TNYPL V25 — SPONSORS, MATCH CENTER, MOBILE FIX & LEAGUE VISION

RUN FIRST
TNYPL_V25_MIGRATION.sql

DEPLOY
rm -rf /tmp/tnypl-v25
mkdir -p /tmp/tnypl-v25
unzip -o TNYPL_V25_Sponsors_Match_Center_Vision.zip -d /tmp/tnypl-v25
cp -r /tmp/tnypl-v25/. .
rm -f TNYPL_V25_Sponsors_Match_Center_Vision.zip
npm install
git add .
git commit -m "Add sponsors match center mobile fix and league vision"
git push origin main

NEW PUBLIC PAGES
https://tnypl.in/sponsors.html
https://tnypl.in/match-center.html
https://tnypl.in/dls-calculator.html
https://tnypl.in/league-vision.html

NEW ADMIN PAGES
https://tnypl.in/admin-sponsors.html
https://tnypl.in/admin-match-center.html

SPONSORS INCLUDED
- The Cake Point
- Ayyappa Auto Agencies
- DOJO MAN Sports Event App
- Vedapile

No sponsor category or level has been assigned.

MOBILE FIX
The fixed floating Match Center shortcut was removed.
Homepage action buttons now use normal page flow and stack vertically on phones.

MATCH ADMIN IMPROVEMENTS
- Automatic match number
- Franchise 08 filtered out
- Prevent same team twice
- Team A / Team B labels
- Toss winner and decision
- Match officials
- Weather
- Result type
- Google Maps URL
- CricHeroes scorecard
- YouTube live and replay
