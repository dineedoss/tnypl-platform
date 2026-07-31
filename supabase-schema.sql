-- Run this in Supabase SQL Editor

create extension if not exists pgcrypto;

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  full_name text not null,
  date_of_birth date not null,
  parent_name text not null,
  parent_phone text not null,
  email text not null,
  district text not null,
  school text,
  academy text,
  cricheroes_url text,
  primary_role text not null,
  batting_style text not null,
  bowling_style text,
  tshirt_size text not null,
  pant_size text not null,
  age_proof_path text not null,
  payment_receipt_path text not null,
  payment_verified boolean not null default false,
  age_verified boolean not null default false,
  status text not null default 'pending' check (status in ('pending','eligible','rejected'))
);

alter table public.players enable row level security;

create policy "public can register"
on public.players for insert
to anon
with check (status = 'pending' and payment_verified = false and age_verified = false);

create policy "authenticated admins can read"
on public.players for select
to authenticated
using (true);

create policy "authenticated admins can update"
on public.players for update
to authenticated
using (true)
with check (true);

insert into storage.buckets (id, name, public)
values ('player-documents','player-documents',false)
on conflict (id) do nothing;

create policy "public can upload player documents"
on storage.objects for insert
to anon
with check (bucket_id='player-documents');

create policy "authenticated admins can read player documents"
on storage.objects for select
to authenticated
using (bucket_id='player-documents');
