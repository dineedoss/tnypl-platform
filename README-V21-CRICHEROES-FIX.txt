TNYPL V21 — CRICHEROES LINK FIX

FIXED
- Registration now accepts:
  https://cricheroes.com/...
  https://www.cricheroes.com/...
  https://chshare.link/player/...
- Browser HTML validation updated
- JavaScript validation updated
- Supabase players constraint updated
- Existing website, auction, owners and franchise-team features preserved

FIRST
Run TNYPL_V21_CRICHEROES_LINK_FIX.sql in Supabase SQL Editor.

DEPLOY
rm -rf /tmp/tnypl-v21
mkdir -p /tmp/tnypl-v21
unzip -o TNYPL_V21_CricHeroes_Link_Fix.zip -d /tmp/tnypl-v21
cp -r /tmp/tnypl-v21/* .
rm -f TNYPL_V21_CricHeroes_Link_Fix.zip
npm install
git add .
git commit -m "Accept CricHeroes chshare links in registration"
git push origin main

TEST LINK
https://chshare.link/player/nfujyU
