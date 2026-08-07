# TNYPL R1.1 Official Draw Fix

This patch fixes the errors seen in the release preview:

- `draw_type` null constraint during Create Draw
- RPC calls appearing as “without parameters” when no draw ID existed
- Lock, Undo and Reset buttons being usable before a draw was created
- Browser/Netlify cache serving an older Official Draw JavaScript file
- Registration showing Closed when no deadline was configured

## 1. Deploy this patch

```bash
git checkout release/r1-production-candidate

rm -rf /tmp/tnypl-r1-1
mkdir -p /tmp/tnypl-r1-1

unzip -o TNYPL_R1_1_Official_Draw_Fix.zip -d /tmp/tnypl-r1-1
cp -r /tmp/tnypl-r1-1/. .

rm -f TNYPL_R1_1_Official_Draw_Fix.zip

git add -A
git commit -m "Fix Official Draw workflow and registration status"
git push origin release/r1-production-candidate
```

## 2. Run the SQL patch

Run the complete file:

`TNYPL_R1_1_OFFICIAL_DRAW_PATCH.sql`

The final result should show the Create, Lock and Reset RPC names.

## 3. Test

After Netlify redeploys, hard-refresh:

`/official-draw-admin.html`

Test in order:

1. Create Draw
2. Lock Draw
3. Spin
4. Accept
5. Undo
6. Reset

The registration banner will now display `REGISTRATION OPEN` when registration
is enabled but no deadline has been configured.
