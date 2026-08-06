TNYPL V8 — EIGHT FRANCHISES + CLICKABLE OWNER PROFILES

Includes all eight franchises, 104 draft places, 13 players per team, clickable owner cards, dedicated pages for every franchise, Thanjavur Royals joint owners, Tuticorin Sharks co-owners, owner login links and updated live draft tracker.

DEPLOY:
rm -rf /tmp/tnypl-v8-owners
mkdir -p /tmp/tnypl-v8-owners
unzip -o TNYPL_V8_Owners_Linked.zip -d /tmp/tnypl-v8-owners
cp -r /tmp/tnypl-v8-owners/* .
rm -f TNYPL_V8_Owners_Linked.zip
git add .
git commit -m "Add eight franchises and linked owner profiles"
git push origin main
