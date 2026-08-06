-- =====================================================================
-- TNYPL V22 PRODUCTION FOUNDATION — MASTER COMPATIBILITY MIGRATION
-- This consolidates owner invitations, franchise memberships, auction,
-- password onboarding, permissions and CricHeroes share-link support.
-- Safe to run over the current production database.
-- =====================================================================

begin;

-- Legacy compatibility: old builds required owner_profiles.team_id.
-- V22 standardizes all current features on franchise_id.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='owner_profiles' and column_name='team_id'
  ) then
    alter table public.owner_profiles alter column team_id drop not null;
  end if;
end $$;

alter table if exists public.owner_profiles
  add column if not exists franchise_id uuid;
alter table if exists public.owner_profiles
  add column if not exists owner_name text;
alter table if exists public.owner_profiles
  add column if not exists role text default 'owner';
alter table if exists public.owner_profiles
  add column if not exists is_active boolean default true;

commit;


-- INCLUDED: TNYPL_V16_AUCTION_MIGRATION.sql
-- =====================================================================
-- TNYPL V16 LIVE AUCTION DRAFT MIGRATION
-- Run once in Supabase SQL Editor after the V2.1 production database.
-- Existing registrations and admin access are preserved.
-- =====================================================================

begin;
create extension if not exists pgcrypto;

-- Owner-to-franchise authentication mapping.
create table if not exists public.owner_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  owner_name text,
  franchise_id uuid references public.franchises(id) on delete cascade,
  role text not null default 'owner',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.owner_profiles add column if not exists owner_name text;
alter table public.owner_profiles add column if not exists franchise_id uuid references public.franchises(id) on delete cascade;
alter table public.owner_profiles add column if not exists role text default 'owner';
alter table public.owner_profiles add column if not exists is_active boolean default true;

-- Player draft classification and presentation information.
alter table public.players add column if not exists draft_category text;
alter table public.players add column if not exists draft_base_points integer;
alter table public.players add column if not exists draft_photo_url text;
alter table public.players add column if not exists draft_video_url text;
alter table public.players add column if not exists coach_rating numeric(3,1);
alter table public.players add column if not exists coach_notes text;
alter table public.players add column if not exists draft_pool_approved boolean not null default false;

alter table public.players drop constraint if exists players_draft_category_check;
alter table public.players add constraint players_draft_category_check
check (draft_category is null or draft_category in ('Platinum','Gold','Silver'));

-- League-wide auction configuration.
create table if not exists public.auction_settings (
  id integer primary key default 1 check (id=1),
  auction_name text not null default 'TNYPL 2026 Live Player Auction',
  status text not null default 'setup',
  current_player_id uuid references public.players(id) on delete set null,
  bidding_opens_at timestamptz,
  bidding_closes_at timestamptz,
  timer_seconds integer not null default 45,
  bid_extension_seconds integer not null default 10,
  points_to_rupees numeric(12,2) not null default 10,
  default_points integer not null default 10000,
  default_credit_limit integer not null default 2500,
  bid_increment_low integer not null default 50,
  bid_increment_mid integer not null default 100,
  bid_increment_high integer not null default 250,
  updated_at timestamptz not null default now()
);

insert into public.auction_settings(id)
values(1)
on conflict(id) do nothing;

alter table public.auction_settings drop constraint if exists auction_settings_status_check;
alter table public.auction_settings add constraint auction_settings_status_check
check(status in ('setup','open','paused','sold','unsold','closed'));

-- Franchise budgets / wallets.
create table if not exists public.franchise_wallets (
  franchise_id uuid primary key references public.franchises(id) on delete cascade,
  allocated_points integer not null default 10000,
  credit_limit integer not null default 2500,
  points_spent integer not null default 0,
  squad_count integer not null default 0,
  is_locked boolean not null default false,
  updated_at timestamptz not null default now()
);

insert into public.franchise_wallets(franchise_id)
select id from public.franchises
on conflict(franchise_id) do nothing;

-- Auction lots; one lot per player, but supports reopening through round_no.
create table if not exists public.auction_lots (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  round_no integer not null default 1,
  category text not null,
  base_points integer not null,
  status text not null default 'queued',
  highest_bid integer,
  highest_franchise_id uuid references public.franchises(id) on delete set null,
  opened_at timestamptz,
  closes_at timestamptz,
  sold_at timestamptz,
  created_at timestamptz not null default now(),
  unique(player_id,round_no)
);

alter table public.auction_lots drop constraint if exists auction_lots_status_check;
alter table public.auction_lots add constraint auction_lots_status_check
check(status in ('queued','open','paused','sold','unsold','withdrawn'));

-- Every accepted or rejected attempt is stored.
create table if not exists public.auction_bids (
  id bigint generated by default as identity primary key,
  lot_id uuid not null references public.auction_lots(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  franchise_id uuid not null references public.franchises(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  bid_points integer not null,
  previous_bid integer,
  accepted boolean not null default true,
  rejection_reason text,
  created_at timestamptz not null default now()
);

create index if not exists auction_bids_lot_created_idx on public.auction_bids(lot_id,created_at desc);
create index if not exists auction_lots_status_idx on public.auction_lots(status);
create index if not exists players_draft_category_idx on public.players(draft_category);

-- Settlement ledger.
create table if not exists public.auction_settlements (
  franchise_id uuid primary key references public.franchises(id) on delete cascade,
  allocated_points integer not null,
  points_spent integer not null,
  excess_points integer not null,
  unused_points integer not null,
  rupees_per_excess_point numeric(12,2) not null,
  amount_payable numeric(12,2) not null,
  generated_at timestamptz not null default now()
);

-- Security helper functions prevent recursive RLS.
create or replace function public.is_tnypl_admin()
returns boolean
language sql stable security definer
set search_path=public
as $$
  select exists(select 1 from public.admin_users where user_id=auth.uid());
$$;

create or replace function public.my_tnypl_franchise_id()
returns uuid
language sql stable security definer
set search_path=public
as $$
  select franchise_id from public.owner_profiles
  where user_id=auth.uid() and is_active=true
  limit 1;
$$;

-- Bid increment helper.
create or replace function public.required_bid_increment(p_current integer)
returns integer
language sql immutable
as $$
  select case
    when coalesce(p_current,0) < 1000 then 50
    when coalesce(p_current,0) < 2000 then 100
    else 250
  end;
$$;

-- Atomic owner bid RPC.
create or replace function public.place_auction_bid(p_lot_id uuid, p_bid_points integer)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_uid uuid := auth.uid();
  v_franchise uuid;
  v_lot public.auction_lots%rowtype;
  v_wallet public.franchise_wallets%rowtype;
  v_current integer;
  v_min integer;
  v_total_capacity integer;
  v_available integer;
  v_now timestamptz := now();
begin
  if v_uid is null then raise exception 'Authentication required'; end if;

  select franchise_id into v_franchise
  from public.owner_profiles
  where user_id=v_uid and is_active=true;

  if v_franchise is null then raise exception 'Owner account is not linked to a franchise'; end if;

  select * into v_lot from public.auction_lots where id=p_lot_id for update;
  if not found then raise exception 'Auction lot not found'; end if;
  if v_lot.status <> 'open' then raise exception 'Bidding is not open'; end if;
  if v_lot.closes_at is not null and v_lot.closes_at <= v_now then raise exception 'Bidding time has expired'; end if;

  select * into v_wallet from public.franchise_wallets where franchise_id=v_franchise for update;
  if not found then raise exception 'Franchise wallet not found'; end if;
  if v_wallet.is_locked then raise exception 'This franchise is locked from bidding'; end if;
  if v_wallet.squad_count >= 13 then raise exception 'Squad limit of 13 has been reached'; end if;

  v_current := coalesce(v_lot.highest_bid, v_lot.base_points - public.required_bid_increment(v_lot.base_points));
  v_min := greatest(v_lot.base_points, v_current + public.required_bid_increment(v_current));
  if p_bid_points < v_min then raise exception 'Minimum valid bid is % points',v_min; end if;

  v_total_capacity := v_wallet.allocated_points + v_wallet.credit_limit;
  v_available := v_total_capacity - v_wallet.points_spent;
  if p_bid_points > v_available then
    raise exception 'Bid exceeds maximum available bidding power of % points',v_available;
  end if;

  if v_lot.highest_franchise_id = v_franchise then
    raise exception 'Your franchise is already the highest bidder';
  end if;

  insert into public.auction_bids
    (lot_id,player_id,franchise_id,owner_user_id,bid_points,previous_bid,accepted)
  values
    (v_lot.id,v_lot.player_id,v_franchise,v_uid,p_bid_points,v_lot.highest_bid,true);

  update public.auction_lots
  set highest_bid=p_bid_points,
      highest_franchise_id=v_franchise,
      closes_at=case
        when closes_at is null then v_now + interval '45 seconds'
        when closes_at-v_now < interval '10 seconds' then v_now + interval '10 seconds'
        else closes_at
      end
  where id=v_lot.id;

  return jsonb_build_object(
    'accepted',true,
    'bid_points',p_bid_points,
    'franchise_id',v_franchise,
    'remaining_capacity',v_available-p_bid_points
  );
exception when others then
  if v_uid is not null and v_franchise is not null and p_lot_id is not null then
    insert into public.auction_bids
      (lot_id,player_id,franchise_id,owner_user_id,bid_points,previous_bid,accepted,rejection_reason)
    select p_lot_id,player_id,v_franchise,v_uid,p_bid_points,highest_bid,false,sqlerrm
    from public.auction_lots where id=p_lot_id;
  end if;
  raise;
end;
$$;

grant execute on function public.place_auction_bid(uuid,integer) to authenticated;

-- Admin opens a player lot.
create or replace function public.admin_open_auction(
  p_player_id uuid,
  p_category text,
  p_base_points integer,
  p_timer_seconds integer default 45
)
returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare v_lot_id uuid;
begin
  if not public.is_tnypl_admin() then raise exception 'Admin access required'; end if;
  if p_category not in ('Platinum','Gold','Silver') then raise exception 'Invalid category'; end if;

  update public.auction_lots set status='paused' where status='open';

  insert into public.auction_lots(player_id,category,base_points,status,opened_at,closes_at)
  values(p_player_id,p_category,p_base_points,'open',now(),now()+make_interval(secs=>p_timer_seconds))
  on conflict(player_id,round_no) do update set
    category=excluded.category,
    base_points=excluded.base_points,
    status='open',
    highest_bid=null,
    highest_franchise_id=null,
    opened_at=now(),
    closes_at=now()+make_interval(secs=>p_timer_seconds),
    sold_at=null
  returning id into v_lot_id;

  update public.players
  set draft_category=p_category,draft_base_points=p_base_points,draft_pool_approved=true
  where id=p_player_id;

  update public.auction_settings
  set current_player_id=p_player_id,status='open',
      bidding_opens_at=now(),bidding_closes_at=now()+make_interval(secs=>p_timer_seconds),
      timer_seconds=p_timer_seconds,updated_at=now()
  where id=1;

  return v_lot_id;
end;
$$;
grant execute on function public.admin_open_auction(uuid,text,integer,integer) to authenticated;

-- Admin pause / resume.
create or replace function public.admin_set_auction_status(p_status text)
returns void
language plpgsql security definer set search_path=public
as $$
begin
  if not public.is_tnypl_admin() then raise exception 'Admin access required'; end if;
  if p_status not in ('open','paused','closed') then raise exception 'Invalid status'; end if;
  update public.auction_settings set status=p_status,updated_at=now() where id=1;
  update public.auction_lots set status=p_status where status in ('open','paused');
end;
$$;
grant execute on function public.admin_set_auction_status(text) to authenticated;

-- Admin finalizes the current lot.
create or replace function public.admin_finalize_auction(p_lot_id uuid,p_result text)
returns jsonb
language plpgsql security definer set search_path=public
as $$
declare
  v_lot public.auction_lots%rowtype;
  v_name text;
begin
  if not public.is_tnypl_admin() then raise exception 'Admin access required'; end if;
  select * into v_lot from public.auction_lots where id=p_lot_id for update;
  if not found then raise exception 'Lot not found'; end if;

  if p_result='sold' then
    if v_lot.highest_franchise_id is null or v_lot.highest_bid is null then
      raise exception 'No accepted bid exists';
    end if;

    update public.auction_lots set status='sold',sold_at=now() where id=p_lot_id;
    update public.players p set
      drafted=true,
      status='drafted',
      drafted_franchise_id=v_lot.highest_franchise_id,
      drafted_team=f.name,
      drafted_at=now()
    from public.franchises f
    where p.id=v_lot.player_id and f.id=v_lot.highest_franchise_id;

    update public.franchise_wallets set
      points_spent=points_spent+v_lot.highest_bid,
      squad_count=squad_count+1,
      updated_at=now()
    where franchise_id=v_lot.highest_franchise_id;

    select name into v_name from public.franchises where id=v_lot.highest_franchise_id;
    update public.auction_settings set status='sold',updated_at=now() where id=1;
    return jsonb_build_object('result','sold','franchise',v_name,'points',v_lot.highest_bid);
  elsif p_result='unsold' then
    update public.auction_lots set status='unsold',sold_at=now() where id=p_lot_id;
    update public.auction_settings set status='unsold',updated_at=now() where id=1;
    return jsonb_build_object('result','unsold');
  else
    raise exception 'Result must be sold or unsold';
  end if;
end;
$$;
grant execute on function public.admin_finalize_auction(uuid,text) to authenticated;

-- Generate final settlement: excess is payable, unused allocation is forfeited.
create or replace function public.generate_auction_settlements()
returns void
language plpgsql security definer set search_path=public
as $$
declare v_rate numeric;
begin
  if not public.is_tnypl_admin() then raise exception 'Admin access required'; end if;
  select points_to_rupees into v_rate from public.auction_settings where id=1;

  insert into public.auction_settlements
    (franchise_id,allocated_points,points_spent,excess_points,unused_points,
     rupees_per_excess_point,amount_payable,generated_at)
  select franchise_id,allocated_points,points_spent,
    greatest(points_spent-allocated_points,0),
    greatest(allocated_points-points_spent,0),
    v_rate,
    greatest(points_spent-allocated_points,0)*v_rate,
    now()
  from public.franchise_wallets
  on conflict(franchise_id) do update set
    allocated_points=excluded.allocated_points,
    points_spent=excluded.points_spent,
    excess_points=excluded.excess_points,
    unused_points=excluded.unused_points,
    rupees_per_excess_point=excluded.rupees_per_excess_point,
    amount_payable=excluded.amount_payable,
    generated_at=excluded.generated_at;
end;
$$;
grant execute on function public.generate_auction_settlements() to authenticated;

-- RLS
alter table public.owner_profiles enable row level security;
alter table public.auction_settings enable row level security;
alter table public.franchise_wallets enable row level security;
alter table public.auction_lots enable row level security;
alter table public.auction_bids enable row level security;
alter table public.auction_settlements enable row level security;

drop policy if exists "owner reads own profile" on public.owner_profiles;
create policy "owner reads own profile" on public.owner_profiles
for select to authenticated using(user_id=auth.uid() or public.is_tnypl_admin());

drop policy if exists "public reads auction settings" on public.auction_settings;
create policy "public reads auction settings" on public.auction_settings
for select to anon,authenticated using(true);

drop policy if exists "public reads wallets" on public.franchise_wallets;
create policy "public reads wallets" on public.franchise_wallets
for select to anon,authenticated using(true);

drop policy if exists "public reads lots" on public.auction_lots;
create policy "public reads lots" on public.auction_lots
for select to anon,authenticated using(true);

drop policy if exists "public reads accepted bids" on public.auction_bids;
create policy "public reads accepted bids" on public.auction_bids
for select to anon,authenticated using(accepted=true or public.is_tnypl_admin() or owner_user_id=auth.uid());

drop policy if exists "owners read settlements" on public.auction_settlements;
create policy "owners read settlements" on public.auction_settlements
for select to authenticated
using(franchise_id=public.my_tnypl_franchise_id() or public.is_tnypl_admin());

-- Admin manage policies.
drop policy if exists "admin manages auction settings" on public.auction_settings;
create policy "admin manages auction settings" on public.auction_settings
for all to authenticated using(public.is_tnypl_admin()) with check(public.is_tnypl_admin());

drop policy if exists "admin manages wallets" on public.franchise_wallets;
create policy "admin manages wallets" on public.franchise_wallets
for all to authenticated using(public.is_tnypl_admin()) with check(public.is_tnypl_admin());

drop policy if exists "admin manages lots" on public.auction_lots;
create policy "admin manages lots" on public.auction_lots
for all to authenticated using(public.is_tnypl_admin()) with check(public.is_tnypl_admin());

-- Realtime
do $$
begin
  alter publication supabase_realtime add table public.auction_settings;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.auction_lots;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.auction_bids;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.franchise_wallets;
exception when duplicate_object then null;
end $$;

commit;

-- =====================================================================
-- LINK EACH OWNER LOGIN AFTER CREATING AUTH USERS
-- Replace emails and franchise slugs, and run each needed row.
-- =====================================================================
--
-- insert into public.owner_profiles(user_id,owner_name,franchise_id)
-- select u.id,'Vimalesh Vedachalam',f.id
-- from auth.users u cross join public.franchises f
-- where lower(u.email)=lower('OWNER_EMAIL') and f.slug='chennai-strikers'
-- on conflict(user_id) do update set owner_name=excluded.owner_name,
-- franchise_id=excluded.franchise_id,is_active=true;
--
-- =====================================================================


-- INCLUDED: TNYPL_V17_OWNER_INVITATION_MIGRATION.sql
-- =====================================================================
-- TNYPL V17 OWNER INVITATION ADMIN MIGRATION
-- Run after V16 auction migration.
-- =====================================================================

begin;

create table if not exists public.owner_invites (
  id bigint generated by default as identity primary key,
  owner_user_id uuid references auth.users(id) on delete set null,
  owner_name text not null,
  email text not null,
  franchise_id uuid not null references public.franchises(id) on delete cascade,
  invited_by uuid references auth.users(id) on delete set null,
  invitation_sent boolean not null default false,
  status text not null default 'invited',
  created_at timestamptz not null default now()
);

alter table public.owner_invites enable row level security;

drop policy if exists "admins read owner invites" on public.owner_invites;
create policy "admins read owner invites"
on public.owner_invites
for select
to authenticated
using (public.is_tnypl_admin());

drop policy if exists "service role manages owner invites" on public.owner_invites;
create policy "service role manages owner invites"
on public.owner_invites
for all
to service_role
using (true)
with check (true);

create index if not exists owner_invites_email_idx
  on public.owner_invites(lower(email));

create index if not exists owner_invites_franchise_idx
  on public.owner_invites(franchise_id);

commit;


-- INCLUDED: TNYPL_V20_FRANCHISE_TEAM_MIGRATION.sql

begin;

create table if not exists public.franchise_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  franchise_id uuid not null references public.franchises(id) on delete cascade,
  full_name text not null,
  email text not null,
  member_role text not null default 'viewer',
  can_bid boolean not null default false,
  can_manage_watchlist boolean not null default false,
  can_manage_players boolean not null default false,
  can_view_settlement boolean not null default false,
  can_manage_members boolean not null default false,
  is_primary_owner boolean not null default false,
  is_active boolean not null default true,
  invited_by uuid references auth.users(id) on delete set null,
  invited_at timestamptz not null default now(),
  accepted_at timestamptz,
  updated_at timestamptz not null default now(),
  unique(user_id, franchise_id)
);

alter table public.franchise_members drop constraint if exists franchise_members_role_check;
alter table public.franchise_members add constraint franchise_members_role_check
check (member_role in ('primary_owner','co_owner','coach','manager','analyst','viewer'));

create table if not exists public.franchise_member_audit (
  id bigint generated by default as identity primary key,
  franchise_id uuid references public.franchises(id) on delete cascade,
  member_user_id uuid references auth.users(id) on delete set null,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  previous_values jsonb,
  new_values jsonb,
  created_at timestamptz not null default now()
);

create index if not exists franchise_members_franchise_idx
on public.franchise_members(franchise_id);

create index if not exists franchise_members_email_idx
on public.franchise_members(lower(email));

create or replace function public.my_franchise_member_id()
returns uuid
language sql stable security definer
set search_path=public
as $$
  select fm.franchise_id
  from public.franchise_members fm
  where fm.user_id=auth.uid() and fm.is_active=true
  order by fm.is_primary_owner desc, fm.invited_at
  limit 1;
$$;

create or replace function public.has_franchise_permission(
  p_franchise_id uuid,
  p_permission text
)
returns boolean
language plpgsql stable security definer
set search_path=public
as $$
declare v public.franchise_members%rowtype;
begin
  if public.is_tnypl_admin() then return true; end if;

  select * into v
  from public.franchise_members
  where user_id=auth.uid()
    and franchise_id=p_franchise_id
    and is_active=true
  limit 1;

  if not found then return false; end if;

  return case p_permission
    when 'bid' then v.can_bid
    when 'watchlist' then v.can_manage_watchlist
    when 'players' then v.can_manage_players
    when 'settlement' then v.can_view_settlement
    when 'members' then v.can_manage_members
    else false
  end;
end;
$$;

insert into public.franchise_members (
  user_id,franchise_id,full_name,email,member_role,
  can_bid,can_manage_watchlist,can_manage_players,
  can_view_settlement,can_manage_members,
  is_primary_owner,is_active,invited_by,accepted_at
)
select
  op.user_id,op.franchise_id,coalesce(op.owner_name,u.email),u.email,
  'primary_owner',true,true,true,true,true,true,
  coalesce(op.is_active,true),op.user_id,now()
from public.owner_profiles op
join auth.users u on u.id=op.user_id
where op.franchise_id is not null
on conflict(user_id,franchise_id) do update set
  full_name=excluded.full_name,
  email=excluded.email,
  member_role='primary_owner',
  can_bid=true,
  can_manage_watchlist=true,
  can_manage_players=true,
  can_view_settlement=true,
  can_manage_members=true,
  is_primary_owner=true,
  is_active=excluded.is_active,
  accepted_at=coalesce(public.franchise_members.accepted_at,now()),
  updated_at=now();

alter table public.franchise_members enable row level security;
alter table public.franchise_member_audit enable row level security;

drop policy if exists "franchise users read team members" on public.franchise_members;
create policy "franchise users read team members"
on public.franchise_members for select to authenticated
using (franchise_id=public.my_franchise_member_id() or public.is_tnypl_admin());

drop policy if exists "service role manages franchise members" on public.franchise_members;
create policy "service role manages franchise members"
on public.franchise_members for all to service_role
using(true) with check(true);

drop policy if exists "franchise managers read member audit" on public.franchise_member_audit;
create policy "franchise managers read member audit"
on public.franchise_member_audit for select to authenticated
using(public.has_franchise_permission(franchise_id,'members') or public.is_tnypl_admin());

drop policy if exists "service role writes member audit" on public.franchise_member_audit;
create policy "service role writes member audit"
on public.franchise_member_audit for all to service_role
using(true) with check(true);

create or replace function public.place_auction_bid(
  p_lot_id uuid,
  p_bid_points integer
)
returns jsonb
language plpgsql security definer
set search_path=public
as $$
declare
  v_uid uuid:=auth.uid();
  v_franchise uuid;
  v_can_bid boolean;
  v_lot public.auction_lots%rowtype;
  v_wallet public.franchise_wallets%rowtype;
  v_current integer;
  v_min integer;
  v_capacity integer;
  v_now timestamptz:=now();
begin
  if v_uid is null then raise exception 'Authentication required'; end if;

  select franchise_id,can_bid into v_franchise,v_can_bid
  from public.franchise_members
  where user_id=v_uid and is_active=true
  order by is_primary_owner desc limit 1;

  if v_franchise is null then raise exception 'Account is not linked to a franchise'; end if;
  if not coalesce(v_can_bid,false) then raise exception 'Your role cannot place bids'; end if;

  select * into v_lot from public.auction_lots where id=p_lot_id for update;
  if not found then raise exception 'Auction lot not found'; end if;
  if v_lot.status<>'open' then raise exception 'Auction is not open'; end if;
  if v_lot.closes_at is not null and v_lot.closes_at<=v_now then
    raise exception 'Bidding time has expired';
  end if;

  select * into v_wallet from public.franchise_wallets
  where franchise_id=v_franchise for update;

  if not found then raise exception 'Franchise wallet not found'; end if;
  if coalesce(v_wallet.is_locked,false) then raise exception 'Franchise is locked'; end if;
  if coalesce(v_wallet.squad_count,0)>=13 then raise exception 'Squad limit reached'; end if;
  if v_lot.highest_franchise_id=v_franchise then
    raise exception 'Your franchise is already highest bidder';
  end if;

  v_current:=coalesce(v_lot.highest_bid,
    v_lot.base_points-public.required_bid_increment(v_lot.base_points));
  v_min:=greatest(v_lot.base_points,
    v_current+public.required_bid_increment(v_current));

  if p_bid_points<v_min then raise exception 'Minimum bid is % points',v_min; end if;

  v_capacity:=coalesce(v_wallet.allocated_points,0)
    +coalesce(v_wallet.credit_limit,0)-coalesce(v_wallet.points_spent,0);

  if p_bid_points>v_capacity then
    raise exception 'Bid exceeds available bidding power of % points',v_capacity;
  end if;

  insert into public.auction_bids(
    lot_id,player_id,franchise_id,owner_user_id,
    bid_points,previous_bid,accepted
  ) values(
    v_lot.id,v_lot.player_id,v_franchise,v_uid,
    p_bid_points,v_lot.highest_bid,true
  );

  update public.auction_lots set
    highest_bid=p_bid_points,
    highest_franchise_id=v_franchise,
    closes_at=case
      when closes_at is null then v_now+interval '45 seconds'
      when closes_at-v_now<interval '10 seconds' then v_now+interval '10 seconds'
      else closes_at end
  where id=v_lot.id;

  return jsonb_build_object(
    'accepted',true,'bid_points',p_bid_points,
    'franchise_id',v_franchise,
    'remaining_capacity',v_capacity-p_bid_points
  );
end;
$$;

grant execute on function public.place_auction_bid(uuid,integer) to authenticated;

commit;


-- INCLUDED: TNYPL_V21_CRICHEROES_LINK_FIX.sql
-- =====================================================================
-- TNYPL V21 CRICHEROES SHARE-LINK FIX
-- Accepts both official CricHeroes URLs and chshare.link player URLs.
-- Safe to run repeatedly.
-- =====================================================================

begin;

alter table public.players
  drop constraint if exists players_cricheroes_url_check;

alter table public.players
  add constraint players_cricheroes_url_check
  check (
    cricheroes_url ~* '^https?://(([a-z0-9-]+\.)?cricheroes\.com|([a-z0-9-]+\.)?chshare\.link)/.+'
  );

commit;

-- Verify existing links that would still fail.
select
  id,
  full_name,
  cricheroes_url
from public.players
where cricheroes_url is not null
  and cricheroes_url !~* '^https?://(([a-z0-9-]+\.)?cricheroes\.com|([a-z0-9-]+\.)?chshare\.link)/.+';


-- =====================================================================
-- V22 FINAL NORMALIZATION
-- =====================================================================
begin;

-- Ensure old team_id cannot block new invitations.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='owner_profiles' and column_name='team_id'
  ) then
    alter table public.owner_profiles alter column team_id drop not null;
  end if;
end $$;

-- Backfill primary memberships for every existing owner profile.
insert into public.franchise_members (
  user_id,franchise_id,full_name,email,member_role,
  can_bid,can_manage_watchlist,can_manage_players,
  can_view_settlement,can_manage_members,
  is_primary_owner,is_active,invited_by,accepted_at,updated_at
)
select
  op.user_id,op.franchise_id,coalesce(op.owner_name,u.email),u.email,
  'primary_owner',true,true,true,true,true,true,
  coalesce(op.is_active,true),op.user_id,now(),now()
from public.owner_profiles op
join auth.users u on u.id=op.user_id
where op.franchise_id is not null
on conflict(user_id,franchise_id) do update set
  full_name=excluded.full_name,
  email=excluded.email,
  member_role='primary_owner',
  can_bid=true,
  can_manage_watchlist=true,
  can_manage_players=true,
  can_view_settlement=true,
  can_manage_members=true,
  is_primary_owner=true,
  is_active=excluded.is_active,
  updated_at=now();

commit;

-- Final health check.
select
  (select count(*) from public.franchises) as franchises,
  (select count(*) from public.franchise_wallets) as wallets,
  (select count(*) from public.owner_profiles) as primary_owner_profiles,
  (select count(*) from public.franchise_members) as franchise_members,
  (select count(*) from public.auction_settings) as auction_settings_rows;
