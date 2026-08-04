-- TNYPL REGISTRATION VERIFICATION QUERIES

-- Latest registrations
select
  full_name,
  date_of_birth,
  parent_phone,
  email,
  status,
  age_proof_path,
  payment_receipt_path,
  created_at
from public.players
order by created_at desc
limit 20;

-- Registration count
select count(*) as total_registrations
from public.players;

-- Public live statistics
select public.get_public_site_stats();

-- Example: mark a player as verified
-- Replace TEST_PLAYER_EMAIL with the real email.
-- update public.players
-- set status = 'verified'
-- where email = 'TEST_PLAYER_EMAIL';
