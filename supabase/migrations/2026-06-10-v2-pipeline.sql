-- ============================================================
-- GES schema v2 — sales pipeline + CRM fields
-- For databases that already ran the original schema.sql.
-- Run in the Supabase SQL editor (Project → SQL → New query → Run).
-- Safe to run more than once.
-- ============================================================

alter table public.clients
  add column if not exists stage          text not null default 'new',
  add column if not exists contact_email  text,
  add column if not exists contact_phone  text,
  add column if not exists notes          text,
  add column if not exists pricing_model  text,
  add column if not exists quote          text,
  add column if not exists view_count     integer not null default 0,
  add column if not exists last_viewed_at timestamptz;

-- Constraints added separately so re-runs don't error.
do $$ begin
  alter table public.clients
    add constraint clients_stage_check check (stage in ('new','viewed','deposit','delivered'));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.clients
    add constraint clients_pricing_model_check check (pricing_model in ('buyout','rent'));
exception when duplicate_object then null; end $$;
