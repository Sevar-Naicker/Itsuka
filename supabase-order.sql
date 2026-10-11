-- Position Column Addition (the number that decides where a book stands on its shelf, a new book gets the time it was added so it goes on the end):
alter table public.books
  add column position double precision not null default extract(epoch from now());

-- Existing Books Keep Their Order (each one gets the time it was added as its place):
update public.books
set position = extract(epoch from created_at);
