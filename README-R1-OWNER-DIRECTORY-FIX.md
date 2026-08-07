# TNYPL R1 Owner Directory Photo Fix

Fixes the public `/owners` page:

- Replaces Satish Raja's `SR` placeholder with his supplied photo.
- Replaces Tuticorin Sharks' `SD` placeholder with both Suresh Durai and Usha Durai photos.
- Corrects `Usha Suresh` to `Usha Durai`.
- Keeps the detailed Satish Raja and Tuticorin Sharks profile pages already included in R1.

## Deploy on the release branch

```bash
git checkout release/r1-production-candidate

rm -rf /tmp/tnypl-owner-fix
mkdir -p /tmp/tnypl-owner-fix

unzip -o TNYPL_R1_Owner_Directory_Photo_Fix.zip -d /tmp/tnypl-owner-fix
cp -r /tmp/tnypl-owner-fix/. .

rm -f TNYPL_R1_Owner_Directory_Photo_Fix.zip

git add -A
git commit -m "Fix owner directory photos and Tuticorin owner name"
git push origin release/r1-production-candidate
```

After Netlify redeploys, hard-refresh `/owners`.
