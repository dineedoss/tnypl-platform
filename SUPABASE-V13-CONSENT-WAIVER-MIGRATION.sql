
-- TNYPL V13 REGISTRATION CONSENT / WAIVER MIGRATION
-- Run in Supabase SQL Editor before deploying V13.

alter table public.players add column if not exists guardian_relationship text;
alter table public.players add column if not exists emergency_contact_name text;
alter table public.players add column if not exists emergency_contact_phone text;
alter table public.players add column if not exists parent_signature text;
alter table public.players add column if not exists parent_consent boolean not null default false;
alter table public.players add column if not exists parent_consent_at timestamptz;
alter table public.players add column if not exists waiver_accepted boolean not null default false;
alter table public.players add column if not exists waiver_accepted_at timestamptz;
alter table public.players add column if not exists waiver_signature text;
alter table public.players add column if not exists media_consent boolean not null default false;

alter table public.players drop constraint if exists players_eligible_dob_check;
alter table public.players add constraint players_eligible_dob_check
check (date_of_birth between date '2010-01-01' and date '2012-12-31');

alter table public.players drop constraint if exists players_cricheroes_url_check;
alter table public.players add constraint players_cricheroes_url_check
check (cricheroes_url ~* '^https?://(([a-z0-9-]+\.)?cricheroes\.com|([a-z0-9-]+\.)?chshare\.link)/.+');

-- Replace public insert policy so consent and waiver are mandatory server-side.
drop policy if exists "public can submit registrations" on public.players;
create policy "public can submit registrations"
on public.players for insert
to anon, authenticated
with check (
  status = 'pending'
  and drafted = false
  and payment_verified = false
  and age_verified = false
  and parent_consent = true
  and waiver_accepted = true
  and media_consent = true
  and parent_signature is not null
  and length(trim(parent_signature)) >= 3
  and waiver_signature is not null
  and lower(trim(parent_signature)) = lower(trim(waiver_signature))
  and guardian_relationship is not null
  and emergency_contact_name is not null
  and emergency_contact_phone is not null
);
