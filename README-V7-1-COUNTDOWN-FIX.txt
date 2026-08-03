TNYPL V7.1 — COUNTDOWN CORRECTION

WHY THE OLD COUNTER LOOKED WRONG
The website was showing an exact hours-and-minutes countdown to 8:00 AM IST.
That start time had not been confirmed by the tournament owner.

WHAT THIS FIX DOES
- Uses Chennai / India calendar date.
- Shows calendar days until 14 September 2026.
- Clearly labels the timezone as IST.
- Displays "First-ball time to be confirmed."
- Keeps the global visitor and registration counters in a separate section.
- Does not display fake or assumed hours and minutes.

WHEN THE FIRST-BALL TIME IS CONFIRMED
Open config.js and change:
TOURNAMENT_START_TIME_CONFIRMED: false

to:
TOURNAMENT_START_TIME_CONFIRMED: true

Then update:
TOURNAMENT_START: "2026-09-14T08:00:00+05:30"

to the actual Chennai start time.

DEPLOY
Upload TNYPL_V7_1_Countdown_Fix.zip to the repository root and run:

rm -rf /tmp/tnypl-v7-1
mkdir -p /tmp/tnypl-v7-1
unzip -o TNYPL_V7_1_Countdown_Fix.zip -d /tmp/tnypl-v7-1
cp -r /tmp/tnypl-v7-1/* .
rm -f TNYPL_V7_1_Countdown_Fix.zip
git add .
git commit -m "Correct TNYPL tournament countdown"
git push origin main
