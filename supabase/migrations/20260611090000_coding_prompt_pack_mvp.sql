-- PromptVault Vibe Coder MVP
-- Additive migration: keeps old data, adds coding prompt pack store/order fields.

create extension if not exists pgcrypto;

create table if not exists public.prompt_packs (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid,
  creator_name text,
  title text not null,
  description text,
  cover_image text,
  price numeric default 0,
  is_paid boolean default false,
  status text default 'pending',
  total_prompts integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.prompt_packs add column if not exists slug text;
alter table public.prompt_packs add column if not exists category text;
alter table public.prompt_packs add column if not exists is_free boolean default false;
alter table public.prompt_packs add column if not exists tools_supported text[] default '{}';
alter table public.prompt_packs add column if not exists tech_stack text[] default '{}';
alter table public.prompt_packs add column if not exists what_user_gets text;
alter table public.prompt_packs add column if not exists preview_content text[] default '{}';
alter table public.prompt_packs add column if not exists full_content text default '';
alter table public.prompt_packs add column if not exists sort_order integer default 0;
alter table public.prompt_packs add column if not exists updated_at timestamptz default now();

update public.prompt_packs
set
  slug = coalesce(nullif(slug, ''), lower(trim(both '-' from regexp_replace(coalesce(title, id::text), '[^a-zA-Z0-9]+', '-', 'g')))),
  category = coalesce(nullif(category, ''), 'Full App Build Prompts'),
  is_free = coalesce(is_free, coalesce(price, 0) <= 0),
  is_paid = coalesce(is_paid, coalesce(price, 0) > 0),
  tools_supported = case when tools_supported is null or array_length(tools_supported, 1) is null then array['Codex','Cursor','Lovable','Replit','Bolt','Claude','ChatGPT'] else tools_supported end,
  tech_stack = case when tech_stack is null or array_length(tech_stack, 1) is null then array['React','Next.js','Supabase','Tailwind','Vercel'] else tech_stack end,
  preview_content = case when preview_content is null or array_length(preview_content, 1) is null then array[]::text[] else preview_content end,
  full_content = coalesce(full_content, '')
where slug is null
   or category is null
   or is_free is null
   or tools_supported is null
   or tech_stack is null
   or preview_content is null
   or full_content is null;

create unique index if not exists prompt_packs_slug_unique_idx on public.prompt_packs (slug);
create index if not exists prompt_packs_mvp_public_idx on public.prompt_packs (status, is_free, category, created_at desc);
create index if not exists prompt_packs_mvp_category_idx on public.prompt_packs (category, status);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  buyer_email text not null,
  prompt_pack_id uuid references public.prompt_packs(id) on delete set null,
  prompt_pack_title text not null,
  price numeric not null default 0,
  status text not null default 'pending_payment',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  delivered_at timestamptz,
  check (buyer_email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'),
  check (status in ('pending_payment','paid','delivered','cancelled'))
);

create index if not exists orders_status_created_idx on public.orders (status, created_at desc);
create index if not exists orders_pack_idx on public.orders (prompt_pack_id, created_at desc);
create index if not exists orders_buyer_email_idx on public.orders (lower(buyer_email));

create table if not exists public.site_settings (
  id integer primary key default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.site_settings add column if not exists admin_email text default 'cdubey159@gmail.com';
alter table public.site_settings add column if not exists upi_id text default 'promptvault@upi';
alter table public.site_settings add column if not exists qr_code_url text;
alter table public.site_settings add column if not exists homepage_title text default 'Copy-ready coding prompts for vibe coders.';
alter table public.site_settings add column if not exists homepage_subtitle text default 'Build apps, fix bugs, create dashboards, connect Supabase, improve UI, and deploy faster using powerful AI coding prompt packs.';
alter table public.site_settings add column if not exists categories text[] default array[
  'Full App Build Prompts','SaaS Startup Prompts','Bug Fix Prompts','Supabase Prompts','Admin Dashboard Prompts','UI/UX Upgrade Prompts','Vercel Deployment Prompts','Authentication Prompts','SEO Prompts','AI Agent Prompts','Landing Page Prompts','Database Schema Prompts'
];

-- Legacy columns kept populated so old metadata/admin code cannot crash during deploy rollouts.
alter table public.site_settings add column if not exists website_name text default 'PromptVault';
alter table public.site_settings add column if not exists logo_text text default 'PromptVault';
alter table public.site_settings add column if not exists hero_headline text default 'Copy-ready coding prompts for vibe coders.';
alter table public.site_settings add column if not exists hero_subheadline text default 'Build apps, fix bugs, create dashboards, connect Supabase, improve UI, and deploy faster using powerful AI coding prompt packs.';
alter table public.site_settings add column if not exists footer_text text default 'Copyright 2026 PromptVault. All rights reserved.';
alter table public.site_settings add column if not exists cta_text text default 'Explore Prompt Packs';
alter table public.site_settings add column if not exists empty_state_title text default 'No prompt packs yet';
alter table public.site_settings add column if not exists empty_state_message text default 'Approved coding prompt packs will appear here.';

insert into public.site_settings (id, admin_email, upi_id, homepage_title, homepage_subtitle, website_name, logo_text, hero_headline, hero_subheadline, footer_text, cta_text)
values (
  1,
  'cdubey159@gmail.com',
  'promptvault@upi',
  'Copy-ready coding prompts for vibe coders.',
  'Build apps, fix bugs, create dashboards, connect Supabase, improve UI, and deploy faster using powerful AI coding prompt packs.',
  'PromptVault',
  'PromptVault',
  'Copy-ready coding prompts for vibe coders.',
  'Build apps, fix bugs, create dashboards, connect Supabase, improve UI, and deploy faster using powerful AI coding prompt packs.',
  'Copyright 2026 PromptVault. All rights reserved.',
  'Explore Prompt Packs'
)
on conflict (id) do update set
  homepage_title = coalesce(public.site_settings.homepage_title, excluded.homepage_title),
  homepage_subtitle = coalesce(public.site_settings.homepage_subtitle, excluded.homepage_subtitle),
  website_name = coalesce(public.site_settings.website_name, excluded.website_name),
  logo_text = coalesce(public.site_settings.logo_text, excluded.logo_text),
  hero_headline = coalesce(public.site_settings.hero_headline, excluded.hero_headline),
  hero_subheadline = coalesce(public.site_settings.hero_subheadline, excluded.hero_subheadline),
  footer_text = coalesce(public.site_settings.footer_text, excluded.footer_text),
  cta_text = coalesce(public.site_settings.cta_text, excluded.cta_text),
  updated_at = now();

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists prompt_packs_touch_updated_at on public.prompt_packs;
create trigger prompt_packs_touch_updated_at
before update on public.prompt_packs
for each row execute function public.touch_updated_at();

drop trigger if exists orders_touch_updated_at on public.orders;
create trigger orders_touch_updated_at
before update on public.orders
for each row execute function public.touch_updated_at();

drop trigger if exists site_settings_touch_updated_at on public.site_settings;
create trigger site_settings_touch_updated_at
before update on public.site_settings
for each row execute function public.touch_updated_at();

alter table public.prompt_packs enable row level security;
alter table public.orders enable row level security;
alter table public.site_settings enable row level security;

-- Retire creator/buyer pack policies for the simplified no-login MVP.
drop policy if exists "Public can read approved free packs" on public.prompt_packs;
drop policy if exists "Buyers can read approved paid packs" on public.prompt_packs;
drop policy if exists "Public read approved free prompt packs" on public.prompt_packs;
drop policy if exists "Buyers read approved paid prompt packs" on public.prompt_packs;
drop policy if exists "Public read approved prompt packs" on public.prompt_packs;
drop policy if exists "Creators create prompt packs" on public.prompt_packs;
drop policy if exists "Creators read own prompt packs" on public.prompt_packs;
drop policy if exists "Creators update own pending prompt packs" on public.prompt_packs;
drop policy if exists "Creators delete own pending prompt packs" on public.prompt_packs;
drop policy if exists "Creators can create own packs" on public.prompt_packs;
drop policy if exists "Creators can read own packs" on public.prompt_packs;
drop policy if exists "Creators can update own pending packs" on public.prompt_packs;
drop policy if exists "Creators can delete own pending packs" on public.prompt_packs;
drop policy if exists "Admins can manage all packs" on public.prompt_packs;
drop policy if exists "Admins full access prompt packs" on public.prompt_packs;
drop policy if exists "Public can read approved coding prompt packs" on public.prompt_packs;
drop policy if exists "Admins manage coding prompt packs" on public.prompt_packs;

create policy "Public can read approved coding prompt packs"
on public.prompt_packs for select
to anon, authenticated
using (status = 'approved');

create policy "Admins manage coding prompt packs"
on public.prompt_packs for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Public can create order requests" on public.orders;
drop policy if exists "Admins manage orders" on public.orders;

create policy "Public can create order requests"
on public.orders for insert
to anon, authenticated
with check (
  buyer_email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
  and status = 'pending_payment'
  and price >= 0
);

create policy "Admins manage orders"
on public.orders for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Public can read site settings" on public.site_settings;
drop policy if exists "Admins can update site settings" on public.site_settings;
drop policy if exists "Admins can insert site settings" on public.site_settings;
drop policy if exists "Admins manage site settings" on public.site_settings;

create policy "Public can read site settings"
on public.site_settings for select
to anon, authenticated
using (true);

create policy "Admins manage site settings"
on public.site_settings for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Data API privileges. full_content is intentionally not granted to anon/authenticated table readers;
-- server/admin code uses service role for delivery and admin management.
revoke all on public.prompt_packs from anon, authenticated;
grant select (id, title, slug, description, category, price, is_free, is_paid, tools_supported, tech_stack, what_user_gets, preview_content, status, cover_image, total_prompts, sort_order, created_at, updated_at) on public.prompt_packs to anon, authenticated;

grant select on public.site_settings to anon, authenticated;
grant insert on public.orders to anon, authenticated;
grant usage on schema public to anon, authenticated;

insert into public.prompt_packs (
  title, slug, description, category, price, is_free, is_paid, tools_supported, tech_stack, what_user_gets, preview_content, full_content, status, total_prompts, sort_order
) values
(
  'Full SaaS App Build Master Prompt',
  'full-saas-app-build-master-prompt',
  'A complete copy-ready prompt pack for building a production SaaS app with auth, database, dashboard, payments, and deployment.',
  'Full App Build Prompts',
  999,
  false,
  true,
  array['Codex','Cursor','Lovable','Claude','ChatGPT'],
  array['Next.js','React','Supabase','Tailwind','Vercel'],
  'A full app build command, architecture checklist, database plan, security checklist, deployment QA, and follow-up debugging prompts.',
  array[
    'Act as a senior full-stack engineer. Build a production-ready SaaS app using Next.js, Supabase, Tailwind, and Vercel. Start by auditing requirements, then create pages, database schema, server actions, auth, admin, and deployment notes.',
    'Inspect this codebase and create a clean implementation plan before editing. Classify work into frontend, backend, database, auth, security, and deployment.'
  ],
  'MASTER PROMPT 1: Act as my autonomous senior full-stack engineer. Build a production-ready SaaS app from this idea: [APP IDEA]. Use Next.js App Router, TypeScript, Tailwind, Supabase Auth/Database/Storage, and Vercel deployment. First inspect the repo. Then create the schema, RLS policies, server actions, public pages, protected dashboard, admin panel, empty/loading/error states, and README. Run lint, typecheck, and build. Fix all errors before reporting.\n\nMASTER PROMPT 2: Audit the app like a production CTO. Find missing routes, broken data flow, weak security, slow pages, and deployment issues. Fix critical items first, then high, medium, low. Do not use fake data in production paths.\n\nMASTER PROMPT 3: Prepare the Vercel deployment. Verify env variables, build command, output, middleware, server actions, redirects, and production routes. Return exact required settings only.',
  'approved',
  12,
  10
),
(
  'Supabase Backend Fix Pack',
  'supabase-backend-fix-pack',
  'Prompts for fixing Supabase tables, RLS policies, auth, storage, inserts, and admin visibility problems.',
  'Supabase Prompts',
  499,
  false,
  true,
  array['Codex','Cursor','Claude','ChatGPT'],
  array['Supabase','Postgres','RLS','Next.js'],
  'Schema audit prompts, RLS repair prompts, storage upload fix prompts, and production-safe SQL migration instructions.',
  array[
    'Inspect the Supabase integration. Find all queries, table names, RLS policies, and env variables. Fix missing tables and permissions without deleting data.',
    'Create a production-safe Supabase migration with UUID primary keys, timestamps, indexes, RLS, public read policies, admin manage policies, and rollback notes.'
  ],
  'SUPABASE PROMPT 1: Act as a senior Supabase backend engineer. Inspect every Supabase query in this project. Verify tables, columns, RLS, grants, storage buckets, and env variables. If a table or column is missing, create an additive migration. Public users should only read approved public content. Admin can manage everything. Never expose service role keys to client code.\n\nSUPABASE PROMPT 2: Fix this Supabase error: [PASTE ERROR]. Find the query, table, schema cache issue, RLS policy, grants, and frontend assumptions causing it. Add safe empty states and server-side error handling.\n\nSUPABASE PROMPT 3: Build an RLS policy set for [FEATURE]. Include public read, owner create/update/delete, admin full access, and paid-content protection.',
  'approved',
  9,
  20
),
(
  'Vercel Deployment Recovery Pack',
  'vercel-deployment-recovery-pack',
  'A deployment debugging pack for build failures, runtime crashes, missing env variables, and broken production routes.',
  'Vercel Deployment Prompts',
  399,
  false,
  true,
  array['Codex','Cursor','Claude','ChatGPT'],
  array['Vercel','Next.js','GitHub Actions','Environment Variables'],
  'Build-log diagnosis prompts, production crash prompts, env checklist prompts, and deployment verification prompts.',
  array[
    'Check why this GitHub-connected Next.js project is not deploying to Vercel. Inspect package scripts, build logs, env vars, routes, middleware, and runtime errors.',
    'Run npm/pnpm install, lint, typecheck, build, then fix every error before pushing.'
  ],
  'VERCEL PROMPT 1: Act as my senior Vercel deployment engineer. Inspect this repo, package manager, framework settings, build command, output directory, env vars, middleware, server actions, and deployment logs. Fix all build and runtime errors. Push only after build passes.\n\nVERCEL PROMPT 2: Production is showing: [ERROR]. Reproduce locally with production build. Check browser console, server logs, failed network requests, missing env variables, and null data access. Add graceful fallbacks and verify all critical routes.\n\nVERCEL PROMPT 3: Create a deployment checklist for this app including Vercel env vars, Supabase redirect URLs, build command, install command, and post-deploy route verification.',
  'approved',
  8,
  30
),
(
  'Bug Fix Commander Prompt Pack',
  'bug-fix-commander-prompt-pack',
  'A practical pack for making AI coding tools debug root causes instead of applying random patches.',
  'Bug Fix Prompts',
  0,
  true,
  false,
  array['Codex','Cursor','Claude','ChatGPT','Replit'],
  array['React','Next.js','TypeScript','Supabase','Vercel'],
  'Free root-cause debugging prompts for runtime errors, broken buttons, form failures, and slow pages.',
  array[
    'Act as a senior debugging engineer. Reproduce the bug, inspect logs, identify the root cause, fix it, run tests, and explain exactly what changed.',
    'Do not patch only the symptom. Search for similar failures, add error handling, and prevent the same bug from coming back.',
    'Check every map/filter call, async function, server action, environment variable, and database response for null or undefined failures.'
  ],
  'Act as a senior debugging engineer. Reproduce the bug, inspect browser console, server logs, network requests, database responses, and recent commits. Identify the root cause, fix it cleanly, add validation/error states, run lint/typecheck/build, and report files changed plus test results.',
  'approved',
  3,
  40
),
(
  'Admin Dashboard Builder Pack',
  'admin-dashboard-builder-pack',
  'Prompts for building and repairing admin dashboards with CRUD, moderation, logs, settings, and analytics.',
  'Admin Dashboard Prompts',
  599,
  false,
  true,
  array['Codex','Cursor','Lovable','Claude','ChatGPT'],
  array['Next.js','Supabase','Tailwind','Server Actions'],
  'Admin dashboard architecture prompts, CRUD prompts, role-protection prompts, and production error handling prompts.',
  array[
    'Build a protected admin dashboard with overview stats, records table, filters, edit modal, delete confirmation, and audit logs.',
    'Only admin users can access this route. Use server-side checks and database policies. Never rely on client-side admin flags.'
  ],
  'ADMIN PROMPT 1: Build a production admin dashboard for [RESOURCE]. Admin can list, filter, create, edit, delete, approve, reject, and update settings. Use real database data, server-side authorization, loading states, empty states, error states, and audit logs.\n\nADMIN PROMPT 2: Fix this broken admin page: [PASTE ISSUE]. Check route protection, server actions, Supabase queries, table schemas, RLS, form fields, redirects, and UI state. No fake stats.\n\nADMIN PROMPT 3: Add an admin settings page for editable website content. Store settings in a database table and update the public homepage without code changes.',
  'approved',
  10,
  50
),
(
  'UI UX Premium Upgrade Prompt Pack',
  'ui-ux-premium-upgrade-prompt-pack',
  'Prompts to make rough interfaces feel premium, fast, animated, responsive, and conversion-ready.',
  'UI/UX Upgrade Prompts',
  0,
  true,
  false,
  array['Codex','Cursor','Lovable','Bolt','Claude','ChatGPT'],
  array['React','Next.js','Tailwind','Framer Motion'],
  'Free UI upgrade prompts for glassmorphism, mobile layouts, animations, empty states, and interaction polish.',
  array[
    'Upgrade this UI to feel premium and modern. Keep the same functionality, improve spacing, hierarchy, contrast, responsiveness, and interaction states.',
    'Add loading skeletons, empty states, error states, hover/tap states, and mobile-first layouts without making the app slow.'
  ],
  'Upgrade this website UI/UX to look premium, clean, and high-end. Use glassmorphism, strong hierarchy, responsive cards, smooth hover/tap interactions, readable typography, clean empty states, loading skeletons, and accessible contrast. Do not remove existing functionality. Run build and fix layout issues.',
  'approved',
  4,
  60
),
(
  'Authentication System Prompt Pack',
  'authentication-system-prompt-pack',
  'Prompts for implementing secure auth, protected routes, OAuth, password reset, and session-safe dashboards.',
  'Authentication Prompts',
  399,
  false,
  true,
  array['Codex','Cursor','Claude','ChatGPT'],
  array['Supabase Auth','Next.js','Middleware','RLS'],
  'Signup/login/OAuth prompts, protected route prompts, reset-password prompts, and profile/RLS prompts.',
  array[
    'Build production Supabase Auth with email/password, Google OAuth, protected dashboard, logout, reset password, and profile creation.',
    'If auth env vars are missing, show a clean setup warning and do not create fake users or fake sessions.'
  ],
  'AUTH PROMPT 1: Build production Supabase Auth for this Next.js app. Include signup, login, logout, Google OAuth, forgot password, reset password, protected dashboard, profile table trigger, navbar session display, loading states, and clean error messages. Never store passwords manually.\n\nAUTH PROMPT 2: Fix this auth bug: [PASTE BUG]. Inspect callback URLs, Supabase provider config, env vars, middleware, cookies, redirects, session restoration, and RLS policies.\n\nAUTH PROMPT 3: Remove fake auth and localStorage sessions. Use only Supabase Auth and server-safe route protection.',
  'approved',
  7,
  70
),
(
  'Landing Page Builder Prompt Pack',
  'landing-page-builder-prompt-pack',
  'Prompts for building SaaS landing pages with hero, pricing, features, trust, FAQ, and conversion-focused copy.',
  'Landing Page Prompts',
  299,
  false,
  true,
  array['Codex','Cursor','Lovable','Bolt','Claude','ChatGPT'],
  array['React','Next.js','Tailwind','SEO'],
  'Landing page prompts, copywriting prompts, pricing-section prompts, and SEO structure prompts.',
  array[
    'Create a premium SaaS landing page for [PRODUCT]. Include hero, benefits, product cards, pricing, FAQ, trust signals, and CTA sections.',
    'Make it mobile-first, fast, accessible, SEO-ready, and visually distinctive.'
  ],
  'LANDING PROMPT 1: Build a premium landing page for [PRODUCT]. Audience: [AUDIENCE]. Promise: [PROMISE]. Include hero headline, subheadline, CTAs, feature cards, how it works, pricing, FAQ, trust section, and footer. Use a clean design system and mobile-first responsive layout.\n\nLANDING PROMPT 2: Rewrite this landing page copy to be clear, specific, and conversion-focused. Remove vague claims. Add proof, outcomes, and direct CTAs.\n\nLANDING PROMPT 3: Audit this page for mobile UX, speed, accessibility, SEO metadata, Open Graph, and conversion blockers.',
  'approved',
  6,
  80
)
on conflict (slug) do update set
  title = excluded.title,
  description = excluded.description,
  category = excluded.category,
  price = excluded.price,
  is_free = excluded.is_free,
  is_paid = excluded.is_paid,
  tools_supported = excluded.tools_supported,
  tech_stack = excluded.tech_stack,
  what_user_gets = excluded.what_user_gets,
  preview_content = excluded.preview_content,
  full_content = excluded.full_content,
  status = excluded.status,
  total_prompts = excluded.total_prompts,
  sort_order = excluded.sort_order,
  updated_at = now();
