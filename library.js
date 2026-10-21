// This file contains the code for the plaques, shelves and books as well as the cards for adding to them, it loads last and uses all the other files (shelves.js draws the books themselves)

// Library holds the member's shelves as a list of sections, each with its list of books
let Library = [];

// ExampleLibrary holds a few example shelves that are only used while login is switched off
const ExampleLibrary = [
  { id: "example-artists", name: "Artists", books: [
    { id: "example-1", name: "Moth & Fern Prints", link: "https://example.com", notes: "Linocut prints\nWant the A5 moth print" },
    { id: "example-2", name: "Wild Thread Studio", link: "https://example.com", notes: "Hand embroidery kits\nFinished hoops too" },
    { id: "example-3", name: "Ama Beads", link: "https://example.com", notes: "Beaded earrings\nRestocks on the first of the month" },
    { id: "example-4", name: "Inkwell Zines", link: "https://example.com", notes: "Riso zines and sticker sheets" },
  ] },
  { id: "example-business", name: "Small businesses", books: [
    { id: "example-5", name: "Fig & Flame Candles", link: "https://example.com", notes: "Hand-poured soy candles\nThe fig one, and the gift box" },
    { id: "example-6", name: "Second Shelf Books", link: "https://example.com", notes: "Second-hand bookshop\nMonthly mystery parcel" },
    { id: "example-7", name: "Honey Row Bakery", link: "", notes: "Sourdough and cardamom buns\nSaturday market only" },
  ] },
  { id: "example-education", name: "Education", books: [
    { id: "example-8", name: "Kiln Night Classes", link: "https://example.com", notes: "Six-week beginner wheel-throwing course" },
  ] },
];

// The parts of the page this file fills in
const TabsRoot = document.getElementById("tabs");
const LibraryNote = document.getElementById("libraryNote");
const Chosen = new Set();      // ids of the sections switched on with the plaques at the top; empty means "show them all"

// SearchLine is the row that holds the search box, SearchBox is the box itself and FindButton is the button that opens and closes the row
const SearchLine = document.getElementById("searchLine");
const SearchBox = document.getElementById("searchBox");
const FindButton = document.getElementById("findButton");
// SearchText holds what is typed in the search box in small letters, empty means "show every book"
let SearchText = "";

// Settings for the shelf tools:

// SETTING_LIST holds the switches shown under On the shelves in the settings, each with its key, name and a short line on what it does
const SETTING_LIST = [
  { key: "find", label: "Find", hint: "The Find button and search box" },
  { key: "done", label: "Done mark", hint: "The Done tick box, ribbon and stamp" },
  { key: "hideDone", label: "Hide done button", hint: "Tucks the done books away" },
  { key: "pull", label: "Pull a book", hint: "Opens a random book that is not done" },
  { key: "drag", label: "Drag to move books", hint: "Pick a book up by its spine" },
  { key: "ornaments", label: "Shelf ornaments", hint: "The little things at the end of each shelf" },
  { key: "hover", label: "Open books on hover", hint: "On a laptop, a book opens when you point at it" },
  { key: "dust", label: "Dusty books", hint: "Books you have not opened in a while gather dust" },
  { key: "sideList", label: "Shelves down the side", hint: "On a laptop, the plaques stand in a list beside the shelves" },
  { key: "sway", label: "Swaying sign", hint: "With no signal, the sign sways gently, off keeps it still" },
];
// JointIsSetUp holds whether the database has joint shelves (supabase-joint.sql), until then the Invite button explains what to run
let JointIsSetUp = true;
// ShelfSettings holds which tools are switched on, they all start on apart from Shelves down the side, and the member's own choices are loaded over them
const ShelfSettings = { find: true, done: true, hideDone: true, pull: true, drag: true, ornaments: true, hover: true, dust: true, sideList: false, sway: true };
// WaitingGone holds the books and shelves deleted in the last few seconds, kept off the page while their Undo note is showing, even if the shelves are fetched again
const WaitingGone = new Set();
const SettingsList = document.getElementById("settingsList");
const SettingsNote = document.getElementById("settingsNote");



// DoneSwitch is the Hide done button and HideDone holds whether the books marked as done are hidden, it uses the choice saved on this device
const DoneSwitch = document.getElementById("doneSwitch");
let HideDone = Recall("library-hide-done") === "yes";

// Small helpers:

// The ShowLibraryNote function shows a message above the shelves
function ShowLibraryNote(Message)
{
  LibraryNote.textContent = Message;
  LibraryNote.hidden = false;
}

// The Matches function checks whether a book fits the search, it looks at the book's name and notes, and the titles and notes of its pages
function Matches(Book)
{
  if (!SearchText) return true;
  const Pages = (Book.pages || []).map((Page) => Page.title + "\n" + (Page.notes || "")).join("\n");
  const Words = (Book.name + "\n" + (Book.notes || "") + "\n" + Pages).toLowerCase();
  return Words.includes(SearchText);
}

// The HidingDone function checks whether done books are hidden right now: the switch is pressed and the done mark and its button are both on in the settings
function HidingDone()
{
  return HideDone && ShelfSettings.done && ShelfSettings.hideDone;
}

// The Visible function checks whether a book should be on the shelf: it must fit the search and not be a done book while those are hidden
function Visible(Book)
{
  return Matches(Book) && !(HidingDone() && Book.done);
}

// The MyId function returns the signed-in member's account id, or an empty string while login is off
function MyId()
{
  return typeof SignedIn !== "undefined" && SignedIn ? SignedIn.id : "";
}

// The CanEdit function checks whether the member may change a book's words, picture or shelf: always on their own shelves, and on a joint shelf only when they own it or added the book
function CanEdit(Book)
{
  const Section = SectionOf(Book);
  return !DB || !Section || Section.owner || Book.added_by === MyId();
}

// The PersonOf function finds who added a book on a joint shelf, as one of the shelf's people
function PersonOf(Section, Book)
{
  return Section.people.find((Person) => Person.member_id === Book.added_by) || null;
}

// The SectionOf function finds the section a book is in
function SectionOf(Book)
{
  return Library.find((Section) => Section.books.includes(Book));
}

// The BookWithId function finds a book in the library by its id
function BookWithId(Id)
{
  for (const Section of Library)
  {
    const Book = Section.books.find((Other) => String(Other.id) === String(Id));
    if (Book) return Book;
  }
  return null;
}

// The ShowDoneSwitch function shows the Hide done button only when there is a done book to hide
function ShowDoneSwitch()
{
  const AnyDone = Library.some((Section) => Section.books.some((Book) => Book.done));
  if (!AnyDone && HideDone)
  {
    HideDone = false;                                                 // nothing left to hide, so the switch goes back to off
    Remember("library-hide-done", "no");
  }
  DoneSwitch.hidden = !AnyDone || !ShelfSettings.done || !ShelfSettings.hideDone;
  DoneSwitch.setAttribute("aria-pressed", String(HideDone));
}

// The DressAsDone function gives a book on the shelf the look of a done book or takes it away again: the ribbon, the stamp and the ticked box
function DressAsDone(Elem, Book)
{
  const Done = Boolean(Book.done) && ShelfSettings.done;              // with the done mark switched off, no book looks done
  Elem.classList.toggle("is-done", Done);
  Elem.querySelector(".spine").setAttribute("aria-label", Done ? Book.name + ", done" : Book.name);
  Elem.querySelector(".done-box").setAttribute("aria-pressed", String(Done));
  ShowDust(Elem, Book);                                                // a done book is finished with, so it never looks dusty
}

// Dusty books:

// DUST_DAYS holds how many days a book can go unopened before it gathers a little dust, more dust and finally a cobweb
const DUST_DAYS = [60, 120, 240];
// DAY is one day in milliseconds
const DAY = 24 * 60 * 60 * 1000;

// The DustLevel function returns how dusty a book is: 0 for none up to 3, from the last time it was opened (or added, if it never has been)
function DustLevel(Book)
{
  if (!ShelfSettings.dust || Book.done) return 0;
  const Last = Date.parse(Book.opened_at || Book.created_at || "");
  if (isNaN(Last)) return 0;
  const Days = (Date.now() - Last) / DAY;
  return DUST_DAYS.filter((Limit) => Days >= Limit).length;
}

// The ShowDust function puts the right amount of dust on a book's spine, or takes it away
function ShowDust(Elem, Book)
{
  const Level = DustLevel(Book);
  if (Level) Elem.dataset.dust = Level;
  else delete Elem.dataset.dust;
}

// The NoteOpened function blows the dust off a book that has just been opened and remembers when it was opened, at most once a day
async function NoteOpened(Elem)
{
  const Book = BookWithId(Elem.dataset.id);
  if (!Book) return;
  if (Elem.dataset.dust)
  {
    Elem.classList.add("is-dusting");                                  // the dust puffs away (styles.css)
    setTimeout(() => { Elem.classList.remove("is-dusting"); delete Elem.dataset.dust; }, 700);
  }
  const Last = Date.parse(Book.opened_at || "");
  if (!isNaN(Last) && Date.now() - Last < DAY) return;
  Book.opened_at = new Date().toISOString();
  if (!DB) return;
  const { error } = await DB.from("books").update({ opened_at: Book.opened_at }).eq("id", Book.id);
  if (error) console.error(error);                                     // only the dust depends on it, so the page carries on
}

// The ClearSearch function empties the search box so every book shows again
function ClearSearch()
{
  SearchBox.value = "";
  SearchText = "";
}

// The ShowSearch function opens or closes the search box, closing it also clears the search
function ShowSearch(Open)
{
  SearchLine.hidden = !Open;
  FindButton.setAttribute("aria-expanded", String(Open));
  if (Open)
  {
    SearchBox.focus();
  }
  else if (SearchText)
  {
    ClearSearch();
    Update();
  }
}

// The ShowLoading function shows a short message where the shelves will be while they are being fetched
function ShowLoading()
{
  const Loading = Make("div", "empty-library");
  Loading.setAttribute("role", "status");
  Loading.append(
    Make("h2", "", "Fetching your shelves\u2026"),
    Make("p", "", "Your books will be here in a moment."),
  );
  LibraryRoot.replaceChildren(Loading);
}

// Building the page:

// The MakeLibraryBook function builds one of the member's own books, with the Edit button and the Done tick box in the foot of its page
function MakeLibraryBook(Book, ColourNumber)
{
  const Elem = MakeBook(Book, ColourNumber);
  const Foot = Elem.querySelector(".page-foot");
  const Edit = Make("button", "link-button edit-book", "Edit");
  Edit.type = "button";
  // The tick box that marks the book as done, or not done again
  const DoneBox = Make("button", "link-button done-box", "Done");
  DoneBox.type = "button";
  Foot.append(Edit, DoneBox);
  Edit.hidden = !CanEdit(Book);                                        // on a joint shelf only the owner and whoever added it can edit it
  // On a joint shelf: who added it, in their colour, and the stripe across the top of the spine
  const Section = SectionOf(Book);
  if (Section && Section.joint)
  {
    const Person = PersonOf(Section, Book);
    const Colour = Person ? ColourOf(Person.key) : "var(--faded)";
    const Line = Make("p", "added-by");
    const Face = Make("i");
    Face.style.setProperty("--who", Colour);
    Line.append(Face, "Added by " + (!Person ? "a former member" : Person.member_id === MyId() ? "you" : Person.name));
    Elem.querySelector(".page.right h3").after(Line);
    const Stripe = Make("i", "spine-stripe");
    Stripe.setAttribute("aria-hidden", "true");
    Stripe.style.setProperty("--who", Colour);
    Elem.querySelector(".spine").append(Stripe);
  }
  // The dust that gathers on a book that has not been opened for a while, drawn by styles.css
  const Dust = Make("i", "dust");
  Dust.setAttribute("aria-hidden", "true");
  Elem.querySelector(".spine").append(Dust);
  DressAsDone(Elem, Book);
  if (typeof DressComeBack === "function") DressComeBack(Elem, Book);     // comeback.js writes the day to come back to it inside the book
  return Elem;
}

// The MarkJoint function gives a joint shelf's plaque its ribbon, in the owner's colour and with how many people are on it
function MarkJoint(Plaque, Section)
{
  if (!Section.joint) return Plaque;
  Plaque.classList.add("is-joint");
  Plaque.dataset.people = Section.people.length;
  Plaque.style.setProperty("--owner", ColourOf(Section.people[0].key));
  Plaque.setAttribute("aria-label", Section.name + ", a joint shelf with " + Section.people.length + " people");
  return Plaque;
}

// The RenderTabs function builds the plaques at the top, each one is an on/off switch for its section and All switches them all off again
function RenderTabs()
{
  TabsRoot.replaceChildren();
  const Total = Library.reduce((Sum, Section) => Sum + Section.books.length, 0);
  FindButton.hidden = Total === 0 || !ShelfSettings.find;             // nothing to search until there is a book
  ShowDoneSwitch();
  if (Total === 0 && !SearchLine.hidden) ShowSearch(false);
  const AddTab = (Key, Label, Count, OnClick) =>
  {
    const Button = Make("button", "plaque tab", Label + " ");
    Button.type = "button";
    Button.dataset.section = Key;
    Button.append(Make("span", "count", String(Count)));
    Button.addEventListener("click", OnClick);
    Button.addEventListener("click", () => Button.scrollIntoView({ inline: "nearest", block: "nearest" }));     // a plaque half hidden at the end of the row slides fully into view
    TabsRoot.append(Button);
    return Button;
  };
  if (Library.length) AddTab("all", "All", Total, () => { Chosen.clear(); Update(); });
  Library.forEach((Section) => MarkJoint(AddTab(Section.id, Section.name, Section.books.length, () =>
  {
    if (Chosen.has(Section.id)) Chosen.delete(Section.id); else Chosen.add(Section.id);
    if (Chosen.size === Library.length) Chosen.clear();                 // every section switched on is the same as "All"
    Update();
  }), Section));

  EditSections.textContent = Library.length ? "Edit sections" : "+ Section";
  BoardCount.textContent = String(Library.length);
  requestAnimationFrame(CheckArrows);
  if (typeof SyncLive === "function") SyncLive();     // live.js listens on the joint shelves now showing, it loads after this file so it is not there for the very first build
  if (typeof PlaceLetters === "function") PlaceLetters();
}

// Sliding the plaques:

// The plaque row's parts: the box the plaques slide in, its two arrows, Edit sections and the shelf count on the side board
const TabsSlide = document.getElementById("tabsSlide");
const SlideLeft = document.getElementById("slideLeft");
const SlideRight = document.getElementById("slideRight");
const EditSections = document.getElementById("editSections");
const BoardCount = document.getElementById("boardCount");

SlideLeft.append(DrawArrow(true));
SlideRight.append(DrawArrow(false));

// The CheckArrows function shows the arrows only when the plaques do not all fit, and dims the arrow at whichever end has been reached
function CheckArrows()
{
  const Standing = getComputedStyle(TabsRoot).flexDirection === "column";       // Shelves down the side is showing, so nothing slides sideways
  const Slides = !Standing && TabsRoot.scrollWidth > TabsRoot.clientWidth + 2;
  const AtStart = TabsRoot.scrollLeft <= 2;
  const AtEnd = TabsRoot.scrollLeft + TabsRoot.clientWidth >= TabsRoot.scrollWidth - 2;
  TabsSlide.classList.toggle("can-slide", Slides);
  TabsSlide.classList.toggle("at-start", Slides && AtStart);
  TabsSlide.classList.toggle("at-end", Slides && AtEnd);
  SlideLeft.disabled = !Slides || AtStart;
  SlideRight.disabled = !Slides || AtEnd;
}

// The SlideBy function slides the row by part of its width, gently unless the device asks for less motion
function SlideBy(Share)
{
  const Calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  TabsRoot.scrollBy({ left: TabsRoot.clientWidth * Share, behavior: Calm ? "auto" : "smooth" });
}

// Each arrow slides the row about three quarters of its width
SlideLeft.addEventListener("click", () => SlideBy(-0.75));
SlideRight.addEventListener("click", () => SlideBy(0.75));
TabsRoot.addEventListener("scroll", CheckArrows);
window.addEventListener("resize", CheckArrows);
// On a laptop the mouse wheel slides the row too, once there are more plaques than fit
TabsRoot.addEventListener("wheel", (event) =>
{
  if (!TabsSlide.classList.contains("can-slide") || Math.abs(event.deltaY) < Math.abs(event.deltaX)) return;
  event.preventDefault();
  TabsRoot.scrollLeft += event.deltaY;
}, { passive: false });
EditSections.addEventListener("click", OpenSectionsCard);

// The RenderShelves function builds the shelves for whichever sections are switched on
function RenderShelves()
{
  LibraryRoot.replaceChildren();

  if (!Library.length)
  {
    const Empty = Make("div", "empty-library");
    Empty.append(
      Make("h2", "", "Your shelves are empty"),
      Make("p", "", "Add the first artist, creator or shop you want to remember, and it will appear here as a book."),
    );
    LibraryRoot.append(Empty);
    return;
  }

  Library.forEach((Section, Index) =>
  {
    if (Chosen.size && !Chosen.has(Section.id)) return;
    // While searching, a section with no matching book is left out
    if (SearchText && !Section.books.some(Visible)) return;
    // While done books are hidden, so is a section where every book is done
    if (HidingDone() && Section.books.length && !Section.books.some(Visible)) return;

    const Block = Make("section", "section");
    Block.dataset.section = Section.id;                               // so a dropped book knows which shelf it landed on
    // With exactly one section switched on, its plaque at the top already names it. Otherwise each shelf gets a label.
    if (Chosen.size !== 1) Block.append(MarkJoint(Make("h2", "plaque", Section.name), Section));
    const Shelf = Make("div", "shelf");
    // i is the book's place in its section, so a book keeps its colour while the search hides the books around it
    Section.books.forEach((Book, i) =>
    {
      if (Visible(Book)) Shelf.append(MakeLibraryBook(Book, Index * 3 + i));
    });
    Shelf.append(MakeOrnament(Index));
    Block.append(Shelf);
    LibraryRoot.append(Block);
  });

  // A search that found nothing gets a message in place of the shelves
  if (SearchText && !LibraryRoot.children.length)
  {
    const Empty = Make("div", "empty-library");
    Empty.append(Make("h2", "", "No books match \u201C" + SearchBox.value.trim() + "\u201D"));
    const DoneMatch = HidingDone() && Library.some((Section) => Section.books.some((Book) => Book.done && Matches(Book)));
    const Hint = DoneMatch ? "A done book matches. Press Hide done to bring the done books back."
      : Chosen.size ? "Only the sections switched on were searched. Press All to search every shelf."
      : "Check the spelling or try a shorter word.";
    Empty.append(Make("p", "", Hint));
    LibraryRoot.append(Empty);
    return;
  }

  // Hiding the done books can leave nothing to show as well
  if (HidingDone() && !LibraryRoot.children.length)
  {
    const Empty = Make("div", "empty-library");
    Empty.append(
      Make("h2", "", "Every book here is done"),
      Make("p", "", "Press Hide done to bring them back."),
    );
    LibraryRoot.append(Empty);
    return;
  }

  ApplyTheme(Current.theme);     // colour the new books to match the background
  TidyOrnaments();
}

// The Update function lights up the plaques that are switched on and then rebuilds the shelves
function Update()
{
  CloseAll();
  TabsRoot.querySelectorAll(".tab").forEach((Tab) =>
  {
    const On = Tab.dataset.section === "all" ? Chosen.size === 0 : Chosen.has(Tab.dataset.section);
    Tab.setAttribute("aria-pressed", String(On));
  });
  RenderShelves();
  PullButton.hidden = !ShelfSettings.pull || !LibraryRoot.querySelector(".book:not(.is-done)");     // only when there is a book that is not done to pull
  if (typeof PlaceLetters === "function") PlaceLetters();     // letters.js puts the letters back on the plaques, it loads after this file
  if (typeof SaveCopy === "function") SaveCopy();             // offline.js keeps a copy of the shelves on this device for when there is no signal
}

// Pulling a book at random:

// PullButton is the Pull a book button and Pulling holds whether a pick is under way
const PullButton = document.getElementById("pullButton");
let Pulling = false;

// The Pause function waits for a number of milliseconds
function Pause(Milliseconds)
{
  return new Promise((Resolve) => setTimeout(Resolve, Milliseconds));
}

// The OnScreen function checks whether a book's spine can be seen without scrolling
function OnScreen(Elem)
{
  const Box = Elem.querySelector(".spine").getBoundingClientRect();
  return Box.bottom > 0 && Box.top < window.innerHeight && Box.right > 0 && Box.left < window.innerWidth;
}

// The PullBook function picks a book that is not done from the shelves on show, lifts it off the shelf and opens it
async function PullBook()
{
  const Choices = [...LibraryRoot.querySelectorAll(".book:not(.is-done)")];
  if (!Choices.length || Pulling) return;
  Pulling = true;
  PullButton.disabled = true;
  CloseAll();

  const Picked = Choices[Math.floor(Math.random() * Choices.length)];
  const Calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  Picked.querySelector(".spine").scrollIntoView({ block: "center", behavior: Calm ? "auto" : "smooth" });
  await Pause(Calm ? 0 : 350);

  // The hop: a light runs along a few of the books on screen, slowing down, before it stops on the picked one
  if (!Calm)
  {
    const Near = Choices.filter((Elem) => Elem !== Picked && OnScreen(Elem));
    const Hops = Math.min(6, Near.length);
    let Last = null;
    for (let i = 0; i < Hops; i++)
    {
      let Next = Near[Math.floor(Math.random() * Near.length)];
      if (Next === Last && Near.length > 1) Next = Near[(Near.indexOf(Next) + 1) % Near.length];
      Next.classList.add("is-hopped");
      await Pause(90 + i * 35);
      Next.classList.remove("is-hopped");
      Last = Next;
    }
  }

  // The picked book rises off the shelf, then falls open
  Picked.classList.add("is-pulled");
  await Pause(Calm ? 0 : 420);
  Picked.classList.remove("is-pulled");
  OpenBook(Picked);
  NoteOpened(Picked);
  Picked.querySelector(".spine").focus({ preventScroll: true });
  PullButton.disabled = false;
  Pulling = false;
}

PullButton.addEventListener("click", PullBook);

// Typing in the search box rebuilds the shelves with only the books that match
SearchBox.addEventListener("input", () =>
{
  SearchText = SearchBox.value.trim().toLowerCase();
  Update();
});

// The Find button opens the search box and closes it again
FindButton.addEventListener("click", () => ShowSearch(SearchLine.hidden));

// The Escape key closes the search box and hands the keyboard back to the Find button
SearchBox.addEventListener("keydown", (event) =>
{
  if (event.key !== "Escape") return;
  ShowSearch(false);
  FindButton.focus();
});

// The Hide done button hides the books marked as done and brings them back, the choice is remembered on this device
DoneSwitch.addEventListener("click", () =>
{
  HideDone = !HideDone;
  Remember("library-hide-done", HideDone ? "yes" : "no");
  ShowDoneSwitch();
  Update();
});

// The Done tick box inside an open book marks the book as done, or as not done again
LibraryRoot.addEventListener("click", async (event) =>
{
  const Box = event.target.closest(".done-box");
  if (!Box || Box.disabled) return;
  const Elem = Box.closest(".book");
  const Book = BookWithId(Elem.dataset.id);
  if (!Book) return;

  Box.disabled = true;
  try
  {
    await MarkDone(Book, !Book.done);
    LibraryNote.hidden = true;
    ShowDoneSwitch();
    if (HidingDone() && Book.done) Update();          // it is hidden straight away, like the other done books
    else DressAsDone(Elem, Book);
  }
  catch (error)
  {
    console.error(error);
    ShowLibraryNote(ExplainDatabase(error));
  }
  Box.disabled = false;
});

// A click or tap that opens a book counts as opening it, so its dust blows away (opening by hover does not count)
LibraryRoot.addEventListener("click", (event) =>
{
  const Spine = event.target.closest(".spine");
  const Elem = Spine && Spine.closest(".book");
  if (Elem && Elem.classList.contains("is-open")) NoteOpened(Elem);
});

// The settings panel:

// The ApplyShelfSettings function shows or hides each shelf tool to match the settings and rebuilds the shelves
function ApplyShelfSettings()
{
  document.body.classList.toggle("no-done", !ShelfSettings.done);
  document.body.classList.toggle("no-ornaments", !ShelfSettings.ornaments);
  document.body.classList.toggle("no-hover", !ShelfSettings.hover);
  document.body.classList.toggle("side-list", ShelfSettings.sideList);
  document.body.classList.toggle("still-sign", !ShelfSettings.sway);
  if (!ShelfSettings.find && !SearchLine.hidden) ShowSearch(false);
  SettingsList.querySelectorAll("input").forEach((Box) =>
  {
    Box.checked = ShelfSettings[Box.dataset.key];
    if (Box.dataset.key === "hideDone") Box.disabled = !ShelfSettings.done;      // it only matters while the done mark is on
  });
  RenderTabs();
  Update();
}

// The LoadShelfSettings function reads the member's saved settings, or the ones saved on this device while login is off
function LoadShelfSettings(Member)
{
  let Saved = Member && Member.user_metadata ? Member.user_metadata.shelf_settings : null;
  if (!Member)
  {
    try { Saved = JSON.parse(Recall("library-shelf-settings")); }
    catch (error) { Saved = null; }
  }
  if (!Saved) return;
  Object.keys(ShelfSettings).forEach((Key) =>
  {
    if (typeof Saved[Key] === "boolean") ShelfSettings[Key] = Saved[Key];
  });
}

// The SaveShelfSettings function saves the settings with the member's account so they follow them to every device
async function SaveShelfSettings()
{
  if (DB && SignedIn)
  {
    const { data: Data, error } = await DB.auth.updateUser({ data: { shelf_settings: { ...ShelfSettings } } });
    if (error) throw error;
    SignedIn = Data.user;
  }
  else
  {
    Remember("library-shelf-settings", JSON.stringify(ShelfSettings));
  }
}

// The BuildSettingsList function makes one switch per shelf tool in the settings panel
function BuildSettingsList()
{
  SettingsList.replaceChildren();
  SETTING_LIST.forEach((Setting) =>
  {
    const Line = Make("label", "setting");
    const Box = document.createElement("input");
    Box.type = "checkbox";
    Box.dataset.key = Setting.key;
    const Words = Make("span", "setting-words");
    Words.append(Make("b", "", Setting.label), Make("small", "", Setting.hint));
    Line.append(Box, Words);
    SettingsList.append(Line);

    // Flipping a switch takes effect straight away and is then saved, if the save fails it flips back
    Box.addEventListener("change", async () =>
    {
      SettingsNote.hidden = true;
      ShelfSettings[Setting.key] = Box.checked;
      ApplyShelfSettings();
      try
      {
        await SaveShelfSettings();
      }
      catch (error)
      {
        console.error(error);
        ShelfSettings[Setting.key] = !Box.checked;
        ApplyShelfSettings();
        SettingsNote.textContent = "That setting could not be saved. " + ExplainDatabase(error);
        SettingsNote.hidden = false;
      }
    });
  });
}

// Saving a copy of the library and loading one back:

// LibraryStatus is the line under the two buttons that says how a download or a load is going
const LibraryStatus = document.getElementById("libraryStatus");
const CopyFile = document.getElementById("copyFile");

// The ShowLibraryStatus function shows how a download or a load is going, Problem makes it red
function ShowLibraryStatus(Message, Problem)
{
  LibraryStatus.textContent = Message;
  LibraryStatus.classList.toggle("problem", Boolean(Problem));
  LibraryStatus.hidden = !Message;
}

// The PictureAsText function fetches a stored picture and turns it into text, so it can travel inside the copy
async function PictureAsText(Path)
{
  const Address = await PictureAddress(Path);
  const Picture = await (await fetch(Address)).blob();
  return new Promise((Resolve, Reject) =>
  {
    const Reader = new FileReader();
    Reader.onload = () => Resolve(Reader.result);
    Reader.onerror = () => Reject(Reader.error);
    Reader.readAsDataURL(Picture);
  });
}

// The DownloadLibrary function saves the whole library, pictures included, as one file on this device
async function DownloadLibrary(Button)
{
  Button.disabled = true;
  const Total = Library.reduce((Sum, Section) => Sum + Section.books.reduce((Count, Book) => Count + [Book, ...(Book.pages || [])].filter((Page) => Page.picture).length, 0), 0);
  let Packed = 0;
  let Missed = 0;                                // pictures that could not be fetched, the copy is still made without them
  ShowLibraryStatus("Packing your library\u2026");
  try
  {
    const Copy = { app: "Itsuka", version: 1, saved: new Date().toISOString(), sections: [] };
    for (const Section of Library)
    {
      const Shelf = { name: Section.name, sort_by: Section.sort_by || "", books: [] };
      for (const Book of Section.books)
      {
        const Entry = { name: Book.name, link: Book.link || "", notes: Book.notes || "", done: Boolean(Book.done), added: Book.created_at || null, picture: null };
        if (Book.picture)
        {
          try { Entry.picture = await PictureAsText(Book.picture); }
          catch (error) { console.error(error); Missed++; }          // a picture that cannot be fetched is left out, the book still goes in
          Packed++;
          ShowLibraryStatus("Packing pictures: " + Packed + " of " + Total + "\u2026");
        }
        // Its pages go in too, each with its own picture
        Entry.pages = [];
        for (const Page of Book.pages || [])
        {
          const Sheet = { title: Page.title, link: Page.link || "", notes: Page.notes || "", picture: null };
          if (Page.picture)
          {
            try { Sheet.picture = await PictureAsText(Page.picture); }
            catch (error) { console.error(error); Missed++; }
            Packed++;
            ShowLibraryStatus("Packing pictures: " + Packed + " of " + Total + "\u2026");
          }
          Entry.pages.push(Sheet);
        }
        Shelf.books.push(Entry);
      }
      Copy.sections.push(Shelf);
    }

    // The file is handed to the browser to save, named with today's date
    const FileName = "itsuka-library-" + new Date().toISOString().slice(0, 10) + ".json";
    const Address = URL.createObjectURL(new Blob([JSON.stringify(Copy, null, 2)], { type: "application/json" }));
    const Link = document.createElement("a");
    Link.href = Address;
    Link.download = FileName;
    document.body.append(Link);
    Link.click();
    Link.remove();
    setTimeout(() => URL.revokeObjectURL(Address), 2000);
    const Books = Copy.sections.reduce((Sum, Shelf) => Sum + Shelf.books.length, 0);
    ShowLibraryStatus("Saved " + FileName + " with " + Copy.sections.length + (Copy.sections.length === 1 ? " section and " : " sections and ") + Books + (Books === 1 ? " book." : " books.") + (Missed ? " " + Missed + (Missed === 1 ? " picture" : " pictures") + " could not be fetched and " + (Missed === 1 ? "was" : "were") + " left out, try again with a better signal to include " + (Missed === 1 ? "it." : "them.") : ""), Missed > 0);
  }
  catch (error)
  {
    console.error(error);
    ShowLibraryStatus("The copy could not be made. " + ExplainDatabase(error), true);
  }
  Button.disabled = false;
}

// The PictureFromText function turns a picture that travelled inside a copy back into a file that can be stored
async function PictureFromText(Text)
{
  return (await fetch(Text)).blob();
}

// The LoadCopy function reads a copy made by DownloadLibrary and adds what is in it to the library
// Sections are matched by name, and a book that is already on the same shelf (same name and link) is skipped, so loading the same copy twice adds nothing twice
async function LoadCopy(ChosenFile)
{
  let Copy = null;
  try { Copy = JSON.parse(await ChosenFile.text()); }
  catch (error) { Copy = null; }
  if (!Copy || Copy.app !== "Itsuka" || !Array.isArray(Copy.sections))
  {
    ShowLibraryStatus("That file is not an Itsuka copy. Choose a file made with Download a copy.", true);
    return;
  }

  const Shelves = Copy.sections.filter((Shelf) => Shelf && typeof Shelf.name === "string" && Shelf.name.trim());
  const Total = Shelves.reduce((Sum, Shelf) => Sum + (Array.isArray(Shelf.books) ? Shelf.books.length : 0), 0);
  const Question = "Add the " + Total + (Total === 1 ? " book" : " books") + " in " + Shelves.length + (Shelves.length === 1 ? " section" : " sections") + " from this copy? Books already on the same shelf are skipped.";
  if (!(await AskToConfirm(Question, "Add them", true))) return;

  let Added = 0, Skipped = 0, Done = 0;
  const Same = (A, B) => A.trim().toLowerCase() === B.trim().toLowerCase();
  try
  {
    for (const Shelf of Shelves)
    {
      const Name = Shelf.name.trim().slice(0, 100);
      let Section = SectionNamed(Name);
      if (!Section)
      {
        Section = await SaveSection(Name);
        const How = SORT_NAMES.some(([Value]) => Value && Value === Shelf.sort_by) ? Shelf.sort_by : "";
        if (How) await SetSectionSort(Section, How);
      }
      for (const Entry of Array.isArray(Shelf.books) ? Shelf.books : [])
      {
        Done++;
        ShowLibraryStatus("Adding books: " + Done + " of " + Total + "\u2026");
        if (!Entry || typeof Entry.name !== "string" || !Entry.name.trim()) { Skipped++; continue; }
        const Link = TidyLink(Entry.link || "");
        if (Section.books.some((Book) => Same(Book.name, Entry.name) && (Book.link || "") === Link)) { Skipped++; continue; }

        const Details = { name: Entry.name.trim().slice(0, 200), link: Link.slice(0, 2000), notes: String(Entry.notes || "").slice(0, 10000), picture: "" };
        if (Entry.done) Details.done = true;
        if (Entry.added && !isNaN(Date.parse(Entry.added))) Details.created_at = Entry.added;      // it keeps the day it was first added
        if (typeof Entry.picture === "string" && Entry.picture.startsWith("data:image/"))
        {
          try { Details.picture = await StorePicture(await PictureFromText(Entry.picture), Section.joint ? "shelves/" + Section.id : ""); }
          catch (error) { console.error(error); }                    // a picture that cannot be stored is left out, the book still goes in
        }
        const Book = await SaveBook(Section, Details);
        await LoadPages(Book, Entry.pages, Section);
        Added++;
      }
    }
    ShowLibraryStatus("Added " + Added + (Added === 1 ? " book" : " books") + (Skipped ? ", skipped " + Skipped + " already on your shelves." : "."));
  }
  catch (error)
  {
    console.error(error);
    ShowLibraryStatus("Stopped after adding " + Added + (Added === 1 ? " book. " : " books. ") + ExplainDatabase(error), true);
  }
  RenderTabs();
  Update();
}

// The LoadPages function adds the pages that travelled with a book in a copy, up to the most a book can hold, a page that cannot be added is left out and the book keeps the rest
async function LoadPages(Book, Sheets, Section)
{
  Book.pages = [];
  const Folder = Section.joint ? "shelves/" + Section.id : "";
  for (const Sheet of (Array.isArray(Sheets) ? Sheets : []).slice(0, MOST_PAGES - 1))
  {
    if (!Sheet || typeof Sheet.title !== "string" || !Sheet.title.trim()) continue;
    const Details = { book_id: Book.id, title: Sheet.title.trim().slice(0, 100), link: TidyLink(Sheet.link || "").slice(0, 2000), notes: String(Sheet.notes || "").slice(0, 4000), picture: "", position: Book.pages.length + 1 };
    if (typeof Sheet.picture === "string" && Sheet.picture.startsWith("data:image/"))
    {
      try { Details.picture = await StorePicture(await PictureFromText(Sheet.picture), Folder); }
      catch (error) { console.error(error); }
    }
    if (!DB) { Book.pages.push({ id: "local-page-" + Date.now() + "-" + Book.pages.length, ...Details }); continue; }
    const { data: Data, error } = await DB.from("book_pages").insert(Details).select("*").single();
    if (error) { console.error(error); continue; }
    Book.pages.push(Data);
  }
}

// The Download a copy button, and the Load a copy button which opens the file picker
document.getElementById("downloadCopy").addEventListener("click", (event) => DownloadLibrary(event.currentTarget));
document.getElementById("loadCopy").addEventListener("click", () =>
{
  ShowLibraryStatus("");
  CopyFile.value = "";
  CopyFile.click();
});
CopyFile.addEventListener("change", () =>
{
  if (CopyFile.files[0]) LoadCopy(CopyFile.files[0]);
});

// Moving a book by dragging its spine:
// With a mouse the book lifts once it is dragged a little, on a phone the finger has to rest on the spine for a moment first so that scrolling still works

// HOLD_TIME is how long a finger must rest on a spine before the book lifts, in milliseconds
const HOLD_TIME = 350;
// MOUSE_SLACK and TOUCH_SLACK are how far a press may move, in screen pixels, before a mouse lifts the book or a finger counts as scrolling
const MOUSE_SLACK = 6;
const TOUCH_SLACK = 10;

// Press holds a press on a spine that has not lifted the book yet and Carry holds the book being carried, both are null the rest of the time
let Press = null;
let Carry = null;
// DroppedAt holds when the last book was put down, so the click that follows a drag does not open it
let DroppedAt = 0;

// The ForgetPress function drops a press that did not turn into a drag
function ForgetPress()
{
  if (Press) clearTimeout(Press.Timer);
  Press = null;
}

// The LiftBook function starts carrying a book: its slot on the shelf fades and a copy of its spine follows the pointer
function LiftBook(Elem, X, Y)
{
  ForgetPress();
  CloseAll();
  const Spine = Elem.querySelector(".spine");
  const Box = Spine.getBoundingClientRect();
  const Copy = Spine.cloneNode(true);
  Copy.className = "spine carried";
  ["--cover", "--title", "--w", "--h"].forEach((Name) => Copy.style.setProperty(Name, Elem.style.getPropertyValue(Name)));
  document.body.append(Copy);
  document.body.classList.add("carrying");
  Elem.classList.add("is-lifted");
  Carry = { Elem, Copy, GrabX: X - Box.left, GrabY: Y - Box.top, X, Y, HomeShelf: Elem.parentNode, HomeNext: Elem.nextSibling };
  if (navigator.vibrate) navigator.vibrate(15);                       // a small buzz on phones that support it
  CarryTo(X, Y);
  requestAnimationFrame(ScrollWhileCarrying);
}

// The CarryTo function moves the carried copy to the pointer and slides the book's slot to wherever it would land
function CarryTo(X, Y)
{
  if (typeof CarryOver === "function" && CarryOver(X, Y)) return;     // pages.js: held over the middle of another book, to put it inside
  Carry.X = X;
  Carry.Y = Y;
  Carry.Copy.style.left = X - Carry.GrabX + "px";
  Carry.Copy.style.top = Y - Carry.GrabY - 12 + "px";

  const Under = document.elementFromPoint(X, Y);
  if (!Under) return;
  const Over = Under.closest(".book");
  const Shelf = Under.closest(".shelf");
  if (Over && Over !== Carry.Elem)
  {
    // Over the left half of a book the slot goes before it, over the right half it goes after
    const Box = Over.getBoundingClientRect();
    const Next = X > Box.left + Box.width / 2 ? Over.nextSibling : Over;
    if (Next !== Carry.Elem && Carry.Elem.nextSibling !== Next) Over.parentNode.insertBefore(Carry.Elem, Next);
  }
  else if (Shelf && !Over)
  {
    // Over the empty part of a shelf the slot goes on the end, just before the ornament
    const Ornament = Shelf.querySelector(".ornament");
    if (Carry.Elem.parentNode !== Shelf || Carry.Elem.nextSibling !== Ornament) Shelf.insertBefore(Carry.Elem, Ornament);
  }
}

// The ScrollWhileCarrying function scrolls the page when a carried book is held near the top or bottom of the screen
function ScrollWhileCarrying()
{
  if (!Carry) return;
  const Edge = 70;
  const Step = Carry.Y < Edge ? -10 : Carry.Y > window.innerHeight - Edge ? 10 : 0;
  if (Step)
  {
    window.scrollBy(0, Step);
    CarryTo(Carry.X, Carry.Y);
  }
  requestAnimationFrame(ScrollWhileCarrying);
}

// The StopCarrying function takes away the carried copy and gives back the book that was being carried
function StopCarrying()
{
  const Was = Carry;
  Carry = null;
  Was.Copy.remove();
  Was.Elem.classList.remove("is-lifted");
  document.body.classList.remove("carrying");
  DroppedAt = performance.now();
  return Was;
}

// The PutBack function ends a drag without moving anything
function PutBack()
{
  const Was = StopCarrying();
  Was.HomeShelf.insertBefore(Was.Elem, Was.HomeNext);
}

// The DropBook function puts the carried book down where its slot is and saves its new shelf and place
async function DropBook()
{
  if (typeof DropInside === "function" && DropInside()) return;      // pages.js: let go over the middle of another book
  const Was = StopCarrying();
  const Elem = Was.Elem;
  const Book = BookWithId(Elem.dataset.id);
  const To = Library.find((Section) => String(Section.id) === Elem.closest(".section").dataset.section);

  // The books now either side of it on the shelf tell us where it goes among all the books of that section, hidden ones included
  const IsBook = (Other) => Other && Other.classList.contains("book");
  const Others = To.books.filter((Other) => Other !== Book);
  let Index = Others.length;
  if (IsBook(Elem.nextElementSibling)) Index = Others.indexOf(BookWithId(Elem.nextElementSibling.dataset.id));
  else if (IsBook(Elem.previousElementSibling)) Index = Others.indexOf(BookWithId(Elem.previousElementSibling.dataset.id)) + 1;

  // Put down where it was picked up: nothing to save
  if (SectionOf(Book) === To && To.books.indexOf(Book) === Index) return;

  // A book someone else added stays on its joint shelf, and a joint shelf sorted A to Z (or by date) for this member cannot be rearranged by hand
  const From = SectionOf(Book);
  const Refuse = From !== To && !CanEdit(Book) ? "Only " + (From.people[0] ? From.people[0].name : "the owner") + " and whoever added this book can move it to another shelf."
    : To.joint && To.sort_by && From === To ? "You have this shelf sorted. Switch it to Your own order in Edit sections to move its books by hand."
    : "";
  if (Refuse)
  {
    ShowLibraryNote(Refuse);
    Update();
    return;
  }

  // Its place is a number between the places of the books either side, so only this one book has to be saved
  const Before = Others[Index - 1];
  const After = Others[Index];
  // On a joint shelf that is sorted just for this member, a book brought from another shelf goes on the end of the shared order
  const ByPlace = [...Others].sort((a, b) => a.position - b.position);
  const Position = To.joint && To.sort_by ? PlaceBetween(ByPlace[ByPlace.length - 1], null) : PlaceBetween(Before, After);
  try
  {
    await MoveBook(Book, To, Index, Position);
    LibraryNote.hidden = true;
    if (To.joint && To.sort_by) To.books.sort(SortRule(To.sort_by));
    else if (To.sort_by) await SetSectionSort(To, "");   // a hand-placed book means the shelf is in the member's own order now
  }
  catch (error)
  {
    console.error(error);
    ShowLibraryNote(ExplainDatabase(error));
  }
  RenderTabs();                                  // the counts on the plaques may have changed
  Update();                                      // rebuilt from the saved order, so a move that failed goes back by itself
}

// A press on a spine may become a drag
LibraryRoot.addEventListener("pointerdown", (event) =>
{
  const Spine = event.target.closest(".spine");
  if (!Spine || event.button !== 0 || Carry || !ShelfSettings.drag || NoSignalNow()) return;
  const Elem = Spine.closest(".book");
  Press = { Elem, X: event.clientX, Y: event.clientY, Touch: event.pointerType !== "mouse", Timer: null };
  if (Press.Touch) Press.Timer = setTimeout(() => LiftBook(Elem, Press.X, Press.Y), HOLD_TIME);
});

// Moving the pointer lifts the book (mouse), carries it, or shows that a finger is scrolling instead
document.addEventListener("pointermove", (event) =>
{
  if (Carry)
  {
    CarryTo(event.clientX, event.clientY);
    return;
  }
  if (!Press) return;
  const Moved = Math.hypot(event.clientX - Press.X, event.clientY - Press.Y);
  if (Press.Touch && Moved > TOUCH_SLACK) ForgetPress();
  if (Press && !Press.Touch && Moved > MOUSE_SLACK) LiftBook(Press.Elem, event.clientX, event.clientY);
});

// Letting go puts the book down
document.addEventListener("pointerup", () =>
{
  ForgetPress();
  if (Carry) DropBook();
});

// The browser taking over the gesture, or the Escape key, puts the book back where it was
document.addEventListener("pointercancel", () =>
{
  ForgetPress();
  if (Carry) PutBack();
});
document.addEventListener("keydown", (event) =>
{
  if (event.key === "Escape" && Carry) PutBack();
});

// While a book is carried the page must not scroll under the finger
document.addEventListener("touchmove", (event) =>
{
  if (Carry) event.preventDefault();
}, { passive: false });

// A long press on a phone would otherwise bring up the browser's own menu
LibraryRoot.addEventListener("contextmenu", (event) =>
{
  if (event.target.closest(".spine") && (Press || Carry)) event.preventDefault();
});

// The click that comes straight after a drag is swallowed, so putting a book down does not open it
LibraryRoot.addEventListener("click", (event) =>
{
  if (performance.now() - DroppedAt < 400) event.stopPropagation();
}, true);

// Loading from and saving to the database:
// Each of these talks to Supabase when someone is signed in, when login is off they only change the list in memory

// The Softly function runs a request that may fail before supabase-joint.sql has been run, a failure comes back as { error } instead of stopping the page
function Softly(Request)
{
  try
  {
    return Promise.resolve(Request()).catch((error) => ({ error }));
  }
  catch (error)
  {
    return Promise.resolve({ error });
  }
}

// The NoSignalNow function checks whether the library is showing the copy kept on this device because there is no signal (offline.js decides)
function NoSignalNow()
{
  return typeof NoSignal !== "undefined" && NoSignal;
}

// The LoadLibrary function fetches the member's sections and books and puts each book inside its section
async function LoadLibrary()
{
  const [Sections, Books, Rows, People, Pages] = await Promise.all([
    DB.from("sections").select("*"),
    DB.from("books").select("*"),
    Softly(() => DB.from("shelf_members").select("*")),
    Softly(() => DB.rpc("shelf_people")),
    Softly(() => DB.from("book_pages").select("*")),
  ]);
  if (Sections.error) throw Sections.error;
  if (Books.error) throw Books.error;
  GivePages(Books.data, Pages.error ? [] : Pages.data);          // pages need supabase-pages.sql, until it has been run books simply have none
  // Joint shelves need supabase-joint.sql, until it has been run every shelf is simply the member's own
  JointIsSetUp = !Rows.error && !People.error;
  const Mine = JointIsSetUp ? Rows.data.filter((Row) => Row.member_id === MyId()) : [];
  const Everyone = JointIsSetUp && Array.isArray(People.data) ? People.data : [];
  // Every section and book has a place, a number that decides its spot, so they are put in that order
  Library = Sections.data.filter((Section) => !WaitingGone.has(Section.id)).map((Section) => MakeShelf(Section, Books.data, Mine, Everyone)).sort((a, b) => a.position - b.position);
}

// The GivePages function puts each book's pages on it, in order, leaving out a page or book still waiting on its Undo note
function GivePages(Books, Pages)
{
  Books.forEach((Book) =>
  {
    Book.pages = (Pages || []).filter((Page) => Page.book_id === Book.id && !WaitingGone.has(Page.id)).sort((a, b) => a.position - b.position);
  });
}

// The MakeShelf function turns a section from the database into a shelf on the page, with its books, its people and the member's own place and sort for it
// On a shelf someone else owns, the member's own row holds where it sits among their plaques and how they like it sorted
function MakeShelf(Section, AllBooks, Mine, Everyone)
{
  const Owner = !Section.member_id || Section.member_id === MyId();
  const Row = Mine.find((Other) => Other.section_id === Section.id) || {};
  const Here = Everyone.filter((Person) => Person.section_id === Section.id);
  const Keys = ColourKeys(Here);
  const Shelf = {
    id: Section.id,
    name: Section.name,
    owner: Owner,
    joint: Here.length > 1,
    people: Here.map((Person, i) => ({ ...Person, key: Keys[i] })),
    sort_by: (Owner ? Section.sort_by : Row.sort_by) || "",
    share_key: Section.share_key || "",                  // empty until the shelf is shared
    invite_key: Section.invite_key || "",                // empty until the owner turns on the invite link
    position: Owner ? Section.position : Row.position ?? Section.position,
    books: AllBooks.filter((Book) => Book.section_id === Section.id && !WaitingGone.has(Book.id)).sort((a, b) => a.position - b.position),
  };
  if (Shelf.joint && Shelf.sort_by) Shelf.books.sort(SortRule(Shelf.sort_by));     // sorted for this member only, the shared order stays as it is
  return Shelf;
}

// The SaveSection function saves a new section, adds it to the page's list and returns it
async function SaveSection(Name)
{
  // A new section goes after the last one
  const Last = Library[Library.length - 1];
  const Position = Last ? Math.max(NowInSeconds(), Last.position + 1) : NowInSeconds();
  let Row = { id: "local-" + Date.now(), name: Name };
  if (DB)
  {
    const { data: Data, error } = await DB.from("sections").insert({ name: Name, position: Position }).select("id, name").single();
    if (error) throw error;
    Row = Data;
  }
  const Section = { id: Row.id, name: Row.name, owner: true, joint: false, people: [], sort_by: "", share_key: "", invite_key: "", position: Position, books: [] };
  Library.push(Section);
  return Section;
}

// The RenameSection function saves a new name for a section
async function RenameSection(Section, Name)
{
  if (DB)
  {
    const { error } = await DB.from("sections").update({ name: Name }).eq("id", Section.id);
    if (error) throw error;
  }
  Section.name = Name;
}

// The DeleteSection function deletes a section, the database removes its books and their pictures are removed from storage here
async function DeleteSection(Section)
{
  if (DB)
  {
    const { error } = await DB.from("sections").delete().eq("id", Section.id);
    if (error) throw error;
  }
  Section.books.forEach((Book) => DiscardPicture(Book.picture).catch(console.error));
  Library = Library.filter((Other) => Other !== Section);
  Chosen.delete(Section.id);
}

// The SaveBook function saves a new book into a section and returns it
async function SaveBook(Section, Details)
{
  // A new book goes on the end of its shelf, or into its sorted spot when the shelf keeps an order
  const Spot = SpotFor(Section, { ...Details, added: Date.now() });
  let Row = { id: "local-" + Date.now(), ...Details, position: Spot.Position };
  if (DB)
  {
    const { data: Data, error } = await DB.from("books").insert({ section_id: Section.id, ...Details, position: Row.position }).select("*").single();
    if (error) throw error;
    Row = Data;
  }
  Section.books.splice(Spot.Index, 0, Row);
  return Row;
}

// The UpdateBook function saves changes to an existing book and moves it to another section when that changed
async function UpdateBook(Book, Section, Details)
{
  const OldSection = SectionOf(Book);
  // A book moved to another section with the card goes on the end of that shelf (or into its sorted spot), and so does a renamed book on an A to Z shelf
  const Moved = OldSection !== Section;
  const Renamed = Section.sort_by === "name" && Details.name !== Book.name;
  const Changes = { ...Details };
  const Spot = Moved || Renamed ? SpotFor(Section, { ...Book, ...Details }) : null;
  if (Spot) Changes.position = Spot.Position;
  if (DB)
  {
    const { error } = await DB.from("books").update({ section_id: Section.id, ...Changes }).eq("id", Book.id);
    if (error) throw error;
  }
  Object.assign(Book, Changes);
  if (Spot)
  {
    OldSection.books = OldSection.books.filter((Other) => Other !== Book);
    Section.books = Section.books.filter((Other) => Other !== Book);
    Section.books.splice(Spot.Index, 0, Book);
  }
}

// The MoveSection function moves a section one place up (Step is -1) or down (Step is 1) and saves its new place
async function MoveSection(Section, Step)
{
  const From = Library.indexOf(Section);
  const To = From + Step;
  if (To < 0 || To >= Library.length) return;
  const Others = Library.filter((Other) => Other !== Section);
  const Before = Others[To - 1];
  const After = Others[To];
  const Position = Before && After ? (Before.position + After.position) / 2 : Before ? Before.position + 1 : After.position - 1;
  if (DB)
  {
    // A shelf someone else owns keeps its place in the member's own row, so moving it does not move it for anyone else
    const { error } = Section.owner
      ? await DB.from("sections").update({ position: Position }).eq("id", Section.id)
      : await DB.from("shelf_members").update({ position: Position }).eq("section_id", Section.id).eq("member_id", MyId());
    if (error) throw error;
  }
  Library.splice(From, 1);
  Library.splice(To, 0, Section);
  Section.position = Position;
}

// The SortBooks function puts a section's books in order by name, newest first or oldest first, and saves each book's new place
async function SortBooks(Section, How)
{
  const Sorted = [...Section.books].sort(SortRule(How));
  if (Section.joint)
  {
    Section.books = Sorted;                      // a joint shelf is only sorted for this member, the shared order is left as it is
    return;
  }
  if (DB)
  {
    const Results = await Promise.all(Sorted.map((Book, i) => DB.from("books").update({ position: i + 1 }).eq("id", Book.id)));
    const Failed = Results.find((Result) => Result.error);
    if (Failed) throw Failed.error;
  }
  Sorted.forEach((Book, i) => { Book.position = i + 1; });
  Section.books = Sorted;
}

// The SetSectionSort function saves how a shelf keeps its books in order, an empty How means the member's own order
async function SetSectionSort(Section, How)
{
  if (DB)
  {
    // On a shelf someone else owns, the sort is kept in the member's own row
    const { error } = Section.owner
      ? await DB.from("sections").update({ sort_by: How }).eq("id", Section.id)
      : await DB.from("shelf_members").update({ sort_by: How }).eq("section_id", Section.id).eq("member_id", MyId());
    if (error) throw error;
  }
  Section.sort_by = How;
  if (Section.joint && !How) Section.books.sort((a, b) => a.position - b.position);     // back to the shared order
}

// The MoveBook function saves a book's new shelf and place after it has been dragged, Index is where it goes among the other books of that section
async function MoveBook(Book, Section, Index, Position)
{
  if (DB)
  {
    const { error } = await DB.from("books").update({ section_id: Section.id, position: Position }).eq("id", Book.id);
    if (error) throw error;
  }
  const OldSection = SectionOf(Book);
  OldSection.books = OldSection.books.filter((Other) => Other !== Book);
  Section.books.splice(Index, 0, Book);
  Book.position = Position;
  Book.section_id = Section.id;
}

// The MarkDone function saves whether a book is done
async function MarkDone(Book, Done)
{
  if (DB)
  {
    const { error } = await DB.from("books").update({ done: Done }).eq("id", Book.id);
    if (error) throw error;
  }
  Book.done = Done;
  // The database stamps the day it was ticked, the page keeps the same so the reading record is right before the shelves are fetched again
  Book.done_at = Done ? new Date().toISOString() : null;
  Book.done_by = Done ? MyId() : null;
}

// The DeleteBook function deletes a book and its picture
async function DeleteBook(Book)
{
  if (DB)
  {
    const { error } = await DB.from("books").delete().eq("id", Book.id);
    if (error) throw error;
  }
  DiscardPicture(Book.picture).catch(console.error);
  (Book.pages || []).forEach((Page) => DiscardPicture(Page.picture).catch(console.error));    // its pages went with it
  Library.forEach((Section) => { Section.books = Section.books.filter((Other) => Other !== Book); });
}

// Undo after deleting:

// UNDO_TIME is how long the Undo note waits before a delete is saved
const UNDO_TIME = 8000;
// UndoNotes is where the Undo notes are pinned, and Waiting holds the deletes still to be saved, each as the function that saves it
const UndoNotes = document.getElementById("undoNotes");
const Waiting = new Set();

// The Quoted function puts a name in curly quotes, in bold, for a note
function Quoted(Name)
{
  return Make("b", "", "\u201C" + Name + "\u201D");
}

// The PinNote function pins a taped note at the bottom of the screen, a note with no button leaves by itself after a moment
function PinNote(Words, Button)
{
  const Note = Make("div", "undo-note");
  const Line = Make("p");
  Line.append(...Words);
  Note.append(Line);
  if (Button) Note.append(Button);
  MoveNotes();
  UndoNotes.append(Note);
  while (UndoNotes.children.length > 3) UndoNotes.firstElementChild.remove();     // only the newest three stay
  if (!Button) setTimeout(() => UnpinNote(Note), 2600);
  return Note;
}

// The PinProblem function pins a note about something that did not save, it stays long enough to read and has a button to put it away
function PinProblem(Words)
{
  const Button = Make("button", "", "Got it");
  Button.type = "button";
  const Note = PinNote(Words, Button);
  Button.addEventListener("click", () => UnpinNote(Note));
  setTimeout(() => UnpinNote(Note), 12000);
  return Note;
}

// The MoveNotes function keeps the notes inside the card that is open, if there is one, so Undo can still be pressed while the card covers the page
function MoveNotes()
{
  const Open = [...document.querySelectorAll("dialog[open]")].pop();
  const Home = Open || document.body;
  if (UndoNotes.parentElement !== Home) Home.append(UndoNotes);
}
// When a card closes, the notes move back out with it
document.addEventListener("close", () => setTimeout(MoveNotes, 0), true);

// The UnpinNote function lets a note go
function UnpinNote(Note)
{
  Note.classList.add("is-leaving");
  setTimeout(() => Note.remove(), 300);
}

// The DeleteLater function takes a book or a shelf off the page straight away and pins an Undo note, the delete is only saved when the note runs out
// TakeOff takes it off the page, PutBack puts it back where it was (and may return a book's id to point at) and Save deletes it for good
// Failed is what the note says when saving goes wrong, for a move rather than a delete (pages.js)
function DeleteLater(Id, Name, Words, TakeOff, PutBack, Save, Failed)
{
  WaitingGone.add(Id);
  TakeOff();
  RedrawAll();
  const Button = Make("button", "", "Undo");
  Button.type = "button";
  const Time = Make("span", "undo-time");
  Time.setAttribute("aria-hidden", "true");
  Time.append(Make("i"));
  const Note = PinNote(Words, Button);
  Note.append(Time);
  Note.style.setProperty("--undo-for", UNDO_TIME / 1000 + "s");
  let Settled = false;

  // Saving the delete: if it fails, the book or shelf comes back and the note says why
  const SaveNow = async () =>
  {
    if (Settled) return;
    Settled = true;
    clearTimeout(Timer);
    Waiting.delete(SaveNow);
    UnpinNote(Note);
    try
    {
      await Save();
    }
    catch (error)
    {
      console.error(error);
      PutBack();
      RedrawAll();
      PinProblem([(Failed || "\u201C" + Name + "\u201D could not be deleted, so it is back.") + " " + ExplainDatabase(error)]);
    }
    WaitingGone.delete(Id);
  };
  const Timer = setTimeout(SaveNow, UNDO_TIME);
  Waiting.add(SaveNow);

  // Undo puts it back where it was
  Button.addEventListener("click", () =>
  {
    if (Settled) return;
    Settled = true;
    clearTimeout(Timer);
    Waiting.delete(SaveNow);
    WaitingGone.delete(Id);
    const BookId = PutBack();
    RedrawAll();
    const Elem = BookId && LibraryRoot.querySelector('.book[data-id="' + BookId + '"]');
    if (Elem)
    {
      Elem.classList.add("is-returned");
      Elem.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
    Note.classList.add("is-back");
    Note.querySelector("p").replaceChildren("Put back where it was.");
    Button.remove();
    Time.remove();
    setTimeout(() => UnpinNote(Note), 1400);
  });
}

// The RedrawAll function redraws the plaques, the shelves and the Edit sections card if it is open
function RedrawAll()
{
  if (SectionsDialog.open) RenderSectionRows();
  RenderTabs();
  Update();
}

// When the page goes out of sight or closes, waiting deletes are saved straight away, so a deleted book does not come back next time
document.addEventListener("visibilitychange", () => { if (document.hidden) Waiting.forEach((SaveNow) => SaveNow()); });
window.addEventListener("pagehide", () => Waiting.forEach((SaveNow) => SaveNow()));

// Asking before deleting:

// ConfirmDialog is the card that asks before anything is deleted
const ConfirmDialog = document.getElementById("confirmDialog");

// The AskToConfirm function asks before something is deleted and returns true only when the delete button is pressed
// Calm is true for questions that are not about deleting, the button is then dark instead of red
function AskToConfirm(Message, ActionLabel, Calm)
{
  return new Promise((Resolve) =>
  {
    document.getElementById("confirmMessage").textContent = Message;
    const Yes = document.getElementById("confirmYes");
    Yes.textContent = ActionLabel;
    Yes.classList.toggle("danger", !Calm);
    document.getElementById("confirmNo").textContent = Calm ? "Not now" : "Keep it";
    const Answer = (Value) => { ConfirmDialog.onclose = null; ConfirmDialog.close(); Resolve(Value); };
    Yes.onclick = () => Answer(true);
    document.getElementById("confirmNo").onclick = () => Answer(false);
    ConfirmDialog.onclose = () => Resolve(false);            // closed with Escape or a click outside: treat as "no"
    ConfirmDialog.showModal();
  });
}

// The catalogue card (adding or editing a book):

// The parts of the catalogue card
const CatalogueDialog = document.getElementById("catalogueDialog");
const CatalogueForm = document.getElementById("catalogueForm");
const CatalogueNote = document.getElementById("catalogueNote");
const CatalogueSubmit = document.getElementById("catalogueSubmit");
const BookName = document.getElementById("bookName");
const BookLink = document.getElementById("bookLink");
const BookSection = document.getElementById("bookSection");
const BookNotes = document.getElementById("bookNotes");
const NewSectionLine = document.getElementById("newSectionLine");
const NewSectionName = document.getElementById("newSectionName");
const BookPictureFile = document.getElementById("bookPictureFile");
const BookPicturePreview = document.getElementById("bookPicturePreview");
const BookPictureLabel = document.getElementById("bookPictureLabel");
const BookPictureRemove = document.getElementById("bookPictureRemove");
const BookDelete = document.getElementById("bookDelete");

let EditingBook = null;        // the book being edited, or null when adding a new one
let ChosenPicture = null;      // a new file picked on the card, until the book is saved
let KeptPicture = "";          // when editing: the path of the picture the book already has, unless it was removed

// The SectionNamed function finds a section by its name, ignoring capital letters
function SectionNamed(Name)
{
  return Library.find((Section) => Section.name.toLowerCase() === Name.toLowerCase());
}

// The ShowCardNote function shows a message on a card
function ShowCardNote(Note, Message)
{
  Note.textContent = Message;
  Note.hidden = false;
}

// The ShowCardPicture function shows whichever picture the catalogue card holds: a newly chosen file, the book's existing one or none
async function ShowCardPicture()
{
  const Has = Boolean(ChosenPicture || KeptPicture);
  BookPicturePreview.hidden = !Has;
  BookPictureRemove.hidden = !Has;
  BookPictureLabel.textContent = Has ? "Change picture" : "Choose a picture";
  if (!Has) return;
  try
  {
    const Address = ChosenPicture ? URL.createObjectURL(ChosenPicture) : await PictureAddress(KeptPicture);
    PaintPixelated(BookPicturePreview, await LoadPicture(Address), THUMB_DOTS);
    if (ChosenPicture) URL.revokeObjectURL(Address);
  }
  catch (error)
  {
    if (ChosenPicture) { ChosenPicture = null; ShowCardPicture(); ShowCardNote(CatalogueNote, ExplainDatabase(error)); }
  }
}
// When a picture is chosen on the card we keep it and show its preview
BookPictureFile.addEventListener("change", (event) =>
{
  const ChosenFile = event.target.files[0];
  event.target.value = "";                       // so choosing the same file again still counts as a change
  if (ChosenFile) { ChosenPicture = ChosenFile; ShowCardPicture(); }
});
// Remove picture clears both the new choice and the book's existing picture
BookPictureRemove.addEventListener("click", () => { ChosenPicture = null; KeptPicture = ""; ShowCardPicture(); });

// The OpenCatalogueCard function opens the catalogue card, blank for adding a book or filled in for editing one
function OpenCatalogueCard(Book)
{
  CloseAll();
  EditingBook = Book || null;
  CatalogueForm.reset();
  CatalogueNote.hidden = true;
  CatalogueNote.classList.remove("good");
  ChosenPicture = null;
  KeptPicture = Book ? Book.picture || "" : "";

  document.getElementById("catalogueTitle").textContent = Book ? "Edit book" : "Add a book";
  CatalogueSubmit.textContent = Book ? "Save changes" : "Add to shelf";
  BookDelete.hidden = !Book;

  // The section list: every section, then the choice to start a new one.
  BookSection.replaceChildren();
  Library.forEach((Section) =>
  {
    const Choice = Make("option", "", Section.name);
    Choice.value = Section.id;
    BookSection.append(Choice);
  });
  const StartNew = Make("option", "", "New section\u2026");
  StartNew.value = "new";
  BookSection.append(StartNew);

  if (Book)
  {
    BookName.value = Book.name;
    BookLink.value = (Book.link || "").replace(/^https:\/\//i, "");    // the whole link, so its ?extras and www. are kept when it is saved again
    BookNotes.value = Book.notes || "";
    BookSection.value = Library.find((Section) => Section.books.includes(Book)).id;
  }
  else if (Chosen.size === 1)
  {
    BookSection.value = [...Chosen][0];                              // start on the section being looked at
  }
  NewSectionLine.hidden = BookSection.value !== "new";               // with no sections yet, "New section" is the only choice
  ShowCardPicture();
  if (typeof FillComeBackLine === "function") FillComeBackLine(Book);   // comeback.js fills in the Come back on line
  if (typeof FillPagesLine === "function") FillPagesLine(Book);         // pages.js writes the book's pages as slips

  if (!DB) ShowCardNote(CatalogueNote, "Login is switched off, so changes show on the shelf but are not saved.");
  CatalogueDialog.showModal();
  BookName.focus();
}

// Choosing New section in the list shows the line for typing its name
BookSection.addEventListener("change", () =>
{
  NewSectionLine.hidden = BookSection.value !== "new";
  if (BookSection.value === "new") NewSectionName.focus();
});

// When the card is submitted we check the boxes and then save the new book or the changes
CatalogueForm.addEventListener("submit", async (event) =>
{
  event.preventDefault();                       // stop the browser reloading the page, which is what forms do by default
  CatalogueNote.hidden = true;                  // clear any message left from the last try
  const Name = BookName.value.trim();
  const Link = TidyLink(BookLink.value);
  const Notes = BookNotes.value.split("\n").map((Line) => Line.trim()).filter(Boolean).join("\n");
  const SectionName = NewSectionName.value.trim();

  if (!Name) { ShowCardNote(CatalogueNote, "Give the book a name, usually who or what you are saving."); BookName.focus(); return; }
  if (BookLink.value.trim() && !Link) { ShowCardNote(CatalogueNote, "That link does not look like a web address. Fix it or leave it empty."); BookLink.focus(); return; }
  if (BookSection.value === "new" && !SectionName) { ShowCardNote(CatalogueNote, "Name the new section, for example Artists."); NewSectionName.focus(); return; }
  if (typeof ComeBackProblem === "function" && ComeBackProblem()) return;     // comeback.js checks the day has not already passed

  const Label = CatalogueSubmit.textContent;
  CatalogueSubmit.disabled = true;
  CatalogueSubmit.textContent = "Shelving\u2026";
  try
  {
    let Section = Library.find((s) => s.id === BookSection.value);
    if (BookSection.value === "new") Section = SectionNamed(SectionName) || await SaveSection(SectionName);

    // A newly chosen picture is shrunk and stored first; the book then remembers where it is.
    const Picture = ChosenPicture ? await StorePicture(await ShrinkPicture(ChosenPicture, 352), Section.joint ? "shelves/" + Section.id : "") : KeptPicture;

    let Book = EditingBook;
    if (Book)
    {
      const OldPicture = Book.picture || "";
      await UpdateBook(Book, Section, { name: Name, link: Link, notes: Notes, picture: Picture });
      if (OldPicture && OldPicture !== Picture) DiscardPicture(OldPicture).catch(console.error);   // the old picture is no longer used
    }
    else
    {
      Book = await SaveBook(Section, { name: Name, link: Link, notes: Notes, picture: Picture });
    }
    if (typeof SaveComeBackLine === "function") await SaveComeBackLine(Book);  // and saves the day to come back to it
    if (typeof SavePagesLine === "function") await SavePagesLine(Book, Section);   // pages.js saves the pages added, changed, moved or removed on the card

    CatalogueDialog.close();
    if (Chosen.size) Chosen.add(Section.id);                           // make sure the shelf it is on is showing
    if (!Matches(Book)) ClearSearch();                                 // and that a search is not hiding it
    RenderTabs();
    Update();
    const Elem = LibraryRoot.querySelector(`.book[data-id="${Book.id}"]`);
    if (Elem) { Elem.scrollIntoView({ block: "center" }); OpenBook(Elem); }   // show the book, open
  }
  catch (error)
  {
    console.error(error);
    ShowCardNote(CatalogueNote, ExplainDatabase(error));
  }
  CatalogueSubmit.disabled = false;
  CatalogueSubmit.textContent = Label;
});

// Delete book asks first and then removes the book
BookDelete.addEventListener("click", async () =>
{
  const Book = EditingBook;
  if (!(await AskToConfirm("Delete \u201C" + Book.name + "\u201D for good?", "Delete book"))) return;
  CatalogueDialog.close();
  // The book leaves the shelf straight away, but it is only deleted once the Undo note has run out
  const SectionId = SectionOf(Book).id;
  const Index = SectionOf(Book).books.indexOf(Book);
  DeleteLater(Book.id, Book.name, ["Took ", Quoted(Book.name), " off the shelf."], () =>
  {
    Library.forEach((Section) => { Section.books = Section.books.filter((Other) => Other !== Book); });
  }, () =>
  {
    const Section = Library.find((Other) => Other.id === SectionId);     // the shelf may have been fetched again in the meantime
    if (!Section || Section.books.some((Other) => Other.id === Book.id)) return;
    Section.books.splice(Math.min(Index, Section.books.length), 0, Book);
    return Book.id;
  }, () => DeleteBook(Book));
});

// The Add a book button opens a blank card and the Cancel link closes it
document.getElementById("addBook").addEventListener("click", () => OpenCatalogueCard());
document.getElementById("catalogueCancel").addEventListener("click", () => CatalogueDialog.close());

// The Edit button inside an open book
LibraryRoot.addEventListener("click", (event) =>
{
  const Button = event.target.closest(".edit-book");
  if (!Button) return;
  const Id = Button.closest(".book").dataset.id;
  for (const Section of Library)
  {
    const Book = Section.books.find((Other) => String(Other.id) === Id);
    if (Book) { OpenCatalogueCard(Book); return; }
  }
});

// The sections card (rename, delete and add sections):

// The parts of the sections card
const SectionsDialog = document.getElementById("sectionsDialog");
const SectionsNote = document.getElementById("sectionsNote");
const SectionRows = document.getElementById("sectionRows");
const SectionAddName = document.getElementById("sectionAddName");

// The RenderSectionRows function builds one row per section on the sections card: its name in a box, then Up, Down, the order box and Delete
// FocusId and FocusPart say which button to put the keyboard back on after the rows are rebuilt
function RenderSectionRows(FocusId, FocusPart)
{
  SectionRows.replaceChildren();
  Library.forEach((Section, Index) =>
  {
    const Row = Make("div", "section-entry");
    Row.dataset.section = Section.id;
    const Line = Make("div", "card-line section-name");
    const Box = document.createElement("input");
    Box.type = "text"; Box.value = Section.name; Box.maxLength = 40;
    Box.disabled = Section.owner === false;                          // only the owner can rename a joint shelf
    Box.setAttribute("aria-label", "Name of the " + Section.name + " section");
    Line.append(Box);

    // "change" fires when they press Enter or leave the box after editing it.
    Box.addEventListener("change", async () =>
    {
      const Name = Box.value.trim();
      SectionsNote.hidden = true;
      const Clash = Name && SectionNamed(Name);
      if (!Name || (Clash && Clash !== Section))
      {
        ShowCardNote(SectionsNote, Name ? "You already have a section called " + Clash.name + "." : "A section needs a name.");
        Box.value = Section.name;
        return;
      }
      try
      {
        await RenameSection(Section, Name);
        RenderTabs(); Update();
      }
      catch (error)
      {
        console.error(error);
        Box.value = Section.name;
        ShowCardNote(SectionsNote, ExplainDatabase(error));
      }
    });

    // Up and Down move the whole section, its plaque at the top moves with it
    const Tools = Make("div", "section-tools");
    const Mover = (Label, Part, Step, Off) =>
    {
      const Button = Make("button", "link-button " + Part, Label);
      Button.type = "button";
      Button.disabled = Off;
      Button.setAttribute("aria-label", "Move the " + Section.name + " section " + Label.toLowerCase());
      Button.addEventListener("click", async () =>
      {
        SectionsNote.hidden = true;
        try
        {
          await MoveSection(Section, Step);
          RenderSectionRows(Section.id, Part); RenderTabs(); Update();
        }
        catch (error)
        {
          console.error(error);
          ShowCardNote(SectionsNote, ExplainDatabase(error));
        }
      });
      return Button;
    };
    const Up = Mover("Up", "move-up", -1, Index === 0);
    const Down = Mover("Down", "move-down", 1, Index === Library.length - 1);

    // The order box shows how this shelf keeps its books: the member's own order, or sorted, and new books follow the sorted order
    const Sorter = document.createElement("select");
    Sorter.className = "sort-books";
    Sorter.setAttribute("aria-label", "Order of the books in " + Section.name);
    SORT_NAMES.forEach(([Value, Words]) =>
    {
      const Choice = document.createElement("option");
      Choice.value = Value;
      Choice.textContent = Words;
      Sorter.append(Choice);
    });
    Sorter.value = Section.sort_by || "";
    Sorter.addEventListener("change", async () =>
    {
      const How = Sorter.value;
      SectionsNote.hidden = true;
      Sorter.disabled = true;
      try
      {
        if (How) await SortBooks(Section, How);
        await SetSectionSort(Section, How);
        Update();
      }
      catch (error)
      {
        console.error(error);
        ShowCardNote(SectionsNote, ExplainDatabase(error));
        Update();
      }
      Sorter.value = Section.sort_by || "";
      Sorter.disabled = false;
    });

    const Remove = Make("button", "link-button danger-link", "Delete");
    Remove.type = "button";
    Remove.setAttribute("aria-label", "Delete the " + Section.name + " section");
    Remove.addEventListener("click", async () =>
    {
      const Count = Section.books.length;
      const Inside = Count === 0 ? "" : Count === 1 ? " and the 1 book in it" : " and the " + Count + " books in it";
      const Others = Section.joint ? " Everyone else on it loses it too." : "";
      const Question = Section.owner === false
        ? "Leave \u201C" + Section.name + "\u201D? The books you added stay on the shelf for the others, and " + Section.people[0].name + " can invite you again."
        : "Delete \u201C" + Section.name + "\u201D" + Inside + " for good?" + Others;
      if (!(await AskToConfirm(Question, Section.owner === false ? "Leave shelf" : "Delete section"))) return;
      SectionsNote.hidden = true;
      if (Section.owner !== false)
      {
        // The shelf comes down straight away, but it is only deleted once the Undo note has run out
        const Index = Library.indexOf(Section);
        const WasChosen = Chosen.has(Section.id);
        const Inside = Count === 0 ? "" : Count === 1 ? " and its 1 book" : " and its " + Count + " books";
        DeleteLater(Section.id, Section.name, ["Took down ", Quoted(Section.name), Inside + "."], () =>
        {
          Library = Library.filter((Other) => Other !== Section);
          Chosen.delete(Section.id);
        }, () =>
        {
          if (Library.some((Other) => Other.id === Section.id)) return;
          Library.splice(Math.min(Index, Library.length), 0, Section);
          if (WasChosen) Chosen.add(Section.id);
        }, () => DeleteSection(Section));
        return;
      }
      try
      {
        await LeaveShelf(Section);
        RenderSectionRows(); RenderTabs(); Update();
      }
      catch (error)
      {
        console.error(error);
        ShowCardNote(SectionsNote, ExplainDatabase(error));
      }
    });

    // Share opens the share card for this shelf, it reads Shared while the shelf has a link
    const Share = Make("button", "link-button share-section", Section.share_key ? "Shared" : "Share");
    Share.type = "button";
    Share.classList.toggle("is-shared", Boolean(Section.share_key));
    Share.setAttribute("aria-label", (Section.share_key ? "Sharing the " : "Share the ") + Section.name + " section");
    Share.hidden = !DB || Section.owner === false;             // sharing needs the database, and only the owner can share a joint shelf
    Share.addEventListener("click", () => OpenShareCard(Section));

    // Invite (for the owner) asks friends to add books to this shelf too, someone who joined gets Leave instead of Delete
    const Invite = Make("button", "link-button invite-section", Section.joint ? "Invite (" + Section.people.length + "/5)" : "Invite");
    Invite.type = "button";
    Invite.hidden = !DB || Section.owner === false;
    Invite.setAttribute("aria-label", "Invite friends to add books to the " + Section.name + " section");
    Invite.addEventListener("click", () => OpenInviteCard(Section));
    if (Section.owner === false)
    {
      Remove.textContent = "Leave";
      Remove.setAttribute("aria-label", "Leave the " + Section.name + " section");
    }

    Tools.append(Up, Down, Sorter, Invite, Share, Remove);
    Row.append(Line, Tools);
    SectionRows.append(Row);
  });
  if (!Library.length) SectionRows.append(Make("p", "card-switch", "No sections yet. Add your first one below."));

  // Put the keyboard back on the button that was pressed, or on its partner if that one is now greyed out
  if (FocusId)
  {
    const Row = SectionRows.querySelector(`[data-section="${FocusId}"]`);
    const Button = Row && (Row.querySelector("." + FocusPart + ":not(:disabled)") || Row.querySelector(".move-up:not(:disabled), .move-down:not(:disabled)"));
    if (Button) Button.focus();
  }
}

// The OpenSectionsCard function opens the sections card
function OpenSectionsCard()
{
  CloseAll();
  SectionsNote.hidden = true;
  SectionAddName.value = "";
  RenderSectionRows();
  SectionsDialog.showModal();
}

// The New section line at the bottom of the sections card adds a section
document.getElementById("sectionAddForm").addEventListener("submit", async (event) =>
{
  event.preventDefault();
  SectionsNote.hidden = true;
  const Name = SectionAddName.value.trim();
  if (!Name) { ShowCardNote(SectionsNote, "Give the section a name, for example Artists."); SectionAddName.focus(); return; }
  if (SectionNamed(Name)) { ShowCardNote(SectionsNote, "You already have a section called " + SectionNamed(Name).name + "."); return; }
  try
  {
    const Section = await SaveSection(Name);
    if (Chosen.size) Chosen.add(Section.id);
    SectionAddName.value = "";
    RenderSectionRows(); RenderTabs(); Update();
    SectionAddName.focus();
  }
  catch (error)
  {
    console.error(error);
    ShowCardNote(SectionsNote, ExplainDatabase(error));
  }
});
document.getElementById("sectionsDone").addEventListener("click", () => SectionsDialog.close());

// Sharing a shelf:

// The parts of the share card
const ShareDialog = document.getElementById("shareDialog");
const ShareNote = document.getElementById("shareNote");
const ShareAbout = document.getElementById("shareAbout");
const ShareLinkLine = document.getElementById("shareLinkLine");
const ShareLink = document.getElementById("shareLink");
const ShareMake = document.getElementById("shareMake");
const ShareActions = document.getElementById("shareActions");
const ShareCopy = document.getElementById("shareCopy");
const ShareSend = document.getElementById("shareSend");
const ShareStop = document.getElementById("shareStop");

// Sharing holds the section the share card is open for
let Sharing = null;

// The NewShareKey function makes a long random key for a shelf's link: 24 letters, numbers, dashes and underscores that nobody could guess
function NewShareKey()
{
  const Bytes = crypto.getRandomValues(new Uint8Array(18));
  return btoa(String.fromCharCode(...Bytes)).replace(/\+/g, "-").replace(/\//g, "_");
}

// The ShareAddress function returns the full link to a shared shelf
function ShareAddress(Key)
{
  return new URL("shelf.html?k=" + Key, location.href).href;
}

// The SetShareKey function saves a shelf's share key, a new key makes a new link and an empty one stops the sharing
async function SetShareKey(Section, Key)
{
  const { error } = await DB.from("sections").update({ share_key: Key || null }).eq("id", Section.id);
  if (error) throw error;
  Section.share_key = Key;
}

// The ShowShareCard function fills in the share card for a shelf that is shared or not shared yet
function ShowShareCard()
{
  const Shared = Boolean(Sharing.share_key);
  ShareAbout.textContent = Shared
    ? "Anyone with this link can look at your “" + Sharing.name + "” shelf and add its books to their own library. Your other shelves stay private."
    : "Make a link to your “" + Sharing.name + "” shelf. Anyone you send it to can look at its books and add them to their own library, but they cannot change your shelf. Your other shelves stay private.";
  ShareLinkLine.hidden = !Shared;
  ShareLink.value = Shared ? ShareAddress(Sharing.share_key) : "";
  ShareMake.hidden = Shared;
  ShareActions.hidden = !Shared;
  ShareSend.hidden = !navigator.share;                       // only phones and some browsers can hand a link to another app
  ShareStop.hidden = !Shared;
  ShareCopy.textContent = "Copy link";
}

// The OpenShareCard function opens the share card for a shelf
function OpenShareCard(Section)
{
  Sharing = Section;
  ShareNote.hidden = true;
  ShowShareCard();
  ShareDialog.showModal();
  (Section.share_key ? ShareCopy : ShareMake).focus();
}

// The AfterShareChange function shows the change on the share card and on the shelf's row of the sections card
function AfterShareChange()
{
  ShowShareCard();
  if (SectionsDialog.open) RenderSectionRows();
}

// Make a link gives the shelf a key, which turns its link on
ShareMake.addEventListener("click", async () =>
{
  ShareNote.hidden = true;
  ShareMake.disabled = true;
  try
  {
    await SetShareKey(Sharing, NewShareKey());
    AfterShareChange();
    ShareCopy.focus();
  }
  catch (error)
  {
    console.error(error);
    ShowCardNote(ShareNote, ExplainDatabase(error));
  }
  ShareMake.disabled = false;
});

// Copy link puts the link on the clipboard, older browsers copy the selected text in the link box instead
ShareCopy.addEventListener("click", async () =>
{
  try
  {
    await navigator.clipboard.writeText(ShareLink.value);
  }
  catch (error)
  {
    ShareLink.select();
    document.execCommand("copy");
  }
  ShareCopy.textContent = "Copied";
  setTimeout(() => { ShareCopy.textContent = "Copy link"; }, 2000);
});

// Send hands the link to the phone's own share menu (messages, email and so on)
ShareSend.addEventListener("click", async () =>
{
  try
  {
    await navigator.share({ title: Sharing.name + " on Itsuka", text: "Have a look at my " + Sharing.name + " shelf on Itsuka", url: ShareLink.value });
  }
  catch (error)
  {
    // closing the share menu without choosing an app counts as an error, so there is nothing to show
  }
});

// Tapping the link box selects all of it, ready to copy by hand
ShareLink.addEventListener("focus", () => ShareLink.select());

// Stop sharing asks first and then removes the key, so the link stops working
ShareStop.addEventListener("click", async () =>
{
  if (!(await AskToConfirm("Stop sharing “" + Sharing.name + "”? The link stops working straight away. Sharing it again makes a new link.", "Stop sharing"))) return;
  ShareNote.hidden = true;
  try
  {
    await SetShareKey(Sharing, "");
    AfterShareChange();
    ShareMake.focus();
  }
  catch (error)
  {
    console.error(error);
    ShowCardNote(ShareNote, ExplainDatabase(error));
  }
});

document.getElementById("shareClose").addEventListener("click", () => ShareDialog.close());

// A click on the dark area outside a card closes it.
[CatalogueDialog, SectionsDialog, ShareDialog, ConfirmDialog].forEach((Dialog) =>
{
  Dialog.addEventListener("click", (event) => { if (event.target === Dialog) Dialog.close(); });
});

// Adding a link shared from another app:
// On Android the home screen app appears in the Share menu (manifest.json), on iPhone the Add to Itsuka shortcut opens library.html?add=

// SHARED_KEY is the note this device keeps of a shared link until the library is ready, which may be after signing in
const SHARED_KEY = "library-adding";

// The FirstLink function finds the first web address in a piece of text, apps often send a sentence with the link at the end
function FirstLink(Text)
{
  const Found = String(Text || "").match(/https?:\/\/[^\s<>"']+/i);
  return Found ? Found[0].replace(/[).,!?]+$/, "") : "";
}

// The CleanLink function removes the tracking extras apps add to a shared link, such as igsh and utm_source
function CleanLink(Link)
{
  try
  {
    const Address = new URL(Link);
    [...Address.searchParams.keys()].forEach((Key) =>
    {
      if (/^(utm_.*|igsh|igshid|si|fbclid|mibextid|share_id|ref|ref_src)$/i.test(Key)) Address.searchParams.delete(Key);
    });
    return Address.href;
  }
  catch (error)
  {
    return Link;
  }
}

// The NameFromLink function guesses a book's name from a shared link: the account name on Instagram, TikTok, Pinterest and similar sites, otherwise nothing
function NameFromLink(Link)
{
  try
  {
    const Address = new URL(Link);
    const Host = Address.hostname.replace(/^(www|m)\./, "");
    const First = decodeURIComponent(Address.pathname.split("/").filter(Boolean)[0] || "");
    const Social = /^(instagram\.com|tiktok\.com|pinterest\.[a-z.]+|x\.com|twitter\.com|threads\.net|youtube\.com|facebook\.com|behance\.net|dribbble\.com)$/.test(Host);
    if (!Social || !First || /^(p|reel|reels|pin|watch|stories|explore|shorts|share|profile\.php)$/i.test(First)) return "";
    return First.replace(/^@/, "").slice(0, 80);
  }
  catch (error)
  {
    return "";
  }
}

// The NoteSharedArrival function keeps a link that arrived from another app and tidies the address bar
// It runs straight away, before member.js may send a signed-out visitor to sign in, so the link is still waiting when they come back
function NoteSharedArrival()
{
  const Params = new URLSearchParams(location.search);
  const Link = FirstLink(Params.get("add")) || FirstLink(Params.get("url")) || FirstLink(Params.get("text")) || FirstLink(Params.get("title"));
  if (!Link) return;
  const Title = (Params.get("title") || "").trim();
  Remember(SHARED_KEY, JSON.stringify({ link: CleanLink(Link), name: Title && !FirstLink(Title) ? Title.slice(0, 80) : "", at: Date.now() }));
  history.replaceState(null, "", location.pathname + location.hash);
}
NoteSharedArrival();

// The OpenSharedArrival function opens a new catalogue card with the shared link filled in, once the shelves are loaded
function OpenSharedArrival()
{
  let Note = null;
  try { Note = JSON.parse(Recall(SHARED_KEY)); }
  catch (error) { Note = null; }
  if (!Note) return;
  Remember(SHARED_KEY, "");
  if (!Note.link || Date.now() - Number(Note.at) > 24 * 60 * 60 * 1000) return;      // a link left waiting for more than a day is forgotten

  OpenCatalogueCard();
  BookLink.value = Note.link.replace(/^https:\/\//i, "");
  BookName.value = Note.name || NameFromLink(Note.link);
  // If the same link is already on a shelf we say where, so it is not added twice by accident
  const Same = TidyLink(Note.link);
  const Section = Library.find((Shelf) => Shelf.books.some((Book) => Book.link === Same));
  const Already = Section && Section.books.find((Book) => Book.link === Same);
  CatalogueNote.classList.toggle("good", !Already);
  ShowCardNote(CatalogueNote, Already ? "This link is already on your \u201C" + Section.name + "\u201D shelf as " + Already.name + "." : "Shared from another app. Check the name, pick a shelf and add a picture if you like.");
  (BookName.value ? BookSection : BookName).focus();
}

// Counting visits:

// VISIT_KEY is the note this device keeps of the last day it counted a visit, so the database is only asked once a day
const VISIT_KEY = "library-visit-day";

// The NoteVisit function tells the database the member opened their library today, only the date of their latest visit is kept, for the Ledger's totals
async function NoteVisit()
{
  const Today = new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Johannesburg" });
  if (Recall(VISIT_KEY) === Today + ":" + MyId()) return;
  try
  {
    const { error } = await DB.rpc("note_visit", {});
    if (!error) Remember(VISIT_KEY, Today + ":" + MyId());
  }
  catch (error)
  {
    console.error(error);                    // without supabase-ledger.sql visits are simply not counted
  }
}

// Start:

// The StartLibrary function runs when the page opens, it waits for the member and then loads and shows their shelves
async function StartLibrary()
{
  // Every script on the page loads first, so offline.js is there to open the copy if the shelves cannot be fetched
  if (document.readyState === "loading") await new Promise((Done) => document.addEventListener("DOMContentLoaded", Done, { once: true }));
  const Member = await MemberReady;              // from member.js: the signed-in member, or null
  if (LoginIsSetUp && !Member) return;           // nobody signed in: member.js is already sending them to the login page

  if (Member)
  {
    // If the shelves take more than a moment to arrive we say so, a quick load shows nothing extra
    const Waiting = setTimeout(ShowLoading, 300);
    try
    {
      await LoadLibrary();
    }
    catch (error)
    {
      console.error(error);
      // With no signal, offline.js opens the copy of the shelves kept on this device instead
      if (!(typeof OpenCopy === "function" && OpenCopy(error))) ShowLibraryNote(ExplainDatabase(error));
    }
    clearTimeout(Waiting);
  }
  else
  {
    Library = ExampleLibrary;                    // login is off: show the examples
    Library.forEach((Section, Index) =>
    {
      Section.position = Index;
      Section.sort_by = "";
      Section.books.forEach((Book, i) => { Book.position = i; });
    });
  }
  if (Member) NoteVisit();
  LoadShelfSettings(Member);
  BuildSettingsList();
  ApplyShelfSettings();                          // this also builds the plaques and the shelves
  OpenSharedArrival();                           // a link shared from another app opens on a new catalogue card
}
// LibraryReady is what guide.js waits on before showing What's new or the welcome tour
const LibraryReady = StartLibrary();
