drop policy if exists "Public read approved free prompt packs" on public.prompt_packs;
drop policy if exists "Buyers read approved paid prompt packs" on public.prompt_packs;
drop policy if exists "Public can read approved free packs" on public.prompt_packs;
drop policy if exists "Buyers can read approved paid packs" on public.prompt_packs;
drop policy if exists "Public read approved prompt packs" on public.prompt_packs;

create policy "Public read approved prompt packs"
on public.prompt_packs
for select
to anon, authenticated
using (status = 'approved');

drop policy if exists "Users create own payment requests" on public.payment_requests;

create policy "Users create own payment requests"
on public.payment_requests
for insert
to authenticated
with check (
  auth.uid() = user_id
  and status = 'pending'::public.payment_status
  and exists (
    select 1
    from public.prompt_packs pack
    where pack.id = payment_requests.pack_id
      and pack.status = 'approved'
      and coalesce(pack.is_paid, pack.price > 0, false) = true
      and payment_requests.amount = pack.price
  )
  and not exists (
    select 1
    from public.user_pack_access access
    where access.user_id = auth.uid()
      and access.pack_id = payment_requests.pack_id
  )
);

create index if not exists prompt_packs_public_marketplace_idx
on public.prompt_packs (status, is_paid, price, created_at desc);

select pg_notify('pgrst', 'reload schema');
