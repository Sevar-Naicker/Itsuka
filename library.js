// This file contains the code for the plaques, shelves and books as well as the cards for adding to them, it loads last and uses all the other files

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

// PictureColours holds the blocks of colour shown on a book's left page when it has no picture
const PictureColours = ["#C96F4A", "#8FA6C9", "#E3C27A", "#9CCBC6", "#C9A3C6", "#E0A98C", "#7C8F8A", "#A9B4D6"];

// Ornaments holds the little pictures that stand at the end of a shelf, written as rows of letters
const Ornaments = [
  { rows: [                                  // pot plant
      "....g.g....",
      "..g.ggg.g..",
      ".ggggGgggg.",
      "..gGgggGg..",
      ".gggGgGggg.",
      "..ggggggg..",
      "....gGg....",
      ".ppppppppp.",
      ".pPPPPPPPp.",
      "..pPPPPPp..",
      "..pPPPPPp..",
      "..ppppppp..",
    ], colours: { g: "#4E8C5F", G: "#2F6B45", p: "#8E4226", P: "#B5532E" } },
  { rows: [                                  // candle
      "..y..",
      ".yoy.",
      "..o..",
      ".www.",
      ".wWw.",
      ".wWw.",
      ".wWw.",
      ".wWw.",
      "bbbbb",
      ".bbb.",
    ], colours: { y: "#FFD15C", o: "#FF9A3C", w: "#D9CFB4", W: "#EDE3C8", b: "#C9A14A" } },
  { rows: [                                  // a few books lying flat
      "..aaaaaaaa..",
      "..aAAAAAAa..",
      ".bbbbbbbbbb.",
      ".bBBBBBBBBb.",
      ".bbbbbbbbbb.",
      "cccccccccccc",
      "cCCCCCCCCCCc",
      "cccccccccccc",
    ], colours: { a: "#8C2F39", A: "#B4505A", b: "#2F5D3A", B: "#4E8C5F", c: "#24305E", C: "#55608F" } },
  { rows: [                                  // mug of something hot
      "..s..s..",
      ".s..s...",
      "..s..s..",
      "........",
      "mmmmmm..",
      "mMMMMmhh",
      "mMMMMm.h",
      "mMMMMmhh",
      "mMMMMm..",
      ".mmmm...",
    ], colours: { s: "#D5DCEE", m: "#B9C4DE", M: "#E6EAF5", h: "#B9C4DE" } },
  { rows: CatShape, colours: CatColours },   // the cat, asleep
];

// The parts of the page this file fills in
const TabsRoot = document.getElementById("tabs");
const LibraryRoot = document.getElementById("library");
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
];
// ShelfSettings holds which tools are switched on, they all start on and the member's own choices are loaded over them
const ShelfSettings = { find: true, done: true, hideDone: true, pull: true, drag: true, ornaments: true, hover: true };
const SettingsList = document.getElementById("settingsList");
const SettingsNote = document.getElementById("settingsNote");

// PlacesAreSaved holds whether the database has the position column that remembers each book's place (added by supabase-order.sql)
let PlacesAreSaved = true;

// SectionPlacesAreSaved holds whether the database has the position column for sections (added by supabase-section-order.sql)
let SectionPlacesAreSaved = true;
// SORT_NAMES holds the ways a shelf can keep its books in order, an empty key means the member's own order (set by dragging)
// SectionSortIsSaved holds whether the database has the column that remembers how each shelf is sorted (added by supabase-section-sort.sql)
let SectionSortIsSaved = true;
const SORT_NAMES = [["", "Your own order"], ["name", "A to Z"], ["newest", "Newest first"], ["oldest", "Oldest first"]];

// DoneSwitch is the Hide done button and HideDone holds whether the books marked as done are hidden, it uses the choice saved on this device
const DoneSwitch = document.getElementById("doneSwitch");
let HideDone = Recall("library-hide-done") === "yes";

// Small helpers:

// The Make function creates an element with a class and some text
function Make(Tag, ClassName, Text)
{
  const Elem = document.createElement(Tag);
  if (ClassName) Elem.className = ClassName;
  if (Text) Elem.textContent = Text;
  return Elem;
}

// The NumberFrom function turns any text (a book's id) into a steady number so a book keeps the same height and width every visit
function NumberFrom(Text)
{
  let Total = 0;
  for (const Letter of String(Text)) Total = (Total * 31 + Letter.charCodeAt(0)) % 100000;
  return Total;
}

// The TidyLink function tidies a typed link into a full web address and returns an empty string for anything that is not one
function TidyLink(Typed)
{
  let Text = String(Typed || "").trim();
  if (!Text) return "";
  if (!/^https?:\/\//i.test(Text)) Text = "https://" + Text;
  try
  {
    const Address = new URL(Text);
    if (!Address.hostname.includes(".")) return "";
    return Address.href;
  }
  catch (error)
  {
    return "";
  }
}

// The ShortLink function returns a short form of a link to show on the page, without the https://www. and the trailing slash
function ShortLink(Link)
{
  try
  {
    const Address = new URL(Link);
    return Address.hostname.replace(/^www\./, "") + Address.pathname.replace(/\/$/, "");
  }
  catch (error)
  {
    return Link;
  }
}

// The ShowLibraryNote function shows a message above the shelves
function ShowLibraryNote(Message)
{
  LibraryNote.textContent = Message;
  LibraryNote.hidden = false;
}

// The Matches function checks whether a book fits the search, it looks at the book's name and notes
function Matches(Book)
{
  if (!SearchText) return true;
  const Words = (Book.name + "\n" + (Book.notes || "")).toLowerCase();
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

// The NowInSeconds function returns the time as a number, a new book uses it as its place so it goes on the end of its shelf
function NowInSeconds()
{
  return Date.now() / 1000;
}

// The AddedTime function returns when a book was added, as a number to compare, a book that is still being saved counts as added now
function AddedTime(Book)
{
  return Book.created_at ? Date.parse(Book.created_at) : Book.added ?? Book.position ?? Date.now();
}

// The SortRule function returns how two books compare for a shelf's order: below 0 puts A first, above 0 puts B first
function SortRule(How)
{
  if (How === "name") return (A, B) => A.name.localeCompare(B.name, undefined, { sensitivity: "base" });
  if (How === "newest") return (A, B) => AddedTime(B) - AddedTime(A);
  return (A, B) => AddedTime(A) - AddedTime(B);
}

// The PlaceBetween function returns a place number between two books, either of which may be missing at the ends of a shelf
function PlaceBetween(Before, After)
{
  if (Before && After) return (Before.position + After.position) / 2;
  if (Before) return Math.max(NowInSeconds(), Before.position + 1);
  if (After) return After.position - 1;
  return NowInSeconds();
}

// The SpotFor function works out where a book goes in a section: in sorted order when the shelf keeps one, otherwise on the end
// It returns the book's index among the other books and its place number
function SpotFor(Section, Book)
{
  const Others = Section.books.filter((Other) => Other !== Book);
  let Index = Others.length;
  if (Section.sort_by)
  {
    const Rule = SortRule(Section.sort_by);
    const First = Others.findIndex((Other) => Rule(Book, Other) < 0);
    if (First !== -1) Index = First;
  }
  return { Index, Position: PlaceBetween(Others[Index - 1], Others[Index]) };
}

// The EndPlace function returns the place that puts a book after every book already in a section
function EndPlace(Section)
{
  const Last = Section.books[Section.books.length - 1];
  return Last ? Math.max(NowInSeconds(), Last.position + 1) : NowInSeconds();
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

// The MakeBook function builds one book: the spine and the open book that appears on hover or tap
function MakeBook(Book, ColourNumber)
{
  const Elem = Make("article", "book");
  Elem.dataset.id = Book.id;
  Elem.dataset.number = ColourNumber;                               // which of the theme's colours it gets
  const Steady = NumberFrom(Book.id);
  Elem.style.setProperty("--h", 160 + 4 * (Steady % 11) + "px");
  Elem.style.setProperty("--w", 36 + 4 * (Math.floor(Steady / 11) % 5) + "px");

  const Spine = Make("button", "spine");
  Spine.type = "button";
  Spine.setAttribute("aria-expanded", "false");
  Spine.append(Make("span", "", Book.name));
  const Ribbon = Make("i", "ribbon");                                  // only shows on a done book
  Ribbon.setAttribute("aria-hidden", "true");
  Spine.append(Ribbon);

  const Open = Make("div", "open-book");
  const Left = Make("div", "page left");
  const Picture = Make("canvas", "picture");                           // a block of colour until the book's picture is drawn on it
  Picture.style.background = PictureColours[Steady % PictureColours.length];
  if (Book.picture) Elem.dataset.picture = Book.picture;            // fetched the first time the book is opened (see ShowPicture)
  Left.append(Picture);

  const Right = Make("div", "page right");
  Right.append(Make("h3", "", Book.name));
  Right.append(Make("p", "stamp", "Done"));                            // only shows on a done book
  const Points = (Book.notes || "").split("\n").map((Line) => Line.trim()).filter(Boolean);
  if (Points.length)
  {
    const List = Make("ul", "points");
    Points.forEach((Point) => List.append(Make("li", "", Point)));
    Right.append(List);
  }
  if (Book.link)
  {
    const Link = Make("a", "", ShortLink(Book.link));
    Link.href = Book.link; Link.target = "_blank"; Link.rel = "noopener";
    Right.append(Link);
  }
  // Pinned to the bottom of the page: the way in to change or delete this book
  const Foot = Make("div", "page-foot");
  const Edit = Make("button", "link-button edit-book", "Edit");
  Edit.type = "button";
  // The tick box that marks the book as done, or not done again
  const DoneBox = Make("button", "link-button done-box", "Done");
  DoneBox.type = "button";
  Foot.append(Edit, DoneBox);
  Right.append(Foot);
  Open.append(Left, Right);

  Elem.append(Spine, Open);
  DressAsDone(Elem, Book);
  return Elem;
}

// The MakeOrnament function paints an ornament onto a tiny canvas and sizes it so its dots match the page's dots
function MakeOrnament(Which)
{
  const Ornament = Ornaments[Which % Ornaments.length];
  const Holder = Make("div", "ornament");
  Holder.setAttribute("aria-hidden", "true");                           // decoration only: screen readers skip it
  const Picture = document.createElement("canvas");
  Picture.width = Ornament.rows[0].length;
  Picture.height = Ornament.rows.length;
  Sprite(Picture.getContext("2d"), 0, 0, Ornament.rows, Ornament.colours);
  Picture.style.width = `calc(var(--dot) * ${Picture.width})`;
  Picture.style.height = `calc(var(--dot) * ${Picture.height})`;
  Holder.append(Picture);
  return Holder;
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
    TabsRoot.append(Button);
  };
  if (Library.length) AddTab("all", "All", Total, () => { Chosen.clear(); Update(); });
  Library.forEach((Section) => AddTab(Section.id, Section.name, Section.books.length, () =>
  {
    if (Chosen.has(Section.id)) Chosen.delete(Section.id); else Chosen.add(Section.id);
    if (Chosen.size === Library.length) Chosen.clear();                 // every section switched on is the same as "All"
    Update();
  }));

  const EditSections = Make("button", "plain-button new-section", Library.length ? "Edit sections" : "+ Section");
  EditSections.type = "button";
  EditSections.addEventListener("click", OpenSectionsCard);
  TabsRoot.append(EditSections);
}

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
    if (Chosen.size !== 1) Block.append(Make("h2", "plaque", Section.name));
    const Shelf = Make("div", "shelf");
    // i is the book's place in its section, so a book keeps its colour while the search hides the books around it
    Section.books.forEach((Book, i) =>
    {
      if (Visible(Book)) Shelf.append(MakeBook(Book, Index * 3 + i));
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

// The TidyOrnaments function hides an ornament when its row is full and it has dropped onto a row of its own
function TidyOrnaments()
{
  LibraryRoot.querySelectorAll(".shelf").forEach((Shelf) =>
  {
    const Ornament = Shelf.querySelector(".ornament");
    const LastBook = Ornament.previousElementSibling;
    Ornament.hidden = false;
    if (LastBook && Ornament.offsetTop !== LastBook.offsetTop) Ornament.hidden = true;
  });
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

// The settings panel:

// The ApplyShelfSettings function shows or hides each shelf tool to match the settings and rebuilds the shelves
function ApplyShelfSettings()
{
  document.body.classList.toggle("no-done", !ShelfSettings.done);
  document.body.classList.toggle("no-ornaments", !ShelfSettings.ornaments);
  document.body.classList.toggle("no-hover", !ShelfSettings.hover);
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
  const Total = Library.reduce((Sum, Section) => Sum + Section.books.filter((Book) => Book.picture).length, 0);
  let Packed = 0;
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
          catch (error) { console.error(error); }                    // a picture that cannot be fetched is left out, the book still goes in
          Packed++;
          ShowLibraryStatus("Packing pictures: " + Packed + " of " + Total + "\u2026");
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
    ShowLibraryStatus("Saved " + FileName + " with " + Copy.sections.length + (Copy.sections.length === 1 ? " section and " : " sections and ") + Books + (Books === 1 ? " book." : " books."));
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
        if (How && SectionSortIsSaved) await SetSectionSort(Section, How);
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
          try { Details.picture = await StorePicture(await PictureFromText(Entry.picture)); }
          catch (error) { console.error(error); }                    // a picture that cannot be stored is left out, the book still goes in
        }
        await SaveBook(Section, Details);
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

  // Its place is a number between the places of the books either side, so only this one book has to be saved
  const Before = Others[Index - 1];
  const After = Others[Index];
  const Position = PlaceBetween(Before, After);
  try
  {
    await MoveBook(Book, To, Index, Position);
    LibraryNote.hidden = true;
    if (To.sort_by) await SetSectionSort(To, "");      // a hand-placed book means the shelf is in the member's own order now
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
  if (!Spine || event.button !== 0 || Carry || !ShelfSettings.drag) return;
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

// Opening and closing books:

// The ShowPicture function fetches and draws a book's picture the first time the book is opened instead of when the page loads
function ShowPicture(Book)
{
  if (!Book.dataset.picture || Book.dataset.pictureShown) return;
  Book.dataset.pictureShown = "yes";
  PictureAddress(Book.dataset.picture)
    .then(LoadPicture)
    .then((LoadedImage) => PaintPixelated(Book.querySelector(".picture"), LoadedImage, BOOK_DOTS))
    .catch(console.error);                       // if it cannot be fetched, the block of colour stays
}

// The Place function puts a book's open pages just above its spine (or below when there is no room) and keeps them on the screen
function Place(Book)
{
  ShowPicture(Book);
  const Open = Book.querySelector(".open-book");
  const Slot = Book.getBoundingClientRect();                         // where this book's slot is on screen
  const ScreenWidth = document.documentElement.clientWidth;

  let Left = Slot.left + Slot.width / 2 - Open.offsetWidth / 2;          // centred over the spine...
  Left = Math.max(8, Math.min(Left, ScreenWidth - Open.offsetWidth - 8)); // ...but never past either edge
  const Above = Slot.top - Open.offsetHeight;
  Open.style.left = Left + "px";
  Open.style.top = (Above >= 8 ? Above : Slot.bottom) + "px";
}

// The OpenBook function opens a book
function OpenBook(Book)
{
  Place(Book);
  Book.classList.add("is-open");
  Book.querySelector(".spine").setAttribute("aria-expanded", "true");
}

// The CloseAll function closes every open book
function CloseAll()
{
  document.querySelectorAll(".book.is-open").forEach((Book) =>
  {
    Book.classList.remove("is-open");
    Book.querySelector(".spine").setAttribute("aria-expanded", "false");
  });
}

// One listener on the whole library handles every book, including ones added later.
LibraryRoot.addEventListener("mouseover", (event) =>
{
  const Book = event.target.closest(".book");
  if (Book) Place(Book);
});
// A click on a spine opens that book, or closes it when it was already open
LibraryRoot.addEventListener("click", (event) =>
{
  const Spine = event.target.closest(".spine");
  if (!Spine) return;
  const Book = Spine.closest(".book");
  const WasOpen = Book.classList.contains("is-open");
  CloseAll();
  if (!WasOpen) OpenBook(Book);
});

// Keep an open book attached to its spine while the page scrolls.
window.addEventListener("scroll", () =>
{
  document.querySelectorAll(".book.is-open, .book:hover").forEach(Place);
}, true);
// When the window changes size we re-check the ornaments and re-position any open book
window.addEventListener("resize", () =>
{
  TidyOrnaments();
  document.querySelectorAll(".book.is-open").forEach(Place);
});

// A press anywhere that is not on a book closes the open one
document.addEventListener("pointerdown", (event) =>
{
  if (!event.target.closest(".book")) CloseAll();
});
// The Escape key closes the open book
document.addEventListener("keydown", (event) =>
{
  if (event.key === "Escape") CloseAll();
});

// Loading from and saving to the database:
// Each of these talks to Supabase when someone is signed in, when login is off they only change the list in memory

// The LoadLibrary function fetches the member's sections and books and puts each book inside its section
async function LoadLibrary()
{
  const [Sections, Books] = await Promise.all([
    DB.from("sections").select("*").order("created_at"),   // every column, so the shelves still load before supabase-section-order.sql has been run
    DB.from("books").select("*").order("created_at"),      // every column, so the shelves still load before supabase-done.sql has been run
  ]);
  if (Sections.error) throw Sections.error;
  if (Books.error) throw Books.error;
  // Every book gets a place, a number that decides its spot on the shelf. Before supabase-order.sql has been run it is the time the book was added
  PlacesAreSaved = !Books.data.length || Books.data[0].position !== undefined;
  Books.data.forEach((Book) =>
  {
    Book.position = Number(Book.position ?? Date.parse(Book.created_at) / 1000);
  });
  // Sections get a place in the same way, so they can be moved up and down
  SectionPlacesAreSaved = !Sections.data.length || Sections.data[0].position !== undefined;
  SectionSortIsSaved = !Sections.data.length || Sections.data[0].sort_by !== undefined;
  Library = Sections.data.map((Section) => ({
    id: Section.id,
    name: Section.name,
    sort_by: Section.sort_by || "",
    position: Number(Section.position ?? Date.parse(Section.created_at) / 1000),
    books: Books.data.filter((Book) => Book.section_id === Section.id).sort((a, b) => a.position - b.position),
  })).sort((a, b) => a.position - b.position);
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
    const New = { name: Name };
    if (SectionPlacesAreSaved) New.position = Position;
    const { data: Data, error } = await DB.from("sections").insert(New).select("id, name").single();
    if (error) throw error;
    Row = Data;
  }
  const Section = { id: Row.id, name: Row.name, sort_by: "", position: Position, books: [] };
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
    const New = { section_id: Section.id, ...Details };
    if (PlacesAreSaved) New.position = Row.position;
    const { data: Data, error } = await DB.from("books").insert(New).select("*").single();
    if (error) throw error;
    Data.position = Number(Data.position ?? Row.position);
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
    const Saved = { section_id: Section.id, ...Changes };
    if (!PlacesAreSaved) delete Saved.position;
    const { error } = await DB.from("books").update(Saved).eq("id", Book.id);
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
    const { error } = await DB.from("sections").update({ position: Position }).eq("id", Section.id);
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
    const { error } = await DB.from("sections").update({ sort_by: How }).eq("id", Section.id);
    if (error) throw error;
  }
  Section.sort_by = How;
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
  Library.forEach((Section) => { Section.books = Section.books.filter((Other) => Other !== Book); });
}

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
    BookLink.value = Book.link ? ShortLink(Book.link) : "";
    BookNotes.value = Book.notes || "";
    BookSection.value = Library.find((Section) => Section.books.includes(Book)).id;
  }
  else if (Chosen.size === 1)
  {
    BookSection.value = [...Chosen][0];                              // start on the section being looked at
  }
  NewSectionLine.hidden = BookSection.value !== "new";               // with no sections yet, "New section" is the only choice
  ShowCardPicture();

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

  const Label = CatalogueSubmit.textContent;
  CatalogueSubmit.disabled = true;
  CatalogueSubmit.textContent = "Shelving\u2026";
  try
  {
    let Section = Library.find((s) => s.id === BookSection.value);
    if (BookSection.value === "new") Section = SectionNamed(SectionName) || await SaveSection(SectionName);

    // A newly chosen picture is shrunk and stored first; the book then remembers where it is.
    const Picture = ChosenPicture ? await StorePicture(await ShrinkPicture(ChosenPicture, 800)) : KeptPicture;

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
  try
  {
    await DeleteBook(Book);
    CatalogueDialog.close();
    RenderTabs();
    Update();
  }
  catch (error)
  {
    console.error(error);
    ShowCardNote(CatalogueNote, ExplainDatabase(error));
  }
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
      if (!(await AskToConfirm("Delete \u201C" + Section.name + "\u201D" + Inside + " for good?", "Delete section"))) return;
      SectionsNote.hidden = true;
      try
      {
        await DeleteSection(Section);
        RenderSectionRows(); RenderTabs(); Update();
      }
      catch (error)
      {
        console.error(error);
        ShowCardNote(SectionsNote, ExplainDatabase(error));
      }
    });

    Tools.append(Up, Down, Sorter, Remove);
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

// A click on the dark area outside a card closes it.
[CatalogueDialog, SectionsDialog, ConfirmDialog].forEach((Dialog) =>
{
  Dialog.addEventListener("click", (event) => { if (event.target === Dialog) Dialog.close(); });
});

// Start:

// The StartLibrary function runs when the page opens, it waits for the member and then loads and shows their shelves
async function StartLibrary()
{
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
      ShowLibraryNote(ExplainDatabase(error));
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
  LoadShelfSettings(Member);
  BuildSettingsList();
  ApplyShelfSettings();                          // this also builds the plaques and the shelves
}
StartLibrary();
