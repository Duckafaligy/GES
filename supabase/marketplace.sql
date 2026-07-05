-- ============================================================
-- GES Marketplace — templates for sale
-- Run in the Supabase SQL editor (after / alongside schema.sql).
-- ============================================================

create extension if not exists pgcrypto;

-- Private bucket: each template's live demo build + its downloadable format zips.
--   templates/<slug>/demo/...            → live demo build (served email-gated)
--   templates/<slug>/formats/<file>.zip  → paid artifacts (delivered post-purchase)
insert into storage.buckets (id, name, public)
values ('templates', 'templates', false)
on conflict (id) do nothing;

-- Public bucket for storefront thumbnails (shown on the public store).
insert into storage.buckets (id, name, public)
values ('template-thumbnails', 'template-thumbnails', true)
on conflict (id) do nothing;

-- 1) Templates (the products)
create table if not exists public.templates (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,
  title           text not null,
  tagline         text,
  description     text,
  category        text,
  tags            text[] not null default '{}',
  price_cents     integer not null default 0,         -- "from" / display price
  thumbnail_url   text,                                -- public image URL (or null → CSS placeholder)
  demo_ready      boolean not null default false,      -- a demo build is uploaded
  demo_deploy_url text,                                -- optional external (Vercel) live demo
  status          text not null default 'draft' check (status in ('draft', 'published')),
  created_at      timestamptz not null default now()
);
create index if not exists templates_status_idx on public.templates (status);

-- 2) Format variants (what a buyer actually purchases / downloads)
create table if not exists public.template_formats (
  id           uuid primary key default gen_random_uuid(),
  template_id  uuid not null references public.templates(id) on delete cascade,
  kind         text not null,            -- 'raw' | 'shopify' | 'html' | 'next' | 'wordpress' | ...
  label        text not null,            -- e.g. "Raw codebase (Next.js + Tailwind)"
  price_cents  integer not null,
  license      text,                     -- short license summary for this format
  storage_key  text,                     -- templates/<slug>/formats/<file>.zip
  size_bytes   bigint,
  created_at   timestamptz not null default now()
);
create index if not exists template_formats_template_idx on public.template_formats (template_id);

-- 3) Email-gated demo leads
create table if not exists public.demo_leads (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  template_id uuid references public.templates(id) on delete set null,
  created_at  timestamptz not null default now()
);

-- 4) Orders (Stripe + buyer accounts fill these in later phases)
create table if not exists public.orders (
  id                uuid primary key default gen_random_uuid(),
  template_id       uuid references public.templates(id) on delete set null,
  format_id         uuid references public.template_formats(id) on delete set null,
  buyer_user_id     uuid,                 -- Supabase auth user (Phase 3)
  buyer_email       text,
  amount_cents      integer not null default 0,
  status            text not null default 'pending' check (status in ('pending', 'paid', 'refunded')),
  stripe_session_id text,
  created_at        timestamptz not null default now()
);
create index if not exists orders_buyer_idx on public.orders (buyer_user_id);

-- Locked down; all access goes through the Next server (service role) for now.
alter table public.templates       enable row level security;
alter table public.template_formats enable row level security;
alter table public.demo_leads      enable row level security;
alter table public.orders          enable row level security;

-- 5) Seed a few published templates so the storefront isn't empty (no files yet).
insert into public.templates (slug, title, tagline, description, category, price_cents, status) values
  ('aurora-storefront', 'Aurora', 'Conversion-first storefront', 'A bold e-commerce storefront with a 3D product hero and scroll-driven storytelling.', 'E-Commerce', 9900, 'published'),
  ('atelier-portfolio', 'Atelier', 'Minimal studio portfolio', 'A refined portfolio / agency template with case studies and tasteful motion.', 'Portfolio', 5900, 'published'),
  ('forge-saas', 'Forge', 'SaaS landing + pricing', 'A modern SaaS landing with pricing, FAQ, and dark mode out of the box.', 'SaaS', 6900, 'published')
on conflict (slug) do nothing;
