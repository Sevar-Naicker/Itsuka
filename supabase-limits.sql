-- These limits are far above anything the website itself saves, they only stop someone filling the library's storage by going around the website

-- Pictures Bucket Limits (no file over 5 MB and pictures only, the website stores small JPEGs of a few hundred KB at most):
update storage.buckets
set file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'pictures';

-- Section Name Limit (the website allows 40 characters):
alter table public.sections
  add constraint sections_name_length check (char_length(name) <= 100);

-- Book Limits (the website allows 80 characters for a name, 2000 for a link and 10000 for notes):
alter table public.books
  add constraint books_name_length    check (char_length(name) <= 200),
  add constraint books_link_length    check (char_length(link) <= 2000),
  add constraint books_notes_length   check (char_length(notes) <= 10000),
  add constraint books_picture_length check (char_length(picture) <= 300);