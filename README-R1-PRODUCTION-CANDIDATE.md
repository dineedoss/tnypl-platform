# Deploy
```bash
git checkout main
git pull origin main
git checkout -b release/r1-production-candidate
rm -rf /tmp/tnypl-r1 && mkdir -p /tmp/tnypl-r1
unzip -o TNYPL_R1_Production_Candidate.zip -d /tmp/tnypl-r1
cp -r /tmp/tnypl-r1/. .
rm -f TNYPL_R1_Production_Candidate.zip
npm install
git add .
git commit -m "Build TNYPL R1 production candidate"
git push -u origin release/r1-production-candidate
```
Run `TNYPL_R1_PRODUCTION_CANDIDATE_MIGRATION.sql` before testing.
Ayyappa Auto Agencies is intentionally non-clickable until an official URL is provided.
