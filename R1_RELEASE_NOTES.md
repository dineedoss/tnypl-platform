# R1 Production Candidate V2

Corrected production schema compatibility after live inspection confirmed:

- tournament_draws.id = bigint
- franchises.id = uuid
- matches franchise references = uuid

The V2 migration uses bigint draw IDs in:
- tournament_draw_entries.draw_id
- tournament_draw_history.draw_id
- all Official Draw RPC parameters
- admin_create_tournament_draw return type

Existing production tables and data are preserved.
