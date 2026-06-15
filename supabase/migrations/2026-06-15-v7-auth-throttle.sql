-- ============================================================
-- GES schema v7 — Apple-style escalating auth lockout
-- Run in the Supabase SQL editor. Safe to run more than once.
-- ============================================================

-- Per-IP (per-scope) failed-attempt tracking for auth endpoints. A row is keyed
-- by "<scope>:<ip>" (e.g. "dev-login:1.2.3.4"). After 5 wrong attempts the IP is
-- locked for 1 minute; each further wrong attempt escalates (5m, 15m, 60m). A
-- successful auth deletes the row. Stored in the DB (not memory) so the lockout
-- holds across serverless instances and cold starts.
create table if not exists public.auth_throttle (
  id          text primary key,                 -- "<scope>:<ip>"
  fails       int  not null default 0,          -- consecutive fails in the current window
  lock_level  int  not null default 0,          -- 0 = never locked, 1..n = escalation tier
  lock_until  timestamptz,                      -- locked until this time (null = not locked)
  updated_at  timestamptz not null default now()
);

alter table public.auth_throttle enable row level security;
