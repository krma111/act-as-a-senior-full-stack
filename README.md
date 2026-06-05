# PromptVault

A production-ready Next.js, TypeScript, Tailwind CSS, and Supabase website for sharing text-to-image prompts with example images.

## Features

- Dark premium prompt marketplace UI with search, categories, trending, latest, empty states, and responsive image grids
- Supabase Auth with email/password, Google OAuth, optional GitHub OAuth, account recovery, and protected dashboard routes
- Prompt publishing with image upload, category, tags, AI model, negative prompt, and public/private visibility
- Prompt detail pages with copy count, favorite count, favorite button, report flow, tags, and creator metadata
- Admin dashboard for site settings, homepage text, categories, users, report moderation, featuring, hiding, and deleting prompts
- SQL schema with RLS for public reads, user-owned writes, and admin override

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` from `.env.example`:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_ADMIN_EMAIL=you@example.com
NEXT_PUBLIC_ENABLE_GITHUB_OAUTH=false
```

3. In Supabase SQL Editor, run the project SQL in this order:

```sql
-- existing app schema
\i supabase/schema.sql

-- production profiles/prompts/saved prompts tables
\i supabase/migrations/20260602090000_production_backend.sql

-- full_name profile alignment for auth
\i supabase/migrations/20260602123000_auth_profiles_full_name.sql
```

4. Before creating the admin user, replace the inserted `site_settings` email with the same email as `NEXT_PUBLIC_ADMIN_EMAIL`:

```sql
update public.site_settings
set admin_email = 'you@example.com'
where id = 1;
```

5. Run the app:

```bash
npm run dev
```

6. Configure Supabase Auth:

- Auth > URL Configuration
  - Site URL locally: `http://localhost:3000`
  - Site URL in production: `https://promptvault-ai-rho.vercel.app`
  - Add redirect URL: `http://localhost:3000/auth/callback`
  - Add production redirect URL: `https://promptvault-ai-rho.vercel.app/auth/callback`
  - Add your custom-domain redirect URL too if you connect one, for example `https://your-domain.com/auth/callback`
- Auth > Providers
  - Enable Google in Supabase and add the Google Client ID and Client Secret.
  - For this Supabase project, set the Google Cloud authorized redirect URI to `https://nxmveyrpvhnaaxszrchh.supabase.co/auth/v1/callback`
  - Optional: enable GitHub in Supabase and set `NEXT_PUBLIC_ENABLE_GITHUB_OAUTH=true`
  - In GitHub OAuth App, set the authorization callback URL to `https://<your-supabase-project-ref>.supabase.co/auth/v1/callback`
- Auth > Email
  - Keep email confirmations enabled if you want verified-email signup

7. Sign up with the admin email, then set the admin role manually once:

```sql
update public.profiles
set role = 'admin'
where lower(email) = lower('you@example.com');
```

## Supabase notes

- The `prompt-images` storage bucket is created by the SQL file and is public for reads.
- `SUPABASE_SERVICE_ROLE_KEY` is used only by server actions in the admin dashboard. Never expose it in the browser.
- Public visitors can view approved prompts. Authenticated users can access only their own profile and saved prompt data unless they are admins.
- The app uses `/auth/callback` for email verification, OAuth, and password recovery redirects.
- The protected dashboard lives at `/dashboard`. Legacy `/profile`, `/auth/login`, and `/auth/signup` routes now redirect to the new routes.
- Normal OAuth login uses `/auth/callback` without a query string and lands on `/dashboard`.

## PR3 in progress

This branch is used to complete missing live PromptVault feature parity and production QA fixes.
