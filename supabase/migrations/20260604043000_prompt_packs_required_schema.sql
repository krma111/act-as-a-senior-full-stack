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
  created_at timestamp default now(),
  updated_at timestamp default now()
);

alter table public.prompt_packs add column if not exists creator_id uuid;
alter table public.prompt_packs add column if not exists creator_name text;
alter table public.prompt_packs add column if not exists title text;
alter table public.prompt_packs add column if not exists description text;
alter table public.prompt_packs add column if not exists cover_image text;
alter table public.prompt_packs add column if not exists price numeric default 0;
alter table public.prompt_packs add column if not exists is_paid boolean default false;
alter table public.prompt_packs add column if not exists status text default 'pending';
alter table public.prompt_packs add column if not exists rejection_reason text;
alter table public.prompt_packs add column if not exists total_prompts integer default 0;
alter table public.prompt_packs add column if not exists created_at timestamp default now();
alter table public.prompt_packs add column if not exists updated_at timestamp default now();

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'prompt_packs'
      and column_name = 'cover_image_url'
  ) then
    update public.prompt_packs
    set cover_image = coalesce(cover_image, cover_image_url);
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'prompt_packs'
      and column_name = 'currency'
  ) then
    update public.prompt_packs set is_paid = coalesce(is_paid, price > 0);
  end if;

  begin
    alter table public.prompt_packs alter column creator_id drop not null;
  exception when undefined_column then
    null;
  end;

  begin
    alter table public.prompt_packs alter column status type text using status::text;
  exception when others then
    null;
  end;
end $$;

alter table public.prompt_packs alter column title set not null;
alter table public.prompt_packs alter column price set default 0;
alter table public.prompt_packs alter column is_paid set default false;
alter table public.prompt_packs alter column status set default 'pending';
alter table public.prompt_packs alter column total_prompts set default 0;
alter table public.prompt_packs alter column created_at set default now();
alter table public.prompt_packs alter column updated_at set default now();

create index if not exists prompt_packs_status_idx on public.prompt_packs (status);
create index if not exists prompt_packs_creator_id_idx on public.prompt_packs (creator_id);
create index if not exists prompt_packs_created_at_idx on public.prompt_packs (created_at desc);

alter table public.prompt_packs enable row level security;

drop policy if exists "Admins full access prompt packs" on public.prompt_packs;
create policy "Admins full access prompt packs"
on public.prompt_packs for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Creators create prompt packs" on public.prompt_packs;
create policy "Creators create prompt packs"
on public.prompt_packs for insert
with check (auth.uid() = creator_id and status = 'pending');

drop policy if exists "Creators read own prompt packs" on public.prompt_packs;
create policy "Creators read own prompt packs"
on public.prompt_packs for select
using (auth.uid() = creator_id);

drop policy if exists "Creators update own pending prompt packs" on public.prompt_packs;
create policy "Creators update own pending prompt packs"
on public.prompt_packs for update
using (auth.uid() = creator_id and status <> 'approved')
with check (auth.uid() = creator_id and status = 'pending');

drop policy if exists "Public read approved free prompt packs" on public.prompt_packs;
create policy "Public read approved free prompt packs"
on public.prompt_packs for select
using (status = 'approved' and is_paid = false);

update public.profiles
set role = 'admin'::public.profile_role,
    updated_at = now()
where lower(email) = lower('cdubey159@gmail.com');
