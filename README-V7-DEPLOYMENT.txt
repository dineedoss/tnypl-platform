TNYPL VERSION 7 — ANIMATED LOGO + LIVE GLOBAL COUNTERS

NEW IN THIS VERSION
- Cleaner geometric lion-shield logo
- Animated shield drawing, crown reveal, lion build, wordmark reveal and orbiting cricket ball
- Separate animated logo demonstration page: logo-animation.html
- Live unique visitor count
- Live total page-view count
- Live player-registration count from the existing players table
- Live countries-reached count
- Live online-now count (active in the last five minutes)
- Top visitor countries with page-view totals
- Country is detected securely by a Netlify Edge Function
- No visitor name, email or IP address is stored by the counter
- Anonymous browser ID prevents every refresh from becoming a new person
- Statistics refresh every 15 seconds

IMPORTANT: ONE-TIME DATABASE SETUP
The deployment package can be uploaded in one operation, but Supabase must have the
counter functions and table. This cannot be created by a public website key.

1. Open Supabase.
2. Open SQL Editor.
3. Open SUPABASE-LIVE-COUNTERS.sql from this package.
4. Copy the entire file, paste it into SQL Editor and press Run.
5. This only needs to be done once.

DEPLOY IN CODESPACES
Upload TNYPL_V7_Animated_Live.zip into the repository root and run:

rm -rf /tmp/tnypl-v7
mkdir -p /tmp/tnypl-v7
unzip -o TNYPL_V7_Animated_Live.zip -d /tmp/tnypl-v7
cp -r /tmp/tnypl-v7/* .
rm -f TNYPL_V7_Animated_Live.zip
git add .
git commit -m "Add animated TNYPL identity and live global counters"
git push origin main

NETLIFY
Netlify automatically discovers:
netlify/edge-functions/track-visit.js
netlify/edge-functions/public-stats.js

After the deploy and SQL setup, visit the homepage once and refresh after a few seconds.
The live counters should begin at real values. No fake starting values are included.

LOGO PREVIEW
Open:
https://tamilnaduypl.netlify.app/logo-animation.html

COUNTER DEFINITIONS
Unique visitors: anonymous browsers that have opened the website.
Page views: total recorded page loads.
Player registrations: rows in the existing public.players table.
Countries reached: countries with at least one visitor.
Online now: visitors active during the last five minutes.

PRIVACY
The browser stores a random anonymous identifier in localStorage.
The database stores that identifier, country, optional city, timestamps and page-view count.
The visitor IP address is not written to the database.
