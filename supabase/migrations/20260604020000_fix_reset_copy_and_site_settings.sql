create table if not exists public.site_settings (
  id integer primary key default 1 check (id = 1),
  website_name text not null default 'PromptVault',
  logo_text text not null default 'PromptVault',
  hero_headline text not null default 'Discover and share powerful AI image prompts',
  hero_subheadline text not null default 'Browse battle-tested prompts, save favorites, and publish your best image generations.',
  footer_text text not null default 'Copyright 2026 PromptVault. All rights reserved.',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.site_settings (id)
values (1)
on conflict (id) do nothing;

alter table public.site_settings enable row level security;

drop policy if exists "Public can read site settings" on public.site_settings;
drop policy if exists "Admins can update site settings" on public.site_settings;
drop policy if exists "Admins can insert site settings" on public.site_settings;

create policy "Public can read site settings"
on public.site_settings
for select
to anon, authenticated
using (true);

create policy "Admins can update site settings"
on public.site_settings
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can insert site settings"
on public.site_settings
for insert
to authenticated
with check (public.is_admin());

create or replace function public.increment_prompt_copy_count(prompt_uuid uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count integer;
begin
  update public.prompts
  set copy_count = coalesce(copy_count, 0) + 1
  where id = prompt_uuid
    and status = 'approved'::public.prompt_status
  returning copy_count into new_count;

  if new_count is null then
    select copy_count into new_count
    from public.prompts
    where id = prompt_uuid;
  end if;

  return coalesce(new_count, 0);
end;
$$;

grant execute on function public.increment_prompt_copy_count(uuid) to anon, authenticated;
