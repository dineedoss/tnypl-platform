-- TNYPL R1.1 OFFICIAL DRAW COMPATIBILITY PATCH
-- Run once in Supabase SQL Editor as postgres.
-- Safe to rerun.

begin;

-- Give the legacy required draw_type column a usable default.
do $$
declare
  v_type text;
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'tournament_draws'
      and column_name = 'draw_type'
  ) then
    execute $q$
      select draw_type::text
      from public.tournament_draws
      where draw_type is not null
      limit 1
    $q$ into v_type;

    v_type := coalesce(nullif(v_type, ''), 'group');

    execute format(
      'alter table public.tournament_draws alter column draw_type set default %L',
      v_type
    );
  end if;
end;
$$;

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
  v_has_draw_type boolean;
  v_draw_type text;
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

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'tournament_draws'
      and column_name = 'draw_type'
  )
  into v_has_draw_type;

  if v_has_draw_type then
    execute $q$
      select draw_type::text
      from public.tournament_draws
      where draw_type is not null
      limit 1
    $q$ into v_draw_type;

    v_draw_type := coalesce(nullif(v_draw_type, ''), 'group');

    execute format(
      'insert into public.tournament_draws
       (draw_name, draw_type, status, created_by, created_at, updated_at)
       values ($1, %L, $2, $3, now(), now())
       returning id',
      v_draw_type
    )
    into v_draw_id
    using
      coalesce(nullif(trim(p_draw_name), ''), 'TNYPL Official Draw'),
      'draft',
      auth.uid();
  else
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
  end if;

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

grant execute on function public.admin_create_tournament_draw(text)
to authenticated;

-- Force PostgREST to refresh its function/schema cache.
notify pgrst, 'reload schema';

commit;

select
  to_regprocedure(
    'public.admin_create_tournament_draw(text)'
  ) as create_draw_rpc,
  to_regprocedure(
    'public.admin_lock_tournament_draw(bigint)'
  ) as lock_draw_rpc,
  to_regprocedure(
    'public.admin_reset_tournament_draw(bigint)'
  ) as reset_draw_rpc,
  (
    select column_default
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'tournament_draws'
      and column_name = 'draw_type'
  ) as draw_type_default;
