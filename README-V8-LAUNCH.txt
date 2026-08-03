TNYPL V8 LAUNCH PACKAGE

Included:
- Premium Golden Lion visual identity
- September 14–18, 2026 dates
- Cinematic premium homepage
- Full team and individual prize amounts
- Player benefits and owner benefits
- Sponsor value
- Multi-step registration form
- UPI QR and refund policy
- Founder and Technical Director profiles
- Six dedicated franchise pages
- Live YouTube Draft Arena
- Squad tracker
- Real-counter hooks with no sample values
- Registration goal progress
- Media center
- Future Hall of Fame
- Existing Supabase registration, admin and owner login preserved

DEPLOY:
rm -rf /tmp/tnypl-v8
mkdir -p /tmp/tnypl-v8
unzip -o TNYPL_V8_Launch.zip -d /tmp/tnypl-v8
cp -r /tmp/tnypl-v8/* .
rm -f TNYPL_V8_Launch.zip
git add .
git commit -m "Launch TNYPL V8 premium website"
git push origin main
