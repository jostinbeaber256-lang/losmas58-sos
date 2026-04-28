create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique,
  full_name text,
  bike_model text,
  city text,
  emergency_contact text,
  is_on_route boolean not null default false,
  emergency_state text not null default 'normal' check (emergency_state in ('normal', 'emergency')),
  is_admin boolean not null default false,
  continuous_monitoring_enabled boolean not null default false,
  emergency_tracking_active boolean not null default false,
  latitude double precision,
  longitude double precision,
  location_updated_at timestamptz,
  sharing_started_at timestamptz,
  monitoring_updated_at timestamptz,
  emergency_tracking_started_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sos_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  full_name text,
  username text,
  bike_model text,
  city text,
  emergency_contact text,
  emergency_type text,
  emergency_details text,
  medical_summary text,
  latitude double precision not null,
  longitude double precision not null,
  status text not null default 'active' check (status in ('active', 'resolved', 'cancelled')),
  message text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists public.medical_profiles (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  blood_type text,
  allergies text,
  medical_conditions text,
  medications text,
  notes text,
  emergency_contact_name text,
  emergency_contact_phone text,
  secondary_contact_name text,
  secondary_contact_phone text,
  insurance_info text,
  preferred_hospital text,
  show_in_sos boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  platform text,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.native_push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  token text not null,
  platform text not null default 'android',
  device_info text,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sos_responses (
  id uuid primary key default gen_random_uuid(),
  sos_alert_id uuid not null references public.sos_alerts (id) on delete cascade,
  helper_user_id uuid not null references public.profiles (id) on delete cascade,
  helper_name text,
  status text not null default 'on_the_way' check (status in ('on_the_way')),
  created_at timestamptz not null default now(),
  unique (sos_alert_id, helper_user_id)
);

create table if not exists public.group_rides (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  meeting_point text,
  starts_at timestamptz,
  status text not null default 'draft' check (status in ('draft', 'active', 'finished')),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ride_participants (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.group_rides (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  full_name text,
  username text,
  bike_model text,
  city text,
  is_admin boolean not null default false,
  attendance_status text not null default 'pending' check (attendance_status in ('pending', 'confirmed', 'declined')),
  live_route_enabled boolean not null default false,
  current_lat double precision,
  current_lng double precision,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, user_id)
);

alter table public.profiles add column if not exists latitude double precision;
alter table public.profiles add column if not exists longitude double precision;
alter table public.profiles add column if not exists location_updated_at timestamptz;
alter table public.profiles add column if not exists sharing_started_at timestamptz;
alter table public.profiles add column if not exists emergency_state text not null default 'normal';
alter table public.profiles add column if not exists is_admin boolean not null default false;
alter table public.profiles add column if not exists continuous_monitoring_enabled boolean not null default false;
alter table public.profiles add column if not exists emergency_tracking_active boolean not null default false;
alter table public.profiles add column if not exists monitoring_updated_at timestamptz;
alter table public.profiles add column if not exists emergency_tracking_started_at timestamptz;
alter table public.sos_alerts add column if not exists city text;
alter table public.sos_alerts add column if not exists emergency_contact text;
alter table public.sos_alerts add column if not exists emergency_type text;
alter table public.sos_alerts add column if not exists emergency_details text;
alter table public.sos_alerts add column if not exists medical_summary text;
alter table public.push_subscriptions add column if not exists user_agent text;
alter table public.native_push_tokens add column if not exists platform text not null default 'android';
alter table public.native_push_tokens add column if not exists device_info text;
alter table public.profiles add column if not exists avatar_url text;

alter table public.profiles enable row level security;
alter table public.sos_alerts enable row level security;
alter table public.medical_profiles enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.native_push_tokens enable row level security;
alter table public.sos_responses enable row level security;
alter table public.group_rides enable row level security;
alter table public.ride_participants enable row level security;

drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile"
on public.profiles
for select
using (auth.uid() = id);

drop policy if exists "Users can view active riders" on public.profiles;
create policy "Users can view active riders"
on public.profiles
for select
using (auth.role() = 'authenticated' and is_on_route = true);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
on public.profiles
for insert
with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Authenticated users can view active sos alerts" on public.sos_alerts;
create policy "Authenticated users can view sos alerts"
on public.sos_alerts
for select
using (
  auth.role() = 'authenticated' and (
    auth.uid() = user_id or 
    status = 'active'
  )
);

drop policy if exists "Users can create their own sos alerts" on public.sos_alerts;
create policy "Users can create their own sos alerts"
on public.sos_alerts
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own sos alerts" on public.sos_alerts;
create policy "Users can update their own sos alerts"
on public.sos_alerts
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can view their own medical profile" on public.medical_profiles;
create policy "Users can view their own medical profile"
on public.medical_profiles
for select
using (auth.uid() = user_id);

drop policy if exists "Users can create their own medical profile" on public.medical_profiles;
create policy "Users can create their own medical profile"
on public.medical_profiles
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own medical profile" on public.medical_profiles;
create policy "Users can update their own medical profile"
on public.medical_profiles
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can view their own push subscriptions" on public.push_subscriptions;
create policy "Users can view their own push subscriptions"
on public.push_subscriptions
for select
using (auth.uid() = user_id);

drop policy if exists "Users can create their own push subscriptions" on public.push_subscriptions;
create policy "Users can create their own push subscriptions"
on public.push_subscriptions
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own push subscriptions" on public.push_subscriptions;
create policy "Users can update their own push subscriptions"
on public.push_subscriptions
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create unique index if not exists push_subscriptions_endpoint_idx
on public.push_subscriptions (endpoint);

drop policy if exists "Users can view their own native push tokens" on public.native_push_tokens;
create policy "Users can view their own native push tokens"
on public.native_push_tokens
for select
using (auth.uid() = user_id);

drop policy if exists "Users can create their own native push tokens" on public.native_push_tokens;
create policy "Users can create their own native push tokens"
on public.native_push_tokens
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own native push tokens" on public.native_push_tokens;
create policy "Users can update their own native push tokens"
on public.native_push_tokens
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create unique index if not exists native_push_tokens_token_idx
on public.native_push_tokens (token);

create unique index if not exists sos_responses_unique_alert_helper_idx
on public.sos_responses (sos_alert_id, helper_user_id);

create unique index if not exists ride_participants_event_user_idx
on public.ride_participants (event_id, user_id);

create index if not exists group_rides_status_starts_idx
on public.group_rides (status, starts_at desc);

create index if not exists ride_participants_event_status_idx
on public.ride_participants (event_id, attendance_status, live_route_enabled, updated_at desc);

drop policy if exists "Authenticated users can view group rides" on public.group_rides;
create policy "Authenticated users can view group rides"
on public.group_rides
for select
using (auth.role() = 'authenticated');

drop policy if exists "Admins can manage group rides" on public.group_rides;
create policy "Admins can manage group rides"
on public.group_rides
for all
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
    and profiles.is_admin = true
  )
)
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
    and profiles.is_admin = true
  )
);

drop policy if exists "Authenticated users can view ride participants" on public.ride_participants;
create policy "Authenticated users can view ride participants"
on public.ride_participants
for select
using (auth.role() = 'authenticated');

drop policy if exists "Users can create their own ride participant" on public.ride_participants;
create policy "Users can create their own ride participant"
on public.ride_participants
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own ride participant" on public.ride_participants;
create policy "Users can update their own ride participant"
on public.ride_participants
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Authenticated users can view sos responses" on public.sos_responses;
create policy "Authenticated users can view sos responses"
on public.sos_responses
for select
using (auth.role() = 'authenticated');

drop policy if exists "Users can create their own sos responses" on public.sos_responses;
create policy "Users can create their own sos responses"
on public.sos_responses
for insert
with check (auth.uid() = helper_user_id);

create index if not exists profiles_live_location_idx
on public.profiles (is_on_route, location_updated_at desc);

create index if not exists profiles_admin_monitoring_idx
on public.profiles (
  continuous_monitoring_enabled,
  emergency_tracking_active,
  location_updated_at desc
);

create index if not exists sos_alerts_active_idx
on public.sos_alerts (status, created_at desc);

create index if not exists sos_responses_alert_idx
on public.sos_responses (sos_alert_id, status, created_at desc);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
