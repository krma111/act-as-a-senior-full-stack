# PromptVault AI Project Context

This repository is the active PromptVault AI website project.

## Verified Identity

- Product name: PromptVault
- Vercel project name: promptvault-ai
- Vercel project id: prj_dSJplymmLdGHh5pZeIo0YQg3mzNq
- Vercel team/scope: krma111s-projects
- Vercel plan: hobby
- Production URL: https://promptvault-ai-rho.vercel.app
- Automatic production URL: https://promptvault-ai-krma111s-projects.vercel.app
- Git branch alias: https://promptvault-ai-git-main-krma111s-projects.vercel.app
- GitHub repository: krma111/act-as-a-senior-full-stack
- Git remote: https://github.com/krma111/act-as-a-senior-full-stack.git
- Production branch: main
- Latest deployed commit: a3633c1a47b117185f955efbde6afebb20d32b0d
- Latest deployed commit message: Fix Supabase authentication flow
- Latest production deployment id: dpl_2tkoZfyQK7ZgG3caVvjJsebLqCpe
- Latest production deployment URL: https://promptvault-js85i6l5r-krma111s-projects.vercel.app
- Latest production status: Ready, promoted
- Latest production creation time: 2026-06-03 01:02:38 Asia/Riyadh
- Vercel framework: Next.js
- Vercel Node version: 20.x
- Vercel function region: iad1
- Vercel web analytics: enabled
- Vercel speed insights: configured, no data yet

## Current Stack

- Next.js 15.1.6 with App Router
- React 19
- TypeScript 5.7
- Tailwind CSS 3.4
- Supabase Auth, database, storage, and RLS
- Vercel production deployments
- pnpm lockfile present, Vercel install command uses `pnpm install --frozen-lockfile`

## Package Scripts

- `npm run dev`: local Next.js dev server
- `npm run build`: production Next.js build
- `npm run start`: serve built app
- `npm run lint`: run ESLint
- `npm run typecheck`: run TypeScript without emitting files

Prefer `pnpm` for dependency installs because the repo has `pnpm-lock.yaml` and Vercel is configured to use pnpm. Use the package scripts above for checks.

## Vercel Configuration

`vercel.json` is authoritative for deployment behavior:

- framework: nextjs
- install command: `pnpm install --frozen-lockfile`
- build command: `pnpm run build`
- output directory: `.next`
- ignore command: `exit 1`

Important Vercel environment variable names:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`

Important local environment variable names from `.env.example`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_ADMIN_EMAIL`
- `NEXT_PUBLIC_ENABLE_GOOGLE_OAUTH`
- `NEXT_PUBLIC_ENABLE_GITHUB_OAUTH`

Never print, commit, or expose secret values. `SUPABASE_SERVICE_ROLE_KEY` must stay server-only.

## Product Scope

PromptVault is a production-ready prompt marketplace and sharing site for text-to-image prompts with example images.

Core features:

- Premium dark prompt marketplace UI
- Search, categories, trending, latest, empty states, and responsive grids
- Supabase email/password auth
- Google OAuth support
- Optional GitHub OAuth support
- Account recovery and reset password flow
- Protected dashboard
- Prompt publishing with image upload
- Prompt metadata: category, tags, AI model, negative prompt, public/private visibility
- Prompt detail pages with copy count, favorite count, favorite button, report flow, tags, and creator metadata
- Admin dashboard for settings, homepage copy, categories, users, report moderation, featuring, hiding, and deleting prompts
- SQL schema and migrations with public reads, user-owned writes, and admin override via RLS

## App Routes

Main routes:

- `/`: home and prompt discovery
- `/login`: user login
- `/signup`: user signup
- `/forgot-password`: password recovery request
- `/reset-password`: password reset
- `/auth/callback`: Supabase email verification, OAuth, and recovery callback
- `/dashboard`: protected user dashboard
- `/admin`: protected admin dashboard
- `/prompts/new`: create prompt
- `/prompts/[id]`: prompt detail
- `/prompts/[id]/edit`: edit prompt
- `/creators/[id]`: creator profile

Legacy routes:

- `/auth/login`
- `/auth/signup`
- `/profile`

These legacy routes now redirect or defer to the newer auth/dashboard flow.

## Important Files

- `README.md`: product overview, setup, Supabase instructions
- `.env.example`: local environment variable names
- `vercel.json`: Vercel build and deploy configuration
- `next.config.ts`: image remote patterns for Unsplash and Supabase
- `src/app/page.tsx`: home page
- `src/app/layout.tsx`: root app shell
- `src/app/globals.css`: current visual system
- `src/app/auth/callback/route.ts`: Supabase auth callback
- `src/app/dashboard/page.tsx`: protected dashboard
- `src/app/admin/page.tsx`: admin dashboard
- `src/components/auth/*`: auth UI
- `src/components/prompt-card.tsx`: prompt card UI
- `src/components/prompt-grid.tsx`: prompt grid UI
- `src/components/search-filters.tsx`: filtering UI
- `src/lib/auth/*`: auth actions, validation, session, and URL helpers
- `src/lib/supabase/*`: Supabase clients and middleware helpers
- `src/lib/actions.ts`: prompt and admin actions
- `src/lib/data.ts`: data loading helpers
- `src/lib/demo-data.ts`: fallback/demo prompt data
- `src/lib/env.ts`: environment handling
- `src/lib/types.ts`: shared types
- `supabase/schema.sql`: base schema
- `supabase/migrations/20260602090000_production_backend.sql`: production backend migration
- `supabase/migrations/20260602123000_auth_profiles_full_name.sql`: auth profile full name migration

## Development Rules

- Keep changes scoped to the PromptVault product unless the user asks for a broader refactor.
- Use existing App Router, TypeScript, Tailwind, Supabase, and component patterns.
- Do not introduce a new UI library unless explicitly requested.
- Preserve the premium dark visual direction.
- Keep user-facing pages responsive and verify mobile layout when editing UI.
- Never expose service-role or database secrets in client components.
- Keep `SUPABASE_SERVICE_ROLE_KEY` usage inside server-only code.
- Treat RLS and auth checks as critical, especially in admin and prompt mutation flows.
- Do not change Vercel project names, aliases, or production branch unless explicitly requested.
- Do not rewrite deployment settings without checking `vercel.json` and Vercel project data first.
- Before committing or deploying, run at least `npm run typecheck` and `npm run lint` when dependencies are available.
- For production-impacting changes, run `npm run build`.

## Known Deployment Context

The current production deployment is from GitHub branch `main` on repo `krma111/act-as-a-senior-full-stack`.

Latest deployment metadata:

- Deployment id: dpl_2tkoZfyQK7ZgG3caVvjJsebLqCpe
- Deployment URL: https://promptvault-js85i6l5r-krma111s-projects.vercel.app
- Aliases:
  - https://promptvault-ai-rho.vercel.app
  - https://promptvault-ai-krma111s-projects.vercel.app
  - https://promptvault-ai-git-main-krma111s-projects.vercel.app
- Commit SHA: a3633c1a47b117185f955efbde6afebb20d32b0d
- Commit author: krma111 <CDUBEY159@GMAIL.COM>
- Commit message: Fix Supabase authentication flow
- Runtime stats: nodejs functions present
- Production status: Ready

## Current Priority

The README says PR3 is in progress. Treat the current work as completing missing live PromptVault feature parity and production QA fixes unless the user gives a newer priority.
