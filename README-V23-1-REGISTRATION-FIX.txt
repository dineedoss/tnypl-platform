TNYPL V23.1 — REGISTRATION DISPLAY FIX

FIXED
- Removed the large blue 'LOAD SAFE DUMMY REGISTRATION' block from the public page.
- Dummy test tools now load only when the URL contains ?dummy=1.
- Normal visitors at https://tnypl.in see no test controls.
- Dummy testing remains available at:
  https://tnypl.in/dummy-registration.html

NO SQL MIGRATION IS REQUIRED.

DEPLOY
rm -rf /tmp/tnypl-v23-1
mkdir -p /tmp/tnypl-v23-1
unzip -o TNYPL_V23_1_Registration_Display_Fix.zip -d /tmp/tnypl-v23-1
cp -r /tmp/tnypl-v23-1/. .
rm -f TNYPL_V23_1_Registration_Display_Fix.zip
npm install
git add .
git commit -m "Hide dummy registration controls from public page"
git push origin main

VERIFY
1. Open https://tnypl.in with a hard refresh.
   The blue dummy block must be gone.
2. Open https://tnypl.in/dummy-registration.html.
   A small yellow TEST MODE notice should appear and sample data should load.
