TNYPL V22.3 — BRANDED OWNER INVITATION

Added:
- Branded TNYPL owner invitation email template
- Personalized owner and franchise names
- Secure activation button using {{ .ConfirmationURL }}
- Preview page: /owner-invitation-preview.html
- Preview Invitation link in Admin Owner Access

Important:
Supabase hosted projects require Custom SMTP before the Invite user template
source can be edited. Until Custom SMTP is configured, Supabase sends its
default generic invitation email.

After Custom SMTP:
1. Supabase → Authentication → Emails → Invite user
2. Subject:
   Welcome to TNYPL — Activate Your Franchise Account
3. Copy all HTML from TNYPL_BRANDED_OWNER_INVITE_TEMPLATE.html
4. Paste it into the Invite user template source and save

Deploy:
rm -rf /tmp/tnypl-v22-3
mkdir -p /tmp/tnypl-v22-3
unzip -o TNYPL_V22_3_Branded_Owner_Invitation.zip -d /tmp/tnypl-v22-3
cp -r /tmp/tnypl-v22-3/* .
rm -f TNYPL_V22_3_Branded_Owner_Invitation.zip
npm install
git add .
git commit -m "Add branded TNYPL owner invitation"
git push origin main
