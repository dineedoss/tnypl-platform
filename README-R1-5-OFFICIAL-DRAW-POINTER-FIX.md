# TNYPL R1.5 Official Draw Pointer Fix

This patch corrects the mismatch between the franchise shown under the pointer
and the franchise displayed as selected.

## What changed

- The final winner is calculated from the wheel's actual stopped angle.
- The visual pointer and accepted database franchise now use the same index.
- The pointer points downward with a centre guide line.
- The final wheel redraw uses the exact normalized stopping rotation.
- Cache-busted assets force Netlify and the browser to load R1.5.

## Deploy

```bash
git checkout release/r1-production-candidate

rm -rf /tmp/tnypl-r1-5
mkdir -p /tmp/tnypl-r1-5

unzip -o TNYPL_R1_5_Official_Draw_Pointer_Fix.zip -d /tmp/tnypl-r1-5
cp -r /tmp/tnypl-r1-5/. .

rm -f TNYPL_R1_5_Official_Draw_Pointer_Fix.zip

git add -A
git commit -m "Align Official Draw winner with pointer"
git push origin release/r1-production-candidate
```

After Netlify deploys, hard-refresh `/official-draw-admin.html`.
