-- ============================================================
-- GES schema v4 — booking availability settings (single row)
-- Run in the Supabase SQL editor. Safe to run more than once.
-- ============================================================

create table if not exists public.booking_settings (
  id            int primary key default 1 check (id = 1),
  weekdays      int[]  not null default '{1,2,3,4,5}',                                 -- 0=Sun … 6=Sat
  times         text[] not null default '{09:00,10:00,11:00,13:00,14:00,15:00,16:00}', -- ET, "HH:MM"
  blocked_dates text[] not null default '{}',                                          -- ["YYYY-MM-DD", …]
  horizon_days  int    not null default 14,                                            -- how many bookable weekdays ahead
  updated_at    timestamptz not null default now()
);

insert into public.booking_settings (id) values (1) on conflict (id) do nothing;
alter table public.booking_settings enable row level security;
