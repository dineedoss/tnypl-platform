TNYPL V11.1 — FOUNDER, OWNER AND SUPABASE CORRECTION RELEASE

COMPLETED
- Added a dedicated founder.html page for Dinesh Devadoss
- Added meaningful founder vision, mission, values, player message and roadmap
- Added Founder navigation and Meet the Founder link
- No YouTube section for Dinesh
- Removed duplicate Owner Biography buttons
- Removed the duplicate Gopi Ramadoss poster from the Kovai page
- Kept Gopi’s real portrait, written biography, highlights and vision
- Fixed leadership portrait cropping on phones
- Added the complete Supabase SQL script
- Added private player-document storage policies
- Added parent/guardian and privacy-consent fields
- Added player verification, draft and refund statuses
- Added audit logs
- Added unique visitors, page views, countries and online-now analytics

DEPLOY
Upload TNYPL_V11_1_Founder_and_Supabase_Fix.zip to the Codespaces project root and run:

rm -rf /tmp/tnypl-v111
mkdir -p /tmp/tnypl-v111
unzip -o TNYPL_V11_1_Founder_and_Supabase_Fix.zip -d /tmp/tnypl-v111
cp -r /tmp/tnypl-v111/* .
rm -f TNYPL_V11_1_Founder_and_Supabase_Fix.zip
npm install
git add .
git commit -m "Add founder page and correct TNYPL V11 owner layout"
git push origin main

SUPABASE
Open Supabase > SQL Editor and run:
SUPABASE-V11-1-COMPLETE-SETUP.sql

NETLIFY
Keep these environment variables configured:
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY

Never place the service-role key in config.js.
