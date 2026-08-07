TNYPL V10 — ALL CONFIRMED MEDIA + LINKED LEADERSHIP

CONFIRMED PHOTOS INCLUDED
- Vimalesh Vedachalam
- Gopi Ramadoss
- Porkai Pandian Gopalakrishnan
- Ramanathan Periyaraja
- P. C. Binny Jo
- Saravanan Narasimhan
- Santhana Krishnan
- Ranjith Janagiraman
- Ajay Manohar

CONFIRMED VIDEOS INCLUDED
- Porkai Pandian owner message
- Ramanathan Periyaraja owner message

STILL USING PLACEHOLDERS
- Dinesh Devadoss
- Senthil Narayanan
- Satish Raja
- Suresh Durai
- Usha Suresh

NEW PAGES
- leadership.html
- owners.html
- Individual leadership profiles
- Individual owner profiles
- Cross-links from every Founder/leadership page to all other administration profiles
- Cross-links from every owner page to other owner profiles

IMPORTANT
Franchise pages remain team-focused. Personal biographies and videos are placed only in the separate owner pages.

ADMIN
https://tnypl.in/admin.html

CONTACT EMAIL
info@tnypl.in

DEPLOY
rm -rf /tmp/tnypl-v10
mkdir -p /tmp/tnypl-v10
unzip -o TNYPL_V10_All_Media_Leadership_Links.zip -d /tmp/tnypl-v10
cp -r /tmp/tnypl-v10/* .
rm -f TNYPL_V10_All_Media_Leadership_Links.zip
npm install
git add .
git commit -m "Add confirmed owner media and linked leadership profiles"
git push origin main
