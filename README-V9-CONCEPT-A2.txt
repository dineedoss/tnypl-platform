TNYPL V9 — CONCEPT A2

Complete visual redesign:
- Cinematic stadium homepage
- Spacious 2-column franchise showcases
- Eight franchises and 104 draft places
- Ranjith Janagiraman and Ajay Manohar restored
- Four-person league leadership section
- Dedicated franchise pages
- Live draft board for all eight teams
- ₹1,20,000 prize presentation
- Player and owner value sections
- Multi-step registration
- Supabase registration and Netlify Functions preserved
- UPI QR and refund policy
- Sponsor area
- Mobile responsive design

DEPLOY:
rm -rf /tmp/tnypl-v9
mkdir -p /tmp/tnypl-v9
unzip -o TNYPL_V9_Concept_A2.zip -d /tmp/tnypl-v9
cp -r /tmp/tnypl-v9/* .
rm -f TNYPL_V9_Concept_A2.zip
npm install
git add .
git commit -m "Launch TNYPL V9 Concept A2 redesign"
git push origin main
