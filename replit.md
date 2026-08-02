# TNYPL — Tamil Nadu Youth Premier League

## Project Overview

The official platform for the Tamil Nadu Youth Premier League (TNYPL) — a U13–U14 franchise T20 cricket league.

### Stack
- **Frontend**: Vanilla HTML5, CSS3 (Playfair Display + Inter fonts), ES6+ JavaScript — no framework, no build step
- **Backend**: Supabase (PostgreSQL database, Auth, and private Storage)
- **Server**: Node.js `http` server (`server.js`) serving static files on port 5000
- **Deployment**: Netlify (static site — `index.html` is the entry point)

### Files
| File | Purpose |
|------|---------|
| `index.html` | Full public-facing site (hero, vision, franchises, prizes, registration) |
| `styles.css` | All styles — navbar, hero, sections, forms, admin overrides, mobile responsive |
| `app.js` | Public page logic — nav scroll, YouTube embed, age validation, registration form, inquiry form |
| `admin.html` | Protected admin dashboard |
| `admin.js` | Admin logic — auth, player table, verification controls, CSV export, signed doc URLs |
| `config.js` | Supabase URL/key and tournament config (DOB window, YouTube video ID) |
| `server.js` | Simple Node.js static file server for Replit preview |
| `supabase-schema.sql` | Database schema for `players` table, RLS policies, storage bucket |

### Running on Replit
The `Start App` workflow runs `node server.js` on port 5000.

### Running on Netlify
Netlify serves `index.html` directly as a static site — no build step required. `server.js` is only used for Replit.

## Supabase Configuration (`config.js`)
- **URL**: `https://jjjlvsmwlffddnalighh.supabase.co`
- **Anon Key**: stored in `config.js` (public/publishable key — safe to commit)
- **Storage bucket**: `player-documents` (private — age proofs and payment receipts)
- **DOB window**: `2012-01-01` to `2013-12-31` (U13–U14 eligibility)
- **YouTube video ID**: update `YOUTUBE_VIDEO_ID` in `config.js` when broadcast is live

## Admin Access
Navigate to `/admin.html`. Login uses Supabase Auth (email + password). Admin accounts must be created in the Supabase Auth dashboard.

## Tournament Details
- 6 franchise teams · 13 players per team · 78 total players
- 15 T20 matches across 5 days
- Free spectator entry
- ₹20,000 franchise contribution · ₹2,000 player registration fee
- Prize pool: ₹50,000 champion · ₹20,000 runner-up · ₹500 Man of the Match (every game)
- Awards: Tournament MVP, Best Batter, Best Bowler, Best Fielder

## User Preferences
- Keep existing Supabase configuration — do not change URL, key, table structure, or bucket name
- Navy (#071b3b), gold (#f4b942), white branding — no deviations
- Mobile-first design — test all changes at 375px viewport width
- No framework or build toolchain — plain HTML/CSS/JS only
- Netlify deployment compatibility must be preserved — no server-side dependencies in the public site
