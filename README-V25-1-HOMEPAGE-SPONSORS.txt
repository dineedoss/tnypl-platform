TNYPL V25.1 — HOMEPAGE SPONSOR DISPLAY FIX

FIXED
- Replaced the old text-only sponsor buttons on the homepage.
- Added all four sponsor logos:
  The Cake Point
  Ayyappa Auto Agencies
  DOJO MAN Sports Event App
  Vedapile
- Homepage reads the sponsor table after the V25 sponsor migration succeeds.
- A static fallback keeps all four logos visible if Supabase is temporarily unavailable.
- Added a link to the full Sponsors page.
- Cleaned mobile spacing so sponsor content, quick links and footer do not overlap.

DATABASE
Run the sponsor column correction script first if V25 failed on logo_path.
After that, rerun TNYPL_V25_MIGRATION.sql.

DEPLOY
rm -rf /tmp/tnypl-v25-1
mkdir -p /tmp/tnypl-v25-1
unzip -o TNYPL_V25_1_Homepage_Sponsor_Fix.zip -d /tmp/tnypl-v25-1
cp -r /tmp/tnypl-v25-1/. .
rm -f TNYPL_V25_1_Homepage_Sponsor_Fix.zip
npm install
git add .
git commit -m "Fix homepage sponsor logos and mobile spacing"
git push origin main

VERIFY
1. Hard refresh https://tnypl.in
2. Confirm four sponsor logos appear in the sponsor section.
3. Confirm no text-only sponsor buttons remain.
4. Test the bottom of the homepage on mobile.
