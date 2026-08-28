// Vercel Serverless Function — /api/contact
// Required environment variables:
// SUPABASE_URL=https://<project-ref>.supabase.co
// SUPABASE_SERVICE_ROLE_KEY=<server-only secret>
//
// Never expose SUPABASE_SERVICE_ROLE_KEY in browser JavaScript.

const json = (status, body) => ({
  status,
  headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  body: JSON.stringify(body)
});

export default async function handler(req) {
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  const origin = req.headers.origin;
  const allowedOrigin = process.env.ALLOWED_ORIGIN;
  if (allowedOrigin && origin && origin !== allowedOrigin) {
    return json(403, { error: "Origin not allowed" });
  }

  try {
    const { name, email, subject, message, website } = req.body || {};
    if (website) return json(200, { ok: true });
    if (!name || !email || !subject || !message) return json(400, { error: "Semua field wajib diisi." });
    if (String(name).length > 100 || String(email).length > 160 || String(subject).length > 180 || String(message).length > 4000) {
      return json(400, { error: "Input terlalu panjang." });
    }
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email));
    if (!emailOk) return json(400, { error: "Format email tidak valid." });

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
      const text = await response.text();
      console.error("Supabase insert failed:", response.status, text);
      return json(502, { error: "Pesan tidak dapat disimpan saat ini." });
    }
    return json(201, { ok: true });
  } catch (error) {
    console.error(error);
    return json(500, { error: "Terjadi kesalahan server." });
  }
}
