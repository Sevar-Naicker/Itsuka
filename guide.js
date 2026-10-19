// This file contains the Guide card, the What's new card and the welcome tour on the library page, it loads after library.js and uses its functions

// What's new:

// NEWS holds every update worth telling members about, newest last. Each item has a short title, one line on how to use it and what Show me does
// Add a new entry with the next number whenever a feature is added, members see only the entries newer than the last one they saw
const NEWS = [
  { number: 1, title: "Catching up", items: [
    { title: "Move books by dragging", text: "Pick a book up by its spine and drop it anywhere, even on another shelf. On a phone, rest your finger on the spine until it lifts.", show: "spine" },
    { title: "Pull a book", text: "Can't decide? Pull a book picks one you haven't finished for you.", show: "#pullButton" },
    { title: "Done and Hide done", text: "Open a book and tick Done once you've bought, visited or used it. Hide done tucks those away.", show: "spine" },
    { title: "Sort and arrange shelves", text: "Edit sections moves shelves up and down and keeps each one in your own order, A to Z, newest or oldest first.", show: "sections" },
    { title: "Share a shelf", text: "Edit sections, then Share, makes a link to one shelf. Friends can look and add its books to their own library.", show: "sections" },
    { title: "Settings and a copy of your library", text: "Switch shelf tools on or off, and download your whole library as one file to keep.", show: "settings shelves" },
    { title: "Dusty books", text: "Books you haven't opened in two months gather dust, and cobwebs after eight. Open one to blow it off.", show: "" },
    { title: "Share into Itsuka", text: "On Android, add Itsuka to your home screen, then Share any Instagram or Pinterest link to it.", show: "" },
  ] },
  { number: 2, title: "Joint shelves", items: [
    { title: "Joint shelves", text: "Fill a shelf together with up to four friends. Edit sections, then Invite, makes a link they can join with. Joint shelves have a ribbon on their plaque.", show: "sections" },
    { title: "Your colour", text: "Pick your colour in Settings. It marks the books you add to joint shelves, with a stripe on the spine and an Added by line inside.", show: "settings shelves" },
  ] },
  { number: 3, title: "Lots of shelves", items: [
    { title: "Sliding plaques", text: "When your shelves don't all fit along the top, brass arrows appear at each end. Press them, or scroll, to slide along. Edit sections now always stays in view.", show: "#editSections" },
    { title: "Shelves down the side", text: "On a laptop, switch on Shelves down the side in Settings to stand your plaques in a list beside the shelves.", show: "settings shelves" },
  ] },
  { number: 4, title: "Live joint shelves", items: [
    { title: "Changes straight away", text: "On a joint shelf, books your friends add, move, tick done or remove now show up on your screen as it happens, no reloading. A small note says who did what.", show: "" },
  ] },
  { number: 5, title: "Sharing from iPhone", items: [
    { title: "Share into Itsuka on iPhone", text: "Add the Itsuka shortcut from Settings once. Then in Instagram, Pinterest or Safari press Share, then More, and choose Itsuka to open a new catalogue card with the link filled in.", show: "settings phone" },
  ] },
  { number: 6, title: "Itsuka on your home screen", items: [
    { title: "Add to home screen", text: "Settings now has an Add to home screen button under On your phone. On many Android phones it adds Itsuka in one tap, on iPhone it shows you the three steps. Itsuka then opens from its own icon like an app.", show: "settings phone" },
  ] },
  { number: 7, title: "Six new backgrounds", items: [
    { title: "New scenes", text: "A rainy café, an autumn forest, an attic nook, a grand library, a mountain temple in cherry blossom and a lighthouse keeper's cottage. Each one recolours your shelves to match. Pick one in Settings.", show: "settings" },
  ] },
  { number: 8, title: "A new look for Settings", items: [
    { title: "The settings journal", text: "Settings is now a journal with a bookmark for each page, and the shelf tools have little levers.", show: "settings shelves" },
    { title: "Shuffle", text: "Pick Shuffle, the first picture under Background, for a new background each visit or each day. Untick any you'd rather leave out.", show: "settings" },
  ] },
  { number: 9, title: "More room on phones", items: [
    { title: "The Guide moved on phones", text: "On a phone, the Guide button now lives in Settings, under Help, so your shelves start higher up. On a laptop it stays at the top.", show: "settings help" },
  ] },
  { number: 10, title: "Letters on joint shelves", items: [
    { title: "While you were away", text: "When friends change a joint shelf while you're away, a small letter now waits on its plaque. Press it to read what changed, and Show me points at the new books.", show: "" },
    { title: "Pages to read", text: "The Guide and What's new are now journal pages, like Settings. Cards for your books stay catalogue cards.", show: "" },
  ] },
  { number: 11, title: "Undo, and no signal", items: [
    { title: "Undo", text: "Deleted a book or a shelf by mistake? A note with an Undo button now waits for a few seconds afterwards, press it to put everything back where it was.", show: "" },
    { title: "Open without signal", text: "Your library now opens even with no signal, showing your shelves as they were last time. A small sign hangs under the title until you're connected again. You can keep it still in Settings.", show: "settings shelves" },
  ] },
];
// LATEST_NEWS is the number of the newest entry
const LATEST_NEWS = NEWS[NEWS.length - 1].number;

// Guide:

// GUIDE holds every part of the Guide card, in groups, each line names a feature and says how to use it
const GUIDE = [
  { group: "Adding", lines: [
    ["Add a book", "Press + Add a book. Give it a name, a link, a few notes (one point per line), a shelf and a picture if you like."],
    ["From other apps", "On Android, add Itsuka to your home screen, then press Share in Instagram, Pinterest or any app and choose Itsuka. On iPhone, add the shortcut from Settings first, then Share, More, Itsuka."],
  ] },
  { group: "Finding", lines: [
    ["Plaques", "The plaques at the top switch shelves on and off, All shows every shelf. With lots of shelves, the brass arrows at each end slide the row along."],
    ["Shelves down the side", "On a laptop, switch this on in Settings to stand the plaques in a list beside your shelves instead."],
    ["Find", "Find searches the names and notes of every book."],
    ["Pull a book", "Picks a book you haven't finished, for when you can't decide."],
  ] },
  { group: "Arranging", lines: [
    ["Move a book", "Drag a book by its spine. On a phone, rest your finger on the spine until it lifts, then drag."],
    ["Edit sections", "Rename shelves, move them up or down, sort their books (A to Z, newest or oldest first), invite friends, share or delete them."],
    ["Undo", "After deleting a book or a shelf, press Undo on the note at the bottom within a few seconds to put it back."],
  ] },
  { group: "Keeping track", lines: [
    ["Done", "Open a book and tick Done. It gets a ribbon and a stamp, and Hide done tucks it away."],
    ["Dust", "A book you haven't opened in two months gathers dust. Opening it blows the dust off."],
  ] },
  { group: "Sharing", lines: [
    ["Share a shelf", "Edit sections, then Share, then Make a link. Anyone with the link can look at that one shelf and add its books to their own library. Stop sharing turns the link off."],
    ["Joint shelves", "Edit sections, then Invite, makes a link that lets up to four friends join one shelf. Everyone can add books, move them and tick them done. Only you and whoever added a book can change it, and only you can rename or delete the shelf. Anyone can leave whenever they like."],
    ["Live changes", "Changes on a joint shelf show up for everyone straight away, with a small note saying who did what. They wait while you're dragging a book or have one open."],
    ["Letters", "When friends change a joint shelf while you're away, a small letter waits on its plaque. Press it to read who added, removed or ticked what. Reading it on one device clears it on all of them."],
    ["Your colour", "In Settings, pick the colour that marks the books you add to joint shelves. The ribbon on a joint shelf's plaque is its owner's colour."],
    ["Copies", "On the Library page in Settings, Download a copy saves your whole library as one file, joint shelves included, and Load a copy adds one back."],
  ] },
  { group: "Your library", lines: [
    ["Settings", "A journal with a bookmark for each page: Background, Shelves, Library, Phone and Help. The shelf tools follow you to every device, the background is chosen on each device."],
    ["Shuffle", "Under Background in Settings, the first picture. Itsuka picks a new background each visit or each day. Untick any you want left out, or pick one picture to stop shuffling."],
    ["Your card", "The card in the top corner holds your photo, Sign out and Delete my account."],
    ["No signal", "With no signal, Itsuka opens the copy of your shelves saved on this device, under a small sign. You can read and find books, and changes come back once you're connected. Swaying sign in Settings keeps the sign still."],
    ["On your phone", "On the Phone page in Settings, Add to home screen puts Itsuka on your home screen, or shows you the steps for your phone. It then opens like an app."],
  ] },
];

// The parts of the page this file works with
const GuideDialog = document.getElementById("guideDialog");
const GuideBody = document.getElementById("guideBody");
const NewsDialog = document.getElementById("newsDialog");
const NewsList = document.getElementById("newsList");
const NewsTitle = document.getElementById("newsTitle");

// Small helpers:

// The SeenNews function returns the number of the newest What's new entry this member has seen, or null for someone who has never been asked
function SeenNews()
{
  const Saved = SignedIn ? (SignedIn.user_metadata || {}).seen_news : Number(Recall("library-seen-news"));
  return typeof Saved === "number" && !isNaN(Saved) && Saved > 0 ? Saved : null;
}

// The SaveSeenNews function remembers that the member has seen everything up to the newest entry, with their account so it follows them to every device
async function SaveSeenNews()
{
  if (!SignedIn || !DB)
  {
    Remember("library-seen-news", String(LATEST_NEWS));
    return;
  }
  try
  {
    const { data: Data, error } = await DB.auth.updateUser({ data: { seen_news: LATEST_NEWS } });
    if (error) throw error;
    SignedIn = Data.user;
  }
  catch (error)
  {
    console.error(error);                       // it is only a reminder, at worst the card shows once more
  }
}

// The PointAt function draws attention to one part of the page for a moment with a pulsing brass outline
function PointAt(Elem)
{
  if (!Elem) return;
  Elem.scrollIntoView({ block: "center", behavior: "smooth" });
  Elem.classList.remove("is-pointed");
  void Elem.offsetWidth;                         // restarts the pulse if it was already running
  Elem.classList.add("is-pointed");
  setTimeout(() => Elem.classList.remove("is-pointed"), 2600);
}

// The ShowMe function opens or points at the part of the page a What's new item is about
function ShowMe(Where)
{
  NewsDialog.close();
  if (Where.startsWith("settings")) { OpenSettingsPage(Where.split(" ")[1] || "background"); ScenePicker.showModal(); return; }
  if (Where === "sections") { OpenSectionsCard(); return; }
  if (Where === "spine") { PointAt(LibraryRoot.querySelector(".book .spine")); return; }
  const Elem = document.querySelector(Where);
  PointAt(Elem && !Elem.hidden ? Elem : null);
}

// The Guide card:

// The BuildGuide function fills the Guide card with every group and line
function BuildGuide()
{
  GuideBody.replaceChildren();
  GUIDE.forEach(({ group: Group, lines: Lines }) =>
  {
    GuideBody.append(Make("h3", "guide-group", Group));
    Lines.forEach(([Name, Text]) =>
    {
      const Line = Make("p", "guide-line");
      Line.append(Make("b", "", Name), " " + Text);
      GuideBody.append(Line);
    });
  });
}

// The OpenGuide function opens the Guide card
function OpenGuide()
{
  CloseAll();
  if (ScenePicker.open) ScenePicker.close();
  GuideDialog.showModal();
  GuideBody.scrollTop = 0;
}

// The What's new card:

// The OpenNews function opens the What's new card with every item newer than Since, or the newest entry when Since is left out
function OpenNews(Since)
{
  const Entries = NEWS.filter((Entry) => Since === undefined ? Entry.number === LATEST_NEWS : Entry.number > Since);
  if (!Entries.length) return;
  NewsTitle.textContent = Entries.length === 1 && Entries[0].number === 1 ? "New on the shelves" : "What's new";
  NewsList.replaceChildren();
  Entries.forEach((Entry) => Entry.items.forEach((Item) =>
  {
    const Row = Make("li", "news-item");
    const Words = Make("div", "news-words");
    Words.append(Make("b", "", Item.title), Make("span", "", Item.text));
    Row.append(Words);
    if (Item.show)
    {
      const Show = Make("button", "link-button news-show", "Show me");
      Show.type = "button";
      Show.addEventListener("click", () => ShowMe(Item.show));
      Row.append(Show);
    }
    NewsList.append(Row);
  }));
  NewsDialog.showModal();
}

// The welcome tour:

// TOUR holds the stops on the welcome tour: what to point at (the first shelf, or the empty shelves message for a new member) and what to say there
// A stop with unless is only used when that other button is not showing, on a phone the Guide button is tucked into Settings
const TOUR = [
  { target: "#library .section, #library .empty-library", title: "Your shelves", text: "Each section you make gets its own shelf and a plaque, like Artists or Shops." },
  { target: "#addBook", title: "Add a book", text: "Save an artist, creator or shop here, with a link, notes and a picture." },
  { target: ".new-section", title: "Sections", text: "Make, rename, sort and share your shelves here." },
  { target: "#guideButton", title: "The guide", text: "Every feature and how to use it, whenever you need it. Settings is next to it." },
  { target: "#sceneButton", unless: "#guideButton", title: "The guide", text: "Every feature and how to use it is in Settings, under Help, whenever you need it." },
];

// TourStop is the stop the tour is on, -1 while no tour is running
let TourStop = -1;
const TourLayer = document.getElementById("tourLayer");

// The PlaceNote function puts a note next to its target, below it when there is room and above it otherwise, and keeps it on the screen
function PlaceNote(Note, Target)
{
  const Box = Target.getBoundingClientRect();
  const ScreenWidth = document.documentElement.clientWidth;
  const Below = Box.bottom + 14 + Note.offsetHeight < window.innerHeight;
  const Top = Below ? Box.bottom + 14 : Box.top - Note.offsetHeight - 14;
  const Left = Math.max(8, Math.min(Box.left + Box.width / 2 - Note.offsetWidth / 2, ScreenWidth - Note.offsetWidth - 8));
  Note.style.top = Math.max(8, Top) + "px";
  Note.style.left = Left + "px";
  Note.classList.toggle("points-up", Below);
  Note.style.setProperty("--arrow", Math.max(16, Math.min(Box.left + Box.width / 2 - Left, Note.offsetWidth - 16)) + "px");
}

// The Showing function checks whether an element is on the page and not hidden, by the hidden attribute or by the styles
function Showing(Elem)
{
  return Boolean(Elem && !Elem.hidden && Elem.getClientRects().length);
}

// The TourTargets function returns the stops whose target is showing right now
function TourTargets()
{
  return TOUR.map((Stop) => ({ ...Stop, Elem: document.querySelector(Stop.target) }))
    .filter((Stop) => Showing(Stop.Elem) && !(Stop.unless && Showing(document.querySelector(Stop.unless))));
}

// The EndTour function takes the tour away and remembers it was seen
function EndTour()
{
  TourStop = -1;
  TourLayer.replaceChildren();
  TourLayer.hidden = true;
  document.querySelectorAll(".tour-target").forEach((Elem) => Elem.classList.remove("tour-target"));
  Remember("library-seen-tour", "yes");
}

// The ShowStep function shows the note for one stop on a phone, with Next and Skip
function ShowStep(Index)
{
  const Stops = TourTargets();
  if (Index >= Stops.length) { EndTour(); return; }
  TourStop = Index;
  const Stop = Stops[Index];
  document.querySelectorAll(".tour-target").forEach((Elem) => Elem.classList.remove("tour-target"));
  Stop.Elem.classList.add("tour-target");
  Stop.Elem.scrollIntoView({ block: "nearest" });

  const Note = Make("div", "tour-note tour-step");
  Note.setAttribute("role", "dialog");
  Note.setAttribute("aria-label", Stop.title);
  Note.append(Make("p", "tour-count", (Index + 1) + " of " + Stops.length), Make("h3", "", Stop.title), Make("p", "", Stop.text));
  const Buttons = Make("div", "tour-buttons");
  const Skip = Make("button", "link-button", "Skip");
  Skip.type = "button";
  Skip.addEventListener("click", EndTour);
  const Next = Make("button", "card-button", Index === Stops.length - 1 ? "Done" : "Next");
  Next.type = "button";
  Next.addEventListener("click", () => ShowStep(Index + 1));
  Buttons.append(Skip, Next);
  Note.append(Buttons);
  TourLayer.replaceChildren(Note);
  TourLayer.hidden = false;
  PlaceNote(Note, Stop.Elem);
  Next.focus();
}

// The MoveClear function moves a note that would cover another note or another part the tour points at
// It first tries beside its own part (to the right), then slides right and finally down
function MoveClear(Note, Target, Stops)
{
  const Others = [...TourLayer.querySelectorAll(".tour-note")].filter((Other) => Other !== Note)
    .concat(Stops.map((Stop) => Stop.Elem).filter((Elem) => Elem !== Target));
  const Covers = () => Others.some((Other) =>
  {
    const A = Note.getBoundingClientRect(), B = Other.getBoundingClientRect();
    return A.left < B.right + 6 && A.right > B.left - 6 && A.top < B.bottom + 6 && A.bottom > B.top - 6;
  });
  if (!Covers()) return;
  const Box = Target.getBoundingClientRect();
  const Room = document.documentElement.clientWidth - Note.offsetWidth - 8;
  const OldLeft = Note.style.left, OldTop = Note.style.top;
  Note.style.left = Math.min(Box.right + 14, Room) + "px";
  Note.style.top = Math.max(8, Box.top + Box.height / 2 - Note.offsetHeight / 2) + "px";      // level with its part
  Note.classList.add("points-left");                                  // beside its part, so the arrow points left instead of up or down
  if (!Covers()) return;
  Note.style.left = OldLeft; Note.style.top = OldTop;
  Note.classList.remove("points-left");
  for (let Step = 0; Step < 40 && Covers(); Step++)
  {
    const Left = parseFloat(Note.style.left), Top = parseFloat(Note.style.top);
    if (Left + 12 <= Room) Note.style.left = (Left + 12) + "px";
    else Note.style.top = (Top + 12) + "px";
  }
}

// The ShowNotes function tapes a small paper note beside every part at once, with one Got it button
function ShowNotes()
{
  TourStop = 0;
  TourLayer.replaceChildren();
  TourLayer.hidden = false;
  const Stops = TourTargets();
  Stops.forEach((Stop, Index) =>
  {
    const Note = Make("div", "tour-note");
    Note.append(Make("h3", "", Stop.title), Make("p", "", Stop.text));
    TourLayer.append(Note);
    PlaceNote(Note, Stop.Elem);
    MoveClear(Note, Stop.Elem, Stops);
  });
  const GotIt = Make("button", "brass-button tour-got-it", "Got it");
  GotIt.type = "button";
  GotIt.addEventListener("click", EndTour);
  TourLayer.append(GotIt);
  GotIt.focus();
}

// The NarrowScreen function checks whether the screen is phone-sized
function NarrowScreen()
{
  return document.documentElement.clientWidth < 700;
}

// The StartTour function starts the welcome tour: every note at once on a laptop, or one at a time on a phone where they would sit on top of each other
function StartTour()
{
  CloseAll();
  if (GuideDialog.open) GuideDialog.close();
  if (NarrowScreen()) ShowStep(0);
  else ShowNotes();
}

// Buttons and keys:

// The Guide button in the top bar and the one in Settings open the Guide card, its Take the tour button starts the tour
document.getElementById("guideButton").addEventListener("click", OpenGuide);
document.getElementById("settingsGuide").addEventListener("click", OpenGuide);
document.getElementById("settingsNews").addEventListener("click", () => { ScenePicker.close(); OpenNews(0); });
document.getElementById("guideTour").addEventListener("click", StartTour);
document.getElementById("guideDone").addEventListener("click", () => GuideDialog.close());
// Got it on the What's new card closes it and remembers it was seen
document.getElementById("newsDone").addEventListener("click", () => NewsDialog.close());
NewsDialog.addEventListener("close", SaveSeenNews);
// A click on the dark area outside a card closes it
[GuideDialog, NewsDialog].forEach((Dialog) =>
{
  Dialog.addEventListener("click", (event) => { if (event.target === Dialog) Dialog.close(); });
});
// The Escape key ends the tour, and the notes follow their targets when the window changes size
document.addEventListener("keydown", (event) => { if (event.key === "Escape" && TourStop !== -1) EndTour(); });
window.addEventListener("resize", () =>
{
  if (TourStop === -1) return;
  if (NarrowScreen()) ShowStep(TourStop);
  else ShowNotes();
});

// Start:

// The StartGuide function runs once the shelves are on the page: a brand-new member with no books gets the welcome tour, anyone else gets What's new when there is something they haven't seen
function StartGuide()
{
  BuildGuide();
  const Seen = SeenNews();
  const HasBooks = Library.some((Section) => Section.books.length);
  if (Seen === null && !HasBooks)
  {
    SaveSeenNews();                                // a new member starts with nothing to catch up on
    if (Recall("library-seen-tour") !== "yes") setTimeout(StartTour, 400);
    return;
  }
  if (Seen === null || Seen < LATEST_NEWS) setTimeout(() => OpenNews(Seen || 0), 400);
}
// It waits for library.js to finish loading the shelves, and stays quiet when a shared link has already opened a catalogue card
LibraryReady.then(() =>
{
  if (LoginIsSetUp && !SignedIn) return;         // nobody signed in: member.js is sending them away
  if (!CatalogueDialog.open) StartGuide();
});
