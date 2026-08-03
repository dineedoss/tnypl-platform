TNYPL PRE-V8 SEPTEMBER GOLDEN LION

Tournament: 14–18 September 2026
Countdown: calendar days to 14 September, Chennai / IST
First-ball time remains unconfirmed.
New Golden Lion logo included.
All existing registration, UPI, refund policy, leadership, owners, owner portal,
admin portal, YouTube draft and analytics files are preserved.

DEPLOY
rm -rf /tmp/tnypl-prev8
mkdir -p /tmp/tnypl-prev8
unzip -o TNYPL_PreV8_September_GoldenLion.zip -d /tmp/tnypl-prev8
cp -r /tmp/tnypl-prev8/* .
rm -f TNYPL_PreV8_September_GoldenLion.zip
git add .
git commit -m "Update TNYPL September dates and Golden Lion branding"
git push origin main
