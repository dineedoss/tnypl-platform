TNYPL SEASON 1 — PRODUCTION RELEASE

This is the consolidated new-design build for deployment and testing.

INCLUDED
- Approved navy-and-gold shield/batsman/gopuram brand identity throughout.
- New primary logo, wordmark and Season 1 identity.
- Eight-franchise wording and 104-player capacity throughout.
- Karaikudi Kings rename and Thanjavur Royals joint-owner page.
- Ajay Manohar official photo, Senior Coach biography and TNYPL responsibilities.
- Ramanathan, Saravanan and Santhana approved photos.
- Public owner email addresses removed; email mappings remain backend-only.
- Updated prizes: Champions ₹50,000; Runner-up ₹20,000; MVP ₹10,000; Orange/Purple ₹7,500 each; Best Fielder/Emerging ₹5,000 each; Player of the Match ₹1,000 per match.
- The Cake Point and Vedapile listed equally as Official Sponsors; no award naming rights.
- Registration, parent consent, Aadhaar notice, admin verification, owner login/reset, email queue, analytics, Tournament Centre and Draft Command Centre retained.
- Venue information remains held back.
- Franchise 08 remains pending.

DEPLOY IN CODESPACES
rm -rf /tmp/tnypl-season1
mkdir -p /tmp/tnypl-season1
unzip -o TNYPL_Season1_Production_Release.zip -d /tmp/tnypl-season1
cp -r /tmp/tnypl-season1/* .
rm -f TNYPL_Season1_Production_Release.zip
npm install
git add .
git commit -m "Deploy TNYPL Season 1 production redesign"
git push origin main

SUPABASE
Run SUPABASE-SEASON1-PRODUCTION-UPGRADE.sql in the SQL Editor.
