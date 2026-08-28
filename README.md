# Rizu Zaman — Ultra-Luxury Cyber Portfolio

Struktur:
- `index.html` — semantic HTML + content
- `css/style.css` — seluruh styling/responsive system
- `js/app.js` — matrix, terminal, dashboard, rings, menu, flip cards, globe, contact
- `api/contact.js` — Vercel serverless endpoint → Supabase
- `supabase/schema.sql` — tabel contact terisolasi
- `vercel.json` — security headers

## Supabase/Vercel
Set environment variables di Vercel:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ALLOWED_ORIGIN` (opsional, mis. https://domain-anda.com)

Jalankan SQL `supabase/schema.sql` pada project Supabase yang memang ditujukan untuk portfolio.
Jangan gunakan service-role key di frontend.

## Mobile lock
Tidak memakai `user-scalable=no`; browser tetap boleh melakukan accessibility zoom.
Overflow horizontal dikunci melalui layout/CSS, sementara elemen yang berpotensi overflow dibatasi.
Three.js globe tidak dimuat pada mobile.
