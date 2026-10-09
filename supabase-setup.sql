-- Every row remembers which member it belongs to. "default auth.uid()" fills that in automatically with whoever is signed in when the row is saved.

-- Sections Table Creation:
create table public.sections 
(
  id         uuid primary key default gen_random_uuid(),
  member_id  uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now()
);

-- Books Table Creation:
create table public.books 
(
  id         uuid primary key default gen_random_uuid(),
  member_id  uuid not null default auth.uid() references auth.users (id) on delete cascade,
  section_id uuid not null references public.sections (id) on delete cascade,
  name       text not null,
  link       text not null default '',
  notes      text not null default '',
  picture    text not null default '',
  created_at timestamptz not null default now()
);

-- Addition of Books Section Index to Books:
create index books_section_idx on public.books (section_id);

-- Granting of access to  authenticated memebers to see their tables through the website, supabase hides tables from websites untill this step:
grant select, insert, update, delete on public.sections to authenticated;
grant select, insert, update, delete on public.books    to authenticated;

-- Ensuring each member only ever sees and changes their own roles:
alter table public.sections enable row level security;
alter table public.books    enable row level security;

-- Ensuring that each member's shelves are private, dispite all records stores in the same two tables:
create policy "members manage their own sections" on public.sections
  for all to authenticated
  using (member_id = (select auth.uid()))
  with check (member_id = (select auth.uid()));

create policy "members manage their own books" on public.books
  for all to authenticated
  using (member_id = (select auth.uid()))
  with check (member_id = (select auth.uid()));
