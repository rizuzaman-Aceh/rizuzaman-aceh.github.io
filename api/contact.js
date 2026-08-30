// api/contact.js
// Vercel Serverless Function — /api/contact
// Required env:
// SUPABASE_URL
// SUPABASE_SERVICE_ROLE_KEY
// ALLOWED_ORIGIN (optional, comma-separated list)

const json = (status, body) => ({
  status,
  headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  body: JSON.stringify(body)
});

// Simple in-memory rate limiter NOTE: in serverless this is best-effort.
// For production use a centralized store (Upstash Redis, Cloudflare KV, etc).
const RATE_MAP = globalThis.__RZ_RATE_MAP ||= new Map();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 12; // max requests per window per IP

function getClientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (xff) return String(xff).split(',')[0].trim();
  const addr = req.socket && req.socket.remoteAddress;
  return addr || 'unknown';
}

export default async function handler(req) {
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  try {
    // Origin / allowed list
    const origin = req.headers.origin || req.headers.referer || "";
    const allowedEnv = process.env.ALLOWED_ORIGIN || "";
    const allowed = allowedEnv.split(',').map(s => s.trim()).filter(Boolean);
    if (allowed.length && origin) {
      const ok = allowed.some(a => a && (origin === a || origin.startsWith(a)));
      if (!ok) return json(403, { error: "Origin not allowed" });
    }

    // Rate limit by IP (best-effort)
    const ip = getClientIp(req);
    const now = Date.now();
    const entry = RATE_MAP.get(ip) || { count: 0, ts: now };
    if (now - entry.ts < RATE_LIMIT_WINDOW_MS) {
      entry.count++;
      if (entry.count > RATE_LIMIT_MAX) {
        // keep a short-lived record to avoid memory leak
        RATE_MAP.set(ip, entry);
        return json(429, { error: "Too many requests" });
      }
    } else {
      entry.count = 1;
      entry.ts = now;
    }
    RATE_MAP.set(ip, entry);

    // Input validation + honeypot
    const { name, email, subject, message, website } = req.body || {};
    if (website) return json(200, { ok: true }); // honeypot
    if (!name || !email || !subject || !message) return json(400, { error: "Semua field wajib diisi." });
    if (String(name).length > 100 || String(email).length > 160 || String(subject).length > 180 || String(message).length > 4000) {
      return json(400, { error: "Input terlalu panjang." });
    }
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email));
    if (!emailOk) return json(400, { error: "Format email tidak valid." });

    // Supabase insert (server-only service role key)
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return json(503, { error: "Contact API belum dikonfigurasi." });

    const response = await fetch(`${url.replace(/\/$/, "")}/rest/v1/portfolio_messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": key,
        "Authorization": `Bearer ${key}`,
        "Prefer": "return=minimal"
      },
      body: JSON.stringify({
        name: String(name).trim(),
        email: String(email).trim().toLowerCase(),
        subject: String(subject).trim(),
        message: String(message).trim()
      })
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      console.error("Supabase insert failed:", response.status, text);
      return json(502, { error: "Pesan tidak dapat disimpan saat ini." });
    }
    return json(201, { ok: true });
  } catch (error) {
    console.error("Contact API error:", error);
    return json(500, { error: "Terjadi kesalahan server." });
  }
}
