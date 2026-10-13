-- This file sets up everything Itsuka needs in a new, empty Supabase project. Run it once in the SQL Editor, the live project already has all of it
-- Every row remembers which member it belongs to. "default auth.uid()" fills that in automatically with whoever is signed in when the row is saved

-- Sections Table Creation (position decides the order of the sections, sort_by how a shelf keeps its books in order and share_key turns on the shelf's share link):
create table public.sections
(
  id         uuid primary key default gen_random_uuid(),
  member_id  uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now(),
  position   double precision not null default extract(epoch from now()),
  sort_by    text not null default '' check (sort_by in ('', 'name', 'newest', 'oldest')),
  share_key  text unique check (share_key is null or share_key ~ '^[A-Za-z0-9_-]{24,64}$'),
  constraint sections_name_length check (char_length(name) <= 100)
);

-- Books Table Creation (done turns true when the member ticks Done, position decides where a book stands on its shelf, opened_at is when it was last opened so it can gather dust):
create table public.books
(
  id         uuid primary key default gen_random_uuid(),
  member_id  uuid not null default auth.uid() references auth.users (id) on delete cascade,
  section_id uuid not null references public.sections (id) on delete cascade,
  name       text not null,
  link       text not null default '',
  notes      text not null default '',
  picture    text not null default '',
  created_at timestamptz not null default now(),
  done       boolean not null default false,
  position   double precision not null default extract(epoch from now()),
  opened_at  timestamptz,
  constraint books_name_length    check (char_length(name) <= 200),
  constraint books_link_length    check (char_length(link) <= 2000),
  constraint books_notes_length   check (char_length(notes) <= 10000),
  constraint books_picture_length check (char_length(picture) <= 300)
);

-- Addition of Books Section Index to Books:
create index books_section_idx on public.books (section_id);

-- Granting of access to authenticated members to see their tables through the website, Supabase hides tables from websites until this step:
grant select, insert, update, delete on public.sections to authenticated;
grant select, insert, update, delete on public.books    to authenticated;

-- Ensuring each member only ever sees and changes their own rows:
alter table public.sections enable row level security;
alter table public.books    enable row level security;

-- Ensuring that each member's shelves are private, despite all records being stored in the same two tables:
create policy "members manage their own sections" on public.sections
  for all to authenticated
  using (member_id = (select auth.uid()))
  with check (member_id = (select auth.uid()));

create policy "members manage their own books" on public.books
  for all to authenticated
  using (member_id = (select auth.uid()))
  with check (member_id = (select auth.uid()));

-- Pictures Bucket Creation (private, so a picture is only handed to the member it belongs to, no file over 5 MB and pictures only):
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('pictures', 'pictures', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Every member's files live in a folder named after their account id, (storage.foldername(name))[1] is the first folder in a file's path

-- Ensuring each member can only add pictures inside their own folder:
create policy "members add their own pictures" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'pictures' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Ensuring each member can only see their own pictures:
create policy "members see their own pictures" on storage.objects
  for select to authenticated
  using (bucket_id = 'pictures' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Ensuring each member can only delete their own pictures:
create policy "members delete their own pictures" on storage.objects
  for delete to authenticated
  using (bucket_id = 'pictures' and (storage.foldername(name))[1] = (select auth.uid())::text);

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

-- Delete My Account Function (deletes the signed-in member, the database then removes their sections and books with them, the website deletes their pictures first):
-- The website first calls it with any other word to check it is set up, only the word DELETE deletes the account
create or replace function public.delete_my_account(confirm text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  if confirm is distinct from 'DELETE' then
    return false;
  end if;
  delete from auth.users where id = auth.uid();
  return true;
end;
$$;

-- Allowing only signed-in members to use it, and only on their own account:
revoke all on function public.delete_my_account(text) from public;
grant execute on function public.delete_my_account(text) to authenticated;