-- TNYPL V8 LIVE STATISTICS SETUP
-- Run once in Supabase > SQL Editor.
-- This does not delete or modify existing player registrations.

create table if not exists public.site_visits (
  visitor_id text primary key,
  country_code text not null default 'XX',
  country_name text not null default 'Unknown',
  city text,
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  page_views bigint not null default 1 check (page_views > 0)
);

create index if not exists site_visits_last_seen_idx
  on public.site_visits(last_seen desc);

create index if not exists site_visits_country_idx
  on public.site_visits(country_code);

alter table public.site_visits enable row level security;

revoke all on table public.site_visits from anon, authenticated;

create or replace function public.track_site_visit(
  p_visitor_id text,
  p_country_code text default 'XX',
  p_country_name text default 'Unknown',
  p_city text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_visitor_id is null
     or length(p_visitor_id) < 8
     or length(p_visitor_id) > 120 then
    raise exception 'Invalid visitor identifier';
  end if;

  insert into public.site_visits (
    visitor_id, country_code, country_name, city,
    first_seen, last_seen, page_views
  )
  values (
    p_visitor_id,
    upper(coalesce(nullif(p_country_code, ''), 'XX')),
    left(coalesce(nullif(p_country_name, ''), 'Unknown'), 120),
    left(nullif(p_city, ''), 120),
    now(), now(), 1
  )
  on conflict (visitor_id) do update
    set country_code = excluded.country_code,
        country_name = excluded.country_name,
        city = excluded.city,
        last_seen = now(),
        page_views = public.site_visits.page_views + 1;
end;
$$;

create or replace function public.get_public_site_stats()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  registration_total bigint := 0;
  verified_total bigint := 0;
  drafted_total bigint := 0;
  result jsonb;
begin
  if to_regclass('public.players') is not null then
    execute 'select count(*) from public.players'
      into registration_total;

    execute $query$
      select count(*)
      from public.players
      where lower(coalesce(status, '')) in
        ('verified', 'approved', 'draft_eligible', 'draft eligible')
    $query$ into verified_total;

    execute $query$
      select count(*)
      from public.players
      where lower(coalesce(status, '')) in
        ('drafted', 'selected')
    $query$ into drafted_total;
  end if;

  select jsonb_build_object(
    'unique_visitors', count(*),
    'page_views', coalesce(sum(page_views), 0),
    'countries_reached',
      count(distinct country_code)
      filter (where country_code <> 'XX'),
    'online_now',
      count(*)
      filter (where last_seen >= now() - interval '5 minutes'),
    'registrations', registration_total,
    'verified_players', verified_total,
    'drafted_players', drafted_total,
    'updated_at', now(),
    'countries',
      coalesce((
        select jsonb_agg(
          jsonb_build_object(
            'country_code', ranked.country_code,
            'country_name', ranked.country_name,
            'visitors', ranked.visitors,
            'page_views', ranked.page_views
          )
          order by ranked.visitors desc, ranked.country_name
        )
        from (
          select
            country_code,
            max(country_name) as country_name,
            count(*) as visitors,
            sum(page_views) as page_views
          from public.site_visits
          where country_code <> 'XX'
          group by country_code
          order by count(*) desc
          limit 8
        ) ranked
      ), '[]'::jsonb)
  )
  into result
  from public.site_visits;

  return result;
end;
$$;

revoke all on function public.track_site_visit(text,text,text,text)
  from public;

revoke all on function public.get_public_site_stats()
  from public;

grant execute on function public.track_site_visit(text,text,text,text)
  to anon, authenticated;

grant execute on function public.get_public_site_stats()
  to anon, authenticated;

select public.get_public_site_stats();
