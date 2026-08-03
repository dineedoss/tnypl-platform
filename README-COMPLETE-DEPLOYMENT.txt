TNYPL COMPLETE LAUNCH PACKAGE

Included:
- Official TNYPL shield/lion logo
- Founder: Dinesh Devadoss, Dallas
- Technical Director: Senthil Narayanan, Kingstar Academy, Chennai
- All six franchise owners
- Owner photo placeholders and interview placeholders
- Owner portal already included
- Player draft registration open
- ₹2,000 registration fee and refund policy
- UPI QR code and UPI ID: kingstarca@okhdfcbank
- YouTube Live Draft section on homepage
- Dedicated live-draft.html page
- Existing Supabase registration/admin integration

Franchise owners:
Chennai Strikers — Suresh Durairaj
Kovai Kings — Gopi
Madurai Warriors — Porki Pandian
Trichy Titans — Satish Raja
Nellai Falcons — P. Ramanathan
Tiruppur Blazers — Binny Jo

DEPLOY IN CODESPACES

1. Upload TNYPL_Complete_Launch_Package.zip into the repository root.
2. Run:

rm -rf /tmp/tnypl-complete
mkdir -p /tmp/tnypl-complete
unzip -o TNYPL_Complete_Launch_Package.zip -d /tmp/tnypl-complete
cp -r /tmp/tnypl-complete/* .
rm -f TNYPL_Complete_Launch_Package.zip
git add .
git commit -m "Launch complete TNYPL platform update"
git push origin main

3. Netlify will deploy automatically.

YOUTUBE LIVE DRAFT
When you have the YouTube draft video link, copy the video ID into config.js:
YOUTUBE_DRAFT_VIDEO_ID: "VIDEO_ID"

Example:
https://www.youtube.com/watch?v=ABC123XYZ
Video ID = ABC123XYZ

PHOTOS AND INTERVIEWS
Replace initials placeholders later with real photos, and replace Coming Soon video labels with YouTube embeds.
