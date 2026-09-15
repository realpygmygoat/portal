-- Subscription-splitting portal schema.
-- Run this once in your Supabase project's SQL editor (Database > SQL Editor).

create extension if not exists "pgcrypto";

-- ── Profiles ─────────────────────────────────────────────────────────────
-- Decoupled from auth.users on purpose: you (the admin) seed a profile row
-- for each friend by email *before* they ever sign in. The first time they
-- log in with a magic link, the trigger below links auth_user_id to their
-- new auth.users row by matching email. No invite flow to build.
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users (id) on delete set null,
  full_name text not null,
  email text not null unique,
  is_admin boolean not null default false,
  reminder_frequency text not null default 'monthly'
    check (reminder_frequency in ('monthly', 'quarterly', 'biannual', 'none')),
  last_reminded_at date,
  created_at timestamptz not null default now()
);

-- ── Services (Spotify, Amazon Prime, YouTube Premium, ...) ─────────────────
create table public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

-- ── Billing periods ─────────────────────────────────────────────────────
-- One row per stretch of time a service was billed at a given price
-- (mirrors the "Nov 2023 - Oct 2024 (12 months)" blocks in the old sheet).
create table public.billing_periods (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services (id) on delete cascade,
  label text not null,
  start_date date not null,
  end_date date not null,
  total_amount numeric(10, 2) not null,
  created_at timestamptz not null default now()
);

-- ── Charges ──────────────────────────────────────────────────────────────
-- One member's share of one billing period. Usually an even split of
-- total_amount across participating members, but stored per-person so
-- uneven splits (someone joined/left mid-period) work like in the sheet.
create table public.charges (
  id uuid primary key default gen_random_uuid(),
  billing_period_id uuid not null references public.billing_periods (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  amount numeric(10, 2) not null,
  created_at timestamptz not null default now(),
  unique (billing_period_id, profile_id)
);

-- ── Payments ─────────────────────────────────────────────────────────────
-- Money a member has sent back to the admin, recorded by the admin.
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  amount numeric(10, 2) not null,
  paid_at date not null default current_date,
  note text,
  recorded_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

-- ── Auto-link auth users to pre-seeded profiles by email ───────────────────
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set auth_user_id = new.id
  where email = new.email and auth_user_id is null;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

-- ── Helper functions for RLS ─────────────────────────────────────────────
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((select is_admin from public.profiles where auth_user_id = auth.uid()), false);
$$;

create or replace function public.current_profile_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select id from public.profiles where auth_user_id = auth.uid();
$$;

-- ── Balances view ────────────────────────────────────────────────────────
create view public.member_balances
with (security_invoker = true) as
select
  p.id as profile_id,
  p.full_name,
  p.email,
  p.reminder_frequency,
  p.last_reminded_at,
  coalesce(c.total_charged, 0) as total_charged,
  coalesce(pay.total_paid, 0) as total_paid,
  coalesce(c.total_charged, 0) - coalesce(pay.total_paid, 0) as balance
from public.profiles p
left join (
  select profile_id, sum(amount) as total_charged
  from public.charges
  group by profile_id
) c on c.profile_id = p.id
left join (
  select profile_id, sum(amount) as total_paid
  from public.payments
  group by profile_id
) pay on pay.profile_id = p.id;

-- ── Row Level Security ───────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.services enable row level security;
alter table public.billing_periods enable row level security;
alter table public.charges enable row level security;
alter table public.payments enable row level security;

-- profiles: everyone can see their own row, admins see/manage everyone
create policy "profiles_select" on public.profiles
  for select using (auth_user_id = auth.uid() or public.is_admin());

create policy "profiles_update_self_or_admin" on public.profiles
  for update using (auth_user_id = auth.uid() or public.is_admin());

create policy "profiles_insert_admin" on public.profiles
  for insert with check (public.is_admin());

create policy "profiles_delete_admin" on public.profiles
  for delete using (public.is_admin());

-- services / billing_periods: read-only for any signed-in member, admin manages
create policy "services_select_authenticated" on public.services
  for select using (auth.uid() is not null);

create policy "services_write_admin" on public.services
  for all using (public.is_admin()) with check (public.is_admin());

create policy "billing_periods_select_authenticated" on public.billing_periods
  for select using (auth.uid() is not null);

create policy "billing_periods_write_admin" on public.billing_periods
  for all using (public.is_admin()) with check (public.is_admin());

-- charges: members see only their own, admin sees/manages all
create policy "charges_select_own_or_admin" on public.charges
  for select using (profile_id = public.current_profile_id() or public.is_admin());

create policy "charges_write_admin" on public.charges
  for all using (public.is_admin()) with check (public.is_admin());

-- payments: members see only their own, admin sees/manages all
create policy "payments_select_own_or_admin" on public.payments
  for select using (profile_id = public.current_profile_id() or public.is_admin());

create policy "payments_write_admin" on public.payments
  for all using (public.is_admin()) with check (public.is_admin());

-- ── Bootstrap: seed yourself as the first admin ─────────────────────────
-- Edit the email below to your own, then run this block once. Do this
-- BEFORE you first log in so the trigger above can link your auth user.
-- insert into public.profiles (full_name, email, is_admin, reminder_frequency)
-- values ('Your Name', 'you@example.com', true, 'monthly');
