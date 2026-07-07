-- ============================================================
-- GES Client Portal — Supabase schema
-- Run this in the Supabase SQL editor (Project → SQL → New query → paste → Run).
-- ============================================================

create extension if not exists pgcrypto;

-- 1) Private storage bucket that holds each client's built preview site
insert into storage.buckets (id, name, public)
values ('client-previews', 'client-previews', false)
on conflict (id) do nothing;

-- 2) Clients table
create table if not exists public.clients (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,          -- used in the preview path, e.g. bloom-florist
  name          text not null,
  code_hash     text not null,                 -- SHA-256 of the access code (used for lookup)
  access_code   text,                          -- plaintext code, kept so it's recoverable later
  status        text not null default 'active' check (status in ('active','disabled')),
  preview_ready boolean not null default false,-- false → shows "Preview is not finished"
  deploy_url    text,                          -- Vercel deployment URL; if set, the preview iframes this
  dob           text,                          -- client's date of birth (YYYY-MM-DD); a personal 2nd factor at login
  expires_at    timestamptz,                   -- optional auto-expiry
  created_at    timestamptz not null default now(),
  -- ── v2: viewer analytics (see migrations/2026-06-11-v2-analytics-and-codes.sql) ──
  view_count      integer not null default 0,  -- total successful code entries
  first_viewed_at timestamptz,                 -- first time the prospect opened the preview
  last_viewed_at  timestamptz                  -- most recent open (the follow-up signal)
);

create unique index if not exists clients_code_hash_key on public.clients (code_hash);

-- For databases created before these columns existed:
alter table public.clients add column if not exists deploy_url text;
alter table public.clients add column if not exists dob text;

-- Lock it down: only the service-role key (used by the Next server) can touch it.
-- No policies = no anon/public access. service_role bypasses RLS.
alter table public.clients enable row level security;

-- 3) Per-view event log — powers the dashboard's viewer analytics (timeline,
--    counts, first/last). One row per successful access-code entry.
create table if not exists public.client_views (
  id        uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  viewed_at timestamptz not null default now()
);
create index if not exists client_views_client_idx on public.client_views (client_id, viewed_at desc);
alter table public.client_views enable row level security;

-- 4) Discovery-call bookings (from the on-site "Book a call" flow)
create table if not exists public.bookings (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  business   text,
  notes      text,
  slot_date  date not null,            -- YYYY-MM-DD
  slot_time  text not null,            -- "14:00" (Eastern)
  status     text not null default 'new' check (status in ('new','done','cancelled')),
  created_at timestamptz not null default now()
);
create index if not exists bookings_slot_idx on public.bookings (slot_date, slot_time);
-- One ACTIVE meeting per slot (cancelled rows free the slot for re-booking).
create unique index if not exists bookings_active_slot_idx
  on public.bookings (slot_date, slot_time) where status <> 'cancelled';
alter table public.bookings enable row level security;

-- 5) Booking availability settings (single row id=1) — which weekdays/times are
--    bookable + blocked dates. Defaults mirror the original hard-coded behavior.
create table if not exists public.booking_settings (
  id            int primary key default 1 check (id = 1),
  weekdays      int[]  not null default '{1,2,3,4,5}',
  times         text[] not null default '{09:00,10:00,11:00,13:00,14:00,15:00,16:00}',
  blocked_dates text[] not null default '{}',
  horizon_days  int    not null default 14,
  updated_at    timestamptz not null default now()
);
insert into public.booking_settings (id) values (1) on conflict (id) do nothing;
alter table public.booking_settings enable row level security;

-- 6) Booking email sign-ups — prospects verify their email (6-digit code) before
--    they can book, which filters junk bookings. Welcome email sent on first verify.
create table if not exists public.booking_signups (
  email           text primary key,
  code_hash       text,
  code_expires_at timestamptz,
  verified_at     timestamptz,
  welcome_sent_at timestamptz,
  created_at      timestamptz not null default now()
);
alter table public.booking_signups enable row level security;

-- 7) Auth lockout — Apple-style escalating per-IP throttle for the auth
--    endpoints (dev login, signup code, access code). 5 wrong attempts → 1m
--    lock; each further wrong attempt escalates (5m → 15m → 60m). Keyed by
--    "<scope>:<ip>"; a successful auth clears the row. See lib/throttle.ts.
create table if not exists public.auth_throttle (
  id          text primary key,
  fails       int  not null default 0,
  lock_level  int  not null default 0,
  lock_until  timestamptz,
  updated_at  timestamptz not null default now()
);
alter table public.auth_throttle enable row level security;

-- 8) No demo seed. Create real clients from the developer dashboard
--    (/Developer-Dashboard-Page) — it generates a 64-char access code and stores
--    only its SHA-256 hash. (Or use scripts/add-client.mjs.)
