# PromptHub

A production-ready Next.js, TypeScript, Tailwind CSS, and Supabase website for sharing text-to-image prompts with example images.

## Features

- Dark premium prompt marketplace UI with search, categories, trending, latest, empty states, and responsive image grids
- Supabase email/password auth with profile pages and creator pages
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
```

3. In Supabase SQL Editor, run `supabase/schema.sql`.

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

6. Sign up with the admin email. The auth trigger assigns that account the `admin` role automatically.

7. If the admin user already existed before step 4, set the role manually once:

```sql
update public.users
set role = 'admin'
where lower(email) = lower('you@example.com');
```

## Supabase notes

- The `prompt-images` storage bucket is created by the SQL file and is public for reads.
- `SUPABASE_SERVICE_ROLE_KEY` is used only by server actions in the admin dashboard. Never expose it in the browser.
- Public visitors can view public, non-hidden prompts. Authenticated users can create prompts and manage their own prompts/favorites/reports. Admins can manage all records.

## PR3 in progress

This branch is used to complete missing live PromptVault feature parity and production QA fixes.
