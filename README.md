# Itsuka

A cosy pixel-art library for saving the links to Instagram pages, creators and small businesses you want to support or use later.

Itsuka (いつか) is Japanese for "someday". You find someone on Instagram or Pinterest whose work you love but can't buy from yet, or want to use as inspiration later, so you put them on a shelf and come back someday.

**Live site:** https://itsuka.co.za

## What it does:

- **Landing Page:** the first page everyone sees is the name Itsuka spelled out as six books on a shelf, with buttons to get a library card, sign in or read how it works. A member who is already signed in gets a Library button instead. Visitors can also choose what sits at the end of the shelf: tea and books, a cat, an armchair, a plant or a lantern.
- **Search:** the Find button on the library page opens a search box that finds a book by its name or notes.
- **Shelves and Books:** every saved creator / page is a book on a shelf. Hover or tap a spine and it opens to show a picture, your notes and a link.
- **Move Books:** drag a book by its spine to move it along its shelf or onto another section's shelf. On a phone, rest a finger on the spine until the book lifts, then drag.
- **Sections:** shelves are grouped under plaques such as Artists or Work Ideas. Each plaque switches its section on or off, so you can view one, a few or all of them. When there are more plaques than fit, the row slides, with brass arrows at each end, and Edit sections always stays in view. On a laptop, the Shelves down the side setting (off to start with) stands the plaques in a list beside the shelves instead. The Edit sections card moves a section up or down, and sets the order of its books: your own order (by dragging), A to Z, newest first or oldest first. A sorted shelf keeps new books in that order.
- **Settings:** the Settings button opens a journal with a bookmark for each page: Background, Shelves (a lever for each shelf tool: Find, the done mark, Hide done, Pull a book, dragging, shelf ornaments, opening books on hover, dusty books, shelves down the side and the swaying sign, plus your colour on joint shelves), Library, Phone and Help. On a phone the bookmarks run across the top. The shelf tools are saved with the member's account, so they follow them to every device.
- **Reading Record:** the library card has a Reading record button that opens a manila record card. Every book the member ticks done is stamped with the day in brown ink, month by month, with totals (this month, all time, busiest shelf) and the book that has waited longest. The database stamps the day and keeps each line even after the book is deleted, until the member presses Take off; unticking Done takes the line off again. On a joint shelf a book goes on the record of whoever ticked it. Books ticked before the record began are listed at the end without a day.
- **Undo:** deleting a book or a whole section still asks first, then a taped note with an Undo button waits for 8 seconds. Undo puts everything back where it was. The delete is only saved once the note runs out, or straight away if the page is closed or put away.
- **Open Without Signal:** a copy of the shelves is kept on the device and brought up to date after every change, and `sw.js` keeps a copy of the site's own files. With no signal the library still opens, showing the shelves as they were last time under a small hanging sign that matches the background. Books can be opened and found, while adding and changing them waits for the signal. When the signal comes back the shelves are fetched again and the sign comes down. The sign sways gently, and the Swaying sign setting keeps it still. The copy is removed on sign out. Pictures need the signal.
- **Download and Load a Copy:** on the Library page of Settings, Download a copy saves the whole library, pictures included, as one file. Load a copy adds the books from such a file back in, skipping any already on the same shelf.
- **Library Card:** members register and sign in with a library card, and can add a profile photo to it.
- **Delete My Account:** the library card has a Delete my account button. After typing DELETE, the member's pictures, shelves, books, share links and account are all deleted.
- **Ledger:** a page only the library keeper can open, from a Ledger button on their library card. It shows totals only: how full the free plan's picture storage, database and member limits are (amber from 70%, red from 90%), when the pictures will fill up at the current rate, how many members visited today, this week and this month, new members and books added each week, emails sent against Resend's limits, whether the daily keep-awake visit came in, and when the pinned Supabase library is due its three-monthly check (change `VERSION_CHECKED` in `ledger.js` after each check). Visits are counted by keeping only the date of each member's latest visit, as the privacy page explains.
- **Privacy Page:** a plain-language page explaining what Itsuka keeps, who can see it and how to delete it, linked from the tag at the bottom of every page.
- **Private Shelves:** each member only ever sees their own sections, books, notes and pictures, unless they choose to share a shelf.
- **Joint Shelves:** the Invite button on the Edit sections card makes a link that lets up to four friends join one shelf. Everyone on it can add books, move them and tick them done, only the owner and whoever added a book can change it, and only the owner can rename, share or delete the shelf or remove people. Each person picks a colour in Settings: it marks the books they add (a stripe on the spine and an Added by line inside), and the ribbon on a joint shelf's plaque is its owner's colour. Sorting and where the shelf sits among the plaques are each person's own. Books stay when someone leaves, and the shelf passes to whoever joined first if its owner deletes their account. Changes show up for everyone on the shelf straight away, with a small taped note saying who did what, and wait while someone is dragging a book, has one open or has a card open. Changes made while someone is away wait for them as a letter on the shelf's plaque, opened as a journal page; the database keeps a short log of these changes for 30 days, and reading a letter on one device clears it on all of them.
- **Share a Shelf:** the Share button on the Edit sections card makes a private link to one shelf. Anyone with the link can look at its books and add them to their own library, without seeing the owner's other shelves, email or done marks. Stop sharing turns the link off straight away.
- **Pull a Book:** the Pull a book button picks a random book that is not done. A light hops along a few spines before the chosen book rises off its shelf and opens.
- **Two kinds of card:** cards for doing something to a book or shelf (adding or editing a book, Edit sections, Share, Invite, the library card) are catalogue cards. Pages for reading or setting things (Settings, the Guide, What's new, How it works, Add to home screen and the letters) are journal pages.
- **Guide and What's New:** the Guide button next to Settings (on a phone, in Settings under Help) explains every feature in short groups. After an update, members see a What's new card once, listing only what changed since their last visit, with Show me buttons. A brand-new member gets a short tour of taped notes beside the shelves, Add a book, Edit sections and the Guide (Settings on a phone).
- **Dusty Books:** a book that has not been opened for 2 months gathers dust on its spine, more at 4 months and a cobweb at 8 months. Opening it blows the dust off. Done books never gather dust, and the Settings switch turns it off.
- **Share Into Itsuka:** on Android, once Itsuka is on the home screen it appears in the Share menu of Instagram, Pinterest and other apps. Sharing a link opens a new catalogue card with the link and name filled in. On iPhone, the Itsuka shortcut (linked in Settings: https://www.icloud.com/shortcuts/4c29b0fcae1b4f10b5e615784edd1c0e) does the same from the Share menu by opening `library.html?add=` followed by the link.
- **Done Mark:** tick Done inside a book once you have visited, bought or used it. The book gets a ribbon on its spine and a stamp inside, and the Hide done button tucks the finished books away.
- **Pictures:** one picture per book, shrunk before upload and drawn in a pixel style to match the library.
- **Backgrounds:** ten animated pixel scenes (cabin fireplace, green woodland, campfire night, snowy cabin, rainy café, autumn forest, attic nook, grand library, mountain temple and keeper's cottage). The shelves, books and plaques change colour to match the one you pick. The background is chosen on each device. Shuffle, the first picture, picks a new one each visit (each time Itsuka is opened in a new tab or from the home screen) or each day, never the same one twice in a row; any background can be unticked to leave it out, as long as two stay in.
- **Phone and Laptop:** the layout and the backgrounds fit both. On a phone the site can be added to the home screen, where it opens like an app. An Add to home screen button, in How it works on the landing page and on the Phone page of Settings, installs it in one tap where the browser allows (Chrome, Edge and Samsung Internet, on Android and laptops) and shows the steps for that phone everywhere else, like on iPhone. It hides once Itsuka is on the home screen.

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
| `join.html` | The page a joint shelf's invite link opens |
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
| `guide.js` | The Guide card, the What's new card (with the list of updates, NEWS) and the welcome tour on the library page |
| `library.js` | The plaques, shelves and books, the cards for adding to them, the Share card and the Undo note after deleting |
| `joint.js` | Joint shelves on the library page: the Invite card, leaving, removing people and choosing your colour |
| `live.js` | Live joint shelves: listens for changes other people make, redraws the shelves and shows the notes |
| `letters.js` | Letters on joint shelves: reads the shelf log, puts a letter on the plaque of a shelf that changed while the member was away and opens it as a journal page |
| `offline.js` | Opening without signal: keeps the copy of the shelves on the device, opens it when the library cannot be reached and hangs the No signal sign until the signal is back |
| `record.js` | The reading record: fetches the member's record and fills the record card opened from the library card |
| `sw.js` | Keeps a copy of the site's own files so it can open with no signal, always trying the internet first so updates arrive straight away |
| `join.js` | The Join page: shows the invite and adds the visitor to the shelf |
| `shelf.js` | The shared shelf page: shows the shelf and adds its books to the visitor's library |
| `backgrounds.js` | The pixel scenes, background picker and colour themes (used by every page) |
| `.github/workflows/keep-awake.yml` | Visits the Supabase project once a day so the free project never pauses for inactivity, and saves the day's totals for the Ledger |
| `supabase.sql` | Sets up the database, the picture storage, shelf sharing, joint shelves, live joint shelves, the Ledger, account deleting, the security rules, the letters on joint shelves and the reading record in a new Supabase project. Run once |
| `ledger.html` | The Ledger, only for the library keeper |
| `ledger.js` | Fills the Ledger from the database: the gauges, the charts and the upkeep checks |
| `install.js` | The Add to home screen buttons on the landing page and in Settings: a one-tap install where the browser allows it, the steps for each phone everywhere else |
| `manifest.json` | Lets a phone add the site to its home screen like an app, and puts Itsuka in the Share menu on Android |
| `robots.txt` | Tells search engines they may visit the site and where the sitemap is (private pages carry a noindex tag instead) |
| `sitemap.xml` | The list of pages search engines should show: the landing page and the privacy page |
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
2. Open **SQL Editor**, start a new query, paste in everything from `supabase.sql` and press **Run**. Do this once. It creates the tables that hold each member's sections and books, the private storage for book pictures and card photos, the size limits that stop anyone storing oversized pictures or text by going around the website, and what shelf sharing, joint shelves, live joint shelves and deleting an account need.
3. Go to **Authentication > URL Configuration**. Set **Site URL** to the address your site runs at, and add that address ending in `/**` to **Redirect URLs**. For Live Server that is `http://127.0.0.1:5500/**`. The links in the confirmation and password reset emails only lead back to the site if its address is on this list.
4. Under **Authentication > Sign In / Providers**, **Confirm email** decides whether new members must confirm their email address before their first sign-in. Switching it off is handy while building. Switch it on before you share the site.
5. Supabase's built-in email only delivers to people on your own Supabase team. To let anyone register, connect an email provider such as Resend under **Authentication > Emails > SMTP Settings**. The provider's key is a secret and belongs only in the Supabase dashboard.
6. In `index.html`, `shelf.html` and `join.html`, change the `https://itsuka.co.za` addresses near the top (`og:url` and `og:image`) to your own site's address, so shared links show your preview. Do the same in `.github/workflows/keep-awake.yml`, and change the contact email in `privacy.html` to your own.

7. To open the Ledger, register on your site, then in the SQL Editor run the three Library Keeper lines at the end of `supabase.sql` with your own email in them. A Ledger button then appears on your library card.

If both values in `config.js` are left empty, login is off and the library shows a few example shelves that are not saved anywhere.

## Keeping it safe:

- Everything a member types (names, notes, links, passwords) is sent to Supabase as plain data, never as part of a database command, so it cannot be used for SQL injection. The database has no hand-built commands.
- Every table has row-level security: a member only reaches their own shelves and the joint shelves they joined. Visitors who are not signed in only reach a shared shelf, its pictures and an invite link, each by its long random key.
- On a joint shelf, who added a book and who owns it are set by the database and cannot be changed from a browser. A book's picture must be one the member uploaded, and its link must start with http:// or https://.
- Everything is written onto the page as text, never as HTML, and only web addresses become clickable links.
- Passwords are handled by Supabase and never reach the site's code or the database tables.

## Never put these in the project:

- The database password
- Any key starting with `sb_secret_`

The publishable key in `config.js` (it starts with `sb_publishable_`) is meant to be seen by browsers, so it is safe to publish.

## Credits:

Developed by Sav.