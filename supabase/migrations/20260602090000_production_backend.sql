create extension if not exists "pgcrypto";

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'profile_role'
  ) then
    create type public.profile_role as enum ('admin', 'creator', 'user');
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'prompt_status'
  ) then
    create type public.prompt_status as enum ('pending', 'approved', 'rejected');
  end if;
end
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  display_name text,
  avatar_url text,
  role public.profile_role not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.prompts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 160),
  prompt_text text not null,
  negative_prompt text,
  image_url text not null,
  ai_model text,
  aspect_ratio text,
  category text not null,
  tags text[] not null default '{}',
  status public.prompt_status not null default 'pending',
  rejection_reason text,
  copy_count integer not null default 0 check (copy_count >= 0),
  view_count integer not null default 0 check (view_count >= 0),
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.saved_prompts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  prompt_id uuid not null references public.prompts(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, prompt_id)
);

alter table public.prompts add column if not exists status public.prompt_status not null default 'pending';
alter table public.prompts add column if not exists rejection_reason text;
alter table public.prompts add column if not exists category text;
alter table public.prompts add column if not exists view_count integer not null default 0;
alter table public.prompts add column if not exists featured boolean not null default false;
alter table public.prompts add column if not exists tags text[] not null default '{}';
alter table public.prompts add column if not exists copy_count integer not null default 0;
alter table public.prompts add column if not exists aspect_ratio text;

create index if not exists profiles_role_idx on public.profiles (role);
create index if not exists prompts_status_created_at_idx on public.prompts (status, created_at desc);
create index if not exists prompts_user_id_idx on public.prompts (user_id, created_at desc);
create index if not exists prompts_category_idx on public.prompts (category);
create index if not exists prompts_tags_gin_idx on public.prompts using gin (tags);
create index if not exists saved_prompts_user_id_idx on public.saved_prompts (user_id, created_at desc);
create index if not exists saved_prompts_prompt_id_idx on public.saved_prompts (prompt_id);

do $$
begin
  if to_regclass('public.users') is not null then
    insert into public.profiles (id, email, display_name, avatar_url, role, created_at, updated_at)
    select
      u.id,
      u.email,
      u.display_name,
      u.avatar_url,
      case
        when u.role::text = 'admin' then 'admin'::public.profile_role
        when u.role::text = 'creator' then 'creator'::public.profile_role
        else 'user'::public.profile_role
      end,
      coalesce(u.created_at, now()),
      now()
    from public.users u
    on conflict (id) do update
      set email = excluded.email,
          display_name = coalesce(public.profiles.display_name, excluded.display_name),
          avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url),
          role = excluded.role,
          updated_at = now();
  else
    insert into public.profiles (id, email, display_name, avatar_url, role, created_at, updated_at)
    select
      au.id,
      au.email,
      coalesce(au.raw_user_meta_data->>'display_name', split_part(coalesce(au.email, ''), '@', 1)),
      au.raw_user_meta_data->>'avatar_url',
      'user'::public.profile_role,
      coalesce(au.created_at, now()),
      now()
    from auth.users au
    on conflict (id) do nothing;
  end if;
end
$$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'prompts' and column_name = 'category_id'
  ) and to_regclass('public.categories') is not null then
    update public.prompts p
    set category = c.slug
    from public.categories c
    where p.category_id = c.id
      and (p.category is null or btrim(p.category) = '');
  end if;
end
$$;

update public.prompts
set category = 'general'
where category is null or btrim(category) = '';

alter table public.prompts alter column category set default 'general';
alter table public.prompts alter column category set not null;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'prompts' and column_name = 'visibility'
  ) and exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'prompts' and column_name = 'hidden'
  ) then
    update public.prompts
    set status = 'approved'::public.prompt_status
    where visibility::text = 'public'
      and coalesce(hidden, false) = false
      and status = 'pending'::public.prompt_status;
  end if;
end
$$;

do $$
begin
  if to_regclass('public.favorites') is not null then
    insert into public.saved_prompts (user_id, prompt_id, created_at, updated_at)
    select
      f.user_id,
      f.prompt_id,
      coalesce(f.created_at, now()),
      coalesce(f.created_at, now())
    from public.favorites f
    on conflict (user_id, prompt_id) do nothing;
  end if;
end
$$;

create or replace function public.current_profile_role()
returns public.profile_role
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.profiles
  where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'::public.profile_role
  );
$$;

create or replace function public.is_creator_or_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role in ('creator'::public.profile_role, 'admin'::public.profile_role)
  );
$$;

create or replace function public.handle_new_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url, role, created_at, updated_at)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(coalesce(new.email, ''), '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    'user'::public.profile_role,
    now(),
    now()
  )
  on conflict (id) do update
    set email = excluded.email,
        display_name = coalesce(public.profiles.display_name, excluded.display_name),
        avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url),
        updated_at = now();

  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_prompts_updated_at on public.prompts;
create trigger set_prompts_updated_at
before update on public.prompts
for each row execute function public.set_updated_at();

drop trigger if exists set_saved_prompts_updated_at on public.saved_prompts;
create trigger set_saved_prompts_updated_at
before update on public.saved_prompts
for each row execute function public.set_updated_at();

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute function public.handle_new_profile();

alter table public.profiles enable row level security;
alter table public.prompts enable row level security;
alter table public.saved_prompts enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Admins can manage all profiles" on public.profiles;

create policy "Users can read own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

create policy "Users can update own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (
  auth.uid() = id
  and role = public.current_profile_role()
);

create policy "Admins can manage all profiles"
on public.profiles
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Anyone can view public prompts" on public.prompts;
drop policy if exists "Logged in users create prompts" on public.prompts;
drop policy if exists "Users update own prompts" on public.prompts;
drop policy if exists "Users delete own prompts" on public.prompts;
drop policy if exists "Admins manage prompts" on public.prompts;
drop policy if exists "Public can read approved prompts" on public.prompts;
drop policy if exists "Creators can read own prompts" on public.prompts;
drop policy if exists "Creators can create prompts" on public.prompts;
drop policy if exists "Creators can update own prompts" on public.prompts;
drop policy if exists "Creators can delete own prompts" on public.prompts;
drop policy if exists "Admins can manage all prompts" on public.prompts;

create policy "Public can read approved prompts"
on public.prompts
for select
to anon, authenticated
using (status = 'approved'::public.prompt_status);

create policy "Creators can read own prompts"
on public.prompts
for select
to authenticated
using (auth.uid() = user_id);

create policy "Creators can create prompts"
on public.prompts
for insert
to authenticated
with check (
  auth.uid() = user_id
  and public.is_creator_or_admin()
);

create policy "Creators can update own prompts"
on public.prompts
for update
to authenticated
using (
  auth.uid() = user_id
  and public.is_creator_or_admin()
)
with check (
  auth.uid() = user_id
  and public.is_creator_or_admin()
);

create policy "Creators can delete own prompts"
on public.prompts
for delete
to authenticated
using (
  auth.uid() = user_id
  and public.is_creator_or_admin()
);

create policy "Admins can manage all prompts"
on public.prompts
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Users can read own saved prompts" on public.saved_prompts;
drop policy if exists "Users can save own prompts" on public.saved_prompts;
drop policy if exists "Users can unsave own prompts" on public.saved_prompts;
drop policy if exists "Admins can manage all saved prompts" on public.saved_prompts;

create policy "Users can read own saved prompts"
on public.saved_prompts
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can save own prompts"
on public.saved_prompts
for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.prompts p
    where p.id = prompt_id
      and (
        p.status = 'approved'::public.prompt_status
        or p.user_id = auth.uid()
        or public.is_admin()
      )
  )
);

create policy "Users can unsave own prompts"
on public.saved_prompts
for delete
to authenticated
using (auth.uid() = user_id);

create policy "Admins can manage all saved prompts"
on public.saved_prompts
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
