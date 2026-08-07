# TNYPL R1.3 Official Draw Spin Animation

This patch adds a real animated wheel spin.

Changes:
- 4.2-second easing animation
- 6–8 full rotations before stopping
- Fixed top pointer
- Selected franchise stops under the pointer
- Accept is enabled only after animation finishes
- Spin/Undo/Reset are locked during animation
- Cache-busted JS/CSS references

## Deploy

```bash
git checkout release/r1-production-candidate

rm -rf /tmp/tnypl-r1-3
mkdir -p /tmp/tnypl-r1-3

unzip -o TNYPL_R1_3_Official_Draw_Spin_Animation.zip -d /tmp/tnypl-r1-3
cp -r /tmp/tnypl-r1-3/. .

rm -f TNYPL_R1_3_Official_Draw_Spin_Animation.zip

git add -A
git commit -m "Animate Official Draw wheel spin"
git push origin release/r1-production-candidate
```

After Netlify deploys, hard-refresh `/official-draw-admin.html`.
