// This file contains the drafts on the catalogue card: while a book is being added or edited, what has been typed is kept on this device, so leaving the page, reloading it or closing the card by accident loses nothing
// It loads after library.js, comeback.js and pages.js and uses their parts of the card, a draft is only kept on this device, for the member signed in, and is cleared once the book is saved, the card is cancelled or they sign out

// Section: Keeping a draft

// DRAFT_KEY starts the name the drafts are kept under on this device, followed by who they belong to, and DRAFT_DAYS is how long a draft is kept before it is let go
const DRAFT_KEY = "library-drafts-";
const DRAFT_DAYS = 30;
const DraftNote = document.getElementById("draftNote");

// DraftBase holds the card as it was when it opened (so a draft only keeps what was changed), and DraftWait the timer that saves a draft shortly after typing stops
let DraftBase = null;
let DraftWait = 0;

// The DraftOwner function gives whose drafts these are: the member signed in, or this device while login is off
function DraftOwner()
{
  return SignedIn ? SignedIn.id : "local";
}

// The ReadDrafts function reads this member's drafts from this device, letting go of any older than DRAFT_DAYS
function ReadDrafts()
{
  let Drafts = {};
  try { Drafts = JSON.parse(Recall(DRAFT_KEY + DraftOwner())) || {}; }
  catch (error) { Drafts = {}; }
  const Oldest = Date.now() - DRAFT_DAYS * 86400000;
  Object.keys(Drafts).forEach((Key) => { if (!Drafts[Key] || Drafts[Key].at < Oldest) delete Drafts[Key]; });
  return Drafts;
}

// The WriteDrafts function keeps this member's drafts on this device, or takes them away when there are none left
function WriteDrafts(Drafts)
{
  if (Object.keys(Drafts).length) Remember(DRAFT_KEY + DraftOwner(), JSON.stringify(Drafts));
  else
  {
    try { localStorage.removeItem(DRAFT_KEY + DraftOwner()); }
    catch (error) { /* storage is off, so there was nothing kept */ }
  }
}

// The DraftKey function gives the name a card's draft is kept under: the book's id when editing, or "new" when adding one
const DraftKey = () => (EditingBook ? EditingBook.id : "new");

// The ReadCard function reads everything on the catalogue card that a draft keeps, pictures only as whether one was chosen or removed (a picture is too big to keep)
function ReadCard()
{
  const Card = {
    name: BookName.value,
    link: BookLink.value,
    section: BookSection.value,
    newSection: NewSectionName.value,
    notes: BookNotes.value,
    comeBack: ComeBackDate.value,
    picture: ChosenPicture ? "chosen" : KeptPicture,
    pages: CardPages.map((Page) => ({ id: Page.id || "", title: Page.title, link: Page.link || "", notes: Page.notes || "", picture: Page.chosen ? "chosen" : Page.picture || "" })),
    page: null,
  };
  // A page card open on top is kept too, so it opens again just as it was
  if (PageDialog.open) Card.page = { index: PageIndex, title: PageName.value, link: PageLink.value, notes: PageNotes.value };
  return Card;
}

// The SameCard function says whether two readings of the card are the same, so a card opened and left untouched keeps no draft
const SameCard = (One, Two) => JSON.stringify({ ...One, page: null }) === JSON.stringify({ ...Two, page: null }) && !One.page === !Two.page;

// The KeepDraft function keeps the card as a draft on this device, or lets its draft go when it is back to how it opened
function KeepDraft()
{
  clearTimeout(DraftWait);
  if (!DraftBase) return;                               // no card open, or its draft has just been let go
  const Card = ReadCard();
  const Drafts = ReadDrafts();
  if (SameCard(Card, DraftBase) && !Card.page) delete Drafts[DraftKey()];
  else Drafts[DraftKey()] = { at: Date.now(), base: DraftBase, card: Card };
  WriteDrafts(Drafts);
}

// The ForgetDraft function lets a card's draft go, called by library.js once the book is saved, the card is cancelled or the book is deleted
function ForgetDraft(Key)
{
  clearTimeout(DraftWait);
  const Drafts = ReadDrafts();
  delete Drafts[Key || DraftKey()];
  WriteDrafts(Drafts);
  DraftBase = null;
}

// The ForgetAllDrafts function lets every draft of the member go, called by member.js when they sign out so the next person on this device never sees them
function ForgetAllDrafts()
{
  try { localStorage.removeItem(DRAFT_KEY + DraftOwner()); }
  catch (error) { /* storage is off, so there was nothing kept */ }
}

// Anything typed, picked or moved on the card (or on a page card over it) is kept a moment after it stops
[CatalogueDialog, PageDialog].forEach((Dialog) => ["input", "change", "click", "pointerup"].forEach((Kind) => Dialog.addEventListener(Kind, () =>
{
  clearTimeout(DraftWait);
  DraftWait = setTimeout(KeepDraft, 400);
})));
// Closing the card any other way (the Escape key, a click outside it, or leaving for another part of the library) keeps the draft as it is
CatalogueDialog.addEventListener("close", () =>
{
  KeepDraft();
  DraftBase = null;
  DraftNote.hidden = true;
});
// When the page goes out of sight or closes, the draft is kept straight away
document.addEventListener("visibilitychange", () => { if (document.hidden) KeepDraft(); });
window.addEventListener("pagehide", KeepDraft);


// Section: Picking up a draft

// The DraftAge function writes how long ago a draft was kept, like "a few minutes ago" or "yesterday"
function DraftAge(At)
{
  const Minutes = Math.round((Date.now() - At) / 60000);
  if (Minutes < 2) return "just now";
  if (Minutes < 60) return Minutes + " minutes ago";
  const Hours = Math.round(Minutes / 60);
  if (Hours < 24) return Hours === 1 ? "an hour ago" : Hours + " hours ago";
  const Days = Math.round(Hours / 24);
  return Days === 1 ? "yesterday" : Days + " days ago";
}

// The Kept function picks each part from the draft only where it was changed in the draft, so changes made since on another device (or by a friend on a joint shelf) are not undone
const Kept = (Draft, Now, Key) => (JSON.stringify(Draft.card[Key]) !== JSON.stringify(Draft.base[Key]) ? Draft.card[Key] : Now[Key]);

// The PickUpDraft function fills the card from its draft when there is one, says so on the card, and opens a page card that was open (Cancel lets the draft go for a fresh card)
function PickUpDraft()
{
  DraftNote.hidden = true;
  DraftBase = ReadCard();
  const Draft = ReadDrafts()[DraftKey()];
  if (!Draft) return;

  BookName.value = Kept(Draft, DraftBase, "name");
  BookLink.value = Kept(Draft, DraftBase, "link");
  BookNotes.value = Kept(Draft, DraftBase, "notes");
  const Section = Kept(Draft, DraftBase, "section");
  if ([...BookSection.options].some((Choice) => Choice.value === Section)) BookSection.value = Section;     // a shelf deleted since then is left as it is
  NewSectionName.value = Kept(Draft, DraftBase, "newSection");
  NewSectionLine.hidden = BookSection.value !== "new";
  ComeBackDate.value = Kept(Draft, DraftBase, "comeBack");

  // A picture that was removed stays removed, a newly chosen one has to be chosen again
  const Picture = Kept(Draft, DraftBase, "picture");
  let Lost = Picture === "chosen";
  if (Picture === "") KeptPicture = "";
  ShowCardPicture();

  // The pages as they were on the card, those with a new picture keep their old one until it is chosen again
  if (JSON.stringify(Draft.card.pages) !== JSON.stringify(Draft.base.pages))
  {
    const Before = new Map(CardPages.filter((Page) => Page.id).map((Page) => [Page.id, Page]));
    CardPages = Draft.card.pages.map((Page) =>
    {
      const Old = Before.get(Page.id) || {};
      if (Page.picture === "chosen") Lost = true;
      return { ...Old, title: Page.title, link: Page.link, notes: Page.notes, picture: Page.picture === "chosen" ? Old.picture || "" : Page.picture, chosen: null, changed: true };
    });
    FillPageSlips();
  }
  const First = PageSlips.querySelector(".is-first span");
  if (First) First.textContent = BookName.value.trim() || "This book";

  DraftNote.textContent = "Picked up where you left off " + DraftAge(Draft.at) + "." + (Lost ? " Choose the new picture again, pictures are too big to keep." : "");
  DraftNote.hidden = false;

  // A page card that was open opens again with what was typed on it
  const Page = Draft.card.page;
  if (Page)
  {
    OpenPageCard(Page.index < CardPages.length ? Page.index : -1);
    PageName.value = Page.title;
    PageLink.value = Page.link;
    PageNotes.value = Page.notes;
  }
}

