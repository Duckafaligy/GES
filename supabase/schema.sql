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
  industry      text,
  code_hash     text not null,                 -- SHA-256 of the access code (no plaintext stored)
  status        text not null default 'active' check (status in ('active','disabled')),
  preview_ready boolean not null default false,-- false → shows "Preview is not finished"
  deploy_url    text,                          -- Vercel deployment URL; if set, the preview iframes this
  dob           text,                          -- client's date of birth (YYYY-MM-DD); a personal 2nd factor at login
  expires_at    timestamptz,                   -- optional auto-expiry
  created_at    timestamptz not null default now()
);

create unique index if not exists clients_code_hash_key on public.clients (code_hash);

-- For databases created before these columns existed:
alter table public.clients add column if not exists deploy_url text;
alter table public.clients add column if not exists dob text;

-- Lock it down: only the service-role key (used by the Next server) can touch it.
-- No policies = no anon/public access. service_role bypasses RLS.
alter table public.clients enable row level security;

-- 3) No demo seed. Create real clients from the developer dashboard
--    (/Developer-Dashboard-Page) — it generates a 64-char access code and stores
--    only its SHA-256 hash. (Or use scripts/add-client.mjs.)
