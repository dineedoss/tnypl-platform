TNYPL V18 — FOUNDING OWNER ACCESS

ADMIN URL
https://tnypl.in/admin-owners.html

CHANGES
- All eight founding owners are preloaded
- Owner names and emails do not need to be typed
- One-click Send Invitation beside each franchise
- Active / Invited / Not Invited status
- Copy login URL button
- Summary counts
- Franchise logos
- Uses the existing secure invite-owner Netlify Function

OPTIONAL CLEAN START
Run TNYPL_V18_RESET_OWNER_ACCESS.sql to remove test owner profiles and invitation records.
This does not delete players, franchises, wallets, auction bids or admin users.

DEPLOY
rm -rf /tmp/tnypl-v18
mkdir -p /tmp/tnypl-v18
unzip -o TNYPL_V18_Founding_Owner_Access.zip -d /tmp/tnypl-v18
cp -r /tmp/tnypl-v18/* .
rm -f TNYPL_V18_Founding_Owner_Access.zip
npm install
git add .
git commit -m "Add one-click founding owner access center"
git push origin main
