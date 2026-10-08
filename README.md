# Itsuka

A cosy pixel-art library for saving the links to Instagram pages, creators and small businesses you want to support or use later.

Itsuka (いつか) is Japanese for "someday". You find someone on Instagram or Pinterest whose work you love but can't buy from yet, or want to use as inspiration later, so you put them on a shelf and come back someday.

**Live site:** https://itsuka.co.za

## What it does:

- **Shelves and Books:** every saved creator / page is a book on a shelf. Hover or tap a spine and it opens to show a picture, your notes and a link.
- **Sections:** shelves are grouped under plaques such as Artists or Work Ideas. Each plaque switches its section on or off, so you can view one, a few or all of them.
- **Library Card:** members register and sign in with a library card, and can add a profile photo to it.
- **Private Shelves:** each member only ever sees their own sections, books and notes.
- **Pictures:** one picture per book, shrunk before upload and drawn in a pixel style to match the library.
- **Backgrounds:** four animated pixel scenes (cabin fireplace, green woodland, campfire night, snowy cabin). The shelves, books and plaques change colour to match the one you pick.
- **Phone and Laptop:** the layout and the backgrounds fit both.

## How it is built:

- Plain HTML, CSS and JavaScript. There is no framework and no build step.
- [Supabase](https://supabase.com) for accounts, the database, user management and picture storage.
- - GitHub Pages with a custom domain for hosting.
- The backgrounds are drawn in code on a `<canvas>`, so there are no image or video files.

## Files:

| File | What it is |
| --- | --- |
| `index.html` | The library itself: plaques, shelves, books |
| `login.html` | The library card: sign in, register and reset a password |
| `styles.css` | How everything looks |
| `config.js` | Which Supabase project the site talks to |
| `auth.js` | Signing in, registering and signing out (used by both pages) |
| `login.js` | The form on the library card |
| `member.js` | Checks for a card on the main page and shows the member's card |
| `pictures.js` | Shrinks, stores and draws pictures (book pictures and card photos) |
| `library.js` | The plaques, shelves and books, and the cards for adding to them |
| `backgrounds.js` | The pixel scenes, background picker and colour themes |
| `supabase-setup.sql` | Creates the tables for sections and books. Run once in Supabase |
| `supabase-pictures.sql` | Creates the storage for pictures. Run once in Supabase |

All of them must stay in the same folder in order for the project to run.

## Running it on your computer:

Use a small local web server instead of double-clicking the files, so both pages share the same sign-in:

- **VS Code:** install the Live Server extension, right-click `login.html` and choose "Open with Live Server".
- **Python:** open a terminal in this folder, run `python -m http.server 8000`, then visit `http://localhost:8000/login.html`.

## Setting up your own copy:

The `config.js` in this repository points at the live Itsuka project. To run your own library with your own members, create a free Supabase project and point the site at it:

1. In your Supabase project press **Connect**, then copy the **Project URL** and the **Publishable key** into `config.js`, replacing the ones that are there.
2. Open **SQL Editor**, start a new query, paste in everything from `supabase-setup.sql` and press **Run**. Do this once. It creates the tables that hold each member's sections and books.
3. Do the same with `supabase-pictures.sql`. It creates the storage for book pictures and card photos.
4. Go to **Authentication > URL Configuration**. Set **Site URL** to the address your site runs at, and add that address ending in `/**` to **Redirect URLs**. For Live Server that is `http://127.0.0.1:5500/**`. The links in the confirmation and password reset emails only lead back to the site if its address is on this list.
5. Under **Authentication > Sign In / Providers**, **Confirm email** decides whether new members must confirm their email address before their first sign-in. Switching it off is handy while building. Switch it on before you share the site.

If both values in `config.js` are left empty, login is off and the library shows a few example shelves that are not saved anywhere.

## Never put these in the project:

- The database password
- Any key starting with `sb_secret_`

The publishable key in `config.js` (it starts with `sb_publishable_`) is meant to be seen by browsers, so it is safe to publish.

## Credits:

Developed by Sav.