TNYPL V23 — COMPLETION PACKAGE

INCLUDED
- Admin auction Start / Pause / Resume / End controls
- Reset Current Player
- Clear Current Bids
- Complete Test Auction Reset
- Clean public waiting screen before auction begins
- Public completed-auction screen
- Livestream URL and Watch Stream button
- YouTube/Vimeo embed support
- Franchise 08 filtered from auction displays
- Clear wallet labels, point units and lock buttons
- Suresh Durai and Usha Durai photos and Tuticorin Sharks ownership story
- Usha Durai highlighted as TNYPL's first woman franchise owner
- Satish Raja photo and Trichy Titans profile
- Privacy Policy
- Terms & Conditions
- Contact page using info@tnypl.in
- FAQ
- Draft & Auction Rules
- Dummy player registration loader

IMPORTANT FIRST STEP
Run:
TNYPL_V23_COMPLETION_MIGRATION.sql

DEPLOY
rm -rf /tmp/tnypl-v23
mkdir -p /tmp/tnypl-v23
unzip -o TNYPL_V23_Completion_Package.zip -d /tmp/tnypl-v23
cp -r /tmp/tnypl-v23/. .
rm -f TNYPL_V23_Completion_Package.zip
npm install
git add .
git commit -m "Add V23 auction controls public stream legal pages and dummy registration"
git push origin main

TEST DUMMY PLAYER REGISTRATION
Open:
https://tnypl.in/dummy-registration.html

The helper fills safe sample text fields. You must still upload any files required
by the registration form. Submit normally, verify the record in Admin, then delete
or clearly mark the dummy registration so it never reaches the real draft pool.

CLEAN PUBLIC DRAFT
After migration and deploy:
1. Open /admin-auction.html
2. Click RESET CURRENT PLAYER
3. Public /draft-room.html will show Auction Not Started
4. Save a stream URL when ready
5. Click START PUBLIC AUCTION or open a selected player

COMPLETE RESET WARNING
RESET COMPLETE TEST AUCTION removes bids, drafted assignments and wallet spending.
It does not remove player registrations, franchises, owners or staff accounts.
