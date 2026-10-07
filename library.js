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

  const Open = Make("div", "open-book");
  const Left = Make("div", "page left");
  const Picture = Make("canvas", "picture");                           // a block of colour until the book's picture is drawn on it
  Picture.style.background = PictureColours[Steady % PictureColours.length];
  if (Book.picture) Elem.dataset.picture = Book.picture;            // fetched the first time the book is opened (see ShowPicture)
  Left.append(Picture);

  const Right = Make("div", "page right");
  Right.append(Make("h3", "", Book.name));
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
  Foot.append(Edit);
  Right.append(Foot);
  Open.append(Left, Right);

  Elem.append(Spine, Open);
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

    const Block = Make("section", "section");
    // With exactly one section switched on, its plaque at the top already names it. Otherwise each shelf gets a label.
    if (Chosen.size !== 1) Block.append(Make("h2", "plaque", Section.name));
    const Shelf = Make("div", "shelf");
    Section.books.forEach((Book, i) => Shelf.append(MakeBook(Book, Index * 3 + i)));
    Shelf.append(MakeOrnament(Index));
    Block.append(Shelf);
    LibraryRoot.append(Block);
  });

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
}

// Opening and closing books:

// The ShowPicture function fetches and draws a book's picture the first time the book is opened instead of when the page loads
function ShowPicture(Book)
{
  if (!Book.dataset.picture || Book.dataset.pictureShown) return;
  Book.dataset.pictureShown = "yes";
  LoadPicture(PictureAddress(Book.dataset.picture))
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
    DB.from("sections").select("id, name").order("created_at"),
    DB.from("books").select("id, section_id, name, link, notes, picture").order("created_at"),
  ]);
  if (Sections.error) throw Sections.error;
  if (Books.error) throw Books.error;
  Library = Sections.data.map((Section) => ({
    id: Section.id,
    name: Section.name,
    books: Books.data.filter((Book) => Book.section_id === Section.id),
  }));
}

// The SaveSection function saves a new section, adds it to the page's list and returns it
async function SaveSection(Name)
{
  let Row = { id: "local-" + Date.now(), name: Name };
  if (DB)
  {
    const { data: Data, error } = await DB.from("sections").insert({ name: Name }).select("id, name").single();
    if (error) throw error;
    Row = Data;
  }
  const Section = { id: Row.id, name: Row.name, books: [] };
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
  let Row = { id: "local-" + Date.now(), ...Details };
  if (DB)
  {
    const { data: Data, error } = await DB.from("books")
      .insert({ section_id: Section.id, ...Details })
      .select("id, section_id, name, link, notes, picture").single();
    if (error) throw error;
    Row = Data;
  }
  Section.books.push(Row);
  return Row;
}

// The UpdateBook function saves changes to an existing book and moves it to another section when that changed
async function UpdateBook(Book, Section, Details)
{
  if (DB)
  {
    const { error } = await DB.from("books").update({ section_id: Section.id, ...Details }).eq("id", Book.id);
    if (error) throw error;
  }
  const OldSection = Library.find((s) => s.books.includes(Book));
  Object.assign(Book, Details);
  if (OldSection !== Section)
  {
    OldSection.books = OldSection.books.filter((Other) => Other !== Book);
    Section.books.push(Book);
  }
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
function AskToConfirm(Message, ActionLabel)
{
  return new Promise((Resolve) =>
  {
    document.getElementById("confirmMessage").textContent = Message;
    const Yes = document.getElementById("confirmYes");
    Yes.textContent = ActionLabel;
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
    const Address = ChosenPicture ? URL.createObjectURL(ChosenPicture) : PictureAddress(KeptPicture);
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

// The RenderSectionRows function builds one row per section on the sections card: its name in a box and a Delete link
function RenderSectionRows()
{
  SectionRows.replaceChildren();
  Library.forEach((Section) =>
  {
    const Row = Make("div", "card-line section-row");
    const Box = document.createElement("input");
    Box.type = "text"; Box.value = Section.name; Box.maxLength = 40;
    Box.setAttribute("aria-label", "Name of the " + Section.name + " section");

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

    Row.append(Box, Remove);
    SectionRows.append(Row);
  });
  if (!Library.length) SectionRows.append(Make("p", "card-switch", "No sections yet. Add your first one below."));
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
    try
    {
      await LoadLibrary();
    }
    catch (error)
    {
      console.error(error);
      ShowLibraryNote(ExplainDatabase(error));
    }
  }
  else
  {
    Library = ExampleLibrary;                    // login is off: show the examples
  }
  RenderTabs();
  Update();
}
StartLibrary();
