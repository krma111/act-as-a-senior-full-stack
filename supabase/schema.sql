create extension if not exists "pgcrypto";

create type public.user_role as enum ('user', 'admin');
create type public.prompt_visibility as enum ('public', 'private');

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  display_name text,
  avatar_url text,
  role public.user_role not null default 'user',
  created_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  created_at timestamptz not null default now()
);

create table public.prompts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  title text not null check (char_length(title) between 3 and 120),
  prompt_text text not null check (char_length(prompt_text) >= 10),
  negative_prompt text,
  image_url text not null,
  ai_model text not null,
  visibility public.prompt_visibility not null default 'public',
  tags text[] not null default '{}',
  copy_count integer not null default 0,
  like_count integer not null default 0,
  featured boolean not null default false,
  hidden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  prompt_id uuid not null references public.prompts(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, prompt_id)
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  prompt_id uuid not null references public.prompts(id) on delete cascade,
  reason text not null,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

create table public.site_settings (
  id integer primary key default 1 check (id = 1),
  website_name text not null default 'PromptHub',
  logo_text text not null default 'PromptHub',
  hero_headline text not null default 'Discover and share powerful AI image prompts',
  hero_subheadline text not null default 'Browse battle-tested prompts, save favorites, and publish your best image generations.',
  footer_text text not null default 'PromptHub is a free community library for AI image prompt creators.',
  admin_email text not null,
  updated_at timestamptz not null default now()
);

create index prompts_search_idx on public.prompts using gin (
  to_tsvector('english', title || ' ' || prompt_text || ' ' || ai_model || ' ' || array_to_string(tags, ' '))
);
create index prompts_tags_idx on public.prompts using gin (tags);
create index prompts_public_idx on public.prompts (visibility, hidden, created_at desc);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.users
    where id = auth.uid()
      and role = 'admin'
      and lower(email) = lower((select admin_email from public.site_settings where id = 1))
  );
$$;

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.users where id = auth.uid();
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  configured_admin_email text;
begin
  select admin_email into configured_admin_email from public.site_settings where id = 1;

  insert into public.users (id, email, display_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    case when lower(new.email) = lower(configured_admin_email) then 'admin'::public.user_role else 'user'::public.user_role end
  )
  on conflict (id) do update
    set email = excluded.email,
        display_name = coalesce(public.users.display_name, excluded.display_name),
        role = case when lower(excluded.email) = lower(configured_admin_email) then 'admin'::public.user_role else public.users.role end;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.increment_prompt_copy_count(prompt_uuid uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.prompts
  set copy_count = copy_count + 1
  where id = prompt_uuid
    and visibility = 'public'
    and hidden = false;
end;
$$;

create or replace function public.sync_prompt_like_count(prompt_uuid uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.prompts
  set like_count = (select count(*) from public.favorites where prompt_id = prompt_uuid)
  where id = prompt_uuid;
end;
$$;

create or replace function public.protect_prompt_admin_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    new.featured = old.featured;
    new.hidden = old.hidden;
  end if;
  return new;
end;
$$;

create trigger protect_prompt_admin_fields_before_update
before update on public.prompts
for each row execute procedure public.protect_prompt_admin_fields();

alter table public.users enable row level security;
alter table public.categories enable row level security;
alter table public.prompts enable row level security;
alter table public.favorites enable row level security;
alter table public.reports enable row level security;
alter table public.site_settings enable row level security;

create policy "Users are visible to authenticated users and public prompt joins"
on public.users for select
using (
  auth.role() = 'authenticated'
  or public.is_admin()
  or exists (
    select 1 from public.prompts
    where prompts.user_id = users.id
      and prompts.visibility = 'public'
      and prompts.hidden = false
  )
);

create policy "Users can update their own profile"
on public.users for update
using (auth.uid() = id)
with check (auth.uid() = id and role = public.current_user_role());

create policy "Admins can manage users"
on public.users for all
using (public.is_admin())
with check (public.is_admin());

create policy "Anyone can read categories"
on public.categories for select
using (true);

create policy "Admins manage categories"
on public.categories for all
using (public.is_admin())
with check (public.is_admin());

create policy "Anyone can view public prompts"
on public.prompts for select
using ((visibility = 'public' and hidden = false) or auth.uid() = user_id or public.is_admin());

create policy "Logged in users create prompts"
on public.prompts for insert
with check (auth.uid() = user_id);

create policy "Users update own prompts"
on public.prompts for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users delete own prompts"
on public.prompts for delete
using (auth.uid() = user_id);

create policy "Admins manage prompts"
on public.prompts for all
using (public.is_admin())
with check (public.is_admin());

create policy "Users read own favorites"
on public.favorites for select
using (auth.uid() = user_id or public.is_admin());

create policy "Users create own favorites"
on public.favorites for insert
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.prompts
    where prompts.id = prompt_id
      and (prompts.visibility = 'public' or prompts.user_id = auth.uid())
      and prompts.hidden = false
  )
);

create policy "Users delete own favorites"
on public.favorites for delete
using (auth.uid() = user_id);

create policy "Users create reports"
on public.reports for insert
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.prompts
    where prompts.id = prompt_id
      and prompts.visibility = 'public'
      and prompts.hidden = false
  )
);

create policy "Admins read and manage reports"
on public.reports for all
using (public.is_admin())
with check (public.is_admin());

create policy "Anyone can read site settings"
on public.site_settings for select
using (true);

create policy "Admins update site settings"
on public.site_settings for all
using (public.is_admin())
with check (public.is_admin());

insert into public.site_settings (id, admin_email)
values (1, 'you@example.com')
on conflict (id) do nothing;

insert into public.categories (name, slug, description) values
  ('Portraits', 'portraits', 'Character, fashion, editorial, and profile prompts'),
  ('Products', 'products', 'Commercial product shots and advertising visuals'),
  ('Architecture', 'architecture', 'Interior, exterior, and spatial concept prompts'),
  ('Fantasy', 'fantasy', 'Worldbuilding, creatures, heroes, and magical scenes'),
  ('Cinematic', 'cinematic', 'Film stills, lighting setups, and mood-rich scenes')
on conflict (slug) do nothing;

insert into storage.buckets (id, name, public)
values ('prompt-images', 'prompt-images', true)
on conflict (id) do nothing;

create policy "Anyone can view prompt images"
on storage.objects for select
using (bucket_id = 'prompt-images');

create policy "Users upload own prompt images"
on storage.objects for insert
with check (
  bucket_id = 'prompt-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users update own prompt images"
on storage.objects for update
using (
  bucket_id = 'prompt-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users delete own prompt images or admins delete all"
on storage.objects for delete
using (
  bucket_id = 'prompt-images'
  and (auth.uid()::text = (storage.foldername(name))[1] or public.is_admin())
);
