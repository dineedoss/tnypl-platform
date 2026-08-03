TNYPL VERSION A — VALUE UPGRADE

Added:
- Prominent ₹70,000 total prize pool banner
- Player benefits and registration value
- Registration-to-competition journey
- Founding owner benefits
- Sponsor value section

DEPLOY:
rm -rf /tmp/tnypl-value
mkdir -p /tmp/tnypl-value
unzip -o TNYPL_Version_A_Value_Upgrade.zip -d /tmp/tnypl-value
cp -r /tmp/tnypl-value/* .
rm -f TNYPL_Version_A_Value_Upgrade.zip
git add .
git commit -m "Add TNYPL prize pool and player owner value sections"
git push origin main
