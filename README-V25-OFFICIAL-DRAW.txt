TNYPL V25 — OFFICIAL DRAW CEREMONY

INCLUDED
- Secure browser random selection using crypto.getRandomValues
- 8-franchise wheel animation
- Full-screen ceremony countdown and winner reveal
- Group A / Group B allocation
- Group A position draw: A1, A2, A3, A4
- Group B position draw: B1, B2, B3, B4
- Automatic removal of selected franchises
- Accept Result confirmation
- Undo Last Spin
- Complete Reset
- Immutable-style audit history with spin number, time and random value
- Public live draw page
- Automatic generation of 15 fixtures:
  12 group matches
  2 semifinals
  1 final
- One-click publish into the V24 Match Center

FIRST
Run:
TNYPL_V25_OFFICIAL_DRAW_MIGRATION.sql

DEPLOY
rm -rf /tmp/tnypl-v25
mkdir -p /tmp/tnypl-v25
unzip -o TNYPL_V25_Official_Draw_Ceremony.zip -d /tmp/tnypl-v25
cp -r /tmp/tnypl-v25/. .
rm -f TNYPL_V25_Official_Draw_Ceremony.zip
npm install
git add .
git commit -m "Add official TNYPL wheel draw and fixture generator"
git push origin main

ADMIN CONTROL
https://tnypl.in/official-draw-admin.html

PUBLIC CEREMONY
https://tnypl.in/official-draw-public.html

PROCESS
1. Create New Draw
2. Lock 8 Franchises & Go Live
3. Group Allocation:
   Spin → Accept Result → alternate Group A/B
4. Group A Positions:
   Select Group A Positions → A1 through A4
5. Group B Positions:
   Select Group B Positions → B1 through B4
6. Enter start date, venue, ground and match times
7. Generate & Publish 15 Matches
8. Verify at /match-center.html

The semifinal records are generated as placeholders because the actual A1/B2 and
B1/A2 teams are determined by the final group standings, not the original draw positions.
