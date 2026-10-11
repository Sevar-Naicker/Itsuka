-- Run this only after the website files that fetch pictures privately are live, the older files stop showing pictures once the bucket is private

-- Pictures Bucket Made Private (a picture is now only handed to the member it belongs to, the policies in supabase-pictures.sql decide who that is):
update storage.buckets
set public = false
where id = 'pictures';
