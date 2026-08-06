TNYPL V12 — FRANCHISE LOGOS + FULL OWNER BIOGRAPHIES

NEW
- Eight original franchise SVG logos
- Logos shown on the homepage cards
- Logos shown prominently on every franchise page
- Franchise pages remain focused on team identity and cricket
- Full owner biographies restored on separate owner pages
- Owner photos and available videos preserved
- Owner directory and cross-links preserved
- Admin, registration, attachments and emails preserved

OWNER BIOGRAPHIES RESTORED
- Vimalesh Vedachalam
- Gopi Ramadoss
- Porkai Pandian Gopalakrishnan
- Satish Raja
- Ramanathan Periyaraja
- P. C. Binny Jo
- Saravanan Narasimhan & Santhana Krishnan
- Suresh Durai & Usha Suresh

DEPLOY
rm -rf /tmp/tnypl-v12
mkdir -p /tmp/tnypl-v12
unzip -o TNYPL_V12_Franchise_Logos_Full_Biographies.zip -d /tmp/tnypl-v12
cp -r /tmp/tnypl-v12/* .
rm -f TNYPL_V12_Franchise_Logos_Full_Biographies.zip
npm install
git add .
git commit -m "Add franchise logos and restore full owner biographies"
git push origin main
