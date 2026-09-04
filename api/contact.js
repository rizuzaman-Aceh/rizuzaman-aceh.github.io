// Vercel Serverless Function — /api/contact
// Required environment variables (SUPABASE_URL + one secret key, from the SAME project):
// SUPABASE_URL=https://<project-ref>.supabase.co
// One of: SUPABASE_SERVICE_ROLE_KEY | SUPABASE_ROLE_KEY | SUPABASE_SECRET_KEY
//
// Never expose the service-role/secret key in browser JavaScript.

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const origin = req.headers.origin;
  const allowedOrigin = process.env.ALLOWED_ORIGIN;
  if (allowedOrigin && origin && origin !== allowedOrigin) {
    console.error("Origin mismatch:", JSON.stringify({ origin, allowedOrigin }));
    res.status(403).json({ error: "Origin not allowed" });
    return;
  }

  try {
    const { name, email, subject, message, website } = req.body || {};
    if (website) { res.status(200).json({ ok: true }); return; }
    if (!name || !email || !subject || !message) {
      res.status(400).json({ error: "Semua field wajib diisi." });
      return;
    }
    if (String(name).length > 100 || String(email).length > 160 || String(subject).length > 180 || String(message).length > 4000) {
      res.status(400).json({ error: "Input terlalu panjang." });
      return;
    }
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email));
    if (!emailOk) {
      res.status(400).json({ error: "Format email tidak valid." });
      return;
    }

    const url = process.env.SUPABASE_URL;
    // Accept whichever server-only secret name is configured. The Vercel Supabase
    // integration provides SUPABASE_ROLE_KEY / SUPABASE_SECRET_KEY, while a manual
    // setup typically uses SUPABASE_SERVICE_ROLE_KEY. IMPORTANT: this key MUST belong
    // to the same Supabase project as SUPABASE_URL.
    const key =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_ROLE_KEY ||
      process.env.SUPABASE_SECRET_KEY;
    if (!url || !key) {
      res.status(503).json({ error: "Contact API belum dikonfigurasi." });
      return;
    }

    const insertUrl = `${url.replace(/\/$/, "")}/rest/v1/portfolio_messages`;

    const response = await fetch(insertUrl, {
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
      }),
      signal: AbortSignal.timeout(8000)
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Supabase insert failed:", response.status, text);
      res.status(502).json({ error: "Pesan tidak dapat disimpan saat ini." });
      return;
    }
    res.status(201).json({ ok: true });
  } catch (error) {
    console.error(error);
    const timedOut = error?.name === "TimeoutError" || error?.name === "AbortError";
    res.status(timedOut ? 504 : 500).json({ error: timedOut ? "Server database tidak merespons, coba lagi." : "Terjadi kesalahan server." });
  }
}
