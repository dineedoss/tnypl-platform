-- =====================================================================
-- TNYPL V18 FOUNDING OWNER ACCESS RESET
-- Removes test owner access and invitation records only.
-- Does not delete franchises, wallets, players, bids or admin users.
-- =====================================================================

begin;

delete from public.owner_invites;

delete from public.owner_profiles;

update public.franchise_wallets
set
  points_spent = 0,
  squad_count = 0,
  is_locked = false,
  updated_at = now();

commit;

select
  (select count(*) from public.owner_profiles) as owner_profiles_remaining,
  (select count(*) from public.owner_invites) as invitations_remaining;
