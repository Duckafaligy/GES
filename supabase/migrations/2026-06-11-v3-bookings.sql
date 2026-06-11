-- ============================================================
-- GES schema v3 — discovery-call bookings
-- Run in the Supabase SQL editor (Project → SQL → New query → Run).
-- Safe to run more than once.
-- ============================================================

create table if not exists public.bookings (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  business   text,
  notes      text,
  slot_date  date not null,            -- YYYY-MM-DD
  slot_time  text not null,            -- "14:00" (Eastern)
  status     text not null default 'new' check (status in ('new','done','cancelled')),
  created_at timestamptz not null default now(),
  unique (slot_date, slot_time)        -- one meeting per slot (no double-booking)
);

create index if not exists bookings_slot_idx on public.bookings (slot_date, slot_time);

-- Service-role only (the Next server). No anon policies.
alter table public.bookings enable row level security;
