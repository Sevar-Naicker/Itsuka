# Itsuka

A cosy pixel-art library for saving the links to Instagram pages, creators and small businesses you want to support or use later.

Itsuka (いつか) is Japanese for "someday". You find someone on Instagram or Pinterest whose work you love but can't buy from yet, or want to use as inspiration later, so you put them on a shelf and come back someday.

**Live site:** https://itsuka.co.za

## What it does:

- **Landing Page:** the first page everyone sees is the name Itsuka spelled out as six books on a shelf, with buttons to get a library card, sign in or read how it works. A member who is already signed in gets a Library button instead. Visitors can also choose what sits at the end of the shelf: tea and books, a cat, an armchair, a plant or a lantern.
- **Search:** the Find button on the library page opens a search box that finds a book by its name or notes.
- **Shelves and Books:** every saved creator / page is a book on a shelf. Hover or tap a spine and it opens to show a picture, your notes and a link.
- **Move Books:** drag a book by its spine to move it along its shelf or onto another section's shelf. On a phone, rest a finger on the spine until the book lifts, then drag.
- **Sections:** shelves are grouped under plaques such as Artists or Work Ideas. Each plaque switches its section on or off, so you can view one, a few or all of them. The Edit sections card moves a section up or down, and sets the order of its books: your own order (by dragging), A to Z, newest first or oldest first. A sorted shelf keeps new books in that order.
- **Settings:** the Settings button holds the background and a switch for each shelf tool: Find, the done mark, Hide done, Pull a book, dragging, shelf ornaments and opening books on hover. The switches are saved with the member's account, so they follow them to every device.
- **Download and Load a Copy:** under Settings, Download a copy saves the whole library, pictures included, as one file. Load a copy adds the books from such a file back in, skipping any already on the same shelf.
- **Library Card:** members register and sign in with a library card, and can add a profile photo to it.
- **Delete My Account:** the library card has a Delete my account button. After typing DELETE, the member's pictures, shelves, books, share links and account are all deleted.
- **Privacy Page:** a plain-language page explaining what Itsuka keeps, who can see it and how to delete it, linked from the tag at the bottom of every page.
- **Private Shelves:** each member only ever sees their own sections, books, notes and pictures, unless they choose to share a shelf.
- **Share a Shelf:** the Share button on the Edit sections card makes a private link to one shelf. Anyone with the link can look at its books and add them to their own library, without seeing the owner's other shelves, email or done marks. Stop sharing turns the link off straight away.
- **Pull a Book:** the Pull a book button picks a random book that is not done. A light hops along a few spines before the chosen book rises off its shelf and opens.
- **Dusty Books:** a book that has not been opened for 2 months gathers dust on its spine, more at 4 months and a cobweb at 8 months. Opening it blows the dust off. Done books never gather dust, and the Settings switch turns it off.
- **Share Into Itsuka:** on Android, once Itsuka is on the home screen it appears in the Share menu of Instagram, Pinterest and other apps. Sharing a link opens a new catalogue card with the link and name filled in. `library.html?add=` followed by a link does the same, ready for an iPhone shortcut.
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
| `shelf.html` | The page a shared shelf's link opens |
| `privacy.html` | What Itsuka keeps, who can see it and how to delete it |
| `login.html` | The library card: sign in, register and reset a password |
| `styles.css` | How everything looks |
| `config.js` | Which Supabase project the site talks to |
| `auth.js` | Signing in, registering and signing out (used by every page) |
| `login.js` | The form on the library card |
| `index.js` | The landing page: the item on the title shelf, its picker, the How it works card and the Library button for members |
| `member.js` | Checks for a card on the library page, sends anyone without one to the landing page and shows the member's card, including Delete my account. It also sends a visitor back to a shared shelf after they sign in |
| `pictures.js` | Shrinks, stores and draws pictures (book pictures and card photos) |
| `shelves.js` | Draws the books and shelves, opens and closes books and keeps books in order (used by the library and the shared shelf page) |
| `library.js` | The plaques, shelves and books, the cards for adding to them and the Share card |
| `shelf.js` | The shared shelf page: shows the shelf and adds its books to the visitor's library |
| `backgrounds.js` | The pixel scenes, background picker and colour themes (used by every page) |
| `.github/workflows/keep-awake.yml` | Visits the Supabase project once a day so the free project never pauses for inactivity |
| `supabase.sql` | Sets up the database, the picture storage, shelf sharing and account deleting in a new Supabase project. Run once |
| `manifest.json` | Lets a phone add the site to its home screen like an app, and puts Itsuka in the Share menu on Android |
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
2. Open **SQL Editor**, start a new query, paste in everything from `supabase.sql` and press **Run**. Do this once. It creates the tables that hold each member's sections and books, the private storage for book pictures and card photos, the size limits that stop anyone storing oversized pictures or text by going around the website, and what shelf sharing and deleting an account need.
3. Go to **Authentication > URL Configuration**. Set **Site URL** to the address your site runs at, and add that address ending in `/**` to **Redirect URLs**. For Live Server that is `http://127.0.0.1:5500/**`. The links in the confirmation and password reset emails only lead back to the site if its address is on this list.
4. Under **Authentication > Sign In / Providers**, **Confirm email** decides whether new members must confirm their email address before their first sign-in. Switching it off is handy while building. Switch it on before you share the site.
5. Supabase's built-in email only delivers to people on your own Supabase team. To let anyone register, connect an email provider such as Resend under **Authentication > Emails > SMTP Settings**. The provider's key is a secret and belongs only in the Supabase dashboard.
6. In `index.html` and `shelf.html`, change the `https://itsuka.co.za` addresses near the top (`og:url` and `og:image`) to your own site's address, so shared links show your preview. Do the same in `.github/workflows/keep-awake.yml`, and change the contact email in `privacy.html` to your own.

If both values in `config.js` are left empty, login is off and the library shows a few example shelves that are not saved anywhere.

## Never put these in the project:

- The database password
- Any key starting with `sb_secret_`

The publishable key in `config.js` (it starts with `sb_publishable_`) is meant to be seen by browsers, so it is safe to publish.

## Credits:
Developed by Sav.