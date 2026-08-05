TNYPL V13 - EIGHT FRANCHISE + SPONSOR DEPLOYMENT

Included:
- Eight-franchise architecture and public franchise display.
- Karaikudi Kings replaces Karaikudi Kings.
- Thanjavur Royals joint-owner page for Saravanan Narasimhan and Santhana Krishnan.
- Both Thanjavur owner photos and login emails.
- Ramanathan Periyaraja approved photo.
- Ajay Manohar leadership role finalized.
- Draft Command Centre for eight franchises.
- Readable owner-page redesign and Karaikudi owner video retained.
- The Cake Point and Vedapile sponsor assets added.
- Sponsor page, sponsor homepage section and branding approval page.
- Official TNYPL logo variants and franchise logo-option boards included.
- No sponsor naming rights assigned to awards.
- Venue details intentionally held back.
- Supabase V13 upgrade SQL included.

Deployment:
1. Upload this ZIP to Codespaces project root.
2. Run:
   rm -rf /tmp/tnypl-v13
   mkdir -p /tmp/tnypl-v13
   unzip -o TNYPL_V13_8_Team_Sponsor_Release.zip -d /tmp/tnypl-v13
   cp -r /tmp/tnypl-v13/* .
   rm -f TNYPL_V13_8_Team_Sponsor_Release.zip
   npm install
   git add .
   git commit -m "Deploy TNYPL V13 eight-franchise sponsor release"
   git push origin main

Supabase:
Run SUPABASE-V13-UPGRADE.sql after the V12 complete setup. Create/invite owner Auth accounts first, then rerun the assignment statements if needed.

Pending small updates:
- Final Franchise 08 identity and owner details.
- Owner approval of franchise logos/colors.
- Remaining owner videos.
- CricHeroes public tournament link.
- Additional sponsors and award principal sponsor.
