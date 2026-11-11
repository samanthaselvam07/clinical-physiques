// Shared helpers for API routes. Files prefixed with "_" are not exposed as routes by Vercel.

const HTML_ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

// Escape user-supplied text before placing it in email HTML.
export function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);
}

// First names are shown in emails: keep them short and free of URLs/markup,
// so the form cannot be used to send links to arbitrary inboxes.
export function isSafeName(value) {
  return value.length > 0 && value.length <= 80 && !/[<>]|https?:|www\.|\w\.[a-z]{2,}/i.test(value);
}

export function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim();
  }
  return req.socket?.remoteAddress || null;
}

// Simple per-IP and per-email limit using the existing table's created_at column.
// Returns { ipLimited, emailRecent }: block when ipLimited; when emailRecent, skip
// re-sending the email so the form cannot be used to flood one inbox.
export async function isRateLimited(sql, { table, ip, email, maxPerIp = 5, windowMinutes = 60 }) {
  const allowedTables = new Set(["resource_interests", "lead_magnet_signups"]);
  if (!allowedTables.has(table)) {
    throw new Error(`Unknown table for rate limiting: ${table}`);
  }

  const since = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();
  const rows = await sql.query(
    `SELECT
       COUNT(*) FILTER (WHERE ip_address = $1)::int AS ip_count,
       COUNT(*) FILTER (WHERE email = $2)::int AS email_count
     FROM ${table}
     WHERE created_at > $3`,
    [ip, email, since],
  );

  const { ip_count: ipCount = 0, email_count: emailCount = 0 } = rows[0] || {};
  return {
    ipLimited: Boolean(ip) && ipCount >= maxPerIp,
    emailRecent: emailCount >= 1,
  };
}
