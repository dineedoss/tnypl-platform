TNYPL V17 — OWNER INVITATION ADMIN

NEW ADMIN URL
https://tnypl.in/admin-owners.html

WHAT IT DOES
- Admin enters owner name and email
- Admin selects franchise
- Netlify Function verifies the logged-in admin
- Supabase sends a secure invitation email
- Existing Auth users are linked without sending a duplicate invitation
- Owner profile is created or updated
- Franchise wallet is initialized
- Invitation is recorded in owner_invites
- Admin can copy the owner login URL

REQUIRED NETLIFY VARIABLES
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
SITE_URL=https://tnypl.in

SUPABASE SETUP
Run TNYPL_V17_OWNER_INVITATION_MIGRATION.sql.

DEPLOY
rm -rf /tmp/tnypl-v17
mkdir -p /tmp/tnypl-v17
unzip -o TNYPL_V17_Owner_Invitation_Admin.zip -d /tmp/tnypl-v17
cp -r /tmp/tnypl-v17/* .
rm -f TNYPL_V17_Owner_Invitation_Admin.zip
npm install
git add .
git commit -m "Add admin owner invitations and login access"
git push origin main

TEST
1. Sign in as TNYPL admin.
2. Open /admin-owners.html.
3. Invite your own secondary email first.
4. Confirm the email arrives.
5. Accept the invitation.
6. Sign in at /owner-login.html.
7. Confirm the owner dashboard shows the linked franchise.
