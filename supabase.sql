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
  constraint books_picture_length check (char_length(picture) <= 300),
  constraint books_link_web       check (link = '' or link ~* '^https?://')
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

-- Book Owner Setting (a book always belongs to the owner of the shelf it is on, checked on every change, it remembers who added it, and a new picture must be in the member's own folder or the shelf's folder):
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
  select s.member_id into new.member_id from public.sections s where s.id = new.section_id;
  if auth.uid() is not null and new.picture <> '' and (tg_op = 'INSERT' or new.picture is distinct from old.picture)
     and not (new.picture like auth.uid()::text || '/%' or new.picture like 'shelves/' || new.section_id::text || '/%') then
    raise exception 'That picture does not belong to you';
  end if;
  return new;
end;
$$;

create trigger books_owner
  before insert or update on public.books
  for each row execute function public.book_owner();

-- Book Change Check (who added a book can only ever be emptied, when they delete their account, on a joint shelf anyone can move a book, tick it done or open it, only its owner and whoever added it can change what it says or move it to another shelf):
create or replace function public.book_change_check()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.added_by is distinct from old.added_by
     and not (new.added_by is null and (auth.uid() is null or auth.uid() = old.added_by or auth.uid() = old.member_id)) then
    raise exception 'Who added a book cannot be changed';
  end if;
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

-- Live Shelves Addition (people on a joint shelf see each other's changes straight away, the website listens on a private channel for each joint shelf):

-- Shelf Has Others Check (true when someone apart from the owner is on the shelf, only those shelves send their changes):
create or replace function public.shelf_has_others(shelf uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.shelf_members m where m.section_id = shelf);
$$;

-- Shelf Change Sending (tells everyone on a joint shelf what changed and who changed it, a hiccup here never stops the change itself being saved):
create or replace function public.send_shelf_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  item jsonb;
  before jsonb;
  shelf uuid;
  shelves uuid[];
  message jsonb;
begin
  if TG_OP = 'DELETE' then item := to_jsonb(OLD); else item := to_jsonb(NEW); end if;
  if TG_OP = 'UPDATE' then before := to_jsonb(OLD); end if;

  -- Opening a book only shifts its dust, and where a shelf sits among someone's plaques or how they sort it is theirs alone, those are not worth telling anyone about
  if TG_TABLE_NAME = 'books' and TG_OP = 'UPDATE' and (item - 'opened_at') = (before - 'opened_at') then
    return null;
  end if;
  if TG_TABLE_NAME = 'sections' and TG_OP = 'UPDATE' and (item - 'position' - 'sort_by') = (before - 'position' - 'sort_by') then
    return null;
  end if;
  if TG_TABLE_NAME = 'shelf_members' and TG_OP = 'UPDATE' then
    return null;
  end if;

  -- The shelf the change is on, and the shelf a book came from when it moved between shelves
  if TG_TABLE_NAME = 'sections' then
    shelves := array[(item ->> 'id')::uuid];
  else
    shelves := array[(item ->> 'section_id')::uuid];
    if before is not null and before ->> 'section_id' is distinct from item ->> 'section_id' then
      shelves := shelves || (before ->> 'section_id')::uuid;
    end if;
  end if;

  message := jsonb_build_object(
    'table', TG_TABLE_NAME,
    'op', TG_OP,
    'by', auth.uid(),
    'id', item ->> 'id',
    'name', item ->> 'name',
    'member', item ->> 'member_id',
    'done', item -> 'done',
    'was_done', before -> 'done',
    'was_name', before ->> 'name');

  foreach shelf in array shelves loop
    -- Only joint shelves send, a deleted shelf and people joining or leaving always do
    if TG_TABLE_NAME = 'shelf_members' or (TG_TABLE_NAME = 'sections' and TG_OP = 'DELETE') or public.shelf_has_others(shelf) then
      begin
        perform realtime.send(message || jsonb_build_object('section', shelf), 'change', 'shelf:' || shelf::text, true);
      exception when others then
        null;
      end;
    end if;
  end loop;
  return null;
end;
$$;

-- Addition of the Shelf Change Triggers on sections, books and the people on shelves:
drop trigger if exists sections_live on public.sections;
create trigger sections_live
  after insert or update or delete on public.sections
  for each row execute function public.send_shelf_change();
drop trigger if exists books_live on public.books;
create trigger books_live
  after insert or update or delete on public.books
  for each row execute function public.send_shelf_change();
drop trigger if exists shelf_members_live on public.shelf_members;
create trigger shelf_members_live
  after insert or update or delete on public.shelf_members
  for each row execute function public.send_shelf_change();

-- Can Hear Shelf Check (true when the channel is shelf:<id> for a shelf the signed-in member is on):
create or replace function public.can_hear_shelf(topic text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if topic is null or topic !~ '^shelf:[0-9a-fA-F-]{36}$' then
    return false;
  end if;
  return public.on_shelf(substr(topic, 7)::uuid);
end;
$$;

revoke all on function public.shelf_has_others(uuid) from public;
revoke all on function public.can_hear_shelf(text) from public;
grant execute on function public.can_hear_shelf(text) to authenticated;

-- Ensuring only the people on a joint shelf can listen to its channel, and nobody can send on it from a browser:
drop policy if exists "people on a joint shelf hear its changes" on realtime.messages;
create policy "people on a joint shelf hear its changes" on realtime.messages
  for select to authenticated
  using (realtime.messages.extension = 'broadcast' and public.can_hear_shelf((select realtime.topic())));

-- Ledger Addition (a page only the library keeper can open: how full the free plan is, how many members use Itsuka and how it is growing, totals only):

-- Site Admins Table Creation (the library keeper's account, added by hand in the SQL Editor, nobody can read or change it from a browser):
create table if not exists public.site_admins
(
  member_id uuid primary key references auth.users (id) on delete cascade
);
alter table public.site_admins enable row level security;

-- Last Visits Table Creation (only the date of each member's latest visit, it is replaced each new day and deleted with the account, never shown to anyone):
create table if not exists public.last_visits
(
  member_id uuid primary key references auth.users (id) on delete cascade,
  day       date not null
);
alter table public.last_visits enable row level security;

-- Daily Visits Table Creation (how many members opened their library each day, a number per day with no names):
create table if not exists public.daily_visits
(
  day     date primary key,
  members integer not null default 0
);
alter table public.daily_visits enable row level security;

-- Ledger Snapshots Table Creation (the totals once a day, saved by the keep-awake job, so the Ledger can tell the job is still running):
create table if not exists public.ledger_snapshots
(
  day           date primary key,
  taken_at      timestamptz not null default now(),
  members       integer not null,
  books         integer not null,
  pictures      integer not null,
  picture_bytes bigint not null,
  database_bytes bigint not null
);
alter table public.ledger_snapshots enable row level security;

-- Is Keeper Check (true when the signed-in member is the library keeper, used to show the Ledger button):
create or replace function public.is_keeper()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.site_admins a where a.member_id = auth.uid());
$$;

-- Note Visit Function (notes that the signed-in member opened their library today, the day's count only goes up the first time each day):
create or replace function public.note_visit()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  today date := (now() at time zone 'Africa/Johannesburg')::date;
  changed integer;
begin
  if auth.uid() is null then
    return;
  end if;
  insert into public.last_visits (member_id, day) values (auth.uid(), today)
  on conflict (member_id) do update set day = excluded.day
  where public.last_visits.day is distinct from excluded.day;
  get diagnostics changed = row_count;
  if changed > 0 then
    insert into public.daily_visits (day, members) values (today, 1)
    on conflict (day) do update set members = public.daily_visits.members + 1;
  end if;
end;
$$;

-- Take Snapshot Function (saves today's totals, called by the keep-awake job each morning, running it again the same day only refreshes the numbers):
create or replace function public.take_snapshot()
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.ledger_snapshots (day, taken_at, members, books, pictures, picture_bytes, database_bytes)
  select (now() at time zone 'Africa/Johannesburg')::date, now(),
         (select count(*) from auth.users),
         (select count(*) from public.books),
         (select count(*) from storage.objects o where o.bucket_id = 'pictures'),
         (select coalesce(sum((o.metadata ->> 'size')::bigint), 0) from storage.objects o where o.bucket_id = 'pictures'),
         pg_database_size(current_database())
  on conflict (day) do update set
    taken_at = excluded.taken_at, members = excluded.members, books = excluded.books,
    pictures = excluded.pictures, picture_bytes = excluded.picture_bytes, database_bytes = excluded.database_bytes;
$$;

-- Ledger Function (every number on the Ledger page in one answer, only for the library keeper, totals only):
create or replace function public.ledger()
returns json
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  today date := (now() at time zone 'Africa/Johannesburg')::date;
  week_start date := date_trunc('week', (now() at time zone 'Africa/Johannesburg'))::date;
  result json;
begin
  if not public.is_keeper() then
    raise exception 'Only the library keeper can open the Ledger';
  end if;
  select json_build_object(
    'counted_at', now(),
    'today', today,
    'members', (select count(*) from auth.users),
    'new_this_month', (select count(*) from auth.users u where u.created_at >= date_trunc('month', now())),
    'active_today', (select count(*) from public.last_visits v where v.day = today),
    'active_week', (select count(*) from public.last_visits v where v.day > today - 7),
    'active_month', (select count(*) from public.last_visits v where v.day > today - 30),
    'daily_active', (select coalesce(json_agg(json_build_object('day', d.day, 'members', coalesce(v.members, 0)) order by d.day), '[]'::json)
                     from generate_series(today - 29, today, interval '1 day') as d(day)
                     left join public.daily_visits v on v.day = d.day::date),
    'new_members_weeks', (select json_agg(coalesce(c.n, 0) order by w.start)
                          from generate_series(week_start - 77, week_start, interval '7 days') as w(start)
                          left join (select date_trunc('week', u.created_at at time zone 'Africa/Johannesburg')::date as start, count(*) as n
                                     from auth.users u group by 1) c on c.start = w.start::date),
    'books_weeks', (select json_agg(coalesce(c.n, 0) order by w.start)
                    from generate_series(week_start - 77, week_start, interval '7 days') as w(start)
                    left join (select date_trunc('week', b.created_at at time zone 'Africa/Johannesburg')::date as start, count(*) as n
                               from public.books b group by 1) c on c.start = w.start::date),
    'week_starts', (select json_agg(w.start::date order by w.start) from generate_series(week_start - 77, week_start, interval '7 days') as w(start)),
    'pictures', (select count(*) from storage.objects o where o.bucket_id = 'pictures'),
    'picture_bytes', (select coalesce(sum((o.metadata ->> 'size')::bigint), 0) from storage.objects o where o.bucket_id = 'pictures'),
    'recent_picture_bytes', (select coalesce(sum((o.metadata ->> 'size')::bigint), 0) from storage.objects o where o.bucket_id = 'pictures' and o.created_at > now() - interval '28 days'),
    'recent_pictures', (select count(*) from storage.objects o where o.bucket_id = 'pictures' and o.created_at > now() - interval '28 days'),
    'database_bytes', pg_database_size(current_database()),
    'shelves', (select count(*) from public.sections),
    'books', (select count(*) from public.books),
    'done_books', (select count(*) from public.books b where b.done),
    'joint_shelves', (select count(distinct m.section_id) from public.shelf_members m),
    'share_links', (select count(*) from public.sections s where s.share_key is not null),
    'emails_day', (select count(*) filter (where u.confirmation_sent_at > now() - interval '1 day')
                        + count(*) filter (where u.recovery_sent_at > now() - interval '1 day')
                        + count(*) filter (where u.email_change_sent_at > now() - interval '1 day') from auth.users u),
    'emails_month', (select count(*) filter (where u.confirmation_sent_at >= date_trunc('month', now()))
                          + count(*) filter (where u.recovery_sent_at >= date_trunc('month', now()))
                          + count(*) filter (where u.email_change_sent_at >= date_trunc('month', now())) from auth.users u),
    'last_snapshot', (select max(s.taken_at) from public.ledger_snapshots s),
    'history_since', (select min(s.day) from public.ledger_snapshots s)
  ) into result;
  return result;
end;
$$;

-- Allowing members to note their visit and the keeper to read the Ledger, and the keep-awake job (signed out) to save the day's totals:
revoke all on function public.is_keeper() from public;
revoke all on function public.note_visit() from public;
revoke all on function public.take_snapshot() from public;
revoke all on function public.ledger() from public;
grant execute on function public.is_keeper() to authenticated;
grant execute on function public.note_visit() to authenticated;
grant execute on function public.take_snapshot() to anon, authenticated;
grant execute on function public.ledger() to authenticated;

-- Library Keeper Addition (makes your own account the library keeper, so the Ledger opens for it: register on the site first, put your email in place of the one below, then run these three lines):
-- insert into public.site_admins (member_id)
-- select u.id from auth.users u where lower(u.email) = lower('you@example.com')
-- on conflict (member_id) do nothing;

-- Security Additions (people on a joint shelf only change their own place and sort, visitors only reach the functions meant for them, and the Ledger's tables are never reached from a browser):

-- Ensuring people on a joint shelf can only change their own place for it and how they sort it, nothing else on their row:
revoke update on public.shelf_members from authenticated;
grant update (position, sort_by) on public.shelf_members to authenticated;

-- Ensuring visitors who are not signed in can only use the three functions meant for them (a shared shelf, its pictures and an invite link) and the keep-awake job's snapshot:
-- Supabase lets visitors use every new function unless it is taken away from them by name, every function below already checked who was asking, this makes it certain
revoke execute on function public.owns_shelf(uuid) from anon;
revoke execute on function public.on_shelf(uuid) from anon;
revoke execute on function public.picture_on_my_shelves(text) from anon;
revoke execute on function public.shelf_folder_ok(text) from anon;
revoke execute on function public.picture_unused(text) from anon;
revoke execute on function public.shelf_people() from anon;
revoke execute on function public.join_shelf(text) from anon;
revoke execute on function public.pictures_to_keep() from anon;
revoke execute on function public.delete_my_account(text) from anon;
revoke execute on function public.can_hear_shelf(text) from anon;
revoke execute on function public.is_keeper() from anon;
revoke execute on function public.note_visit() from anon;
revoke execute on function public.ledger() from anon;
revoke execute on function public.shelf_has_others(uuid) from anon, authenticated;

-- Ensuring the Ledger's tables can only be reached through the Ledger's own functions, never read or changed from a browser:
revoke all on public.site_admins, public.last_visits, public.daily_visits, public.ledger_snapshots from anon, authenticated;

-- Letters Addition (while a member is away, the changes their friends make on a joint shelf are noted in a small log, kept for 30 days, and a letter on the shelf's plaque shows them when they come back):

-- Shelf Log Table Creation (what changed on a joint shelf, who changed it and who joined or left, with their first names so someone who has left can still be named, and a book's name so a removed book can still be named):
create table if not exists public.shelf_log
(
  id         bigint generated always as identity primary key,
  section_id uuid not null references public.sections (id) on delete cascade,
  at         timestamptz not null default now(),
  by_member  uuid references auth.users (id) on delete set null,
  kind       text not null check (kind in ('added', 'removed', 'done', 'renamed', 'joined', 'left', 'removed_person', 'handover')),
  by_name    text not null default '',
  person     uuid references auth.users (id) on delete set null,
  person_name text not null default '',
  book_id    uuid,
  book_name  text not null default '',
  old_name   text not null default ''
);

-- Shelf Log Name Clearing (when someone deletes their account their id empties from the log, and this empties their first name with it):
create or replace function public.clear_log_names()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.by_member is null and old.by_member is not null then
    new.by_name := '';
  end if;
  if new.person is null and old.person is not null then
    new.person_name := '';
  end if;
  return new;
end;
$$;

revoke all on function public.clear_log_names() from public, anon, authenticated;

drop trigger if exists shelf_log_clear_names on public.shelf_log;
create trigger shelf_log_clear_names
  before update on public.shelf_log
  for each row execute function public.clear_log_names();

-- Addition of a Shelf and Time Index for finding a shelf's latest changes:
create index if not exists shelf_log_section_at_idx on public.shelf_log (section_id, at);

-- Shelf Seen Table Creation (when each member last read the letter for a shelf, so reading it on one device clears it on every device):
create table if not exists public.shelf_seen
(
  section_id uuid not null references public.sections (id) on delete cascade,
  member_id  uuid not null default auth.uid() references auth.users (id) on delete cascade,
  seen_at    timestamptz not null default now(),
  primary key (section_id, member_id)
);

-- Ensuring the people on a joint shelf can read its log, nobody can write to it from a browser, and each member only reads and writes their own seen times:
alter table public.shelf_log enable row level security;
alter table public.shelf_seen enable row level security;
revoke all on public.shelf_log, public.shelf_seen from anon, authenticated;
grant select on public.shelf_log to authenticated;
grant select, insert, update on public.shelf_seen to authenticated;

drop policy if exists "people on a joint shelf read its log" on public.shelf_log;
create policy "people on a joint shelf read its log" on public.shelf_log
  for select to authenticated
  using (public.on_shelf(section_id));

drop policy if exists "members read their own seen times" on public.shelf_seen;
create policy "members read their own seen times" on public.shelf_seen
  for select to authenticated
  using (member_id = (select auth.uid()));

drop policy if exists "members note when they read a letter" on public.shelf_seen;
create policy "members note when they read a letter" on public.shelf_seen
  for insert to authenticated
  with check (member_id = (select auth.uid()) and public.on_shelf(section_id));

drop policy if exists "members update when they read a letter" on public.shelf_seen;
create policy "members update when they read a letter" on public.shelf_seen
  for update to authenticated
  using (member_id = (select auth.uid()))
  with check (member_id = (select auth.uid()) and public.on_shelf(section_id));

-- First Name Function (a member's first name, the same one shown on joint shelves, never their email):
create or replace function public.first_name(member uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select nullif(split_part(trim(coalesce(u.raw_user_meta_data ->> 'name', '')), ' ', 1), '') from auth.users u where u.id = member), '');
$$;

revoke all on function public.first_name(uuid) from public, anon, authenticated;

-- Shelf Log Writing (notes the changes worth a letter on a joint shelf: books added, removed or ticked done, the shelf renamed, people joining or leaving, a hiccup here never stops the change itself being saved):
-- Moving a book, opening it, and each person's own place and sort for a shelf are never noted, and anything older than 30 days is cleared away as new changes come in
create or replace function public.log_shelf_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  shelf uuid;
  what text;
  book uuid;
  title text := '';
  before_title text := '';
  who uuid := auth.uid();
  someone uuid;
begin
  if TG_TABLE_NAME = 'books' then
    if TG_OP = 'INSERT' then
      shelf := NEW.section_id; what := 'added'; book := NEW.id; title := NEW.name;
    elsif TG_OP = 'DELETE' then
      shelf := OLD.section_id; what := 'removed'; book := OLD.id; title := OLD.name;
    elsif NEW.done and not OLD.done and NEW.section_id = OLD.section_id then
      shelf := NEW.section_id; what := 'done'; book := NEW.id; title := NEW.name;
    elsif NEW.section_id is distinct from OLD.section_id then
      -- a book moved between shelves counts as removed from one and added to the other
      begin
        if public.shelf_has_others(OLD.section_id) then
          insert into public.shelf_log (section_id, by_member, by_name, kind, book_id, book_name) values (OLD.section_id, who, public.first_name(who), 'removed', OLD.id, OLD.name);
        end if;
        if public.shelf_has_others(NEW.section_id) then
          insert into public.shelf_log (section_id, by_member, by_name, kind, book_id, book_name) values (NEW.section_id, who, public.first_name(who), 'added', NEW.id, NEW.name);
        end if;
      exception when others then
        null;
      end;
      return null;
    else
      return null;
    end if;
  elsif TG_TABLE_NAME = 'sections' then
    if TG_OP <> 'UPDATE' or NEW.name = OLD.name then
      return null;
    end if;
    shelf := NEW.id; what := 'renamed'; title := NEW.name; before_title := OLD.name;
  else
    if TG_OP = 'INSERT' then
      shelf := NEW.section_id; what := 'joined'; who := NEW.member_id; someone := NEW.member_id;
    elsif TG_OP = 'DELETE' then
      shelf := OLD.section_id; someone := OLD.member_id;
      if exists (select 1 from public.sections s where s.id = shelf and s.member_id = OLD.member_id) then
        what := 'handover';                          -- the owner deleted their account and the shelf passed to this person
      elsif auth.uid() is null or auth.uid() = OLD.member_id then
        what := 'left'; who := OLD.member_id;
      else
        what := 'removed_person';
      end if;
    else
      return null;
    end if;
  end if;

  begin
    -- only joint shelves keep a log, people joining and leaving are always noted
    if TG_TABLE_NAME = 'shelf_members' or public.shelf_has_others(shelf) then
      if TG_TABLE_NAME = 'shelf_members' and TG_OP = 'DELETE' and not exists (select 1 from public.sections s where s.id = shelf) then
        return null;                                 -- the shelf itself is being deleted
      end if;
      insert into public.shelf_log (section_id, by_member, by_name, kind, person, person_name, book_id, book_name, old_name)
      values (shelf, who, public.first_name(who), what, someone, public.first_name(someone), book, coalesce(title, ''), coalesce(before_title, ''));
      delete from public.shelf_log l where l.section_id = shelf and l.at < now() - interval '30 days';
    end if;
  exception when others then
    null;
  end;
  return null;
end;
$$;

revoke all on function public.log_shelf_change() from public, anon, authenticated;

-- Addition of the Shelf Log Triggers on books, sections and the people on shelves:
drop trigger if exists books_log on public.books;
create trigger books_log
  after insert or update or delete on public.books
  for each row execute function public.log_shelf_change();
drop trigger if exists sections_log on public.sections;
create trigger sections_log
  after update on public.sections
  for each row execute function public.log_shelf_change();
drop trigger if exists shelf_members_log on public.shelf_members;
create trigger shelf_members_log
  after insert or delete on public.shelf_members
  for each row execute function public.log_shelf_change();

-- Reading Record Addition (the day each book is ticked done is stamped on the member's reading record, opened from their library card, and kept even after the book is deleted):

-- Addition of Done On and Done By to Books (when a book was ticked done and who ticked it, the database fills both in, empty for books ticked before the record began):
alter table public.books add column if not exists done_at timestamptz;
alter table public.books add column if not exists done_by uuid references auth.users (id) on delete set null;

-- Reading Record Table Creation (one line per book a member ticked done, with the book's name and shelf kept so a deleted book can still be named, there is no link to the book itself so the line stays when the book is deleted):
create table if not exists public.reading_record
(
  id          bigint generated always as identity primary key,
  member_id   uuid not null default auth.uid() references auth.users (id) on delete cascade,
  book_id     uuid not null,
  book_name   text not null default '',
  section_id  uuid,
  shelf_name  text not null default '',
  done_at     timestamptz not null default now(),
  constraint reading_record_name_length  check (char_length(book_name) <= 200),
  constraint reading_record_shelf_length check (char_length(shelf_name) <= 100)
);

-- Addition of a Member and Date Index for reading a member's record newest first:
create index if not exists reading_record_member_idx on public.reading_record (member_id, done_at desc);

-- Ensuring each member only reads and takes lines off their own record, and nobody writes to it from a browser, the database writes every line:
alter table public.reading_record enable row level security;
revoke all on public.reading_record from anon, authenticated;
grant select, delete on public.reading_record to authenticated;

drop policy if exists "members read their own record" on public.reading_record;
create policy "members read their own record" on public.reading_record
  for select to authenticated
  using (member_id = (select auth.uid()));

drop policy if exists "members take lines off their own record" on public.reading_record;
create policy "members take lines off their own record" on public.reading_record
  for delete to authenticated
  using (member_id = (select auth.uid()));

-- Reading Record Writing (ticking Done stamps the day and who ticked it on the book and adds a line to their record, unticking it takes their line off again, the stamp itself can never be set or changed from a browser):
-- On a joint shelf the book goes on the record of whoever ticked it, and unticking only takes the line off the record of whoever unticks it
create or replace function public.stamp_reading_record()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  who uuid := auth.uid();
begin
  if tg_op = 'INSERT' then
    -- a new book, or one loaded back from a copy, has no stamp: if it is done it shows under Before the record began
    new.done_at := null;
    new.done_by := null;
    return new;
  end if;
  if new.done and not old.done then
    new.done_at := now();
    new.done_by := who;
    if who is not null then
      insert into public.reading_record (member_id, book_id, book_name, section_id, shelf_name)
      values (who, new.id, new.name, new.section_id, coalesce((select s.name from public.sections s where s.id = new.section_id), ''));
    end if;
  elsif old.done and not new.done then
    new.done_at := null;
    new.done_by := null;
    if who is not null then
      delete from public.reading_record r where r.book_id = old.id and r.member_id = who;
    end if;
  else
    -- anything else keeps the stamp as it was, so it cannot be changed by hand
    new.done_at := old.done_at;
    new.done_by := old.done_by;
  end if;
  return new;
end;
$$;

revoke all on function public.stamp_reading_record() from public, anon, authenticated;

-- Addition of the Reading Record Trigger on books:
drop trigger if exists books_reading_record on public.books;
create trigger books_reading_record
  before insert or update on public.books
  for each row execute function public.stamp_reading_record();
