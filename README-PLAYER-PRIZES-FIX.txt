TNYPL VERSION A — PLAYER PRIZE MONEY FIX

Updated individual player awards:
- Man of the Match: ₹500 per match
- Tournament MVP: ₹2,000
- Best Batter: ₹2,000
- Best Bowler: ₹2,000
- Best Fielder: ₹2,000

The amounts are now shown:
- In the top prize banner
- In the main Prize & Recognition section
- In the Why Register section

DEPLOY:
rm -rf /tmp/tnypl-player-prizes
mkdir -p /tmp/tnypl-player-prizes
unzip -o TNYPL_Version_A_Player_Prizes_Fix.zip -d /tmp/tnypl-player-prizes
cp -r /tmp/tnypl-player-prizes/* .
rm -f TNYPL_Version_A_Player_Prizes_Fix.zip
git add .
git commit -m "Add TNYPL individual player prize amounts"
git push origin main
