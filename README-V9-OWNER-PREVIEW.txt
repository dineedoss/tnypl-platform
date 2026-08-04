TNYPL V9 OWNER PREVIEW / FIX RELEASE

PURPOSE
This is a review package for franchise owners. It contains completed fixes so far,
but is not yet the final public launch package.

COMPLETED IN THIS PREVIEW
- Mobile franchise-card overlap fixed
- Duplicate View/Visit links removed
- Entire franchise cards open the correct franchise pages
- Trichy resume image removed from the homepage
- Owner names corrected:
  Chennai — Vimalesh Vedachalam
  Kovai — Gopi Ramadoss
  Madurai — Porkai Pandian Gopalakrishnan
  Trichy — Satish Raja
  Nellai — Ramanathan Periyaraja
  Tiruppur — P. C. Binny Jo
- Gopi owner photo, profile and premium profile graphic
- Latest Porkai portrait and profile
- P. C. Binny Jo portrait and Shalom Enterprises profile
- Senthil and Ranjith leadership photos
- Ajay placeholder
- Registration privacy/Aadhaar notice and parent consent
- Privacy, Terms and Refund pages
- Supabase statistics scripts retained
- New Supabase privacy, verification and audit SQL included
- tnypl.in shown as official public domain

STILL PENDING FOR FINAL RELEASE
- Ajay full name/photo/profile confirmation
- Ramanathan Periyaraja photo/profile
- Clean Satish Raja headshot
- Dinesh founder photo
- Owner interview YouTube links
- Final legal review of privacy/retention wording
- Production testing of all Supabase storage/admin policies

DEPLOY
Upload this ZIP to the Codespaces project root, then run:

rm -rf /tmp/tnypl-v9-preview
mkdir -p /tmp/tnypl-v9-preview
unzip -o TNYPL_V9_Owner_Preview_Fix.zip -d /tmp/tnypl-v9-preview
cp -r /tmp/tnypl-v9-preview/* .
rm -f TNYPL_V9_Owner_Preview_Fix.zip
git add .
git commit -m "Publish TNYPL V9 owner preview fixes"
git push origin main
