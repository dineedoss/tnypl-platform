TNYPL VERSION A — PREMIUM LEAGUE

Includes:
- Premium navy and championship-gold redesign
- Large Golden Lion crest and clean TNYPL wordmark
- September 14–18, 2026 tournament dates
- Calendar-day countdown in Chennai / IST
- Founder and Technical Director profiles
- Six premium franchise cards and owner vision popups
- YouTube-ready Live Draft Arena
- Prize and recognition section
- Player registration and Supabase integration
- UPI QR payment and refund policy
- Existing owner login, admin, live draft and supporting files preserved
- Mobile-first layout and bottom actions

DEPLOY:
rm -rf /tmp/tnypl-version-a
mkdir -p /tmp/tnypl-version-a
unzip -o TNYPL_Version_A_Premium_League.zip -d /tmp/tnypl-version-a
cp -r /tmp/tnypl-version-a/* .
rm -f TNYPL_Version_A_Premium_League.zip
git add .
git commit -m "Launch TNYPL Version A premium league redesign"
git push origin main
