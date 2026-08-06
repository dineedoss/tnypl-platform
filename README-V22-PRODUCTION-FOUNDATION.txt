TNYPL V22 — PRODUCTION FOUNDATION

WHAT V22 FIXES
- Legacy owner_profiles.team_id no longer blocks owner invitations
- franchise_id is the standard franchise relationship
- Invited Primary Owners are created in owner_profiles and franchise_members
- Primary Owner receives full team-management and bidding permissions
- Password invitation redirects to owner-setup-password.html
- Owner membership is marked accepted after password creation
- Co-owner, coach, manager, analyst and viewer management included
- Auction and points wallet included
- CricHeroes cricheroes.com and chshare.link URLs accepted

SETUP
1. Run TNYPL_V22_MASTER_PRODUCTION_MIGRATION.sql in Supabase SQL Editor.
2. Confirm Netlify variables: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, SITE_URL=https://tnypl.in
3. Deploy this package.
4. Invite one test Primary Owner from /admin-owners.html.
5. Activate password from email.
6. Confirm /owner-dashboard.html and /franchise-team.html.

DEPLOY
rm -rf /tmp/tnypl-v22
mkdir -p /tmp/tnypl-v22
unzip -o TNYPL_V22_Production_Foundation.zip -d /tmp/tnypl-v22
cp -r /tmp/tnypl-v22/* .
rm -f TNYPL_V22_Production_Foundation.zip
npm install
git add .
git commit -m "Consolidate TNYPL production owner and auction foundation"
git push origin main
