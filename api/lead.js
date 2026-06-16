import { neon } from "@neondatabase/serverless";
import { Resend } from "resend";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const leadMagnetPath = "/the-high-performing-womans-body-recomposition-blueprint.pdf";

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function getBaseUrl(req) {
  const configured = process.env.SITE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (configured) {
    return configured.startsWith("http") ? configured : `https://${configured}`;
  }

  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const protocol = req.headers["x-forwarded-proto"] || "https";
  return `${protocol}://${host}`;
}

function buildEmailHtml(firstName, guideUrl) {
  const safeName = firstName || "there";

  return `
    <div style="margin:0;background:#f6f2eb;padding:40px 20px;font-family:Inter,Arial,sans-serif;color:#111111;">
      <div style="margin:0 auto;max-width:620px;background:#ffffff;border:1px solid #e7e0d6;padding:40px;">
        <p style="margin:0 0 18px;color:#b46c45;font-size:12px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;">Clinical Physiques</p>
        <h1 style="margin:0 0 20px;font-family:Georgia,serif;font-size:38px;line-height:1;color:#111111;">Your Body Recomposition Blueprint is here.</h1>
        <p style="margin:0 0 18px;font-size:16px;line-height:1.7;">Hi ${safeName},</p>
        <p style="margin:0 0 18px;font-size:16px;line-height:1.7;">Here is your copy of <strong>The High-Performing Woman's Body Recomposition Blueprint</strong>.</p>
        <p style="margin:0 0 28px;font-size:16px;line-height:1.7;">Set aside 15 minutes, read it properly, and use it to identify the real bottleneck between what you know and what you are consistently doing.</p>
        <p style="margin:0 0 30px;">
          <a href="${guideUrl}" style="display:inline-block;background:#b46c45;color:#ffffff;text-decoration:none;font-weight:800;text-transform:uppercase;letter-spacing:0.04em;padding:16px 22px;border-radius:999px;">Download the blueprint</a>
        </p>
        <p style="margin:0 0 10px;font-size:15px;line-height:1.7;color:#303229;">Data first. Emotion second. Build a body that lasts.</p>
        <p style="margin:0;font-size:15px;line-height:1.7;color:#303229;">Sammi<br>Clinical Physiques</p>
      </div>
    </div>
  `;
}

async function getRequestBody(req) {
  if (req.body && typeof req.body === "object") {
    return req.body;
  }

  if (typeof req.body === "string") {
    return JSON.parse(req.body || "{}");
  }

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
}

async function ensureLeadsTable(sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS lead_magnet_signups (
      id BIGSERIAL PRIMARY KEY,
      first_name TEXT NOT NULL,
      email TEXT NOT NULL,
      source TEXT NOT NULL DEFAULT 'clinical-physiques-lead-magnet',
      user_agent TEXT,
      ip_address TEXT,
      resend_email_id TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (email, source)
    )
  `;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return json(res, 405, { error: "Method not allowed" });
  }

  const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!connectionString || !resendApiKey) {
    return json(res, 500, { error: "Lead capture is not configured yet." });
  }

  let body;
  try {
    body = await getRequestBody(req);
  } catch {
    return json(res, 400, { error: "Invalid form submission." });
  }

  const firstName = normalizeString(body.firstName || body.first_name);
  const email = normalizeString(body.email).toLowerCase();
  const company = normalizeString(body.company);

  if (company) {
    return json(res, 200, { ok: true });
  }

  if (!firstName || !emailPattern.test(email)) {
    return json(res, 400, { error: "Please enter your first name and a valid email address." });
  }

  const sql = neon(connectionString);
  const resend = new Resend(resendApiKey);
  const guideUrl = `${getBaseUrl(req)}${leadMagnetPath}`;
  const fromEmail = process.env.RESEND_FROM_EMAIL || "Clinical Physiques <hello@clinicalphysiques.com>";

  try {
    await ensureLeadsTable(sql);

    await sql`
      INSERT INTO lead_magnet_signups (
        first_name,
        email,
        user_agent,
        ip_address
      )
      VALUES (
        ${firstName},
        ${email},
        ${req.headers["user-agent"] || null},
        ${req.headers["x-forwarded-for"] || req.socket?.remoteAddress || null}
      )
      ON CONFLICT (email, source)
      DO UPDATE SET
        first_name = EXCLUDED.first_name,
        user_agent = EXCLUDED.user_agent,
        ip_address = EXCLUDED.ip_address,
        created_at = NOW()
    `;

    const emailResponse = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: "Your Body Recomposition Blueprint",
      html: buildEmailHtml(firstName, guideUrl),
    });

    if (emailResponse.error) {
      console.error("Resend error", emailResponse.error);
      return json(res, 502, { error: "Your details were received, but the email could not be sent yet." });
    }

    await sql`
      UPDATE lead_magnet_signups
      SET
        resend_email_id = email_result.resend_email_id,
        created_at = NOW()
      FROM (SELECT ${emailResponse.data?.id || null}::text AS resend_email_id) AS email_result
      WHERE email = ${email}
        AND source = 'clinical-physiques-lead-magnet'
    `;

    return json(res, 200, {
      ok: true,
      message: "Check your inbox. The blueprint is on its way.",
    });
  } catch (error) {
    console.error("Lead capture error", error);
    return json(res, 500, { error: "Something went wrong. Please try again." });
  }
}
