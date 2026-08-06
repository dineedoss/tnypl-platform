
-- =====================================================================
-- TNYPL V25: MATCH CENTER, SPONSORS AND LEAGUE VISION
-- Safe to run repeatedly.
-- =====================================================================

begin;

create table if not exists public.sponsors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_path text not null,
  website_url text,
  display_order integer not null default 100,
  is_active boolean not null default true,
  sponsor_level text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists sponsors_name_unique
on public.sponsors(lower(name));

alter table public.sponsors enable row level security;

drop policy if exists "public reads active sponsors" on public.sponsors;
create policy "public reads active sponsors"
on public.sponsors for select
to anon, authenticated
using (is_active = true or public.is_tnypl_admin());

drop policy if exists "admins manage sponsors" on public.sponsors;
create policy "admins manage sponsors"
on public.sponsors for all
to authenticated
using (public.is_tnypl_admin())
with check (public.is_tnypl_admin());

insert into public.sponsors(name,logo_path,display_order,is_active,sponsor_level)
values
 ('The Cake Point','sponsor-cake-point.png',10,true,null),
 ('Ayyappa Auto Agencies','sponsor-ayyappa-auto.png',20,true,null),
 ('DOJO MAN Sports Event App','sponsor-dojo-man.png',30,true,null),
 ('Vedapile','sponsor-vedapile.png',40,true,null)
on conflict ((lower(name))) do update
set logo_path=excluded.logo_path,
    display_order=excluded.display_order,
    is_active=true,
    updated_at=now();

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  match_number integer,
  match_day text,
  match_date date,
  start_time time,
  format text not null default 'T30',
  venue text,
  ground text,
  map_url text,
  team_a_id uuid references public.franchises(id) on delete set null,
  team_b_id uuid references public.franchises(id) on delete set null,
  status text not null default 'scheduled',
  toss_winner_id uuid references public.franchises(id) on delete set null,
  toss_decision text,
  team_a_score text,
  team_b_score text,
  result_type text,
  result_summary text,
  winner_franchise_id uuid references public.franchises(id) on delete set null,
  player_of_match text,
  umpire_one text,
  umpire_two text,
  third_umpire text,
  match_referee text,
  scorer text,
  weather text,
  cricheroes_url text,
  youtube_url text,
  youtube_replay_url text,
  stream_enabled boolean not null default false,
  is_published boolean not null default false,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.matches add column if not exists map_url text;
alter table public.matches add column if not exists team_a_id uuid references public.franchises(id) on delete set null;
alter table public.matches add column if not exists team_b_id uuid references public.franchises(id) on delete set null;
alter table public.matches add column if not exists toss_winner_id uuid references public.franchises(id) on delete set null;
alter table public.matches add column if not exists toss_decision text;
alter table public.matches add column if not exists team_a_score text;
alter table public.matches add column if not exists team_b_score text;
alter table public.matches add column if not exists result_type text;
alter table public.matches add column if not exists result_summary text;
alter table public.matches add column if not exists winner_franchise_id uuid references public.franchises(id) on delete set null;
alter table public.matches add column if not exists player_of_match text;
alter table public.matches add column if not exists umpire_one text;
alter table public.matches add column if not exists umpire_two text;
alter table public.matches add column if not exists third_umpire text;
alter table public.matches add column if not exists match_referee text;
alter table public.matches add column if not exists scorer text;
alter table public.matches add column if not exists weather text;
alter table public.matches add column if not exists cricheroes_url text;
alter table public.matches add column if not exists youtube_url text;
alter table public.matches add column if not exists youtube_replay_url text;
alter table public.matches add column if not exists stream_enabled boolean default false;
alter table public.matches add column if not exists is_published boolean default false;
alter table public.matches add column if not exists notes text;
alter table public.matches add column if not exists created_by uuid references auth.users(id) on delete set null;
alter table public.matches add column if not exists created_at timestamptz default now();
alter table public.matches add column if not exists updated_at timestamptz default now();

alter table public.matches enable row level security;

drop policy if exists "public reads published matches" on public.matches;
create policy "public reads published matches"
on public.matches for select
to anon, authenticated
using (is_published = true or public.is_tnypl_admin());

drop policy if exists "admins manage matches" on public.matches;
create policy "admins manage matches"
on public.matches for all
to authenticated
using (public.is_tnypl_admin())
with check (public.is_tnypl_admin());

create table if not exists public.dls_calculations (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references public.matches(id) on delete set null,
  first_innings_score integer not null,
  team_one_resource numeric(6,2) not null,
  team_two_resource numeric(6,2) not null,
  par_score integer not null,
  target_score integer not null,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.dls_calculations enable row level security;

drop policy if exists "admins manage dls calculations" on public.dls_calculations;
create policy "admins manage dls calculations"
on public.dls_calculations for all
to authenticated
using (public.is_tnypl_admin())
with check (public.is_tnypl_admin());

commit;

select
  (select count(*) from public.sponsors) as sponsors,
  to_regclass('public.matches') as matches_table,
  to_regclass('public.dls_calculations') as dls_table;
