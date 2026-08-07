TNYPL V12 COMPLETE LAUNCH PACKAGE

OFFICIAL DETAILS
Website: https://tnypl.in
Email: info@tnypl.in
YouTube: https://youtube.com/@tamilnaduyouthpremierleague
Player Draft: 25 August 2026
Tournament: 14–18 September 2026
Venue: One official venue (details pending)

INCLUDED
- Premium public website and official logo assets
- Founder, leadership and six franchise pages
- Correct owner biographies and photos received so far
- Registration form with profile photo, age proof, payment receipt, CricHeroes and consent
- Parent/guardian, media, privacy and Aadhaar notices
- Initial submission, verification, correction, drafted, non-selected and refund email queue
- Secure Admin Operations Centre
- Commissioner Command Centre
- Owner portal, franchise assignment, Forgot Password and Reset Password
- Registration close/status control
- Draft master-list and draft-pool CSV exports
- Platinum, Gold and Silver category controls
- 1,000-point franchise architecture and draft tables
- Live Draft process page for 25 August
- Tournament Centre
- Sticky live-score banner
- Schedule, points table, Orange Cap, Purple Cap and results pages
- Official YouTube integration
- Real visitor/page-view/country analytics with safe empty states
- Private Supabase document storage and public approved player photos
- Audit logs, email queue, media, notices and future CricHeroes fields
- Full Supabase SQL script
- Netlify Functions for analytics, live match and email processing

DEPLOY WEBSITE
1. Upload TNYPL_V12_Complete_Launch.zip to the Codespaces project root.
2. Run:

rm -rf /tmp/tnypl-v12
mkdir -p /tmp/tnypl-v12
unzip -o TNYPL_V12_Complete_Launch.zip -d /tmp/tnypl-v12
cp -r /tmp/tnypl-v12/* .
rm -f TNYPL_V12_Complete_Launch.zip
npm install
git add .
git commit -m "Launch complete TNYPL V12 platform"
git push origin main

SUPABASE
Run SUPABASE-V12-COMPLETE-SETUP.sql in Supabase SQL Editor.

OWNER ACCOUNTS
Create/invite owners in Supabase Authentication. The SQL automatically assigns the three emails already supplied:
- info@tnypl.in
- porkai@cakepoint.in
- info@tnypl.in

Add the remaining three owner emails when available.

NETLIFY
Add the variables listed in NETLIFY-ENVIRONMENT-VARIABLES.txt and redeploy.

EMAIL
The package includes an email queue and a Netlify email processor using Resend.
Until RESEND_API_KEY is configured, messages remain safely queued in Supabase.

CRICHEROES
The public Tournament Centre and database are ready for a supported CricHeroes sync, export or API connection. Do not share CricHeroes passwords in code or chat.

FINAL PENDING CONTENT
- Exact venue name/address/map
- Remaining owner/admin emails
- Ajay full name/photo/profile
- Ramanathan final photo/profile if changed
- Sponsor logos and individual YouTube video links
- CricHeroes supported integration details
