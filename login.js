// This file contains the code for the library card on login.html, the card has three modes: signin, register and newpassword

// The parts of the card this file changes
const CardForm = document.getElementById("cardForm");
const CardTitle = document.getElementById("cardTitle");
const CardNote = document.getElementById("cardNote");
const NameLine = document.getElementById("nameLine");
const EmailLine = document.getElementById("emailLine");
const ForgotLine = document.getElementById("forgotLine");
const SwitchLine = document.getElementById("switchLine");
const NameBox = document.getElementById("name");
const EmailBox = document.getElementById("email");
const PasswordBox = document.getElementById("password");
const SubmitButton = document.getElementById("cardSubmit");
const SwitchText = document.getElementById("switchText");
const SwitchButton = document.getElementById("switchMode");

// ButtonLabels holds the wording of the main button for each mode
const ButtonLabels = { signin: "Sign in", register: "Register", newpassword: "Save password" };
// Mode holds which mode the card is showing
let Mode = "signin";

// The SetMode function shows the right lines and labels for the mode the card is in
function SetMode(NewMode)
{
  Mode = NewMode;
  CardTitle.textContent = { signin: "Sign in", register: "Register", newpassword: "New password" }[Mode];
  SubmitButton.textContent = ButtonLabels[Mode];
  NameLine.hidden = Mode !== "register";
  EmailLine.hidden = Mode === "newpassword";
  ForgotLine.hidden = Mode !== "signin";
  SwitchLine.hidden = Mode === "newpassword";
  document.getElementById("passwordLabel").textContent = Mode === "newpassword" ? "New password" : "Password";
  PasswordBox.autocomplete = Mode === "signin" ? "current-password" : "new-password";
  SwitchText.textContent = Mode === "register" ? "Already have a card?" : "No card yet?";
  SwitchButton.textContent = Mode === "register" ? "Sign in" : "Register";
}

// The ShowNote function shows a message on the card, green when the kind is good and red otherwise
function ShowNote(Message, Kind)
{
  CardNote.textContent = Message;
  CardNote.className = "card-note" + (Kind === "good" ? " good" : "");
  CardNote.hidden = false;
}

// LinkExpired is the message shown when a reset link can no longer be used
const LinkExpired = "That reset link has expired or was already used. Use Forgot password to get a new one.";

// The Explain function turns Supabase's error messages into plain directions for the member
function Explain(error)
{
  const Text = (error.message || "").toLowerCase();
  if (Text.includes("invalid login")) return "That email and password do not match a card. Check them and try again.";
  if (Text.includes("not confirmed")) return "This card is waiting to be confirmed. Open the confirmation email, then sign in.";
  if (Text.includes("already registered")) return "There is already a card for that email. Sign in instead.";
  if (Text.includes("session missing")) return LinkExpired;
  if (Text.includes("different from the old")) return "That is your current password. Choose a different one.";
  if (Text.includes("password should")) return "Use a password of at least 6 characters.";
  if (Text.includes("rate limit") || Text.includes("security purposes")) return "Too many tries for now. Wait a few minutes and try again.";
  if (Text.includes("failed to fetch") || Text.includes("network")) return "Could not reach the library. Check your internet connection and try again.";
  return error.message || "Something went wrong. Try again.";
}

// The link at the bottom switches between Sign in and Register
SwitchButton.addEventListener("click", () =>
{
  SetMode(Mode === "register" ? "signin" : "register");
  CardNote.hidden = true;
});

// "Forgot password?": email a reset link to the address typed on the card.
document.getElementById("forgotButton").addEventListener("click", async () =>
{
  if (!DB) return;
  const Email = EmailBox.value.trim();
  if (!Email.includes("@")) { ShowNote("Type your email address above first, then press Forgot password."); EmailBox.focus(); return; }
  CardNote.hidden = true;
  try
  {
    const { error } = await SendPasswordReset(Email);
    if (error) ShowNote(Explain(error));
    // The same message whether or not that email has a card, so nobody can use this to find out who is a member.
    else ShowNote("If there is a card for " + Email + ", a reset link is on its way. It can take a minute to arrive.", "good");
  }
  catch (error)
  {
    ShowNote(Explain(error));
  }
});

// When the card is submitted we check the boxes and then sign in, register or save the new password
CardForm.addEventListener("submit", async (event) =>
{
  event.preventDefault();                       // stop the browser reloading the page, which is what forms do by default
  if (!DB) return;

  const Name = NameBox.value.trim();
  const Email = EmailBox.value.trim();
  const Password = PasswordBox.value;

  // Check the obvious things here, before asking Supabase.
  if (Mode === "register" && !Name) { ShowNote("Add the name to print on your card."); NameBox.focus(); return; }
  if (Mode !== "newpassword" && !Email.includes("@")) { ShowNote("Enter your email address."); EmailBox.focus(); return; }
  if (Password.length < 6) { ShowNote("Use a password of at least 6 characters."); PasswordBox.focus(); return; }

  SubmitButton.disabled = true;
  SubmitButton.textContent = { signin: "Checking your card\u2026", register: "Making your card\u2026", newpassword: "Saving\u2026" }[Mode];
  CardNote.hidden = true;

  try
  {
    if (Mode === "newpassword")
    {
      const { error } = await SetNewPassword(Password);
      if (!error) { location.href = "index.html"; return; }          // saved, and the link already signed them in
      ShowNote(Explain(error));
      if (Explain(error) === LinkExpired) SetMode("signin");
    }
    else
    {
      const { data: Data, error } = Mode === "register" ? await Register(Name, Email, Password) : await SignIn(Email, Password);
      if (error)
      {
        ShowNote(Explain(error));
      }
      else if (Data.session)
      {
        location.href = "index.html";           // signed in: into the library
        return;
      }
      else
      {
        // Registered, but Supabase wants the email confirmed before the first sign-in.
        SetMode("signin");
        ShowNote("Your card is ready. Open the confirmation email we sent to " + Email + ", then sign in here.", "good");
      }
    }
  }
  catch (error)
  {
    ShowNote(Explain(error));
  }
  // Still here, so it did not work (or the email needs confirming): give the button back.
  SubmitButton.disabled = false;
  SubmitButton.textContent = ButtonLabels[Mode];
});

// The StartLoginPage function runs when the page opens and decides which mode of the card to show
async function StartLoginPage()
{
  SetMode("signin");
  if (!LoginIsSetUp)
  {
    ShowNote("Login is not connected yet. Paste your Supabase details into config.js and reload this page. Until then the library is open to everyone.");
    SubmitButton.disabled = true;
    return;
  }
  if (!DB)
  {
    ShowNote("Could not load the login service. Check your internet connection and reload this page.");
    SubmitButton.disabled = true;
    return;
  }

  const Member = await CurrentMember();

  // Did they arrive from a password-reset email? (auth.js noted what was on the end of the address.)
  if (ArrivedWith.includes("reset=1") || ArrivedWith.includes("type=recovery"))
  {
    history.replaceState(null, "", location.pathname);                // tidy the address bar
    if (Member && !ArrivedWith.includes("error="))
    {
      SetMode("newpassword");                    // the link signed them in: let them choose a new password
      PasswordBox.focus();
    }
    else
    {
      ShowNote(LinkExpired);
    }
    return;
  }

  if (Member) location.replace("index.html");    // already signed in: no need to show the card
}
StartLoginPage();
