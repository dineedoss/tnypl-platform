-- TNYPL OWNER LOGIN LINKING TEMPLATE
-- Create each owner under Supabase > Authentication > Users first.
-- Replace email, name and slug, then run.

insert into public.owner_profiles(user_id,owner_name,franchise_id,role,is_active)
select u.id,'OWNER FULL NAME',f.id,'owner',true
from auth.users u
cross join public.franchises f
where lower(u.email)=lower('OWNER_EMAIL_ADDRESS')
  and f.slug='FRANCHISE_SLUG'
on conflict(user_id) do update set
 owner_name=excluded.owner_name,
 franchise_id=excluded.franchise_id,
 role='owner',
 is_active=true;

-- Valid slugs:
-- chennai-strikers
-- kovai-kings
-- karaikudi-kings
-- trichy-titans
-- nellai-falcons
-- tiruppur-blazers
-- thanjavur-royals
-- tuticorin-sharks

select op.owner_name,u.email,f.name
from public.owner_profiles op
join auth.users u on u.id=op.user_id
join public.franchises f on f.id=op.franchise_id;
