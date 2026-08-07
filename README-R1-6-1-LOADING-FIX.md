# TNYPL R1.6.1 Official Draw Loading Fix

The R1.6 page remained on **Loading latest draw…** because
`official-draw-admin.js` contained an orphaned JavaScript block and failed to
parse.

Browser console error:

```text
SyntaxError: Unexpected token '}'
```

This patch:

- removes the invalid orphaned block;
- restores initialization and latest-draw loading;
- keeps the automatic A1, A2, A3, A4, B1, B2, B3, B4 workflow;
- keeps the Match Center relationship fix;
- cache-busts the corrected script as `R1.6.1`;
- passes `node --check`.

## Deploy

```bash
git checkout release/r1-production-candidate

rm -rf /tmp/tnypl-r1-6-1
mkdir -p /tmp/tnypl-r1-6-1

unzip -o "TNYPL_R1_6_1_Official_Draw_Loading_Fix.zip" -d /tmp/tnypl-r1-6-1
cp -r /tmp/tnypl-r1-6-1/. .

rm -f "TNYPL_R1_6_1_Official_Draw_Loading_Fix.zip"

git add -A
git commit -m "Fix Official Draw loading syntax error"
git push origin release/r1-production-candidate
```

No additional SQL is required if `TNYPL_R1_6_AUTO_DRAW_PATCH.sql` was already
run successfully.

After Netlify deploys, open:

```text
/official-draw-admin.html?v=161
```

The page should load the latest draw and show the remaining franchises.
