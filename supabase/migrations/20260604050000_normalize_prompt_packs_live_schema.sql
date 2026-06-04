drop policy if exists "Public can read approved free packs" on public.prompt_packs;
drop policy if exists "Buyers can read approved paid packs" on public.prompt_packs;
drop policy if exists "Creators can create own packs" on public.prompt_packs;
drop policy if exists "Creators can read own packs" on public.prompt_packs;
drop policy if exists "Creators can update own pending packs" on public.prompt_packs;
drop policy if exists "Creators can delete own pending packs" on public.prompt_packs;
drop policy if exists "Admins can manage all packs" on public.prompt_packs;
drop policy if exists "Admins full access prompt packs" on public.prompt_packs;
drop policy if exists "Creators create prompt packs" on public.prompt_packs;
drop policy if exists "Creators read own prompt packs" on public.prompt_packs;
drop policy if exists "Creators update own pending prompt packs" on public.prompt_packs;
drop policy if exists "Public read approved free prompt packs" on public.prompt_packs;

drop policy if exists "Pack prompt links visible by pack access" on public.pack_prompts;
drop policy if exists "Creators manage own pack prompt links" on public.pack_prompts;
drop policy if exists "Admins manage all pack prompt links" on public.pack_prompts;

drop policy if exists "Public can read approved prompts" on public.prompts;

alter table public.prompt_packs alter column status drop default;
alter table public.prompt_packs alter column status type text using status::text;
alter table public.prompt_packs alter column status set default 'pending';
alter table public.prompt_packs alter column price set default 0;
alter table public.prompt_packs alter column is_paid set default false;
alter table public.prompt_packs alter column total_prompts set default 0;
alter table public.prompt_packs alter column creator_id drop not null;

create policy "Admins full access prompt packs"
on public.prompt_packs for all
using (public.is_admin())
with check (public.is_admin());

create policy "Creators create prompt packs"
on public.prompt_packs for insert
with check (auth.uid() = creator_id and status = 'pending');

create policy "Creators read own prompt packs"
on public.prompt_packs for select
using (auth.uid() = creator_id);

create policy "Creators update own pending prompt packs"
on public.prompt_packs for update
using (auth.uid() = creator_id and status <> 'approved')
with check (auth.uid() = creator_id and status = 'pending');

create policy "Creators delete own pending prompt packs"
on public.prompt_packs for delete
using (auth.uid() = creator_id and status <> 'approved');

create policy "Public read approved free prompt packs"
on public.prompt_packs for select
using (status = 'approved' and coalesce(is_paid, price > 0, false) = false);

create policy "Buyers read approved paid prompt packs"
on public.prompt_packs for select
using (
  status = 'approved'
  and (
    coalesce(is_paid, price > 0, false) = false
    or creator_id = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.user_pack_access access
      where access.pack_id = prompt_packs.id
        and access.user_id = auth.uid()
    )
  )
);

create policy "Pack prompt links visible by pack access"
on public.pack_prompts for select
using (
  exists (
    select 1 from public.prompt_packs pack
    where pack.id = pack_prompts.pack_id
      and (
        public.is_admin()
        or pack.creator_id = auth.uid()
        or (pack.status = 'approved' and coalesce(pack.is_paid, pack.price > 0, false) = false)
        or exists (
          select 1 from public.user_pack_access access
          where access.pack_id = pack.id
            and access.user_id = auth.uid()
        )
      )
  )
);

create policy "Creators manage own pack prompt links"
on public.pack_prompts for all
using (
  exists (select 1 from public.prompt_packs pack where pack.id = pack_prompts.pack_id and pack.creator_id = auth.uid())
)
with check (
  exists (select 1 from public.prompt_packs pack where pack.id = pack_prompts.pack_id and pack.creator_id = auth.uid())
);

create policy "Admins manage all pack prompt links"
on public.pack_prompts for all
using (public.is_admin())
with check (public.is_admin());

create policy "Public can read approved prompts"
on public.prompts for select
using (
  status = 'approved'::public.prompt_status
  and not exists (
    select 1
    from public.pack_prompts link
    join public.prompt_packs pack on pack.id = link.pack_id
    where link.prompt_id = prompts.id
      and pack.status = 'approved'
      and coalesce(pack.is_paid, pack.price > 0, false) = true
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

select pg_notify('pgrst', 'reload schema');
