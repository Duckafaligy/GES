-- ============================================================
-- GES schema v2 — viewer analytics + recoverable access codes
-- For databases that already ran the original schema.sql.
-- Run in the Supabase SQL editor (Project → SQL → New query → Run).
-- Safe to run more than once.
-- ============================================================

-- Aggregate view counters on the client row (fast to read in the dashboard list)
-- + the plaintext access code so it's recoverable if you forget it later.
alter table public.clients
  add column if not exists access_code     text,
  add column if not exists view_count      integer not null default 0,
  add column if not exists first_viewed_at timestamptz,
  add column if not exists last_viewed_at  timestamptz;

-- Per-view event log — one row per successful access-code entry. Powers the
-- viewer-analytics panel (timeline of opens).
create table if not exists public.client_views (
  id        uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  viewed_at timestamptz not null default now()
);
create index if not exists client_views_client_idx on public.client_views (client_id, viewed_at desc);
alter table public.client_views enable row level security;
