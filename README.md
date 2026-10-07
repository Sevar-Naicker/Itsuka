# My library

A cosy pixel-art library for saving the artists, creators and small businesses you want to support later.

## Files

| File | What it is |
| --- | --- |
| `index.html` | The library itself: plaques, shelves, books |
| `login.html` | The library card: sign in and register |
| `styles.css` | How everything looks |
| `backgrounds.js` | The pixel scenes, background picker and colour themes |
| `library.js` | The plaques, shelves and books, and the cards for adding to them |
| `config.js` | Your Supabase project address and public key |
| `auth.js` | Signing in, registering and signing out (used by both pages) |
| `login.js` | The form on the library card |
| `member.js` | Checks for a card on the main page and shows the member's card |
| `pictures.js` | Shrinks, stores and draws pictures (book pictures and card photos) |
| `supabase-setup.sql` | Creates the tables for sections and books. Run once in Supabase |
| `supabase-pictures.sql` | Creates the storage for pictures. Run once in Supabase |

All of them must stay in the same folder.

## Turning login on

1. Open your Supabase project and press **Connect**. Copy the **Project URL** and the **Publishable key** into `config.js`, between the quotes.
2. In Supabase go to **Authentication > Sign In / Providers > Email** and switch **Confirm email** off while you are building. With it off, registering signs you straight in. Switch it back on before you share the site.

3. In Supabase open **SQL Editor**, start a new query, paste in everything from `supabase-setup.sql` and press **Run**. Do this once. It creates the tables that hold each member's sections and books.
4. Do the same with `supabase-pictures.sql`. It creates the storage for book pictures and card photos.

5. For the "Forgot password?" emails: in Supabase go to **Authentication > URL Configuration** and add the address you run the site from to **Redirect URLs**, ending in `/**`. For Live Server that is `http://127.0.0.1:5500/**`. Without it, the link in the email does not lead back to the library card.

While `config.js` is empty, login is off and the library shows a few example shelves that are not saved anywhere.

## Running it on your computer

Use a small local web server instead of double-clicking the files, so both pages share the same sign-in:

- **VS Code:** install the Live Server extension, right-click `login.html` and choose "Open with Live Server".
- **Python:** open a terminal in this folder, run `python -m http.server 8000`, then visit `http://localhost:8000/login.html`.

## Never put these in the project

- The database password
- Any key starting with `sb_secret_`
