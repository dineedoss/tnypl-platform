TNYPL V13 LIGHT BUILD — NO VIDEOS BUNDLED

This package contains all V13 website and Supabase updates but excludes the large owner video files.

PRESERVED FEATURES
- Official TNYPL branding
- Eight franchise logos
- Full owner biographies and photos
- Leadership profiles and links
- Tournament dates: 12, 13, 14, 19 and 20 September 2026
- ₹1,20,000 highlighted prize pool
- Orange Cap and Purple Cap visuals
- ₹1,000 Man of the Match for every match
- Player registration and uploads
- DOB and CricHeroes validation
- Parent/Guardian Consent
- Mandatory waiver and electronic signatures
- Admin attachment review
- Draft assignment and email workflow
- Supabase setup and migration files

VIDEO HANDLING
The owner profile pages still reference:
- assets/videos/porkai-pandian-owner-message.mp4
- assets/videos/ramanathan-owner-message.mp4

Those files are intentionally excluded because they already exist in your deployed repository.
Do not delete the existing assets/videos folder from GitHub.

SUPABASE
Run SUPABASE-V13-CONSENT-WAIVER-MIGRATION.sql before testing the updated registration form.

DEPLOY
rm -rf /tmp/tnypl-v13-light
mkdir -p /tmp/tnypl-v13-light
unzip -o TNYPL_V13_Light_No_Videos.zip -d /tmp/tnypl-v13-light
cp -r /tmp/tnypl-v13-light/* .
rm -f TNYPL_V13_Light_No_Videos.zip
npm install
git add .
git commit -m "Deploy lightweight V13 without replacing owner videos"
git push origin main
