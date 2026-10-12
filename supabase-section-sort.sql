-- Section Sort Column Addition (how a shelf keeps its books in order: empty for the member's own order, or name, newest or oldest):
alter table public.sections
  add column sort_by text not null default ''
  check (sort_by in ('', 'name', 'newest', 'oldest'));
