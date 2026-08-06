TNYPL V22.2 — OWNER ACTIVATION HOTFIX

FIXES
1. If Supabase redirects an invitation to https://tnypl.in, the homepage
   detects the invite session token and forwards it to:
   https://tnypl.in/owner-setup-password.html

2. Password setup supports:
   - access_token + refresh_token hash callbacks
   - PKCE code callbacks
   - Supabase automatic detectSessionInUrl processing

3. Invitation functions use the exact production redirect URL:
   https://tnypl.in/owner-setup-password.html

4. Owner Login now has complete mobile and desktop styling.

DEPLOY
rm -rf /tmp/tnypl-v22-2
mkdir -p /tmp/tnypl-v22-2
unzip -o TNYPL_V22_2_Owner_Activation_Hotfix.zip -d /tmp/tnypl-v22-2
cp -r /tmp/tnypl-v22-2/* .
rm -f TNYPL_V22_2_Owner_Activation_Hotfix.zip
npm install
git add .
git commit -m "Fix owner invitation password activation flow"
git push origin main

AFTER DEPLOYMENT
- Delete the failed test owner from Supabase Authentication.
- Delete its owner_invites / franchise_members test records if present.
- Send a brand-new invitation.
- Open only the new email.
