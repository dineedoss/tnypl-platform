TNYPL V11 FINAL LAUNCH PACKAGE
Official domain: https://tnypl.in
Tournament: 14–18 September 2026

INCLUDED
- Premium TNYPL homepage and Golden Lion branding
- Mobile franchise-card overlap and navigation fixes
- Correct team URLs and Owner Biography links
- Owner profiles for Vimalesh Vedachalam, Gopi Ramadoss,
  Porkai Pandian Gopalakrishnan, Satish Raja and P. C. Binny Jo
- Nellai Falcons owner name: Ramanathan Periyaraja
- Senthil Narayanan and Ranjith Janagiraman leadership photos
- Dinesh Devadoss placeholder retained without a YouTube link
- Ajay placeholder retained
- Player DOB: 01 January 2010 through 31 December 2012 inclusive
- Multi-step registration and submit validation
- Parent/legal guardian consent
- Privacy and age-proof/Aadhaar notice
- Privacy Policy, Terms and Refund Policy
- UPI QR and refund promise
- Team and individual prize sections
- Live Draft Arena and squad tracker
- Unique visitors, page views, countries reached and online-now counters
- Netlify Functions for server-side visitor geolocation
- Supabase V11 final SQL for analytics, consent, verification and audit logs
- Admin and owner portals
- tnypl.in production branding

DEPLOY WEBSITE
1. Upload TNYPL_V11_Final_Launch.zip into the Codespaces project root.
2. Run:

rm -rf /tmp/tnypl-v11
mkdir -p /tmp/tnypl-v11
unzip -o TNYPL_V11_Final_Launch.zip -d /tmp/tnypl-v11
cp -r /tmp/tnypl-v11/* .
rm -f TNYPL_V11_Final_Launch.zip
npm install
git add .
git commit -m "Launch TNYPL V11 final website"
git push origin main

SUPABASE
- Run SUPABASE-V11-FINAL-SETUP.sql once.
- Create a PRIVATE Storage bucket named player-documents.
- Confirm the players table and storage upload policies in a test registration.

NETLIFY
Add these environment variables and redeploy:
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY

Never put the service-role key in config.js or browser code.

FINAL TEST
- Open https://tnypl.in in desktop and mobile browsers.
- Submit one test player registration.
- Verify the player row, both private files and consent timestamps.
- Verify unique visitors/page views update after deployment.
- Test all six franchise links and biography links.
- Delete the test registration and test files before public launch.
