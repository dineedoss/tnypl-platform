TNYPL V26 — PROFESSIONAL POLISH RELEASE

WHAT V26 FIXES
- Public pages no longer expose Supabase table names or raw backend errors.
- Official Draw page shows a professional "Draw Not Started" screen when the
  V25 migration has not yet been run or no live draw exists.
- Match Center shows "Fixtures Coming Soon" instead of backend errors.
- Points Table shows a clean pre-season message.
- Public Draft page falls back to "Auction Not Started".
- Consistent TNYPL footer and official email across major public pages.
- Loading spinners and polished empty states.
- New Commissioner Dashboard linking the full tournament lifecycle.
- New System Check page to confirm which database modules are ready.

NO NEW SQL MIGRATION IS REQUIRED FOR V26.
However, V24 and V25 database features still require their migrations:
- TNYPL_V24_MATCH_CENTER_MIGRATION.sql
- TNYPL_V25_OFFICIAL_DRAW_MIGRATION.sql

DEPLOY
rm -rf /tmp/tnypl-v26
mkdir -p /tmp/tnypl-v26
unzip -o TNYPL_V26_Professional_Polish.zip -d /tmp/tnypl-v26
cp -r /tmp/tnypl-v26/. .
rm -f TNYPL_V26_Professional_Polish.zip
npm install
git add .
git commit -m "Add V26 professional polish and commissioner dashboard"
git push origin main

IMPORTANT URLS
Commissioner Dashboard:
https://tnypl.in/commissioner-dashboard.html

System Check:
https://tnypl.in/system-check.html

Official Draw:
https://tnypl.in/official-draw-public.html

Match Center:
https://tnypl.in/match-center.html

FINAL CHECK
1. Deploy V26.
2. Hard refresh with Ctrl + Shift + R.
3. Open /system-check.html.
4. If Matches shows "Migration not detected", run the V24 SQL.
5. If Tournament Draws shows "Migration not detected", run the V25 SQL.
6. Public visitors will still see professional coming-soon screens until those
   migrations and real data are ready.
