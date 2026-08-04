TNYPL V8.5 OWNER PROFILE RELEASE

Included:
- Chennai Strikers owner updated to Vimalesh Vedachalam
- Chennai professional portrait and premium owner page
- Trichy Titans profile for Satish Raja
- Madurai Warriors profile for Porkai Pandian Gopalakrishnan
- Owner photos on homepage cards
- Existing V8 registration, DOB, prizes, statistics, admin and owner portals preserved

DEPLOY
rm -rf /tmp/tnypl-v85
mkdir -p /tmp/tnypl-v85
unzip -o TNYPL_V8_5_Owner_Profiles.zip -d /tmp/tnypl-v85
cp -r /tmp/tnypl-v85/* .
rm -f TNYPL_V8_5_Owner_Profiles.zip
git add .
git commit -m "Add TNYPL owner photos and premium profiles"
git push origin main
