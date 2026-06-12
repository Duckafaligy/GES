-- ============================================================
-- GES schema v5 — booking email sign-ups (verification gate)
-- Run in the Supabase SQL editor. Safe to run more than once.
-- ============================================================

create table if not exists public.booking_signups (
  email           text primary key,
  code_hash       text,                       -- SHA-256 of the current 6-digit code
  code_expires_at timestamptz,                -- code lifetime (~10 min)
  verified_at     timestamptz,                -- first successful verification
  welcome_sent_at timestamptz,                -- welcome email sent once
  created_at      timestamptz not null default now()
);

alter table public.booking_signups enable row level security;
