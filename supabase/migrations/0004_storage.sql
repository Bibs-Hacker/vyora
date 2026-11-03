-- VYORA: storage buckets + policies.
-- Buckets are public-read for display; writes are restricted to the owner's
-- own folder ({user_id}/...). File type/size limits are enforced here and
-- re-checked in the client before upload.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 5242880, array['image/png','image/jpeg','image/webp']),
  ('covers',  'covers',  true, 8388608, array['image/png','image/jpeg','image/webp']),
  ('posts',   'posts',   true, 10485760, array['image/png','image/jpeg','image/webp','image/gif']),
  ('stories', 'stories', true, 20971520, array['image/png','image/jpeg','image/webp','video/mp4']),
  ('messages','messages',true, 10485760, array['image/png','image/jpeg','image/webp'])
on conflict (id) do nothing;

-- Generic read for public buckets
create policy "vyora public read" on storage.objects for select
  using (bucket_id in ('avatars','covers','posts','stories','messages'));

-- Owner-scoped writes: first path segment must equal the caller's uid
create policy "vyora owner insert" on storage.objects for insert to authenticated
  with check (
    bucket_id in ('avatars','covers','posts','stories','messages')
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "vyora owner update" on storage.objects for update to authenticated
  using (bucket_id in ('avatars','covers','posts','stories','messages')
         and (storage.foldername(name))[1] = auth.uid()::text);
create policy "vyora owner delete" on storage.objects for delete to authenticated
  using (bucket_id in ('avatars','covers','posts','stories','messages')
         and (storage.foldername(name))[1] = auth.uid()::text);
