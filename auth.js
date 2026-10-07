// This file contains all relavent code for user accounts, its used by both pages and loads after the Supabase library and config.js

// Settings is declared to hold our projects adress and key, we also make sure it uses an empty list when they congif.js isnt found
const Settings = window.LIBRARY_CONFIG || {};

// LoginIsSetUp is set to true once both values have been pasted into the config.js
const LoginIsSetUp = Boolean(Settings.supabaseUrl && Settings.supabaseKey);

// ArrivedWith holds what the adress bar held when the page opened.
const ArrivedWith = location.search + location.hash;

// DB is our connection to Supabase, it stays null if login is not set up or the library cant be downloaded
let DB = null;

// Window.supabase is the Supabase library, loaded by the <script> tag
if (LoginIsSetUp && window.supabase) 
{
  DB = window.supabase.createClient(Settings.supabaseUrl, Settings.supabaseKey);
}

// The CurrentMember function checks who is signed in and returns the member, async ensures the functions waits for the data aswell
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
function Register(Name, Email, Password) {
  // The signUp creates the account and the "options" carries the extras
  return DB.auth.signUp(
  {
    email: Email,
    password: Password,
    options: 
    {
      data: { name: Name }, // k=Kept with the account and shown on their card
      emailRedirectTo: new URL("index.html", location.href).href, // The confirmation email sends them back to the index page (home page)
    },
  });
}

// The SignOut functions will log the user out of thier current session (dunp sign in information)
function SignOut() 
{
  return DB.auth.signOut();
}

// The SendPasswordReset function will email the user with a link, as well as take them back to the login page 
function SendPasswordReset(Email) 
{
  return DB.auth.resetPasswordForEmail(Email, { redirectTo: new URL("login.html?reset=1", location.href).href });
}

// Forgotten password, part 2: once the link has signed them in, save the new password they type.
// The SetNewPassword function is a secodary part of the SendPasswordReset as once the user has created thier new password we save it to out DB
function SetNewPassword(Password) 
{
  return DB.auth.updateUser({ password: Password });
}

// Details printed on a member's card:

// The MemberName function will store the name they registered with , when not provided the it will just use the email before the @ symbol
function MemberName(Member) 
{
  return (Member.user_metadata && Member.user_metadata.name) || Member.email.split("@")[0];
}

// The CardNumber function will take the make the car number on the member card from thier account Id
function CardNumber(Member) 
{
  // We take the id and drop the dashes while keeping the first 8 characters. We read that a hexadecimal number and keep the last 8 digits
  const Digits = String(parseInt(Member.id.replace(/-/g, "").slice(0, 8), 16) % 100000000).padStart(8, "0");
  // We then print it in two groups of four as a real card number would be
  return "No. " + Digits.slice(0, 4) + " " + Digits.slice(4);
}

// The MemberSince function stores when the account was created
function MemberSince(Member) 
{
  return new Date(Member.created_at).toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

// Page Error Handeling:

//The function ExplainDatabase function are essentially Supabase error messages that are written for developers
function ExplainDatabase(error) 
{
  // We make all text lowercase so that they can be standerdised dispite Supabase capetalising it later
  const Text = (error.message || "").toLowerCase();
  if (Text.includes("bucket not found") || Text.includes("row-level security")) 
  {
    return "Picture storage is not set up in Supabase yet. Run supabase-pictures.sql in the SQL Editor, then try again.";
  }
  if (Text.includes("could not find the table") || Text.includes("permission denied") || Text.includes("does not exist")) 
  {
    return "The shelves are not set up in Supabase yet. Run supabase-setup.sql in the SQL Editor, then reload this page.";
  }
  if (Text.includes("could not be read as a picture")) return "That file could not be read as a picture. Try a JPG or PNG.";
  if (Text.includes("failed to fetch") || Text.includes("network")) return "Could not reach the library. Check your internet connection and try again.";

  // If anything is not recognised above we show Supabase's own error message
  return "Something went wrong: " + (error.message || "unknown error");
}