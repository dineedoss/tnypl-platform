# TNYPL R1.4 Official Draw Flow Fix

Fixes reported during live testing:

- Corrects wheel stopping math so the displayed winner is under the pointer.
- Changes the pointer to face downward into the wheel.
- Accept is only available after the draw is locked and the spin is complete.
- Spin is blocked while the draw is still in Draft status.
- The right panel now shows only franchises eligible for the selected stage.
- An accepted franchise is removed from the eligible list immediately.
- Group A Positions only offers A1-A4.
- Group B Positions only offers B1-B4.
- Group and position controls are shown only when relevant.

## Correct test order

1. Create Draw
2. Lock Draw
3. Select Group Allocation
4. Choose Group A or Group B
5. Spin
6. Accept
7. Repeat until all groups are assigned
8. Select Group A Positions or Group B Positions
9. Spin and accept positions

## Deploy

```bash
git checkout release/r1-production-candidate

rm -rf /tmp/tnypl-r1-4
mkdir -p /tmp/tnypl-r1-4

unzip -o TNYPL_R1_4_Official_Draw_Flow_Fix.zip -d /tmp/tnypl-r1-4
cp -r /tmp/tnypl-r1-4/. .

rm -f TNYPL_R1_4_Official_Draw_Flow_Fix.zip

git add -A
git commit -m "Fix Official Draw pointer selection and accept flow"
git push origin release/r1-production-candidate
```

After Netlify deploys, hard-refresh `/official-draw-admin.html`.
