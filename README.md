# PromptVault

PromptVault is a simplified no-login coding prompt pack store for vibe coders.

Users browse free and premium coding prompt packs. Free prompts can be copied immediately. Premium packs use a manual UPI checkout flow: the buyer enters an email, pays with QR/UPI, sends the payment screenshot by email, and the admin delivers the full pack after verification.

## MVP Features

- Public homepage with premium glassmorphism UI
- Prompt pack listing at `/packs`
- Prompt pack detail pages at `/packs/[slug]`
- Free prompt copy buttons
- Premium locked content previews
- No user login required for purchases
- No creator dashboard or upload flow
- Manual UPI payment checkout modal
- Order creation with buyer email and pending payment status
- Admin dashboard for pack CRUD, order status management, and store settings
- Optional Resend delivery when `RESEND_API_KEY` is configured
- Supabase backend with simple `prompt_packs`, `orders`, and `site_settings` tables

## Environment Variables

Create `.env.local` from `.env.example`:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
RESEND_API_KEY=
GEMINI_API_KEY=
```

Required for production:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Optional:

- `RESEND_API_KEY` sends full prompt packs automatically when admin marks an order delivered. If missing, admin can copy the generated email template manually.
- `GEMINI_API_KEY` is not required for the MVP storefront.

Never expose `SUPABASE_SERVICE_ROLE_KEY` or `RESEND_API_KEY` in client code.

## Database Setup

Run migrations in Supabase SQL Editor or with Supabase CLI. The MVP migration is:

```text
supabase/migrations/20260611090000_coding_prompt_pack_mvp.sql
```

It safely adds/updates:

- `prompt_packs`
- `orders`
- `site_settings`
- indexes
- RLS policies
- starter approved prompt pack content

The migration is additive and does not delete old production data.

## Admin Setup

Admin access still uses the existing Supabase admin role protection.

1. Create or sign in with your admin account.
2. In Supabase SQL Editor, set the admin role:

```sql
update public.profiles
set role = 'admin'
where lower(email) = lower('cdubey159@gmail.com');
```

3. Open `/admin`.

Admin can:

- Add/edit/delete prompt packs
- Set packs to `pending`, `approved`, or `rejected`
- View buyer orders
- Mark orders as `pending_payment`, `paid`, `delivered`, or `cancelled`
- Send delivery email when Resend is configured
- Copy manual email templates when Resend is not configured
- Update admin email, UPI ID, QR code URL, homepage text, and categories

## Local Development

```bash
pnpm install
pnpm run dev
```

Or with npm:

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

## Build Test

```bash
pnpm run lint
pnpm run typecheck
pnpm run build
```

## Vercel Deployment

Set the required environment variables in Vercel Production and Preview:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL=https://promptvault-ai-rho.vercel.app`
- `RESEND_API_KEY` optional

Vercel build command:

```bash
pnpm run build
```

After push to `main`, Vercel should auto-deploy from GitHub.
