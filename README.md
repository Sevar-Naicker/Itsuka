# Itsuka

A cosy pixel-art library for saving the links to Instagram pages, creators and small businesses you want to support or use later.

Itsuka (いつか) is Japanese for "someday". You find someone on Instagram or Pinterest whose work you love but can't buy from yet, or want to use as inspiration later, so you put them on a shelf and come back someday.

**Live site:** https://itsuka.co.za

## What it does:

- **Landing Page:** the first page everyone sees is the name Itsuka spelled out as six books on a shelf, with buttons to get a library card, sign in or read how it works. A member who is already signed in gets a Library button instead. Visitors can also choose what sits at the end of the shelf: tea and books, a cat, an armchair, a plant or a lantern.
- **Search:** the Find button on the library page opens a search box that finds a book by its name or notes.
- **Shelves and Books:** every saved creator / page is a book on a shelf. Hover or tap a spine and it opens to show a picture, your notes and a link.
- **Sections:** shelves are grouped under plaques such as Artists or Work Ideas. Each plaque switches its section on or off, so you can view one, a few or all of them.
- **Library Card:** members register and sign in with a library card, and can add a profile photo to it.
- **Private Shelves:** each member only ever sees their own sections, books, notes and pictures.
- **Done Mark:** tick Done inside a book once you have visited, bought or used it. The book gets a ribbon on its spine and a stamp inside, and the Hide done button tucks the finished books away.
- **Pictures:** one picture per book, shrunk before upload and drawn in a pixel style to match the library.
- **Backgrounds:** four animated pixel scenes (cabin fireplace, green woodland, campfire night, snowy cabin). The shelves, books and plaques change colour to match the one you pick.
- **Phone and Laptop:** the layout and the backgrounds fit both. On a phone the site can be added to the home screen, where it opens like an app.

## How it is built:

- Plain HTML, CSS and JavaScript. There is no framework and no build step.
- [Supabase](https://supabase.com) for accounts, the database, user management and picture storage.
- GitHub Pages with a custom domain for hosting.
- The backgrounds are drawn in code on a `<canvas>`, so the only image files are the icons and the link preview picture.
- The pixel font (Pixelify Sans) is hosted with the site, and the Supabase library is loaded at one exact version.

## Files:

| File | What it is |
| --- | --- |
| `index.html` | The landing page, the first page everyone sees |
| `library.html` | The library itself: plaques, shelves, books |
| `login.html` | The library card: sign in, register and reset a password |
| `styles.css` | How everything looks |
| `config.js` | Which Supabase project the site talks to |
| `auth.js` | Signing in, registering and signing out (used by all three pages) |
| `login.js` | The form on the library card |
| `index.js` | The landing page: the item on the title shelf, its picker, the How it works card and the Library button for members |
| `member.js` | Checks for a card on the library page, sends anyone without one to the landing page and shows the member's card |
| `pictures.js` | Shrinks, stores and draws pictures (book pictures and card photos) |
| `library.js` | The plaques, shelves and books, and the cards for adding to them |
| `backgrounds.js` | The pixel scenes, background picker and colour themes (used by all three pages) |
| `supabase-setup.sql` | Creates the tables for sections and books. Run once in Supabase |
| `supabase-pictures.sql` | Creates the storage for pictures. Run once in Supabase |
| `supabase-limits.sql` | Adds generous size limits to pictures and text. Run once in Supabase |
| `supabase-done.sql` | Adds the done mark to books. Run once in Supabase |
| `supabase-private-pictures.sql` | Makes pictures private to the member they belong to. Run once in Supabase |
| `manifest.json` | Lets a phone add the site to its home screen like an app |
| `icons/` | The tab icon, the home screen icons and the picture shown when the link is shared |
| `fonts/` | The pixel font files and their licence |

All of them must stay in the same folder in order for the project to run.

## Running it on your computer:

Use a small local web server instead of double-clicking the files, so all the pages share the same sign-in:

- **VS Code:** install the Live Server extension, right-click `index.html` and choose "Open with Live Server".
- **Python:** open a terminal in this folder, run `python -m http.server 8000`, then visit `http://localhost:8000`.

## Setting up your own copy:

The `config.js` in this repository points at the live Itsuka project. To run your own library with your own members, create a free Supabase project and point the site at it:

1. In your Supabase project press **Connect**, then copy the **Project URL** and the **Publishable key** into `config.js`, replacing the ones that are there.
2. Open **SQL Editor**, start a new query, paste in everything from `supabase-setup.sql` and press **Run**. Do this once. It creates the tables that hold each member's sections and books.
3. Do the same with `supabase-pictures.sql`. It creates the storage for book pictures and card photos.
4. Do the same with `supabase-limits.sql`. It stops anyone storing oversized pictures or text by going around the website.
5. Do the same with `supabase-done.sql` and then `supabase-private-pictures.sql`. They add the done mark and make pictures private.
6. Go to **Authentication > URL Configuration**. Set **Site URL** to the address your site runs at, and add that address ending in `/**` to **Redirect URLs**. For Live Server that is `http://127.0.0.1:5500/**`. The links in the confirmation and password reset emails only lead back to the site if its address is on this list.
7. Under **Authentication > Sign In / Providers**, **Confirm email** decides whether new members must confirm their email address before their first sign-in. Switching it off is handy while building. Switch it on before you share the site.
8. Supabase's built-in email only delivers to people on your own Supabase team. To let anyone register, connect an email provider such as Resend under **Authentication > Emails > SMTP Settings**. The provider's key is a secret and belongs only in the Supabase dashboard.
9. In `index.html`, change the two `https://itsuka.co.za` addresses near the top (`og:url` and `og:image`) to your own site's address, so shared links show your preview.

If both values in `config.js` are left empty, login is off and the library shows a few example shelves that are not saved anywhere.

## Never put these in the project:

- The database password
- Any key starting with `sb_secret_`

The publishable key in `config.js` (it starts with `sb_publishable_`) is meant to be seen by browsers, so it is safe to publish.

## Credits:

Developed by Sav.