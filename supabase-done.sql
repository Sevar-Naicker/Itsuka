-- Done Column Addition (every book starts as not done, it turns true when the member ticks Done on the book):
alter table public.books
  add column done boolean not null default false;
