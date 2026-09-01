# Rizu Zaman — Portfolio

Portfolio profesional Cyber Security & Web Design. Single-page site, deployed on Vercel with a Supabase-backed contact form.

**Live:** https://rizuzaman-aceh-github-io.vercel.app

## Stack

- Static HTML/CSS/JS (no build step, no framework)
- Vercel Serverless Functions (`/api`) for the contact form and optional live threat feed
- Supabase (Postgres + RLS) as the contact-form datastore

## Structure

```
index.html
css/style.css
js/app.js
api/
  contact.js    # POST -> inserts into Supabase `portfolio_messages` (service-role key, server-side only)
  threats.js    # optional ThreatFox proxy; falls back to labeled demo data without a key
supabase/
  schema.sql    # run once in the Supabase SQL editor to create portfolio_messages
vercel.json     # security headers + /api cache-control
.env.example    # required environment variables (see below)
```

## Environment variables (set in Vercel -> Project Settings -> Environment Variables)

| Key | Required | Notes |
|---|---|---|
| `SUPABASE_URL` | Yes | Project base URL, no trailing `/rest/v1/` |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | From Supabase Dashboard -> Project Settings -> API. Server-side only, never exposed to the client |
| `ALLOWED_ORIGIN` | Recommended | Locks the contact form to this site's own origin |
| `THREATFOX_AUTH_KEY` | Optional | Enables live threat intel; omit to keep the demo-labeled fallback |

## Notes on content

- The Credentials and Education sections explicitly separate what's actually earned ("tercatat") from aspirational/recommended items ("direkomendasikan") -- this distinction is intentional and should be preserved in any future edit.
- The Projects section currently lists example/concept work, not verified employment history.

## Version history

- **v10** -- Original "Cyber Glass / Spider Matrix" light theme: hero, cyber monitor dashboard, skills, projects, timeline.
- **v11** -- Added the full profile data layer: competencies, soft skills, education, credentials, OS/toolchain, detailed experience bullets, achievements. Additive -- existing sections preserved.
- **v12** -- "Neo-Noir Cyberpunk Typography" system for the hero title, plus a Three.js desktop globe (dark-theme branch).
- **v13** -- Merged v12's globe/backend onto the v10/v11 light theme; filled in ~30 CSS classes that were referenced in the markup but never defined (ambient HUD, hero orbs, attack-distribution donut, credential grid, and more); wired Supabase-backed contact form; fixed a production timeout bug in `/api/threats`; general mobile-overflow and responsiveness fixes.
