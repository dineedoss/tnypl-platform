TNYPL V24 — MATCH CENTER

INCLUDED
- Public Match Center
- Upcoming schedule
- Live match status
- Completed results
- CricHeroes live-score / scorecard links
- YouTube live stream links
- YouTube replay links
- Player of the Match
- Public points table from completed matches
- Admin fixture and result editor
- Publish / unpublish controls
- DLS calculator
- Provisional resource percentage assistant
- T20, T30 and 50-over inputs

FIRST
Run:
TNYPL_V24_MATCH_CENTER_MIGRATION.sql

DEPLOY
rm -rf /tmp/tnypl-v24
mkdir -p /tmp/tnypl-v24
unzip -o TNYPL_V24_Match_Center.zip -d /tmp/tnypl-v24
cp -r /tmp/tnypl-v24/. .
rm -f TNYPL_V24_Match_Center.zip
npm install
git add .
git commit -m "Add TNYPL match center fixtures streams scores and DLS"
git push origin main

ADMIN
https://tnypl.in/admin-match-center.html

PUBLIC
https://tnypl.in/match-center.html

DLS
https://tnypl.in/dls-calculator.html

DLS WARNING
The target calculator uses entered Standard Edition resource percentages.
The optional Resource Percentage Assistant is an approximation only.
The official scorer, umpire, or match referee must confirm revised targets.
