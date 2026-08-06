TNYPL V19 — OWNER TEST FLOW

NEW PAGES
1. /owner-demo.html
   Safe preview with sample Chennai Strikers data. No database writes.
2. /owner-setup-password.html
   Owners land here from the Supabase invitation and create their password.
3. /owner-login.html
   Owners return here after activation.
4. /owner-dashboard.html
   Authenticated live bidding console.

OWNER JOURNEY
Admin sends invitation
→ Owner receives Supabase email
→ Owner clicks secure link
→ owner-setup-password.html opens
→ Owner creates password
→ Owner is redirected to owner-dashboard.html
→ Owner sees wallet, squad count, live player, bid controls and history

ADMIN TEST
Open /admin-owners.html and click Preview Owner Flow.
This does not require creating an Auth user and cannot place a real bid.

REAL TEST
Use your secondary email:
1. Send invitation from /admin-owners.html
2. Open the email
3. Create password
4. Confirm redirect to owner-dashboard.html
5. Do not invite all owners until this test passes

DEPLOY
rm -rf /tmp/tnypl-v19
mkdir -p /tmp/tnypl-v19
unzip -o TNYPL_V19_Owner_Test_Flow.zip -d /tmp/tnypl-v19
cp -r /tmp/tnypl-v19/* .
rm -f TNYPL_V19_Owner_Test_Flow.zip
npm install
git add .
git commit -m "Add owner password setup and complete test flow"
git push origin main
