TNYPL V10 PROFESSIONAL LEAGUE PREVIEW

Includes Satish latest photo, Gopi profile, owner biography links, no Dinesh YouTube link, parent consent, privacy pages, correct franchise links, and real visitor/country analytics via Netlify Functions + Supabase.

DEPLOY:
rm -rf /tmp/tnypl-v10
mkdir -p /tmp/tnypl-v10
unzip -o TNYPL_V10_Professional_League.zip -d /tmp/tnypl-v10
cp -r /tmp/tnypl-v10/* .
rm -f TNYPL_V10_Professional_League.zip
npm install
git add .
git commit -m "Launch TNYPL V10 professional league preview"
git push origin main

Then run SUPABASE-V10-ANALYTICS.sql and add the Netlify environment variables.
