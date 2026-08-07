-- =====================================================================
-- TNYPL R1 PRODUCTION MIGRATION V2
-- Production schema compatibility:
--   tournament_draws.id = bigint
--   franchises.id       = uuid
--   matches franchise FK columns = uuid
--
-- Run in Supabase SQL Editor as the postgres role.
-- Safe to rerun. Existing production data is preserved.
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 1. SITE SETTINGS / REGISTRATION COUNTDOWN
-- ---------------------------------------------------------------------

create table if not exists public.site_settings (
  id integer primary key default 1 check (id = 1),
  registration_deadline timestamptz,
  registration_open boolean not null default true,
  show_registration_countdown boolean not null default true,
  official_timezone text not null default 'Asia/Kolkata',
  updated_at timestamptz not null default now()
);

alter table public.site_settings
  add column if not exists registration_deadline timestamptz,
  add column if not exists registration_open boolean not null default true,
  add column if not exists show_registration_countdown boolean not null default true,
  add column if not exists official_timezone text not null default 'Asia/Kolkata',
  add column if not exists updated_at timestamptz not null default now();

insert into public.site_settings (id)
values (1)
on conflict (id) do nothing;

alter table public.site_settings enable row level security;

drop policy if exists "public reads site settings" on public.site_settings;
create policy "public reads site settings"
on public.site_settings
for select
to anon, authenticated
using (true);

drop policy if exists "admins manage site settings" on public.site_settings;
create policy "admins manage site settings"
on public.site_settings
for all
to authenticated
using (public.is_tnypl_admin())
with check (public.is_tnypl_admin());

-- ---------------------------------------------------------------------
-- 2. SPONSORS COMPATIBILITY
-- ---------------------------------------------------------------------

create table if not exists public.sponsors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

alter table public.sponsors
  add column if not exists logo_path text,
  add column if not exists website_url text,
  add column if not exists display_order integer not null default 100,
  add column if not exists is_active boolean not null default true,
  add column if not exists sponsor_level text,
  add column if not exists updated_at timestamptz not null default now();

delete from public.sponsors a
using public.sponsors b
where lower(a.name) = lower(b.name)
  and a.id > b.id;

create unique index if not exists sponsors_name_unique
on public.sponsors (lower(name));

insert into public.sponsors (
  name,
  logo_path,
  website_url,
  display_order,
  is_active,
  sponsor_level
)
values
  ('The Cake Point', 'sponsor-cake-point.png', 'https://www.cakepoint.in/', 10, true, null),
  ('Ayyappa Auto Agencies', 'sponsor-ayyappa-auto.png', null, 20, true, null),
  ('DOJO MAN Sports Event App', 'sponsor-dojo-man.png', 'https://www.dojoman.com/', 30, true, null),
  ('Vedapile', 'sponsor-vedapile.png', 'https://vedapile.com/', 40, true, null)
on conflict ((lower(name)))
do update set
  logo_path = excluded.logo_path,
  website_url = excluded.website_url,
  display_order = excluded.display_order,
  is_active = true,
  updated_at = now();

alter table public.sponsors enable row level security;

drop policy if exists "public reads active sponsors" on public.sponsors;
create policy "public reads active sponsors"
on public.sponsors
for select
to anon, authenticated
using (is_active = true or public.is_tnypl_admin());

drop policy if exists "admins manage sponsors" on public.sponsors;
create policy "admins manage sponsors"
on public.sponsors
for all
to authenticated
using (public.is_tnypl_admin())
with check (public.is_tnypl_admin());

-- ---------------------------------------------------------------------
-- 3. ADMIN TEAM
-- ---------------------------------------------------------------------

create table if not exists public.admin_team_members (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  designation text,
  department text,
  biography text,
  experience text,
  photo_path text,
  location text,
  email text,
  phone text,
  display_order integer not null default 100,
  is_active boolean not null default true,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.admin_team_members
  add column if not exists designation text,
  add column if not exists department text,
  add column if not exists biography text,
  add column if not exists experience text,
  add column if not exists photo_path text,
  add column if not exists location text,
  add column if not exists email text,
  add column if not exists phone text,
  add column if not exists display_order integer not null default 100,
  add column if not exists is_active boolean not null default true,
  add column if not exists is_featured boolean not null default false,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

alter table public.admin_team_members enable row level security;

drop policy if exists "public reads active admin team" on public.admin_team_members;
create policy "public reads active admin team"
on public.admin_team_members
for select
to anon, authenticated
using (is_active = true or public.is_tnypl_admin());

drop policy if exists "admins manage admin team" on public.admin_team_members;
create policy "admins manage admin team"
on public.admin_team_members
for all
to authenticated
using (public.is_tnypl_admin())
with check (public.is_tnypl_admin());

-- ---------------------------------------------------------------------
-- 4. OFFICIAL DRAW TABLES
-- Existing production type:
--   public.tournament_draws.id = bigint
-- ---------------------------------------------------------------------

create table if not exists public.tournament_draws (
  id bigint generated by default as identity primary key,
  draw_name text not null default 'TNYPL Official Draw',
  status text not null default 'draft',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tournament_draws
  add column if not exists draw_name text,
  add column if not exists status text not null default 'draft',
  add column if not exists created_by uuid references auth.users(id) on delete set null,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

update public.tournament_draws
set draw_name = coalesce(nullif(draw_name, ''), 'TNYPL Official Draw')
where draw_name is null or draw_name = '';

alter table public.tournament_draws
  alter column draw_name set default 'TNYPL Official Draw';

create table if not exists public.tournament_draw_entries (
  id uuid primary key default gen_random_uuid(),
  draw_id bigint not null references public.tournament_draws(id) on delete cascade,
  franchise_id uuid not null references public.franchises(id) on delete cascade,
  group_code text,
  position_code text,
  created_at timestamptz not null default now(),
  unique (draw_id, franchise_id)
);

create table if not exists public.tournament_draw_history (
  id uuid primary key default gen_random_uuid(),
  draw_id bigint not null references public.tournament_draws(id) on delete cascade,
  franchise_id uuid not null references public.franchises(id) on delete cascade,
  spin_number integer not null,
  stage text not null,
  group_code text,
  position_code text,
  random_value numeric,
  accepted boolean not null default true,
  undone boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.tournament_draw_entries
  add column if not exists group_code text,
  add column if not exists position_code text,
  add column if not exists created_at timestamptz not null default now();

alter table public.tournament_draw_history
  add column if not exists spin_number integer,
  add column if not exists stage text,
  add column if not exists group_code text,
  add column if not exists position_code text,
  add column if not exists random_value numeric,
  add column if not exists accepted boolean not null default true,
  add column if not exists undone boolean not null default false,
  add column if not exists created_by uuid references auth.users(id) on delete set null,
  add column if not exists created_at timestamptz not null default now();

create unique index if not exists tournament_draw_entries_draw_franchise_unique
on public.tournament_draw_entries (draw_id, franchise_id);

create index if not exists tournament_draw_entries_draw_idx
on public.tournament_draw_entries (draw_id);

create index if not exists tournament_draw_history_draw_spin_idx
on public.tournament_draw_history (draw_id, spin_number desc);

alter table public.tournament_draws enable row level security;
alter table public.tournament_draw_entries enable row level security;
alter table public.tournament_draw_history enable row level security;

drop policy if exists "draw read" on public.tournament_draws;
drop policy if exists "public reads live draws" on public.tournament_draws;
create policy "public reads live draws"
on public.tournament_draws
for select
to anon, authenticated
using (
  status in ('live', 'completed', 'published')
  or public.is_tnypl_admin()
);

drop policy if exists "entry read" on public.tournament_draw_entries;
drop policy if exists "public reads draw entries" on public.tournament_draw_entries;
create policy "public reads draw entries"
on public.tournament_draw_entries
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.tournament_draws d
    where d.id = draw_id
      and (
        d.status in ('live', 'completed', 'published')
        or public.is_tnypl_admin()
      )
  )
);

drop policy if exists "history read" on public.tournament_draw_history;
drop policy if exists "public reads draw history" on public.tournament_draw_history;
create policy "public reads draw history"
on public.tournament_draw_history
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.tournament_draws d
    where d.id = draw_id
      and (
        d.status in ('live', 'completed', 'published')
        or public.is_tnypl_admin()
      )
  )
);

drop policy if exists "draw admin" on public.tournament_draws;
drop policy if exists "admins manage draws" on public.tournament_draws;
create policy "admins manage draws"
on public.tournament_draws
for all
to authenticated
using (public.is_tnypl_admin())
with check (public.is_tnypl_admin());

drop policy if exists "entry admin" on public.tournament_draw_entries;
drop policy if exists "admins manage draw entries" on public.tournament_draw_entries;
create policy "admins manage draw entries"
on public.tournament_draw_entries
for all
to authenticated
using (public.is_tnypl_admin())
with check (public.is_tnypl_admin());

drop policy if exists "history admin" on public.tournament_draw_history;
drop policy if exists "admins manage draw history" on public.tournament_draw_history;
create policy "admins manage draw history"
on public.tournament_draw_history
for all
to authenticated
using (public.is_tnypl_admin())
with check (public.is_tnypl_admin());

-- ---------------------------------------------------------------------
-- 5. DROP INCOMPATIBLE OLD RPC SIGNATURES, IF PRESENT
-- ---------------------------------------------------------------------

drop function if exists public.admin_lock_tournament_draw(uuid);
drop function if exists public.admin_accept_draw_result(uuid, uuid, text, text, text, numeric);
drop function if exists public.admin_undo_last_draw_spin(uuid);
drop function if exists public.admin_reset_tournament_draw(uuid);
drop function if exists public.admin_generate_group_fixtures(uuid, date, text, text, time, time);

-- ---------------------------------------------------------------------
-- 6. OFFICIAL DRAW RPCS USING BIGINT DRAW IDS
-- ---------------------------------------------------------------------

create or replace function public.admin_create_tournament_draw(
  p_draw_name text
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_draw_id bigint;
  v_franchise_count integer;
begin
  if not public.is_tnypl_admin() then
    raise exception 'Admin access required';
  end if;

  select count(*)
  into v_franchise_count
  from public.franchises
  where is_active = true
    and name !~* '^Franchise[[:space:]]+[0-9]+$';

  if v_franchise_count <> 8 then
    raise exception
      'Exactly 8 named active franchises are required; found %',
      v_franchise_count;
  end if;

  insert into public.tournament_draws (
    draw_name,
    status,
    created_by,
    created_at,
    updated_at
  )
  values (
    coalesce(nullif(trim(p_draw_name), ''), 'TNYPL Official Draw'),
    'draft',
    auth.uid(),
    now(),
    now()
  )
  returning id into v_draw_id;

  insert into public.tournament_draw_entries (
    draw_id,
    franchise_id
  )
  select
    v_draw_id,
    id
  from public.franchises
  where is_active = true
    and name !~* '^Franchise[[:space:]]+[0-9]+$'
  order by name;

  return v_draw_id;
end;
$$;

create or replace function public.admin_lock_tournament_draw(
  p_draw_id bigint
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

  if not exists (
    select 1
    from public.tournament_draws
    where id = p_draw_id
  ) then
    raise exception 'Draw not found';
  end if;

  if (
    select count(*)
    from public.tournament_draw_entries
    where draw_id = p_draw_id
  ) <> 8 then
    raise exception 'Draw must contain exactly 8 franchises';
  end if;

  update public.tournament_draws
  set
    status = 'live',
    updated_at = now()
  where id = p_draw_id;
end;
$$;

create or replace function public.admin_accept_draw_result(
  p_draw_id bigint,
  p_franchise_id uuid,
  p_stage text,
  p_group_code text,
  p_position_code text,
  p_random_value numeric
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_spin_number integer;
  v_existing_group text;
begin
  if not public.is_tnypl_admin() then
    raise exception 'Admin access required';
  end if;

  if not exists (
    select 1
    from public.tournament_draws
    where id = p_draw_id
      and status in ('live', 'completed')
  ) then
    raise exception 'Draw is not live';
  end if;

  select group_code
  into v_existing_group
  from public.tournament_draw_entries
  where draw_id = p_draw_id
    and franchise_id = p_franchise_id
  for update;

  if not found then
    raise exception 'Franchise is not part of this draw';
  end if;

  if p_stage = 'group' then
    if p_group_code not in ('A', 'B') then
      raise exception 'Invalid group';
    end if;

    if v_existing_group is not null then
      raise exception 'Franchise already has a group';
    end if;

    if (
      select count(*)
      from public.tournament_draw_entries
      where draw_id = p_draw_id
        and group_code = p_group_code
    ) >= 4 then
      raise exception 'Group % is already full', p_group_code;
    end if;

    update public.tournament_draw_entries
    set group_code = p_group_code
    where draw_id = p_draw_id
      and franchise_id = p_franchise_id;

  elsif p_stage = 'position' then
    if v_existing_group is null then
      raise exception 'Assign the franchise to a group first';
    end if;

    if p_position_code not in (
      'A1', 'A2', 'A3', 'A4',
      'B1', 'B2', 'B3', 'B4'
    ) then
      raise exception 'Invalid position';
    end if;

    if left(p_position_code, 1) <> v_existing_group then
      raise exception
        'Position % does not match Group %',
        p_position_code,
        v_existing_group;
    end if;

    if exists (
      select 1
      from public.tournament_draw_entries
      where draw_id = p_draw_id
        and position_code = p_position_code
    ) then
      raise exception 'Position % has already been assigned', p_position_code;
    end if;

    update public.tournament_draw_entries
    set position_code = p_position_code
    where draw_id = p_draw_id
      and franchise_id = p_franchise_id;

  else
    raise exception 'Invalid draw stage';
  end if;

  select coalesce(max(spin_number), 0) + 1
  into v_spin_number
  from public.tournament_draw_history
  where draw_id = p_draw_id;

  insert into public.tournament_draw_history (
    draw_id,
    franchise_id,
    spin_number,
    stage,
    group_code,
    position_code,
    random_value,
    accepted,
    undone,
    created_by
  )
  values (
    p_draw_id,
    p_franchise_id,
    v_spin_number,
    p_stage,
    case
      when p_stage = 'group' then p_group_code
      else v_existing_group
    end,
    case
      when p_stage = 'position' then p_position_code
      else null
    end,
    p_random_value,
    true,
    false,
    auth.uid()
  );

  if not exists (
    select 1
    from public.tournament_draw_entries
    where draw_id = p_draw_id
      and position_code is null
  ) then
    update public.tournament_draws
    set
      status = 'completed',
      updated_at = now()
    where id = p_draw_id;
  end if;
end;
$$;

create or replace function public.admin_undo_last_draw_spin(
  p_draw_id bigint
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_history public.tournament_draw_history%rowtype;
begin
  if not public.is_tnypl_admin() then
    raise exception 'Admin access required';
  end if;

  select *
  into v_history
  from public.tournament_draw_history
  where draw_id = p_draw_id
    and accepted = true
    and undone = false
  order by spin_number desc
  limit 1
  for update;

  if v_history.id is null then
    raise exception 'No accepted spin is available to undo';
  end if;

  if v_history.stage = 'group' then
    update public.tournament_draw_entries
    set
      group_code = null,
      position_code = null
    where draw_id = p_draw_id
      and franchise_id = v_history.franchise_id;
  else
    update public.tournament_draw_entries
    set position_code = null
    where draw_id = p_draw_id
      and franchise_id = v_history.franchise_id;
  end if;

  update public.tournament_draw_history
  set undone = true
  where id = v_history.id;

  update public.tournament_draws
  set
    status = 'live',
    updated_at = now()
  where id = p_draw_id;
end;
$$;

create or replace function public.admin_reset_tournament_draw(
  p_draw_id bigint
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

  update public.tournament_draw_entries
  set
    group_code = null,
    position_code = null
  where draw_id = p_draw_id;

  update public.tournament_draw_history
  set undone = true
  where draw_id = p_draw_id
    and undone = false;

  update public.tournament_draws
  set
    status = 'draft',
    updated_at = now()
  where id = p_draw_id;
end;
$$;

create or replace function public.admin_generate_group_fixtures(
  p_draw_id bigint,
  p_start_date date,
  p_venue text,
  p_ground text,
  p_first_time time,
  p_second_time time
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group_a uuid[];
  v_group_b uuid[];
  v_match_number integer := 0;
  v_day_offset integer;
  v_match_time time;
  i integer;
  j integer;
begin
  if not public.is_tnypl_admin() then
    raise exception 'Admin access required';
  end if;

  select array_agg(franchise_id order by position_code)
  into v_group_a
  from public.tournament_draw_entries
  where draw_id = p_draw_id
    and group_code = 'A';

  select array_agg(franchise_id order by position_code)
  into v_group_b
  from public.tournament_draw_entries
  where draw_id = p_draw_id
    and group_code = 'B';

  if array_length(v_group_a, 1) <> 4
     or array_length(v_group_b, 1) <> 4 then
    raise exception 'Complete all group and position assignments first';
  end if;

  delete from public.matches
  where notes = 'Generated by Official Draw R1 Production V2';

  for i in 1..3 loop
    for j in (i + 1)..4 loop
      v_match_number := v_match_number + 1;
      v_day_offset := (v_match_number - 1) / 3;

      v_match_time :=
        case (v_match_number - 1) % 3
          when 0 then p_first_time
          when 1 then p_second_time
          else (p_second_time + interval '4 hours')::time
        end;

      insert into public.matches (
        match_number,
        match_day,
        match_date,
        start_time,
        format,
        venue,
        ground,
        team_a_id,
        team_b_id,
        status,
        is_published,
        notes
      )
      values (
        v_match_number,
        'Day ' || (v_day_offset + 1),
        p_start_date + v_day_offset,
        v_match_time,
        'T20',
        p_venue,
        p_ground,
        v_group_a[i],
        v_group_a[j],
        'scheduled',
        true,
        'Generated by Official Draw R1 Production V2'
      );
    end loop;
  end loop;

  for i in 1..3 loop
    for j in (i + 1)..4 loop
      v_match_number := v_match_number + 1;
      v_day_offset := (v_match_number - 1) / 3;

      v_match_time :=
        case (v_match_number - 1) % 3
          when 0 then p_first_time
          when 1 then p_second_time
          else (p_second_time + interval '4 hours')::time
        end;

      insert into public.matches (
        match_number,
        match_day,
        match_date,
        start_time,
        format,
        venue,
        ground,
        team_a_id,
        team_b_id,
        status,
        is_published,
        notes
      )
      values (
        v_match_number,
        'Day ' || (v_day_offset + 1),
        p_start_date + v_day_offset,
        v_match_time,
        'T20',
        p_venue,
        p_ground,
        v_group_b[i],
        v_group_b[j],
        'scheduled',
        true,
        'Generated by Official Draw R1 Production V2'
      );
    end loop;
  end loop;

  insert into public.matches (
    match_number,
    match_day,
    match_date,
    start_time,
    format,
    venue,
    ground,
    status,
    is_published,
    result_summary,
    notes
  )
  values
    (
      13,
      'Day 5',
      p_start_date + 4,
      p_first_time,
      'T20',
      p_venue,
      p_ground,
      'scheduled',
      true,
      'Semi-final 1: A1 vs B2',
      'Generated by Official Draw R1 Production V2'
    ),
    (
      14,
      'Day 5',
      p_start_date + 4,
      p_second_time,
      'T20',
      p_venue,
      p_ground,
      'scheduled',
      true,
      'Semi-final 2: B1 vs A2',
      'Generated by Official Draw R1 Production V2'
    ),
    (
      15,
      'Day 5',
      p_start_date + 4,
      (p_second_time + interval '4 hours')::time,
      'T20',
      p_venue,
      p_ground,
      'scheduled',
      true,
      'Final: Winner SF1 vs Winner SF2',
      'Generated by Official Draw R1 Production V2'
    );

  update public.tournament_draws
  set
    status = 'published',
    updated_at = now()
  where id = p_draw_id;

  return 15;
end;
$$;

grant execute on function public.admin_create_tournament_draw(text)
to authenticated;

grant execute on function public.admin_lock_tournament_draw(bigint)
to authenticated;

grant execute on function public.admin_accept_draw_result(
  bigint,
  uuid,
  text,
  text,
  text,
  numeric
)
to authenticated;

grant execute on function public.admin_undo_last_draw_spin(bigint)
to authenticated;

grant execute on function public.admin_reset_tournament_draw(bigint)
to authenticated;

grant execute on function public.admin_generate_group_fixtures(
  bigint,
  date,
  text,
  text,
  time,
  time
)
to authenticated;

commit;

-- ---------------------------------------------------------------------
-- FINAL VERIFICATION
-- Every value below should be non-null.
-- ---------------------------------------------------------------------

select
  (
    select data_type
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'tournament_draws'
      and column_name = 'id'
  ) as tournament_draw_id_type,
  (
    select data_type
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'tournament_draw_entries'
      and column_name = 'draw_id'
  ) as draw_entry_draw_id_type,
  to_regprocedure(
    'public.admin_create_tournament_draw(text)'
  ) as create_draw_rpc,
  to_regprocedure(
    'public.admin_lock_tournament_draw(bigint)'
  ) as lock_draw_rpc,
  to_regprocedure(
    'public.admin_accept_draw_result(bigint,uuid,text,text,text,numeric)'
  ) as accept_draw_rpc,
  to_regprocedure(
    'public.admin_undo_last_draw_spin(bigint)'
  ) as undo_draw_rpc,
  to_regprocedure(
    'public.admin_reset_tournament_draw(bigint)'
  ) as reset_draw_rpc,
  to_regprocedure(
    'public.admin_generate_group_fixtures(bigint,date,text,text,time without time zone,time without time zone)'
  ) as fixture_rpc,
  to_regclass('public.site_settings') as settings_table,
  to_regclass('public.admin_team_members') as admin_team_table;
