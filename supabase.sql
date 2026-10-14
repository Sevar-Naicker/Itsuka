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

-- Joint shelves: a shelf its owner shares with up to four other members, who can add, move and tick off books on it


-- Invite Key Column Addition (empty means nobody can join the shelf, a long random key means anyone with the invite link can):
alter table public.sections
  add column invite_key text unique
  check (invite_key is null or invite_key ~ '^[A-Za-z0-9_-]{24,64}$');

-- Added By Column Addition (who put a book on the shelf, it empties if their account is deleted but the book stays):
alter table public.books
  add column added_by uuid references auth.users (id) on delete set null default auth.uid();

-- Shelf Members Table Creation (one row per person who joined someone else's shelf, with their own place for it among their plaques and their own sort):
create table public.shelf_members
(
  section_id uuid not null references public.sections (id) on delete cascade,
  member_id  uuid not null default auth.uid() references auth.users (id) on delete cascade,
  joined_at  timestamptz not null default now(),
  position   double precision not null default extract(epoch from now()),
  sort_by    text not null default '' check (sort_by in ('', 'name', 'newest', 'oldest')),
  primary key (section_id, member_id)
);

-- Addition of a Members Index for finding someone's joint shelves:
create index shelf_members_member_idx on public.shelf_members (member_id);

-- Owns Shelf Check (true when the signed-in member owns the shelf):
create or replace function public.owns_shelf(shelf uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.sections s where s.id = shelf and s.member_id = auth.uid());
$$;

-- On Shelf Check (true when the signed-in member owns the shelf or has joined it):
create or replace function public.on_shelf(shelf uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.sections s where s.id = shelf and s.member_id = auth.uid())
      or exists (select 1 from public.shelf_members m where m.section_id = shelf and m.member_id = auth.uid());
$$;

-- Book Owner Setting (a book always belongs to the owner of the shelf it is on, and remembers who added it):
create or replace function public.book_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.added_by := coalesce(auth.uid(), new.added_by);
  end if;
  if tg_op = 'INSERT' or new.section_id is distinct from old.section_id then
    select s.member_id into new.member_id from public.sections s where s.id = new.section_id;
  end if;
  return new;
end;
$$;

create trigger books_owner
  before insert or update on public.books
  for each row execute function public.book_owner();

-- Book Change Check (on a joint shelf anyone can move a book, tick it done or open it, only its owner and whoever added it can change what it says or move it to another shelf):
create or replace function public.book_change_check()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or auth.uid() = old.member_id or auth.uid() = old.added_by then
    return new;
  end if;
  if new.name is distinct from old.name or new.link is distinct from old.link or new.notes is distinct from old.notes
     or new.picture is distinct from old.picture or new.section_id is distinct from old.section_id then
    raise exception 'Only the shelf owner and whoever added this book can change it';
  end if;
  return new;
end;
$$;

create trigger books_change_check
  before update on public.books
  for each row execute function public.book_change_check();

-- Granting of access to authenticated members to see and change their joint shelf rows through the website:
grant select, insert, update, delete on public.shelf_members to authenticated;

-- Ensuring each member can only see the people on shelves they are on, and only change or remove their own row (or anyone, on a shelf they own):
alter table public.shelf_members enable row level security;

create policy "members see the people on their shelves" on public.shelf_members
  for select to authenticated
  using (public.on_shelf(section_id));

create policy "members change their own place and sort" on public.shelf_members
  for update to authenticated
  using (member_id = (select auth.uid()))
  with check (member_id = (select auth.uid()));

create policy "members leave and owners remove" on public.shelf_members
  for delete to authenticated
  using (member_id = (select auth.uid()) or public.owns_shelf(section_id));

-- Ensuring people on a joint shelf can see it, only its owner can rename, share or delete it (the owner's own policy already covers that):
create policy "members see the joint shelves they are on" on public.sections
  for select to authenticated
  using (public.on_shelf(id));

-- Ensuring people on a joint shelf can see, add, move and tick its books, and delete the ones they added:
create policy "members see books on their joint shelves" on public.books
  for select to authenticated
  using (public.on_shelf(section_id));

create policy "members add books to their joint shelves" on public.books
  for insert to authenticated
  with check (public.on_shelf(section_id) and added_by = (select auth.uid()));

create policy "members change books on their joint shelves" on public.books
  for update to authenticated
  using (public.on_shelf(section_id))
  with check (public.on_shelf(section_id));

create policy "members delete books they added" on public.books
  for delete to authenticated
  using (public.on_shelf(section_id) and added_by = (select auth.uid()));

-- Joint Picture Check (true for a picture on a book on any shelf the signed-in member is on, so everyone on a joint shelf sees its pictures):
create or replace function public.picture_on_my_shelves(path text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.books b
    where b.picture = path and b.picture <> '' and public.on_shelf(b.section_id));
$$;

-- Shelf Folder Check (pictures added to a joint shelf live in shelves/<shelf id>/, so they stay with the shelf when someone leaves):
create or replace function public.shelf_folder_ok(path text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select split_part(path, '/', 1) = 'shelves'
     and split_part(path, '/', 2) ~ '^[0-9a-f-]{36}$'
     and public.on_shelf(split_part(path, '/', 2)::uuid);
$$;

-- Unused Picture Check (true for a picture no book or card uses any more):
create or replace function public.picture_unused(path text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select not exists (select 1 from public.books b where b.picture = path);
$$;

-- Ensuring people on a joint shelf can add pictures to its folder, see all its pictures, and delete only pictures nothing uses any more:
create policy "members add pictures to their joint shelves" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'pictures' and public.shelf_folder_ok(name));

create policy "members see pictures on their joint shelves" on storage.objects
  for select to authenticated
  using (bucket_id = 'pictures' and (public.shelf_folder_ok(name) or public.picture_on_my_shelves(name)));

create policy "members delete unused joint shelf pictures" on storage.objects
  for delete to authenticated
  using (bucket_id = 'pictures' and public.shelf_folder_ok(name) and public.picture_unused(name));

-- Shelf People Function (the people on each joint shelf the signed-in member is on: first name, chosen colour and whether they own it, never their email):
create or replace function public.shelf_people()
returns json
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(json_agg(json_build_object(
           'section_id', p.section_id, 'member_id', p.member_id, 'owner', p.owner, 'joined_at', p.joined_at,
           'name', coalesce(nullif(split_part(trim(coalesce(u.raw_user_meta_data ->> 'name', '')), ' ', 1), ''), 'A member'),
           'colour', coalesce(u.raw_user_meta_data ->> 'shelf_colour', ''))
         order by p.section_id, p.owner desc, p.joined_at), '[]'::json)
  from (
    select s.id as section_id, s.member_id, true as owner, s.created_at as joined_at
    from public.sections s
    where public.on_shelf(s.id) and exists (select 1 from public.shelf_members m where m.section_id = s.id)
    union all
    select m.section_id, m.member_id, false, m.joined_at
    from public.shelf_members m
    where public.on_shelf(m.section_id)
  ) p
  join auth.users u on u.id = p.member_id;
$$;

-- Invite Info Function (what the Join page shows for an invite link: the shelf's name, its owner and people, how many books, and whether there is room):
create or replace function public.invite_info(key text)
returns json
language sql
stable
security definer
set search_path = ''
as $$
  select json_build_object(
    'section_id', s.id,
    'name', s.name,
    'books', (select count(*) from public.books b where b.section_id = s.id),
    'people', (
      select json_agg(json_build_object(
               'name', coalesce(nullif(split_part(trim(coalesce(u.raw_user_meta_data ->> 'name', '')), ' ', 1), ''), 'A member'),
               'colour', coalesce(u.raw_user_meta_data ->> 'shelf_colour', ''),
               'owner', p.owner)
             order by p.owner desc, p.joined_at)
      from (
        select s.member_id, true as owner, s.created_at as joined_at
        union all
        select m.member_id, false, m.joined_at from public.shelf_members m where m.section_id = s.id
      ) p
      join auth.users u on u.id = p.member_id),
    'joined', public.on_shelf(s.id),
    'room', 5 - 1 - (select count(*) from public.shelf_members m where m.section_id = s.id))
  from public.sections s
  where s.invite_key = key;
$$;

-- Join Shelf Function (adds the signed-in member to the shelf an invite link points at, up to five people with the owner, and returns the shelf's id):
create or replace function public.join_shelf(key text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  shelf public.sections%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  select * into shelf from public.sections where invite_key = key for update;
  if not found then
    raise exception 'This invite link is not turned on';
  end if;
  if shelf.member_id = auth.uid() or exists (select 1 from public.shelf_members m where m.section_id = shelf.id and m.member_id = auth.uid()) then
    return shelf.id;
  end if;
  if (select count(*) from public.shelf_members m where m.section_id = shelf.id) >= 4 then
    raise exception 'This shelf is full';
  end if;
  insert into public.shelf_members (section_id, member_id) values (shelf.id, auth.uid());
  return shelf.id;
end;
$$;

-- Pictures To Keep Function (pictures in the member's own folder that a joint shelf still needs, the website leaves these when the member deletes their account):
create or replace function public.pictures_to_keep()
returns setof text
language sql
stable
security definer
set search_path = ''
as $$
  select b.picture from public.books b
  join public.sections s on s.id = b.section_id
  where b.picture like auth.uid()::text || '/%'
    and (s.member_id <> auth.uid() or exists (select 1 from public.shelf_members m where m.section_id = s.id));
$$;

-- Delete My Account Function (a joint shelf the member owns passes to whoever joined it first, with all its books, then the account is deleted and the database removes the member's other sections and books with it, the website deletes their pictures first):
-- The website first calls it with any other word to check it is set up, only the word DELETE deletes the account
create or replace function public.delete_my_account(confirm text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  shelf record;
  heir uuid;
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  if confirm is distinct from 'DELETE' then
    return false;
  end if;
  for shelf in select s.id from public.sections s where s.member_id = auth.uid() loop
    select m.member_id into heir from public.shelf_members m where m.section_id = shelf.id order by m.joined_at limit 1;
    if heir is not null then
      update public.sections set member_id = heir, share_key = null where id = shelf.id;
      update public.books set member_id = heir where section_id = shelf.id;
      delete from public.shelf_members where section_id = shelf.id and member_id = heir;
    end if;
  end loop;
  delete from auth.users where id = auth.uid();
  return true;
end;
$$;

-- Allowing signed-in members to use the functions, and visitors to read an invite link:
revoke all on function public.owns_shelf(uuid) from public;
revoke all on function public.on_shelf(uuid) from public;
revoke all on function public.picture_on_my_shelves(text) from public;
revoke all on function public.shelf_folder_ok(text) from public;
revoke all on function public.picture_unused(text) from public;
revoke all on function public.shelf_people() from public;
revoke all on function public.invite_info(text) from public;
revoke all on function public.join_shelf(text) from public;
revoke all on function public.pictures_to_keep() from public;
revoke all on function public.delete_my_account(text) from public;
grant execute on function public.owns_shelf(uuid) to authenticated;
grant execute on function public.on_shelf(uuid) to authenticated;
grant execute on function public.picture_on_my_shelves(text) to authenticated;
grant execute on function public.shelf_folder_ok(text) to authenticated;
grant execute on function public.picture_unused(text) to authenticated;
grant execute on function public.shelf_people() to authenticated;
grant execute on function public.invite_info(text) to anon, authenticated;
grant execute on function public.join_shelf(text) to authenticated;
grant execute on function public.pictures_to_keep() to authenticated;
grant execute on function public.delete_my_account(text) to authenticated;
