// This file contains joint shelves on the library page: the Invite card, leaving a shelf, removing people and choosing your colour, it loads after library.js and uses its functions

// MAX_PEOPLE is how many people a joint shelf can have, the owner included
const MAX_PEOPLE = 5;

// The parts of the Invite card
const InviteDialog = document.getElementById("inviteDialog");
const InviteTitle = document.getElementById("inviteTitle");
const InviteNote = document.getElementById("inviteNote");
const InviteAbout = document.getElementById("inviteAbout");
const InviteLinkLine = document.getElementById("inviteLinkLine");
const InviteLink = document.getElementById("inviteLink");
const InviteMake = document.getElementById("inviteMake");
const InviteActions = document.getElementById("inviteActions");
const InviteCopy = document.getElementById("inviteCopy");
const InviteSend = document.getElementById("inviteSend");
const InviteStop = document.getElementById("inviteStop");
const PeopleHead = document.getElementById("peopleHead");
const PeopleCount = document.getElementById("peopleCount");
const PeopleList = document.getElementById("peopleList");

// Inviting holds the section the Invite card is open for
let Inviting = null;

// Saving to the database:

// The SetInviteKey function saves a shelf's invite key, a new key makes a new invite link and an empty one turns the link off
async function SetInviteKey(Section, Key)
{
  const { error } = await DB.from("sections").update({ invite_key: Key || null }).eq("id", Section.id);
  if (error) throw error;
  Section.invite_key = Key;
}

// The ForgetPerson function takes someone off a shelf in the page's list, the shelf is no longer joint once only the owner is left
function ForgetPerson(Section, MemberId)
{
  Section.people = Section.people.filter((Person) => Person.member_id !== MemberId);
  if (Section.people.length < 2)
  {
    Section.people = [];
    Section.joint = false;
  }
}

// The RemovePerson function takes someone off a shelf the member owns, the books they added stay on it
async function RemovePerson(Section, Person)
{
  const { error } = await DB.from("shelf_members").delete().eq("section_id", Section.id).eq("member_id", Person.member_id);
  if (error) throw error;
  ForgetPerson(Section, Person.member_id);
}

// The LeaveShelf function takes the member off a shelf someone else owns, it leaves their library but the books they added stay on it
async function LeaveShelf(Section)
{
  const { error } = await DB.from("shelf_members").delete().eq("section_id", Section.id).eq("member_id", MyId());
  if (error) throw error;
  Library = Library.filter((Other) => Other !== Section);
  Chosen.delete(Section.id);
}

// The Invite card:

// The InviteAddress function returns the full invite link for a key
function InviteAddress(Key)
{
  return new URL("join.html?k=" + Key, location.href).href;
}

// The ShowInviteCard function fills in the Invite card: the link (or the button that makes it) and the people on the shelf
function ShowInviteCard()
{
  const On = Boolean(Inviting.invite_key);
  const Count = Inviting.joint ? Inviting.people.length : 1;
  InviteTitle.textContent = "Invite to " + Inviting.name;
  InviteAbout.textContent = On
    ? "Anyone with this link can join “" + Inviting.name + "” and add books to it. Only you can rename or delete it, and your other shelves stay private."
    : "Make a link to invite up to " + (MAX_PEOPLE - 1) + " friends. Everyone who joins can add books, move them and tick them done. Only you can rename or delete the shelf, and your other shelves stay private.";
  InviteLinkLine.hidden = !On;
  InviteLink.value = On ? InviteAddress(Inviting.invite_key) : "";
  InviteMake.hidden = On;
  InviteActions.hidden = !On;
  InviteSend.hidden = !navigator.share;
  InviteStop.hidden = !On;
  InviteCopy.textContent = "Copy invite link";

  // The people on the shelf, the owner first
  PeopleHead.hidden = !Inviting.joint;
  PeopleCount.textContent = Count + " of " + MAX_PEOPLE + (Count >= MAX_PEOPLE ? ", the shelf is full" : "");
  PeopleList.replaceChildren();
  if (!Inviting.joint) return;
  Inviting.people.forEach((Person, Index) =>
  {
    const Row = Make("li");
    const Face = Make("i", "face");
    Face.style.setProperty("--who", ColourOf(Person.key));
    Row.append(Face, Make("b", "", Person.name + (Person.member_id === MyId() ? " (you)" : "")));
    if (Index === 0)
    {
      Row.append(Make("small", "", "Owner"));
    }
    else
    {
      const Remove = Make("button", "link-button danger-link", "Remove");
      Remove.type = "button";
      Remove.setAttribute("aria-label", "Remove " + Person.name + " from this shelf");
      Remove.addEventListener("click", async () =>
      {
        if (!(await AskToConfirm("Remove " + Person.name + " from “" + Inviting.name + "”? The books they added stay on the shelf.", "Remove"))) return;
        InviteNote.hidden = true;
        try
        {
          await RemovePerson(Inviting, Person);
          AfterInviteChange();
        }
        catch (error)
        {
          console.error(error);
          ShowCardNote(InviteNote, ExplainDatabase(error));
        }
      });
      Row.append(Remove);
    }
    PeopleList.append(Row);
  });
}

// The OpenInviteCard function opens the Invite card for one of the member's own shelves
function OpenInviteCard(Section)
{
  Inviting = Section;
  InviteNote.hidden = true;
  ShowInviteCard();
  InviteDialog.showModal();
  (Section.invite_key ? InviteCopy : InviteMake).focus();
  if (!JointIsSetUp) ShowCardNote(InviteNote, "Joint shelves are not set up in Supabase yet. Run supabase-joint.sql in the SQL Editor, then reload this page.");
}

// The AfterInviteChange function shows a change on the Invite card, the sections card and the shelves
function AfterInviteChange()
{
  ShowInviteCard();
  if (SectionsDialog.open) RenderSectionRows();
  RenderTabs();
  Update();
}

// Make an invite link gives the shelf an invite key, which turns its link on
InviteMake.addEventListener("click", async () =>
{
  InviteNote.hidden = true;
  InviteMake.disabled = true;
  try
  {
    await SetInviteKey(Inviting, NewShareKey());
    AfterInviteChange();
    InviteCopy.focus();
  }
  catch (error)
  {
    console.error(error);
    ShowCardNote(InviteNote, ExplainDatabase(error));
  }
  InviteMake.disabled = false;
});

// Copy invite link puts the link on the clipboard, older browsers copy the selected text in the link box instead
InviteCopy.addEventListener("click", async () =>
{
  try
  {
    await navigator.clipboard.writeText(InviteLink.value);
  }
  catch (error)
  {
    InviteLink.select();
    document.execCommand("copy");
  }
  InviteCopy.textContent = "Copied";
  setTimeout(() => { InviteCopy.textContent = "Copy invite link"; }, 2000);
});

// Send hands the link to the phone's own share menu
InviteSend.addEventListener("click", async () =>
{
  try
  {
    await navigator.share({ title: "Join " + Inviting.name + " on Itsuka", text: "Come and add to my " + Inviting.name + " shelf on Itsuka", url: InviteLink.value });
  }
  catch (error)
  {
    // closing the share menu without choosing an app counts as an error, so there is nothing to show
  }
});

// Tapping the link box selects all of it, ready to copy by hand
InviteLink.addEventListener("focus", () => InviteLink.select());

// Turn off invite link removes the key, so nobody new can join, the people already on the shelf stay
InviteStop.addEventListener("click", async () =>
{
  if (!(await AskToConfirm("Turn off the invite link for “" + Inviting.name + "”? Nobody new can join with it, and the people already on the shelf stay.", "Turn it off"))) return;
  InviteNote.hidden = true;
  try
  {
    await SetInviteKey(Inviting, "");
    AfterInviteChange();
    InviteMake.focus();
  }
  catch (error)
  {
    console.error(error);
    ShowCardNote(InviteNote, ExplainDatabase(error));
  }
});

document.getElementById("inviteClose").addEventListener("click", () => InviteDialog.close());
InviteDialog.addEventListener("click", (event) => { if (event.target === InviteDialog) InviteDialog.close(); });

// Your colour on joint shelves:

// The parts of the colour picker in Settings
const ColourPicker = document.getElementById("colourPicker");
const ColourNote = document.getElementById("colourNote");

// The MyColour function returns the colour the member chose, or an empty string when they have not chosen one
function MyColour()
{
  return (SignedIn && SignedIn.user_metadata && SignedIn.user_metadata.shelf_colour) || "";
}

// The TakenColours function returns the colours other people on the member's joint shelves have chosen
function TakenColours()
{
  const Taken = new Set();
  Library.forEach((Section) => Section.people.forEach((Person) => { if (Person.member_id !== MyId() && Person.colour) Taken.add(Person.colour); }));
  return Taken;
}

// The BuildColourPicker function makes one swatch per colour, in the current background's shades, a colour someone on one of your joint shelves has is shown as taken
function BuildColourPicker()
{
  document.getElementById("colourSection").hidden = !DB;
  if (!DB) return;
  const Taken = TakenColours();
  ColourPicker.replaceChildren();
  SHELF_COLOURS.forEach(([Key, Name]) =>
  {
    const Swatch = Make("button", "swatch");
    Swatch.type = "button";
    Swatch.style.setProperty("--who", ColourOf(Key));
    Swatch.setAttribute("aria-pressed", String(MyColour() === Key));
    Swatch.setAttribute("aria-label", Name + (Taken.has(Key) ? ", someone on one of your joint shelves has it" : ""));
    Swatch.title = Name + (Taken.has(Key) ? " (taken)" : "");
    Swatch.disabled = Taken.has(Key);
    Swatch.addEventListener("click", () => SaveMyColour(Key));
    ColourPicker.append(Swatch);
  });
}

// The SaveMyColour function saves the member's colour with their account, so it follows them to every device, and redraws their ribbon and stripes
async function SaveMyColour(Key)
{
  ColourNote.hidden = true;
  try
  {
    const { data: Data, error } = await DB.auth.updateUser({ data: { shelf_colour: Key } });
    if (error) throw error;
    SignedIn = Data.user;
    Library.forEach((Section) =>
    {
      const Me = Section.people.find((Person) => Person.member_id === MyId());
      if (!Me) return;
      Me.colour = Key;
      const Keys = ColourKeys(Section.people);
      Section.people.forEach((Person, i) => { Person.key = Keys[i]; });
    });
    BuildColourPicker();
    RenderTabs();
    Update();
  }
  catch (error)
  {
    console.error(error);
    ColourNote.textContent = ExplainDatabase(error);
    ColourNote.hidden = false;
  }
}

// The picker is rebuilt each time Settings opens, so it shows the current background's shades and who has which colour now
document.getElementById("sceneButton").addEventListener("click", BuildColourPicker);
