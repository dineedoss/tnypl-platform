-- =====================================================================
-- TNYPL V23 COMPLETION MIGRATION
-- Auction reset controls, clean public state, and livestream configuration.
-- Safe to run repeatedly after the V22 auction tables exist.
-- =====================================================================

begin;

alter table public.auction_settings
  add column if not exists public_message text
    default 'The TNYPL player auction has not started yet. Please stay tuned.';

alter table public.auction_settings
  add column if not exists live_stream_url text;

alter table public.auction_settings
  add column if not exists live_stream_enabled boolean not null default false;

alter table public.auction_settings
  add column if not exists stream_label text default 'Watch the TNYPL Live Auction';

alter table public.auction_settings
  add column if not exists public_visible boolean not null default false;

alter table public.auction_settings
  add column if not exists auction_started_at timestamptz;

alter table public.auction_settings
  add column if not exists auction_ended_at timestamptz;

-- Save public broadcast settings.
create or replace function public.admin_save_broadcast_settings(
  p_live_stream_url text,
  p_live_stream_enabled boolean,
  p_stream_label text,
  p_public_message text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_tnypl_admin() then
    raise exception 'Admin access required';
  end if;

  update public.auction_settings
  set live_stream_url = nullif(trim(p_live_stream_url), ''),
      live_stream_enabled = coalesce(p_live_stream_enabled, false),
      stream_label = coalesce(nullif(trim(p_stream_label), ''), 'Watch the TNYPL Live Auction'),
      public_message = coalesce(
        nullif(trim(p_public_message), ''),
        'The TNYPL player auction has not started yet. Please stay tuned.'
      ),
      updated_at = now()
  where id = 1;
end;
$$;

grant execute on function public.admin_save_broadcast_settings(text,boolean,text,text)
to authenticated;

-- Clean the current public presentation without deleting players.
create or replace function public.admin_reset_current_auction()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_player uuid;
begin
  if not public.is_tnypl_admin() then
    raise exception 'Admin access required';
  end if;

  select current_player_id into v_player
  from public.auction_settings
  where id = 1;

  update public.auction_lots
  set status = 'queued',
      highest_bid = null,
      highest_franchise_id = null,
      opened_at = null,
      closes_at = null,
      sold_at = null
  where player_id = v_player
    and status in ('open','paused');

  delete from public.auction_bids
  where lot_id in (
    select id from public.auction_lots
    where player_id = v_player
      and status = 'queued'
  );

  update public.auction_settings
  set status = 'setup',
      current_player_id = null,
      bidding_opens_at = null,
      bidding_closes_at = null,
      public_visible = false,
      updated_at = now()
  where id = 1;
end;
$$;

grant execute on function public.admin_reset_current_auction()
to authenticated;

-- Clear bids only for the active lot.
create or replace function public.admin_clear_current_bids()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lot uuid;
begin
  if not public.is_tnypl_admin() then
    raise exception 'Admin access required';
  end if;

  select al.id
  into v_lot
  from public.auction_settings s
  join public.auction_lots al on al.player_id = s.current_player_id
  where s.id = 1
  order by al.round_no desc
  limit 1;

  if v_lot is null then
    raise exception 'No active auction lot';
  end if;

  delete from public.auction_bids where lot_id = v_lot;

  update public.auction_lots
  set highest_bid = null,
      highest_franchise_id = null
  where id = v_lot;

  update public.auction_settings
  set updated_at = now()
  where id = 1;
end;
$$;

grant execute on function public.admin_clear_current_bids()
to authenticated;

-- Start or resume the public auction presentation.
create or replace function public.admin_start_public_auction()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_tnypl_admin() then
    raise exception 'Admin access required';
  end if;

  update public.auction_settings
  set public_visible = true,
      auction_started_at = coalesce(auction_started_at, now()),
      auction_ended_at = null,
      status = case when current_player_id is null then 'setup' else 'open' end,
      updated_at = now()
  where id = 1;
end;
$$;

grant execute on function public.admin_start_public_auction()
to authenticated;

-- End public auction and retain completed records.
create or replace function public.admin_end_public_auction()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_tnypl_admin() then
    raise exception 'Admin access required';
  end if;

  update public.auction_lots
  set status = 'paused'
  where status = 'open';

  update public.auction_settings
  set status = 'closed',
      public_visible = true,
      current_player_id = null,
      bidding_opens_at = null,
      bidding_closes_at = null,
      auction_ended_at = now(),
      updated_at = now()
  where id = 1;
end;
$$;

grant execute on function public.admin_end_public_auction()
to authenticated;

-- Complete test reset. It clears auction activity but does not delete players,
-- registrations, owners, franchises, or staff accounts.
create or replace function public.admin_reset_complete_auction()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_tnypl_admin() then
    raise exception 'Admin access required';
  end if;

  delete from public.auction_bids;

  update public.auction_lots
  set status = 'queued',
      highest_bid = null,
      highest_franchise_id = null,
      opened_at = null,
      closes_at = null,
      sold_at = null;

  update public.players
  set drafted = false,
      drafted_franchise_id = null,
      drafted_team = null,
      drafted_at = null
  where drafted = true;

  update public.franchise_wallets
  set points_spent = 0,
      squad_count = 0,
      is_locked = false,
      updated_at = now();

  update public.auction_settings
  set status = 'setup',
      current_player_id = null,
      bidding_opens_at = null,
      bidding_closes_at = null,
      public_visible = false,
      auction_started_at = null,
      auction_ended_at = null,
      updated_at = now()
  where id = 1;
end;
$$;

grant execute on function public.admin_reset_complete_auction()
to authenticated;

commit;

-- Verification
select
  status,
  public_visible,
  live_stream_enabled,
  live_stream_url,
  public_message
from public.auction_settings
where id = 1;
