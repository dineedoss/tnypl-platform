TNYPL V13

UPDATES
- Official tournament dates: 12, 13, 14, 19 and 20 September 2026
- Highlighted ₹1,20,000 prize pool
- ₹50,000 Champions
- ₹20,000 Runner-up
- ₹10,000 Tournament MVP
- ₹7,500 Orange Cap with orange-cap artwork
- ₹7,500 Purple Cap with purple-cap artwork
- ₹5,000 Best Fielder
- ₹5,000 Emerging Player
- ₹1,000 Man of the Match for every match (15 awards)
- Strict DOB validation: 01 Jan 2010 through 31 Dec 2012
- Required CricHeroes link validation
- Dedicated Parent/Guardian Consent step
- Mandatory participation waiver
- Mandatory electronic signatures
- Submission blocked unless all consent and waiver requirements pass
- Server-side Supabase constraints and insert policy

BEFORE DEPLOYING
Run SUPABASE-V13-CONSENT-WAIVER-MIGRATION.sql in Supabase SQL Editor.

DEPLOY
rm -rf /tmp/tnypl-v13
mkdir -p /tmp/tnypl-v13
unzip -o TNYPL_V13_Prizes_Dates_Consent_Waiver.zip -d /tmp/tnypl-v13
cp -r /tmp/tnypl-v13/* .
rm -f TNYPL_V13_Prizes_Dates_Consent_Waiver.zip
npm install
git add .
git commit -m "Add tournament dates prize spotlight consent and waiver"
git push origin main
