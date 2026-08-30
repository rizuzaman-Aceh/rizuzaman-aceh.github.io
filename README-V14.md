# Rizu Zaman Portfolio V14 — Final Production Audit

## Status
- TRUE LIGHT / WHITE × CORPORATE BLUE enforced as final cascade.
- Existing portfolio sections, data, animations, terminal, threat telemetry, weather, clock/date, globe, contact API, Supabase schema, and Vercel configuration retained.
- Accidental duplicate hero description removed (duplicate content only; no unique data removed).
- Profile image remains the user-provided remote WebP URL and uses `object-fit: contain`.

## Accessibility / visual QA
- Main text uses high-contrast slate/navy values on white/light surfaces.
- Semantic blue/green/amber/red text accents are darkened for strong contrast.
- Body text baseline: 16px.
- Focus-visible outline: 3px corporate blue.
- Mobile controls maintain >=44px tap targets where applicable.
- `prefers-reduced-motion` and `prefers-contrast` retained.
- Horizontal overflow is explicitly suppressed.
- Glass panels use light translucent surfaces with restrained blur and borders.

## Integration notes
- Contact: `/api/contact` -> Supabase REST using server-only `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
- Threat intelligence: `/api/threats` -> ThreatFox proxy when `THREATFOX_AUTH_KEY` is configured; otherwise explicitly reports DEMO TELEMETRY.
- Weather: Open-Meteo client endpoint; no browser API key required.
- 3D globe: lazy-loaded Three.js on desktop; lightweight fallback on smaller/reduced-motion contexts.

## Required Vercel environment variables
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ALLOWED_ORIGIN` (recommended; production origin)
- `THREATFOX_AUTH_KEY` (optional, enables live ThreatFox telemetry)

Secrets are not included in this ZIP.
