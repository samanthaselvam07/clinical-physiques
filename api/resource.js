import { neon } from "@neondatabase/serverless";
import { Resend } from "resend";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const validInterests = new Set(["free-downloads", "paid-education", "both"]);

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
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

async function ensureResourceTable(sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS resource_interests (
      id BIGSERIAL PRIMARY KEY,
      first_name TEXT NOT NULL,
      email TEXT NOT NULL,
      interest TEXT NOT NULL,
      source TEXT NOT NULL DEFAULT 'clinical-physiques-resources',
      user_agent TEXT,
      ip_address TEXT,
      resend_email_id TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (email, source)
    )
  `;
}

function buildEmailHtml(firstName, interest) {
  const safeName = firstName || "there";
  const interestLabel = {
    "free-downloads": "free downloads",
    "paid-education": "paid education resources",
    both: "free and paid resources",
  }[interest] || "Clinical Physiques resources";

  return `
    <div style="margin:0;background:#f6f2eb;padding:40px 20px;font-family:Inter,Arial,sans-serif;color:#111111;">
      <div style="margin:0 auto;max-width:620px;background:#ffffff;border:1px solid #e7e0d6;padding:40px;">
        <p style="margin:0 0 18px;color:#b46c45;font-size:12px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;">Clinical Physiques</p>
        <h1 style="margin:0 0 20px;font-family:Georgia,serif;font-size:34px;line-height:1.05;color:#111111;">You are on the resource list.</h1>
        <p style="margin:0 0 18px;font-size:16px;line-height:1.7;">Hi ${safeName},</p>
        <p style="margin:0 0 18px;font-size:16px;line-height:1.7;">Thanks for registering your interest in ${interestLabel}. We will let you know when the first Clinical Physiques educational resources are ready.</p>
        <p style="margin:0 0 18px;font-size:16px;line-height:1.7;">Expect practical education across training, nutrition, progress review, supplementation, health, and the standards that make physique change sustainable.</p>
        <p style="margin:0;font-size:15px;line-height:1.7;color:#303229;">Clinical Physiques</p>
      </div>
    </div>
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
    return json(res, 500, { error: "Resource capture is not configured yet." });
  }

  let body;
  try {
    body = await getRequestBody(req);
  } catch {
    return json(res, 400, { error: "Invalid form submission." });
  }

  const firstName = normalizeString(body.firstName || body.first_name);
  const email = normalizeString(body.email).toLowerCase();
  const interest = normalizeString(body.interest);
  const company = normalizeString(body.company);

  if (company) {
    return json(res, 200, { ok: true });
  }

  if (!firstName || !emailPattern.test(email) || !validInterests.has(interest)) {
    return json(res, 400, { error: "Please enter your first name, a valid email, and a resource interest." });
  }

  const sql = neon(connectionString);
  const resend = new Resend(resendApiKey);
  const fromEmail = process.env.RESEND_FROM_EMAIL || "Clinical Physiques <hello@clinicalphysiques.com>";

  try {
    await ensureResourceTable(sql);

    await sql`
      INSERT INTO resource_interests (
        first_name,
        email,
        interest,
        user_agent,
        ip_address
      )
      VALUES (
        ${firstName},
        ${email},
        ${interest},
        ${req.headers["user-agent"] || null},
        ${req.headers["x-forwarded-for"] || req.socket?.remoteAddress || null}
      )
      ON CONFLICT (email, source)
      DO UPDATE SET
        first_name = EXCLUDED.first_name,
        interest = EXCLUDED.interest,
        user_agent = EXCLUDED.user_agent,
        ip_address = EXCLUDED.ip_address,
        created_at = NOW()
    `;

    const emailResponse = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: "You are on the Clinical Physiques resource list",
      html: buildEmailHtml(firstName, interest),
    });

    if (emailResponse.error) {
      console.error("Resend error", emailResponse.error);
      return json(res, 502, { error: "Your details were received, but the confirmation email could not be sent yet." });
    }

    await sql`
      UPDATE resource_interests
      SET
        resend_email_id = email_result.resend_email_id,
        created_at = NOW()
      FROM (SELECT ${emailResponse.data?.id || null}::text AS resend_email_id) AS email_result
      WHERE email = ${email}
        AND source = 'clinical-physiques-resources'
    `;

    return json(res, 200, {
      ok: true,
      message: "You are on the resource list. Check your inbox for confirmation.",
    });
  } catch (error) {
    console.error("Resource capture error", error);
    return json(res, 500, { error: "Something went wrong. Please try again." });
  }
}
