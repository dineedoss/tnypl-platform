TNYPL PRE-V8 SEPTEMBER REAL-DATA FIX

Fixes:
- Removes all remaining August 2026 text.
- Sets tournament dates to 14–18 September 2026.
- Removes unconfirmed hours/minutes/seconds countdown.
- Shows calendar days only until 14 September 2026.
- Removes sample/fake analytics numbers.
- Real analytics display only when Netlify/Supabase counters return data.
- Otherwise the site shows unavailable/placeholder state instead of invented numbers.

DEPLOY:
rm -rf /tmp/tnypl-realdata
mkdir -p /tmp/tnypl-realdata
unzip -o TNYPL_PreV8_September_RealDataFix.zip -d /tmp/tnypl-realdata
cp -r /tmp/tnypl-realdata/* .
rm -f TNYPL_PreV8_September_RealDataFix.zip
git add .
git commit -m "Fix September dates and remove sample counters"
git push origin main
