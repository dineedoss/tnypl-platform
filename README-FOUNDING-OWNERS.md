TNYPL FOUNDING OWNERS SHOWCASE

Changes:
- Removes all franchise sales language
- Removes ₹20,000 contribution and Express Interest CTA
- Shows Suresh Durairaj as Chennai Strikers owner
- Adds owner photo placeholders
- Adds franchise vision statements
- Adds video/interview placeholders
- Adds confirmed founding owners section

Deploy:
unzip -o TNYPL_Founding_Owners_Showcase.zip -d /tmp/tnypl-owners
cp /tmp/tnypl-owners/index.html .
cp /tmp/tnypl-owners/styles.css .
git add index.html styles.css
git commit -m "Add founding owners showcase"
git push origin main
