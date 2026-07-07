-- ============================================================
-- GES schema v6 — free up slots when a booking is cancelled
-- Run in the Supabase SQL editor. Safe to run more than once.
-- ============================================================

-- The original UNIQUE(slot_date, slot_time) also blocks cancelled rows, so a
-- cancelled slot could never be re-booked. Replace it with a PARTIAL unique
-- index that only applies to active (non-cancelled) bookings.
alter table public.bookings drop constraint if exists bookings_slot_date_slot_time_key;

create unique index if not exists bookings_active_slot_idx
  on public.bookings (slot_date, slot_time)
  where status <> 'cancelled';
