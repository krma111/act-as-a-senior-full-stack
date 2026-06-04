create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  prompt_id uuid not null references public.prompts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null check (char_length(reason) between 3 and 1000),
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists reports_prompt_id_idx on public.reports (prompt_id);
create index if not exists reports_user_id_idx on public.reports (user_id, created_at desc);
create index if not exists reports_status_created_at_idx on public.reports (status, created_at desc);

alter table public.reports enable row level security;

drop trigger if exists set_reports_updated_at on public.reports;
create trigger set_reports_updated_at
before update on public.reports
for each row execute function public.set_updated_at();

drop policy if exists "Users can create own reports" on public.reports;
drop policy if exists "Users can read own reports" on public.reports;
drop policy if exists "Admins can manage all reports" on public.reports;

create policy "Users can create own reports"
on public.reports
for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.prompts prompt
    where prompt.id = prompt_id
      and prompt.status = 'approved'::public.prompt_status
  )
);

create policy "Users can read own reports"
on public.reports
for select
to authenticated
using (auth.uid() = user_id);

create policy "Admins can manage all reports"
on public.reports
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

select pg_notify('pgrst', 'reload schema');
