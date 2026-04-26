-- Los+58 database compatibility patch
-- Ejecutar en Supabase SQL Editor si una APK/web ya publicada falla por columnas faltantes.

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
alter table public.sos_alerts add column if not exists resolved_at timestamptz;

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

alter table public.push_subscriptions add column if not exists user_agent text;
alter table public.push_subscriptions add column if not exists platform text;
alter table public.push_subscriptions add column if not exists enabled boolean not null default true;

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

alter table public.native_push_tokens add column if not exists platform text not null default 'android';
alter table public.native_push_tokens add column if not exists device_info text;
alter table public.native_push_tokens add column if not exists enabled boolean not null default true;

create table if not exists public.sos_responses (
  id uuid primary key default gen_random_uuid(),
  sos_alert_id uuid not null references public.sos_alerts (id) on delete cascade,
  helper_user_id uuid not null references public.profiles (id) on delete cascade,
  helper_name text,
  status text not null default 'on_the_way',
  created_at timestamptz not null default now(),
  unique (sos_alert_id, helper_user_id)
);

create unique index if not exists push_subscriptions_endpoint_idx
on public.push_subscriptions (endpoint);

create unique index if not exists native_push_tokens_token_idx
on public.native_push_tokens (token);

create unique index if not exists sos_responses_unique_alert_helper_idx
on public.sos_responses (sos_alert_id, helper_user_id);

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
