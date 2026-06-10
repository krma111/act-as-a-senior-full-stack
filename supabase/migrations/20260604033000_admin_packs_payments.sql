do $$
begin
  if not exists (select 1 from pg_type where typname = 'pack_status') then
    create type public.pack_status as enum ('pending', 'approved', 'rejected');
  end if;

  if not exists (select 1 from pg_type where typname = 'payment_status') then
    create type public.payment_status as enum ('pending', 'approved', 'rejected');
  end if;
end $$;

alter table public.prompts add column if not exists price numeric(10,2) not null default 0;

create table if not exists public.prompt_packs (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  cover_image_url text,
  price numeric(10,2) not null default 0,
  currency text not null default 'USD',
  status public.pack_status not null default 'pending',
  rejection_reason text,
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pack_prompts (
  id uuid primary key default gen_random_uuid(),
  pack_id uuid not null references public.prompt_packs(id) on delete cascade,
  prompt_id uuid not null references public.prompts(id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (pack_id, prompt_id)
);

create table if not exists public.payment_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pack_id uuid not null references public.prompt_packs(id) on delete cascade,
  amount numeric(10,2) not null default 0,
  currency text not null default 'USD',
  whatsapp_proof_url text,
  whatsapp_proof_status text not null default 'missing',
  status public.payment_status not null default 'pending',
  rejection_reason text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_pack_access (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pack_id uuid not null references public.prompt_packs(id) on delete cascade,
  granted_by uuid references auth.users(id) on delete set null,
  granted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, pack_id)
);

create index if not exists prompt_packs_creator_status_idx on public.prompt_packs (creator_id, status);
create index if not exists pack_prompts_pack_idx on public.pack_prompts (pack_id);
create index if not exists payment_requests_status_idx on public.payment_requests (status);
create index if not exists payment_requests_user_idx on public.payment_requests (user_id);
create index if not exists user_pack_access_user_pack_idx on public.user_pack_access (user_id, pack_id);

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

drop trigger if exists payment_requests_touch_updated_at on public.payment_requests;
create trigger payment_requests_touch_updated_at
before update on public.payment_requests
for each row execute function public.touch_updated_at();

create or replace function public.prevent_pack_self_approval()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status is distinct from new.status and new.status in ('approved', 'rejected') and auth.uid() = new.creator_id then
    raise exception 'Creators cannot approve or reject their own packs.';
  end if;
  return new;
end;
$$;

drop trigger if exists prevent_pack_self_approval_before_update on public.prompt_packs;
create trigger prevent_pack_self_approval_before_update
before update on public.prompt_packs
for each row execute function public.prevent_pack_self_approval();

alter table public.prompt_packs enable row level security;
alter table public.pack_prompts enable row level security;
alter table public.payment_requests enable row level security;
alter table public.user_pack_access enable row level security;

drop policy if exists "Public can read approved free packs" on public.prompt_packs;
create policy "Public can read approved free packs"
on public.prompt_packs for select
using (status = 'approved'::public.pack_status and price = 0);

drop policy if exists "Buyers can read approved paid packs" on public.prompt_packs;
create policy "Buyers can read approved paid packs"
on public.prompt_packs for select
using (
  status = 'approved'::public.pack_status
  and (
    price = 0
    or creator_id = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.user_pack_access access
      where access.pack_id = prompt_packs.id
        and access.user_id = auth.uid()
    )
  )
);

drop policy if exists "Creators can create own packs" on public.prompt_packs;
create policy "Creators can create own packs"
on public.prompt_packs for insert
with check (auth.uid() = creator_id and public.is_creator_or_admin() and status = 'pending'::public.pack_status);

drop policy if exists "Creators can read own packs" on public.prompt_packs;
create policy "Creators can read own packs"
on public.prompt_packs for select
using (auth.uid() = creator_id);

drop policy if exists "Creators can update own pending packs" on public.prompt_packs;
create policy "Creators can update own pending packs"
on public.prompt_packs for update
using (auth.uid() = creator_id and status <> 'approved'::public.pack_status)
with check (auth.uid() = creator_id and status = 'pending'::public.pack_status);

drop policy if exists "Creators can delete own pending packs" on public.prompt_packs;
create policy "Creators can delete own pending packs"
on public.prompt_packs for delete
using (auth.uid() = creator_id and status <> 'approved'::public.pack_status);

drop policy if exists "Admins can manage all packs" on public.prompt_packs;
create policy "Admins can manage all packs"
on public.prompt_packs for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Pack prompt links visible by pack access" on public.pack_prompts;
create policy "Pack prompt links visible by pack access"
on public.pack_prompts for select
using (
  exists (
    select 1 from public.prompt_packs pack
    where pack.id = pack_prompts.pack_id
      and (
        public.is_admin()
        or pack.creator_id = auth.uid()
        or (pack.status = 'approved'::public.pack_status and pack.price = 0)
        or exists (
          select 1 from public.user_pack_access access
          where access.pack_id = pack.id
            and access.user_id = auth.uid()
        )
      )
  )
);

drop policy if exists "Creators manage own pack prompt links" on public.pack_prompts;
create policy "Creators manage own pack prompt links"
on public.pack_prompts for all
using (
  exists (select 1 from public.prompt_packs pack where pack.id = pack_prompts.pack_id and pack.creator_id = auth.uid())
)
with check (
  exists (select 1 from public.prompt_packs pack where pack.id = pack_prompts.pack_id and pack.creator_id = auth.uid())
);

drop policy if exists "Admins manage all pack prompt links" on public.pack_prompts;
create policy "Admins manage all pack prompt links"
on public.pack_prompts for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Users create own payment requests" on public.payment_requests;
create policy "Users create own payment requests"
on public.payment_requests for insert
with check (auth.uid() = user_id and status = 'pending'::public.payment_status);

drop policy if exists "Users read own payment requests" on public.payment_requests;
create policy "Users read own payment requests"
on public.payment_requests for select
using (auth.uid() = user_id);

drop policy if exists "Admins manage all payment requests" on public.payment_requests;
create policy "Admins manage all payment requests"
on public.payment_requests for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Users read own pack access" on public.user_pack_access;
create policy "Users read own pack access"
on public.user_pack_access for select
using (auth.uid() = user_id);

drop policy if exists "Admins manage all pack access" on public.user_pack_access;
create policy "Admins manage all pack access"
on public.user_pack_access for all
using (public.is_admin())
with check (public.is_admin());

update public.profiles
set role = 'admin'::public.profile_role,
    updated_at = now()
where lower(email) = lower('cdubey159@gmail.com');

drop policy if exists "Public can read approved prompts" on public.prompts;
create policy "Public can read approved prompts"
on public.prompts for select
using (
  status = 'approved'::public.prompt_status
  and not exists (
    select 1
    from public.pack_prompts link
    join public.prompt_packs pack on pack.id = link.pack_id
    where link.prompt_id = prompts.id
      and pack.status = 'approved'::public.pack_status
      and pack.price > 0
      and (auth.uid() is null or pack.creator_id <> auth.uid())
      and not public.is_admin()
      and not exists (
        select 1
        from public.user_pack_access access
        where access.pack_id = pack.id
          and access.user_id = auth.uid()
      )
  )
);
