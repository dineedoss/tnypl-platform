TNYPL V25 — OWNERS PAGE POLISH

CHANGES
- Tuticorin Sharks card now uses the supplied Suresh Durai and Usha Durai photos.
- Corrected the owner name to Usha Durai.
- Added the husband-and-wife ownership milestone.
- Highlighted Usha Durai as TNYPL's first woman franchise owner.
- Trichy Titans card now uses the supplied Satish Raja photo.
- Standardized owner-card heights and image sizing.
- Improved wrapping for long owner names.
- Added founding-owner badges and premium hover effects.
- Improved mobile layout.

NO SQL MIGRATION IS REQUIRED.

DEPLOY
rm -rf /tmp/tnypl-v25-owners
mkdir -p /tmp/tnypl-v25-owners
unzip -o TNYPL_V25_Owners_Page_Polish.zip -d /tmp/tnypl-v25-owners
cp -r /tmp/tnypl-v25-owners/. .
rm -f TNYPL_V25_Owners_Page_Polish.zip
npm install
git add .
git commit -m "Polish V25 founding owners page and add owner photos"
git push origin main

VERIFY
https://tnypl.in/owners.html
Hard refresh with Ctrl+Shift+R after Netlify finishes deploying.
