Deployment & environment (Vercel)

Required environment variables (Project -> Settings -> Environment Variables):
- SUPABASE_URL: https://<project-ref>.supabase.co
- SUPABASE_SERVICE_ROLE_KEY: <service role key> (mark as secret)
- ALLOWED_ORIGIN: optional, comma-separated allowed origins (e.g. https://rizuzaman.dev)

Supabase:
- Run the SQL in supabase/schema.sql (repo/supabase/schema.sql) in your Supabase SQL editor to create public.portfolio_messages and enable RLS.

Deploy:
- After PR merged, ensure Vercel env vars are set and redeploy.
- Smoke tests (post-deploy):
  - Check CSP header:
    curl -I https://your-domain | grep -i "content-security-policy"
  - Check security headers:
    curl -I https://your-domain | egrep -i "x-content-type-options|x-frame-options|strict-transport-security"
  - Test contact form:
    curl -X POST https://your-domain/api/contact -H "Content-Type: application/json" -d '{"name":"Test","email":"t@example.com","subject":"t","message":"m"}'
    Expected: 201 if Supabase properly configured and insert succeeds.
  - Verify Supabase:
    SELECT * FROM public.portfolio_messages ORDER BY created_at DESC LIMIT 5;

Notes:
- The in-memory rate limiter in api/contact.js is best-effort in serverless. For production scale, use Upstash/Redis or similar.
- If SUPABASE_SERVICE_ROLE_KEY was ever committed or exposed, rotate the key immediately.
- If CSP blocks assets after deploy, update vercel.json CSP directives (script-src/style-src/img-src) and redeploy.