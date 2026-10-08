-- Pictures Bucket Creation (public means a picture can be shown by anyone who has its exact address, nobody can list the bucket):
insert into storage.buckets (id, name, public)
values ('pictures', 'pictures', true)
on conflict (id) do nothing;

-- Every member's files live in a folder named after their account id, (storage.foldername(name))[1] is the first folder in a file's path

-- Ensuring each member can only add pictures inside their own folder:
create policy "members add their own pictures" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'pictures' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Ensuring each member can only see their own pictures in listings:
create policy "members see their own pictures" on storage.objects
  for select to authenticated
  using (bucket_id = 'pictures' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Ensuring each member can only delete their own pictures:
create policy "members delete their own pictures" on storage.objects
  for delete to authenticated
  using (bucket_id = 'pictures' and (storage.foldername(name))[1] = (select auth.uid())::text);
