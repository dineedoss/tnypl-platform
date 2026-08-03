TNYPL PRE-V8 LOGO SPELLING FIX

Problem:
The old SVG placed the TNYPL letters inside the crest. At some screen sizes the
letters overlapped and looked like INYL/TNYL.

Fix:
- Crest and TNYPL wordmark are now separate.
- TNYPL is rendered as real HTML text in the hero.
- Navigation uses a clean horizontal TNYPL wordmark.
- Hero uses a crest-only animated logo.
- September dates and existing working features are preserved.

DEPLOY:
rm -rf /tmp/tnypl-logo-fix
mkdir -p /tmp/tnypl-logo-fix
unzip -o TNYPL_PreV8_LogoSpellingFix.zip -d /tmp/tnypl-logo-fix
cp -r /tmp/tnypl-logo-fix/* .
rm -f TNYPL_PreV8_LogoSpellingFix.zip
git add .
git commit -m "Fix TNYPL logo spelling and presentation"
git push origin main
