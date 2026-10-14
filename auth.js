// This file contains all relevant code for user accounts, it's used by every page and loads after the Supabase library and config.js

// Settings is declared to hold our project's address and key, we also make sure it uses an empty list when the config.js isn't found
const Settings = window.LIBRARY_CONFIG || {};

// LoginIsSetUp is set to true once both values have been pasted into the config.js
const LoginIsSetUp = Boolean(Settings.supabaseUrl && Settings.supabaseKey);

// ArrivedWith holds what the address bar held when the page opened
const ArrivedWith = location.search + location.hash;

// DB is our connection to Supabase, it stays null if login is not set up or the library can't be downloaded
let DB = null;

// Window.supabase is the Supabase library, loaded by the <script> tag
if (LoginIsSetUp && window.supabase)
{
  DB = window.supabase.createClient(Settings.supabaseUrl, Settings.supabaseKey);
}

// The CurrentMember function checks who is signed in and returns the member, async ensures the function waits for the data as well
async function CurrentMember()
{
  // no connection, so nobody can be signed in
  if (!DB) return null;
  const { data: Data } = await DB.auth.getSession();
  return Data.session ? Data.session.user : null;
}

// The SignIn function just ensures the credentials of the user when signing in
function SignIn(Email, Password)
{
  return DB.auth.signInWithPassword({ email: Email, password: Password });
}

// The Register function will create a new user account as long as that email is not already attached to an account
function Register(Name, Email, Password)
{
  // The signUp creates the account and the "options" carries the extras
  return DB.auth.signUp(
  {
    email: Email,
    password: Password,
    options:
    {
      data: { name: Name }, // Kept with the account and shown on their card
      emailRedirectTo: new URL("library.html", location.href).href, // The confirmation email sends them back to the library page
    },
  });
}

// The ResendConfirmation function will email the confirmation link again to a user who registered but has not confirmed their email yet
function ResendConfirmation(Email)
{
  return DB.auth.resend({ type: "signup", email: Email, options: { emailRedirectTo: new URL("library.html", location.href).href } });
}

// The SignOut function will log the user out of their current session (dump the sign in information)
function SignOut()
{
  return DB.auth.signOut();
}

// The SendPasswordReset function will email the user with a link, as well as take them back to the login page
function SendPasswordReset(Email)
{
  return DB.auth.resetPasswordForEmail(Email, { redirectTo: new URL("login.html?reset=1", location.href).href });
}

// Forgotten password, part 2: once the link has signed them in, save the new password they type
// The SetNewPassword function is a secondary part of the SendPasswordReset as once the user has created their new password we save it to our DB
function SetNewPassword(Password)
{
  return DB.auth.updateUser({ password: Password });
}

// Details printed on a member's card:

// The MemberName function will store the name they registered with, when not provided it will just use the email before the @ symbol
function MemberName(Member)
{
  return (Member.user_metadata && Member.user_metadata.name) || Member.email.split("@")[0];
}

// The CardNumber function will make the card number on the member card from their account Id
function CardNumber(Member)
{
  // We take the id and drop the dashes while keeping the first 8 characters. We read that as a hexadecimal number and keep the last 8 digits
  const Digits = String(parseInt(Member.id.replace(/-/g, "").slice(0, 8), 16) % 100000000).padStart(8, "0");
  // We then print it in two groups of four as a real card number would be
  return "No. " + Digits.slice(0, 4) + " " + Digits.slice(4);
}

// The MemberSince function stores when the account was created
function MemberSince(Member)
{
  return new Date(Member.created_at).toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

// Page Error Handling:

// The ExplainDatabase function turns Supabase's error messages, which are written for developers, into messages a member can act on
function ExplainDatabase(error)
{
  // We make all text lowercase so that they can be standardised despite Supabase capitalising them
  const Text = (error.message || "").toLowerCase();
  if (Text.includes("bucket not found") || Text.includes("row-level security"))
  {
    return "Picture storage is not set up in Supabase yet. Run supabase.sql in the SQL Editor, then try again.";
  }
  if (Text.includes("could not find the table") || Text.includes("permission denied") || Text.includes("does not exist"))
  {
    return "The shelves are not set up in Supabase yet. Run supabase.sql in the SQL Editor, then reload this page.";
  }
  if (Text.includes("shelf is full")) return "This shelf is full, it already has five people on it.";
  if (Text.includes("invite link is not turned on")) return "This invite link is turned off. Ask the shelf's owner for a fresh one.";
  if (Text.includes("only the shelf owner")) return "Only the shelf's owner and whoever added this book can change it.";
  if (Text.includes("shelf_members") || Text.includes("invite_key") || Text.includes("join_shelf") || Text.includes("invite_info") || Text.includes("shelf_people")) return "Joint shelves are not set up in Supabase yet. Run supabase-joint.sql in the SQL Editor, then try again.";
  // A missing column or function means only part of supabase.sql is in the project
  if (Text.includes("could not find the") && (Text.includes("column") || Text.includes("function"))) return "Part of the library is not set up in Supabase yet. Run supabase.sql in the SQL Editor, then try again.";
  if (Text.includes("could not be read as a picture")) return "That file could not be read as a picture. Try a JPG or PNG.";
  if (Text.includes("check constraint")) return "That is longer than the library can keep. Shorten it and try again.";
  if (Text.includes("maximum allowed size") || Text.includes("mime type")) return "That picture could not be stored. Try a smaller JPG or PNG.";
  if (Text.includes("failed to fetch") || Text.includes("network")) return "Could not reach the library. Check your internet connection and try again.";

  // If anything is not recognised above we show Supabase's own error message
  return "Something went wrong: " + (error.message || "unknown error");
}