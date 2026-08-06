TNYPL V11 — OFFICIAL LOGO PUBLISH PACKAGE

INCLUDED
- Finalized official TNYPL shield logo
- Navy and championship-gold website design
- Updated homepage hero based on approved visual direction
- All confirmed owner and leadership photos
- Porkai Pandian owner video
- Ramanathan Periyaraja owner video
- Separate leadership and owner profile pages
- Franchise pages remain team-focused
- Live draft
- Player registration
- Supabase integration
- Admin attachment review
- Draft + congratulations email workflow
- Official email ttnypl@gmail.com
- Mobile responsive styling

ADMIN URL
https://tnypl.in/admin.html

DEPLOY
rm -rf /tmp/tnypl-v11
mkdir -p /tmp/tnypl-v11
unzip -o TNYPL_V11_Official_Logo_Publish.zip -d /tmp/tnypl-v11
cp -r /tmp/tnypl-v11/* .
rm -f TNYPL_V11_Official_Logo_Publish.zip
npm install
git add .
git commit -m "Publish TNYPL official logo and navy gold redesign"
git push origin main
