insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'prompt-images',
  'prompt-images',
  true,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set public = true,
    file_size_limit = 8388608,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

alter table public.prompts
  alter column image_url drop not null;

drop policy if exists "Public can read prompt images" on storage.objects;
drop policy if exists "Authenticated users can upload prompt images" on storage.objects;
drop policy if exists "Authenticated users can update own prompt images" on storage.objects;
drop policy if exists "Authenticated users can delete own prompt images" on storage.objects;
drop policy if exists "Users can upload own prompt images" on storage.objects;
drop policy if exists "Users update own prompt images" on storage.objects;
drop policy if exists "Users delete own prompt images or admins delete all" on storage.objects;

create policy "Public can read prompt images"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'prompt-images');

create policy "Authenticated users can upload prompt images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'prompt-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Authenticated users can update own prompt images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'prompt-images'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'prompt-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Authenticated users can delete own prompt images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'prompt-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "Authenticated users can create own prompts" on public.prompts;
drop policy if exists "Authenticated users can update own prompts" on public.prompts;
drop policy if exists "Authenticated users can delete own prompts" on public.prompts;

create policy "Authenticated users can create own prompts"
on public.prompts
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Authenticated users can update own prompts"
on public.prompts
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Authenticated users can delete own prompts"
on public.prompts
for delete
to authenticated
using (auth.uid() = user_id);
