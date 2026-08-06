
-- =====================================================================
-- TNYPL V24 MATCH CENTER
-- Fixtures, results, live score links, YouTube links, points table,
-- awards, and saved DLS calculations.
-- Safe to run repeatedly.
-- =====================================================================

begin;

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  match_number integer,
  match_day text,
  match_date date,
  start_time time,
  format text not null default 'T30',
  venue text,
  ground text,
  home_franchise_id uuid references public.franchises(id) on delete set null,
  away_franchise_id uuid references public.franchises(id) on delete set null,
  status text not null default 'scheduled',
  toss_winner_id uuid references public.franchises(id) on delete set null,
  toss_decision text,
  home_score text,
  away_score text,
  result_summary text,
  winner_franchise_id uuid references public.franchises(id) on delete set null,
  player_of_match text,
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

alter table public.matches
  add column if not exists match_number integer;
alter table public.matches
  add column if not exists match_day text;
alter table public.matches
  add column if not exists match_date date;
alter table public.matches
  add column if not exists start_time time;
alter table public.matches
  add column if not exists format text default 'T30';
alter table public.matches
  add column if not exists venue text;
alter table public.matches
  add column if not exists ground text;
alter table public.matches
  add column if not exists home_franchise_id uuid references public.franchises(id) on delete set null;
alter table public.matches
  add column if not exists away_franchise_id uuid references public.franchises(id) on delete set null;
alter table public.matches
  add column if not exists status text default 'scheduled';
alter table public.matches
  add column if not exists toss_winner_id uuid references public.franchises(id) on delete set null;
alter table public.matches
  add column if not exists toss_decision text;
alter table public.matches
  add column if not exists home_score text;
alter table public.matches
  add column if not exists away_score text;
alter table public.matches
  add column if not exists result_summary text;
alter table public.matches
  add column if not exists winner_franchise_id uuid references public.franchises(id) on delete set null;
alter table public.matches
  add column if not exists player_of_match text;
alter table public.matches
  add column if not exists cricheroes_url text;
alter table public.matches
  add column if not exists youtube_url text;
alter table public.matches
  add column if not exists youtube_replay_url text;
alter table public.matches
  add column if not exists stream_enabled boolean default false;
alter table public.matches
  add column if not exists is_published boolean default false;
alter table public.matches
  add column if not exists notes text;
alter table public.matches
  add column if not exists created_by uuid references auth.users(id) on delete set null;
alter table public.matches
  add column if not exists created_at timestamptz default now();
alter table public.matches
  add column if not exists updated_at timestamptz default now();

alter table public.matches
  drop constraint if exists matches_status_check;

alter table public.matches
  add constraint matches_status_check
  check (status in ('scheduled','live','completed','abandoned','cancelled'));

alter table public.matches
  drop constraint if exists matches_format_check;

alter table public.matches
  add constraint matches_format_check
  check (format in ('T20','T30','T40','ODI','Other'));

create index if not exists matches_date_idx
  on public.matches(match_date,start_time);

create index if not exists matches_status_idx
  on public.matches(status,is_published);

create table if not exists public.dls_calculations (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references public.matches(id) on delete set null,
  innings_one_score integer not null,
  innings_one_resource numeric(6,2) not null,
  innings_two_resource numeric(6,2) not null,
  par_score integer not null,
  target_score integer not null,
  scheduled_overs numeric(5,1),
  revised_overs numeric(5,1),
  wickets_lost integer,
  calculation_notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists dls_match_idx
  on public.dls_calculations(match_id,created_at desc);

create or replace function public.touch_match_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists matches_touch_updated_at on public.matches;
create trigger matches_touch_updated_at
before update on public.matches
for each row execute function public.touch_match_updated_at();

alter table public.matches enable row level security;
alter table public.dls_calculations enable row level security;

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

drop policy if exists "admins manage dls calculations" on public.dls_calculations;
create policy "admins manage dls calculations"
on public.dls_calculations for all
to authenticated
using (public.is_tnypl_admin())
with check (public.is_tnypl_admin());

drop policy if exists "public reads saved dls calculations" on public.dls_calculations;
create policy "public reads saved dls calculations"
on public.dls_calculations for select
to anon, authenticated
using (
  exists (
    select 1 from public.matches m
    where m.id = dls_calculations.match_id
      and m.is_published = true
  )
  or public.is_tnypl_admin()
);

commit;

select
  to_regclass('public.matches') as matches_table,
  to_regclass('public.dls_calculations') as dls_table;
