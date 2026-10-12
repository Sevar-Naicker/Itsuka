-- Share Key Column Addition (empty means the shelf is private, a long random key means anyone with the shelf's link can look at it, the website makes the key):
alter table public.sections
  add column share_key text unique
  check (share_key is null or share_key ~ '^[A-Za-z0-9_-]{24,64}$');

-- Shared Shelf Function (hands out one shared shelf by its key: its name, its books and the first name of its owner, never their email, account or other shelves):
create or replace function public.shared_shelf(key text)
returns json
language sql
stable
security definer
set search_path = ''
as $$
  select json_build_object(
    'name',    s.name,
    'sort_by', s.sort_by,
    'owner',   nullif(split_part(trim(coalesce(u.raw_user_meta_data ->> 'name', '')), ' ', 1), ''),
    'books',   coalesce((
      select json_agg(json_build_object(
               'id', b.id, 'name', b.name, 'link', b.link, 'notes', b.notes, 'picture', b.picture, 'added', b.created_at)
             order by b.position)
      from public.books b
      where b.section_id = s.id and b.member_id = s.member_id), '[]'::json)
  )
  from public.sections s
  join auth.users u on u.id = s.member_id
  where s.share_key = key;
$$;

-- Shared Picture Check (true only for a picture that belongs to a book on a shelf that is shared right now):
create or replace function public.picture_is_shared(path text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.books b
    join public.sections s on s.id = b.section_id
    where b.picture = path and b.picture <> '' and s.share_key is not null);
$$;

-- Allowing visitors, signed in or not, to use the two functions and nothing else:
revoke all on function public.shared_shelf(text) from public;
revoke all on function public.picture_is_shared(text) from public;
grant execute on function public.shared_shelf(text) to anon, authenticated;
grant execute on function public.picture_is_shared(text) to anon, authenticated;

-- Ensuring the pictures on a shared shelf can be seen by whoever has the shelf's link, every other picture stays private:
create policy "anyone sees pictures on shared shelves" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'pictures' and public.picture_is_shared(name));
