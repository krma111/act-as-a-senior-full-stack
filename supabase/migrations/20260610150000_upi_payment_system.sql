-- Add new enum values for payment_status
ALTER TYPE public.payment_status ADD VALUE IF NOT EXISTS 'submitted' BEFORE 'approved';
ALTER TYPE public.payment_status ADD VALUE IF NOT EXISTS 'access_sent' AFTER 'approved';

-- Add UPI-specific columns to payment_requests
ALTER TABLE public.payment_requests ADD COLUMN IF NOT EXISTS order_id text UNIQUE;
ALTER TABLE public.payment_requests ADD COLUMN IF NOT EXISTS user_email text;
ALTER TABLE public.payment_requests ADD COLUMN IF NOT EXISTS screenshot_url text;
ALTER TABLE public.payment_requests ADD COLUMN IF NOT EXISTS screenshot_status text DEFAULT 'missing';
ALTER TABLE public.payment_requests ADD COLUMN IF NOT EXISTS access_link text;
ALTER TABLE public.payment_requests ADD COLUMN IF NOT EXISTS access_sent_at timestamptz;

-- Create screenshots bucket for payment proof uploads
insert into storage.buckets (id, name, public)
values ('payment-screenshots', 'payment-screenshots', true)
on conflict (id) do nothing;

-- Allow public read access to screenshots
create policy "Screenshots are publicly viewable"
on storage.objects for select
using (bucket_id = 'payment-screenshots');

-- Allow authenticated users to upload screenshots
create policy "Users can upload their own screenshots"
on storage.objects for insert
with check (
  bucket_id = 'payment-screenshots'
  and auth.role() = 'authenticated'
);

-- Allow users to update their own screenshots
create policy "Users can update their own screenshots"
on storage.objects for update
using (
  bucket_id = 'payment-screenshots'
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow admins to delete any screenshot
create policy "Admins can delete any screenshot"
on storage.objects for delete
using (
  bucket_id = 'payment-screenshots'
  and (
    auth.uid()::text = (storage.foldername(name))[1]
    or exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  )
);
