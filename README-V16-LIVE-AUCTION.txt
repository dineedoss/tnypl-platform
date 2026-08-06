TNYPL V16 — LIVE AUCTION DRAFT PACKAGE

WHAT IS INCLUDED
- Public live Draft Room: draft-room.html
- Owner bidding console: owner-dashboard.html
- Existing owner login: owner-login.html
- Admin Auction Control Room: admin-auction.html
- Platinum / Gold / Silver player categories
- Suggested opening points: Platinum 1000, Gold 600, Silver 300
- Live bid updates through Supabase Realtime
- Atomic bidding through PostgreSQL RPC
- Franchise allocation and credit limit
- Maximum squad size: 13
- Excess points create a rupee payment obligation
- Unused allocated points are forfeited
- Bid audit history, including rejected attempts
- Auction settlement generator

DEFAULT RULES
- Starting allocation: 10,000 points per franchise
- Excess credit limit: 2,500 points
- Excess conversion rate: ₹10 per point
- Bid increments: 50 below 1,000; 100 from 1,000; 250 from 2,000
- Timer: 45 seconds
- Late bid extension: 10 seconds
All defaults can be changed in Supabase auction_settings and franchise_wallets.

BEFORE DEPLOYING
1. Run TNYPL_V16_AUCTION_MIGRATION.sql in Supabase SQL Editor.
2. Create owner users in Supabase Authentication.
3. Link each owner user to a franchise using the sample owner_profiles query at the bottom of the SQL file.
4. Confirm the owner can sign in through owner-login.html.
5. Deploy the ZIP.
6. Open admin-auction.html and classify/open a test player.
7. Open draft-room.html in another browser.
8. Log in as an owner and place a test bid.

DEPLOY
rm -rf /tmp/tnypl-v16
mkdir -p /tmp/tnypl-v16
unzip -o TNYPL_V16_Live_Auction_Draft.zip -d /tmp/tnypl-v16
cp -r /tmp/tnypl-v16/* .
rm -f TNYPL_V16_Live_Auction_Draft.zip
npm install
git add .
git commit -m "Add TNYPL live owner auction and draft room"
git push origin main

IMPORTANT
This is a controlled-points auction. Owners can exceed allocated points only up to their configured credit limit.
The Owner Console shows the projected payment before confirming an excess bid.
