TNYPL V8 — SUBMIT EXPERIENCE UPGRADE

Included:
- Step 4 of 4 progress label
- Stronger final review message
- Compact player benefits summary
- Green Refund Guarantee box
- Stronger submit button text
- Secure data trust message
- Polished success confirmation
- Five-step next-action summary after successful submission
- Existing submit-button validation fix preserved

DEPLOY:
rm -rf /tmp/tnypl-submit-upgrade
mkdir -p /tmp/tnypl-submit-upgrade
unzip -o TNYPL_V8_Submit_Experience_Upgrade.zip -d /tmp/tnypl-submit-upgrade
cp -r /tmp/tnypl-submit-upgrade/* .
rm -f TNYPL_V8_Submit_Experience_Upgrade.zip
git add .
git commit -m "Upgrade TNYPL registration submit experience"
git push origin main
