// This file contains the code for the Join page (join.html), it shows a joint shelf someone was invited to and adds them to it when they press Join

// InviteKey is the key on the end of the invite link (join.html?k=...)
const InviteKey = new URLSearchParams(location.search).get("k") || "";

// Visitor holds the signed-in visitor, or null when nobody is signed in
let Visitor = null;
// Invite holds what the database says about the invite: the shelf's name, its people, how many books and how much room is left
let Invite = null;

// RETURN_KEY is the note this device keeps of the invite a visitor left to sign in, member.js sends them back here afterwards
const RETURN_KEY = "library-return";

// The parts of the page this file fills in
const JoinBanner = document.getElementById("joinBanner");
const JoinFrom = document.getElementById("joinFrom");
const JoinTitle = document.getElementById("joinTitle");
const JoinCount = document.getElementById("joinCount");
const JoinFaces = document.getElementById("joinFaces");
const JoinPeople = document.getElementById("joinPeople");
const JoinButton = document.getElementById("joinButton");
const JoinStatus = document.getElementById("joinStatus");
const TopLink = document.getElementById("topLink");
const CardAsk = document.getElementById("cardAsk");

// Small helpers:

// The NoteReturn function remembers this invite on the device, so signing in or getting a card brings the visitor back to it
function NoteReturn()
{
  Remember(RETURN_KEY, JSON.stringify({ to: "join.html?k=" + InviteKey, at: Date.now() }));
}

// The NameList function joins names the way a person would say them: Sevar, Lerato and Thabo
function NameList(Names)
{
  return Names.length < 2 ? Names.join("") : Names.slice(0, -1).join(", ") + " and " + Names[Names.length - 1];
}

// The ShowGone function shows a message in place of the invite, for a link that is broken or turned off
function ShowGone(Title, Text)
{
  JoinBanner.hidden = true;
  const Gone = Make("div", "empty-library");
  Gone.setAttribute("role", "alert");
  Gone.append(Make("h2", "", Title), Make("p", "", Text));
  const Home = Make("a", "plain-button gone-home", "Go to Itsuka");
  Home.href = "index.html";
  Gone.append(Home);
  LibraryRoot.replaceChildren(Gone);
}

// The ShowStatus function shows a red message under the Join button
function ShowStatus(Message)
{
  JoinStatus.textContent = Message;
  JoinStatus.hidden = !Message;
}

// Showing the invite:

// The RenderInvite function fills in the banner: who invited them, the shelf, its people in their colours and the Join button
function RenderInvite()
{
  const People = Array.isArray(Invite.people) ? Invite.people : [];
  const Keys = ColourKeys(People);
  const Owner = People[0] ? People[0].name : "Someone";
  const Books = Number(Invite.books) || 0;
  JoinFrom.textContent = Owner + " invited you to join";
  JoinTitle.textContent = Invite.name;
  JoinCount.textContent = "A joint shelf with " + Books + (Books === 1 ? " book" : " books") + ". Everyone on it can add books, move them and tick them done.";
  JoinFaces.replaceChildren();
  People.forEach((Person, i) =>
  {
    const Face = Make("i");
    Face.style.setProperty("--who", ColourOf(Keys[i]));
    JoinFaces.append(Face);
  });
  JoinPeople.textContent = NameList(People.map((Person) => Person.name)) + " · " + People.length + " of 5 places taken";
  document.title = "Join " + Invite.name + ": Itsuka";

  if (Invite.joined)
  {
    JoinButton.textContent = "You are on this shelf, open your library";
  }
  else if (Invite.room <= 0)
  {
    JoinButton.textContent = "This shelf is full";
    JoinButton.disabled = true;
  }
  JoinBanner.hidden = false;
}

// The JoinShelf function adds the visitor to the shelf and takes them to their library, someone without a card is asked to get one first
async function JoinShelf()
{
  if (Invite.joined) { location.href = "library.html"; return; }
  if (!Visitor) { NoteReturn(); CardAsk.showModal(); return; }
  JoinButton.disabled = true;
  JoinButton.textContent = "Joining…";
  ShowStatus("");
  try
  {
    const { error } = await DB.rpc("join_shelf", { key: InviteKey });
    if (error) throw error;
    location.href = "library.html";
  }
  catch (error)
  {
    console.error(error);
    ShowStatus(ExplainDatabase(error));
    JoinButton.disabled = false;
    JoinButton.textContent = "Join this shelf";
  }
}

JoinButton.addEventListener("click", JoinShelf);

// Not now closes the card, a click outside it does too
document.getElementById("cardAskClose").addEventListener("click", () => CardAsk.close());
CardAsk.addEventListener("click", (event) => { if (event.target === CardAsk) CardAsk.close(); });

// Start:

// The StartJoinPage function runs when the page opens: it checks who is visiting, fetches the invite and shows it
async function StartJoinPage()
{
  try { Visitor = await CurrentMember(); }
  catch (error) { console.error(error); }        // if the sign-in cannot be read we treat it as nobody being signed in

  // A signed-in visitor gets a way into their own library, everyone else gets Sign in, which brings them back here afterwards
  if (Visitor)
  {
    TopLink.textContent = "Your library";
    TopLink.href = "library.html";
  }
  else
  {
    TopLink.addEventListener("click", NoteReturn);
    document.getElementById("cardAskRegister").addEventListener("click", NoteReturn);
    document.getElementById("cardAskSignIn").addEventListener("click", NoteReturn);
  }
  document.body.classList.remove("checking");

  if (!/^[A-Za-z0-9_-]{24,64}$/.test(InviteKey))
  {
    ShowGone("This link is not complete", "The end of the invite link seems to be missing. Ask whoever sent it for the full link.");
    return;
  }
  if (!DB)
  {
    ShowGone("The invite could not be opened", LoginIsSetUp ? "Could not load the library service. Check your internet connection and reload this page." : "Login is not connected yet, so invites cannot be opened.");
    return;
  }

  try
  {
    const Result = await DB.rpc("invite_info", { key: InviteKey });
    if (Result.error) throw Result.error;
    Invite = Result.data;
  }
  catch (error)
  {
    console.error(error);
    ShowGone("The invite could not be opened", ExplainDatabase(error));
    return;
  }
  if (!Invite)
  {
    ShowGone("This invite link is turned off", "Its owner may have turned the link off, or it was not copied in full. Ask them for a fresh invite.");
    return;
  }
  RenderInvite();
}
StartJoinPage();
