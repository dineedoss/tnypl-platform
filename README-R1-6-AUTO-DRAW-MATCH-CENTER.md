# TNYPL R1.6 Automatic Draw + Match Center Fix

## Automatic draw order

No manual Group A/Group B or position selection is required.

Each accepted spin is assigned automatically:

1. A1
2. A2
3. A3
4. A4
5. B1
6. B2
7. B3
8. B4

The selected franchise is removed from the remaining wheel and roster
immediately after acceptance.

## Match Center

The Match Center no longer depends on Supabase relationship discovery.
It loads matches first, then loads franchise names by their UUIDs. This fixes:

`Could not find a relationship between 'matches' and 'franchises'`

## Deploy

```bash
git checkout release/r1-production-candidate

rm -rf /tmp/tnypl-r1-6
mkdir -p /tmp/tnypl-r1-6

unzip -o TNYPL_R1_6_Auto_Draw_Match_Center_Fix.zip -d /tmp/tnypl-r1-6
cp -r /tmp/tnypl-r1-6/. .

rm -f TNYPL_R1_6_Auto_Draw_Match_Center_Fix.zip

git add -A
git commit -m "Automate draw positions and fix Match Center franchise lookup"
git push origin release/r1-production-candidate
```

Run `TNYPL_R1_6_AUTO_DRAW_PATCH.sql` in Supabase.

Then hard-refresh:
- `/official-draw-admin.html`
- `/match-center.html`
