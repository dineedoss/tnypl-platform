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
