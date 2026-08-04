TNYPL V8 COMPLETE REGISTRATION LAUNCH PACKAGE

INCLUDED
- Premium V8 homepage and Golden Lion branding
- Tournament dates: 14–18 September 2026
- DOB eligibility: 01 January 2010 through 31 December 2012
- Both eligibility dates inclusive
- Multi-step player registration
- Fixed submit-button validation
- Strong final review and success confirmation
- UPI QR payment
- Refund guarantee
- Player, owner and sponsor benefits
- Full team and individual prize amounts
- Six franchise pages
- Live Draft Arena
- Admin and owner portals
- Live-statistics SQL
- Registration-verification SQL

DEPLOY WEBSITE
rm -rf /tmp/tnypl-v8-complete
mkdir -p /tmp/tnypl-v8-complete
unzip -o TNYPL_V8_Complete_Registration_Launch.zip -d /tmp/tnypl-v8-complete
cp -r /tmp/tnypl-v8-complete/* .
rm -f TNYPL_V8_Complete_Registration_Launch.zip
git add .
git commit -m "Launch complete TNYPL V8 registration website"
git push origin main

SUPABASE
Run SUPABASE-V8-LIVE-STATISTICS.sql once in the Supabase SQL Editor.

TEST
Submit one test registration and confirm:
1. Success message appears.
2. New player appears in public.players.
3. age_proof_path is populated.
4. payment_receipt_path is populated.
5. Both uploaded files appear in Storage > player-documents.
6. The registration counter increases.
