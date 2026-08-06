
TNYPL V20 — FRANCHISE TEAM MANAGEMENT

Run:
TNYPL_V20_FRANCHISE_TEAM_MIGRATION.sql

Owner page:
https://tnypl.in/franchise-team.html

Primary owners can invite and remove:
- Co-Owners
- Coaches
- Managers
- Analysts
- Viewers

Permissions:
- Bid
- Watchlist
- Player notes
- Settlement visibility

Safeguards:
- Primary owner cannot be removed
- Members can manage only their own franchise
- TNYPL Admin keeps override access
- Removal disables franchise permissions without deleting the Auth account
- Every change is written to franchise_member_audit

Deploy:
rm -rf /tmp/tnypl-v20
mkdir -p /tmp/tnypl-v20
unzip -o TNYPL_V20_Franchise_Team_Management.zip -d /tmp/tnypl-v20
cp -r /tmp/tnypl-v20/* .
rm -f TNYPL_V20_Franchise_Team_Management.zip
npm install
git add .
git commit -m "Add owner-controlled franchise team access"
git push origin main
