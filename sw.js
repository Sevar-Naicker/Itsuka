// This file contains the helper that lets Itsuka open with no signal: it keeps a copy of the site's own pages, styles, scripts and font on the device
// It always tries the internet first, so every change pushed to the site arrives straight away, and only uses the copy when the internet cannot be reached
// The shelves themselves are never kept here, offline.js keeps the member's copy, and nothing from Supabase passes through this file

// FILES_COPY is the name of the copy, changing the number clears the old one
const FILES_COPY = "itsuka-files-1";
// SUPABASE_LIBRARY is the Supabase library the pages load, the only file from another site that is kept
const SUPABASE_LIBRARY = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.3";
// FILES holds what is copied straight away, everything else the site loads is copied the first time it is used
const FILES = [
  "./", "index.html", "library.html", "privacy.html", "styles.css", "manifest.json",
  "backgrounds.js", "config.js", "auth.js", "pictures.js", "shelves.js", "member.js", "library.js",
  "joint.js", "live.js", "letters.js", "offline.js", "record.js", "install.js", "guide.js", "index.js",
  "fonts/pixelify-sans-latin.woff2", "icons/icon-192.png", "icons/icon-32.png", SUPABASE_LIBRARY,
];

// Section: Keeping the copy

// When the helper is first set up it copies the files, one that cannot be fetched is skipped and copied later
self.addEventListener("install", (event) =>
{
  event.waitUntil(caches.open(FILES_COPY).then((Copy) => Promise.all(FILES.map((File) => Copy.add(new Request(File, { cache: "reload" })).catch(() => null)))));
  self.skipWaiting();
});

// A new helper clears out any older copy and looks after the open pages straight away
self.addEventListener("activate", (event) =>
{
  event.waitUntil(caches.keys().then((Names) => Promise.all(Names.filter((Name) => Name !== FILES_COPY).map((Name) => caches.delete(Name)))).then(() => self.clients.claim()));
});

// The Kept function checks whether a request is for one of the site's own files, or the Supabase library
function Kept(Asked)
{
  if (Asked.method !== "GET") return false;
  const Address = new URL(Asked.url);
  return Address.origin === self.location.origin || Asked.url === SUPABASE_LIBRARY;
}

// Section: Answering the page

// Each file is fetched from the internet and the copy is brought up to date, with no signal the copy answers instead
self.addEventListener("fetch", (event) =>
{
  if (!Kept(event.request)) return;                  // Supabase and everything else go straight to the internet
  event.respondWith(fetch(event.request).then((Answer) =>
  {
    if (Answer.ok)
    {
      const Copied = Answer.clone();
      caches.open(FILES_COPY).then((Copy) => Copy.put(event.request, Copied));
    }
    return Answer;
  }).catch(async () =>
  {
    // An address with extras on the end (a shared link, a share from another app) opens the same page from the copy
    const Copied = await caches.match(event.request, { ignoreSearch: true });
    if (Copied) return Copied;
    if (event.request.mode === "navigate") return (await caches.match("library.html")) || Response.error();
    return Response.error();
  }));
});
