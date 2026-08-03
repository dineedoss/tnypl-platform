TNYPL VERSION 6 — CINEMATIC MEDIA-FIRST PACKAGE

WHAT CHANGED
- Large, high-contrast official lion-shield TNYPL logo
- Animated opening logo reveal
- Looping stadium hero video
- Included 8-second TNYPL launch motion film
- Countdown to 14 August 2026
- Animated news ticker and mobile action bar
- Founder: Dinesh Devadoss, Dallas
- Technical Director: Senthil Narayanan, Kingstar Academy, Chennai
- Six franchise owners and interactive vision/interview cards
- Live YouTube Draft Arena with team squad tracker
- Dedicated live-draft.html broadcast page
- ₹2,000 UPI QR/payment section
- Refund promise and detailed terms
- Existing Supabase registration, owner login and admin files preserved

DEPLOY IN CODESPACES
1. Upload TNYPL_V6_Cinematic.zip into the repository root.
2. Run:

rm -rf /tmp/tnypl-v6
mkdir -p /tmp/tnypl-v6
unzip -o TNYPL_V6_Cinematic.zip -d /tmp/tnypl-v6
cp -r /tmp/tnypl-v6/* .
rm -f TNYPL_V6_Cinematic.zip
git add .
git commit -m "Launch TNYPL cinematic Version 6"
git push origin main

PREVIEW BEFORE PUSH
npm start
Open port 3000 in the Codespaces Ports tab.

ADD THE YOUTUBE LIVE DRAFT
In config.js replace:
YOUTUBE_DRAFT_VIDEO_ID: "YOUR_LIVE_DRAFT_VIDEO_ID"
with the YouTube video ID.

Example:
https://youtube.com/watch?v=ABC123XYZ
Video ID: ABC123XYZ

FILES YOU CAN REPLACE LATER
- tnypl-logo.svg / tnypl-logo.png
- leadership and owner photo placeholders
- interview placeholders
- tnypl-launch-film.mp4
