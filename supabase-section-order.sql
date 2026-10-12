-- Section Position Column Addition (the number that decides the order of the sections, a new section gets the time it was added so it goes last):
alter table public.sections
  add column position double precision not null default extract(epoch from now());

-- Existing Sections Keep Their Order (each one gets the time it was added as its place):
update public.sections
set position = extract(epoch from created_at);
