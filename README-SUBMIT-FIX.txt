TNYPL V8 — SUBMIT BUTTON FIX

Fixed:
- Hidden required fields no longer silently block submission.
- Missing fields return the player to the correct step.
- Missing fields are highlighted.
- Both file uploads are checked.
- Visible uploading and submission messages.
- Duplicate submissions are prevented.
- Supabase/storage errors are shown clearly.

DEPLOY:
rm -rf /tmp/tnypl-submit-fix
mkdir -p /tmp/tnypl-submit-fix
unzip -o TNYPL_V8_Submit_Button_Fix.zip -d /tmp/tnypl-submit-fix
cp -r /tmp/tnypl-submit-fix/* .
rm -f TNYPL_V8_Submit_Button_Fix.zip
git add .
git commit -m "Fix TNYPL player registration submission"
git push origin main
