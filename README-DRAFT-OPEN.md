TNYPL PLAYER DRAFT OPEN UPDATE

Adds:
- Player draft registration open banner
- Stronger registration call-to-action
- ₹2,000 refund assurance for verified players not drafted
- Clear refund conditions below the registration form

Deploy:
rm -rf /tmp/tnypl-draft
mkdir -p /tmp/tnypl-draft
unzip -o TNYPL_Player_Draft_Open.zip -d /tmp/tnypl-draft
cp /tmp/tnypl-draft/index.html .
cp /tmp/tnypl-draft/styles.css .
git add index.html styles.css
git commit -m "Open player draft registration and add refund policy"
git push origin main
