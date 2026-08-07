# TNYPL R1 Production Candidate V2

This package replaces the first R1 migration with a production-compatible
migration based on the verified live schema:

- `tournament_draws.id` is `bigint`
- `franchises.id` is `uuid`
- Match franchise references are `uuid`

## Important

Do not run the previous R1 migration again.

Run:

`TNYPL_R1_PRODUCTION_V2_MIGRATION.sql`

## Deploy on the existing release branch

```bash
git checkout release/r1-production-candidate

rm -rf /tmp/tnypl-r1-v2
mkdir -p /tmp/tnypl-r1-v2

unzip -o TNYPL_R1_Production_Candidate_V2.zip -d /tmp/tnypl-r1-v2
cp -r /tmp/tnypl-r1-v2/. .

rm -f TNYPL_R1_Production_Candidate_V2.zip

npm install

git add -A
git commit -m "Fix R1 production schema compatibility"
git push origin release/r1-production-candidate
```

## Database

Run the complete file:

`TNYPL_R1_PRODUCTION_V2_MIGRATION.sql`

The final verification result must show:

- `tournament_draw_id_type = bigint`
- `draw_entry_draw_id_type = bigint`
- all six RPC names
- `site_settings`
- `admin_team_members`

## Ayyappa Auto Agencies

No verified official website URL was supplied. The logo remains intentionally
non-clickable.
