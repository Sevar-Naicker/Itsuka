// This file contains the drawing of shelves and books that the library page (library.html) and the shared shelf page (shelf.html) both use, it loads after backgrounds.js and pictures.js

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


// LibraryRoot is where the shelves are built on both pages
const LibraryRoot = document.getElementById("library");

// SORT_NAMES holds the ways a shelf can keep its books in order, an empty key means the member's own order (set by dragging)
const SORT_NAMES = [["", "Your own order"], ["name", "A to Z"], ["newest", "Newest first"], ["oldest", "Oldest first"]];

// Colours on joint shelves:

// SHELF_COLOURS holds the colours a member can choose for joint shelves (key, name, base colour)
// Each one is blended with the background's plaque colour (the --c-key variables), so it suits whichever scene is on
const SHELF_COLOURS = [
  ["rose", "Rose", "#C2505E"], ["clay", "Clay", "#C96F4A"], ["amber", "Amber", "#D9A23C"], ["sage", "Sage", "#7FA36C"],
  ["teal", "Teal", "#3F8F8C"], ["sky", "Sky", "#6F93C8"], ["plum", "Plum", "#8E6AA8"], ["ivory", "Ivory", "#E8DFC8"],
];
SHELF_COLOURS.forEach(([Key, , Base]) => document.documentElement.style.setProperty("--c-" + Key, `color-mix(in srgb, ${Base} 80%, var(--brass))`));

// The ColourKeys function gives everyone on a joint shelf a colour: their own choice, or the first colour nobody else on the shelf has
function ColourKeys(People)
{
  const Valid = (Key) => SHELF_COLOURS.some(([Other]) => Other === Key);
  const Used = new Set(People.map((Person) => Person.colour).filter(Valid));
  return People.map((Person) =>
  {
    if (Valid(Person.colour)) return Person.colour;
    const Free = SHELF_COLOURS.find(([Key]) => !Used.has(Key));
    const Key = Free ? Free[0] : SHELF_COLOURS[0][0];
    Used.add(Key);
    return Key;
  });
}

// The ColourOf function returns the colour (as a CSS value) for one of the shelf's colour keys
function ColourOf(Key)
{
  return "var(--c-" + (Key || "clay") + ")";
}

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

// Keeping books in order:

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

// Building books and ornaments:

// The MakeBook function builds one book: the spine and the open book that appears on hover or tap, each page adds its own buttons to the foot of the right page
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
  Picture.dataset.page = "0";                                          // page 1's picture, the book's own
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
  if (Book.link && /^https?:\/\//i.test(Book.link))      // only web addresses become links, anything else could run code when pressed
  {
    const Link = Make("a", "", ShortLink(Book.link));
    Link.href = Book.link; Link.target = "_blank"; Link.rel = "noopener";
    Right.append(Link);
  }
  Right.append(Make("div", "page-foot"));                             // pinned to the bottom of the page, filled by the page using the book
  Open.append(Left, Right);

  Elem.append(Spine, Open);
  DressPages(Elem, Book);                                              // a book with pages gets a thicker spine and the way to turn them
  return Elem;
}

// SLIDE_ARROW is the arrow pointing right, drawn as rows of letters like the shelf ornaments: a small brass plaque with an arrow pressed into it (the left arrow is the same picture flipped)
const SLIDE_ARROW = { rows: [
  ".bbbbbbbbbbbb.",
  "bhhhhhhhhhhhhs",
  "bhbbbbbbbbbbbs",
  "bhbbbdbbbbbbbs",
  "bhbbbddbbbbbbs",
  "bhbbbdddbbbbbs",
  "bhbbbddddbbbbs",
  "bhbbbdddddbbbs",
  "bhbbbddddbbbbs",
  "bhbbbdddbbbbbs",
  "bhbbbddbbbbbbs",
  "bhbbbdbbbbbbbs",
  "bhbbbbbbbbbbbs",
  ".ssssssssssss.",
], colours: { b: "var(--brass)", h: "color-mix(in srgb, var(--brass), white 40%)", s: "color-mix(in srgb, var(--brass), black 30%)", d: "#2A1A10" } };

// The DrawArrow function turns the rows of letters into a crisp pixel picture, its colours come from the background so it changes with the scene, library.js uses it for the plaque row and the pages of a book use it too
function DrawArrow(Left)
{
  const Width = SLIDE_ARROW.rows[0].length;
  const Picture = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  Picture.setAttribute("viewBox", `0 0 ${Width} ${SLIDE_ARROW.rows.length}`);
  Picture.setAttribute("shape-rendering", "crispEdges");
  Picture.setAttribute("aria-hidden", "true");
  SLIDE_ARROW.rows.forEach((Row, y) => [...Row].forEach((Letter, x) =>
  {
    if (!SLIDE_ARROW.colours[Letter]) return;
    const Dot = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    Dot.setAttribute("x", Left ? Width - 1 - x : x);
    Dot.setAttribute("y", y);
    Dot.setAttribute("width", 1.02);       // a hair wider than one dot, so no gaps show between them
    Dot.setAttribute("height", 1.02);
    Dot.style.fill = SLIDE_ARROW.colours[Letter];
    Picture.append(Dot);
  }));
  return Picture;
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


// Pages in a book:
// Page 1 of a book is the book itself, a book can have up to 7 more pages, each with its own title, link, notes and picture

// MOST_PAGES is how many pages a book can hold, page 1 included
const MOST_PAGES = 8;
// PAGES_KEY is where this device keeps the page each book was left open at, so the book opens there again with its bookmark ribbon
const PAGES_KEY = "book-pages-left";
// PageDroppedAt holds when a page was last dragged out of a book (pages.js), so that drag is not taken for a swipe
let PageDroppedAt = 0;

// The PagesOf function gives every page of a book in order: the book itself first, then its extra pages
function PagesOf(Book)
{
  return [{ id: "", title: Book.name, link: Book.link, notes: Book.notes, picture: Book.picture }, ...(Array.isArray(Book.pages) ? Book.pages : [])];
}

// The PagesLeft function reads the pages the books were left open at on this device
function PagesLeft()
{
  try
  {
    const Left = JSON.parse(Recall(PAGES_KEY));
    return Left && typeof Left === "object" ? Left : {};
  }
  catch (error)
  {
    return {};
  }
}

// The LeftAt function finds the page a book was left open at, page 1 when the page it was left at has gone
function LeftAt(Book)
{
  const Id = PagesLeft()[Book.id];
  const Index = Id ? PagesOf(Book).findIndex((Page) => Page.id === Id) : 0;
  return Math.max(Index, 0);
}

// The LeaveAt function remembers the page a book is open at, page 1 is not kept since every book opens there anyway
function LeaveAt(Book, Index)
{
  const Left = PagesLeft();
  const Page = PagesOf(Book)[Index];
  if (Index > 0 && Page) Left[Book.id] = Page.id;
  else delete Left[Book.id];
  Remember(PAGES_KEY, JSON.stringify(Left));
}

// The DressPages function gives a book with pages a spine a little thicker for each page, the arrows and page number on a tab under the open book, the bookmark ribbon and the swipe on a phone
function DressPages(Elem, Book)
{
  const Pages = PagesOf(Book);
  if (Pages.length < 2) return;
  Elem.classList.add("has-pages");
  Elem.BookOnPage = Book;                                               // the arrow keys turn this book's pages
  const Width = parseInt(Elem.style.getPropertyValue("--w"), 10);
  Elem.style.setProperty("--w", Math.min(Width + 4 * (Pages.length - 1), 76) + "px");
  const Open = Elem.querySelector(".open-book");

  // The arrows are the same brass ones as the ends of the plaque row, the page number between them goes back to page 1
  const Bar = Make("div", "page-turn");
  const Back = Make("button", "back");
  Back.type = "button";
  Back.setAttribute("aria-label", "Previous page");
  Back.append(DrawArrow(true));
  const Count = Make("button", "page-count");
  Count.type = "button";
  Count.title = "Back to page 1";
  const Next = Make("button", "next");
  Next.type = "button";
  Next.setAttribute("aria-label", "Next page");
  Next.append(DrawArrow(false));
  Bar.append(Back, Count, Next);
  Back.addEventListener("click", () => TurnTo(Elem, Book, Number(Elem.dataset.page) - 1));
  Next.addEventListener("click", () => TurnTo(Elem, Book, Number(Elem.dataset.page) + 1));
  Count.addEventListener("click", () => TurnTo(Elem, Book, 0));

  // The bookmark ribbon hangs over the top of a book left open at a later page, in the colour of the plaques so it follows the background
  const Ribbon = Make("i", "page-ribbon");
  Ribbon.setAttribute("aria-hidden", "true");
  Open.append(Bar, Ribbon);

  // On a phone a swipe across the open book turns the page
  let StartX = null;
  let StartY = null;
  Open.addEventListener("touchstart", (event) => { StartX = event.touches[0].clientX; StartY = event.touches[0].clientY; }, { passive: true });
  Open.addEventListener("touchend", (event) =>
  {
    if (StartX === null) return;
    const MovedX = event.changedTouches[0].clientX - StartX;
    const MovedY = event.changedTouches[0].clientY - StartY;
    StartX = null;
    if (performance.now() - PageDroppedAt < 500) return;          // a page that was just dragged out is not a swipe
    if (Math.abs(MovedX) > 40 && Math.abs(MovedX) > Math.abs(MovedY)) TurnTo(Elem, Book, Number(Elem.dataset.page) + (MovedX < 0 ? 1 : -1));
  });
  ShowPage(Elem, Book, LeftAt(Book), false);
}

// The TurnTo function turns to another page with a quick flip
function TurnTo(Elem, Book, Index)
{
  if (Index < 0 || Index >= PagesOf(Book).length || Index === Number(Elem.dataset.page)) return;
  Elem.classList.remove("is-turning");
  void Elem.offsetWidth;                                               // so the flip starts again even when turning quickly
  Elem.classList.add("is-turning");
  setTimeout(() => ShowPage(Elem, Book, Index, true), 120);                  // the words change while the page is edge on
  setTimeout(() => Elem.classList.remove("is-turning"), 260);
}

// The ShowPage function writes one page into the open book: page 1 is the book as it always was, the others have their own title, notes, link and picture
// Fetch is true when the page is being looked at, so its picture is fetched, while the shelves are built it is false so no pictures are fetched until a book opens
function ShowPage(Elem, Book, Index, Fetch)
{
  const Pages = PagesOf(Book);
  const Page = Pages[Index];
  Elem.dataset.page = String(Index);
  LeaveAt(Book, Index);
  Elem.classList.toggle("on-later-page", Index > 0);                   // styles.css hides page 1's words on a later page
  const Right = Elem.querySelector(".page.right");
  const Foot = Right.querySelector(".page-foot");
  Right.querySelectorAll(".extra-page").forEach((Old) => Old.remove());
  if (Index > 0)
  {
    const Extra = Make("div", "extra-page");
    Extra.append(Make("h3", "", Page.title), Make("p", "page-of", "Page " + (Index + 1) + " of " + Book.name));
    const Points = (Page.notes || "").split("\n").map((Line) => Line.trim()).filter(Boolean);
    if (Points.length)
    {
      const List = Make("ul", "points");
      Points.forEach((Point) => List.append(Make("li", "", Point)));
      Extra.append(List);
    }
    if (Page.link && /^https?:\/\//i.test(Page.link))   // only web addresses become links
    {
      const Link = Make("a", "", ShortLink(Page.link));
      Link.href = Page.link; Link.target = "_blank"; Link.rel = "noopener";
      Extra.append(Link);
    }
    Foot.before(Extra);
  }
  Right.scrollTop = 0;
  ShowPagePicture(Elem, Index, Page, Fetch);
  const Bar = Elem.querySelector(".page-turn");
  Bar.querySelector(".page-count").textContent = Index + 1 + " of " + Pages.length;
  Bar.querySelector(".page-count").setAttribute("aria-label", "Page " + (Index + 1) + " of " + Pages.length + ", back to page 1");
  Bar.querySelector(".back").disabled = Index === 0;
  Bar.querySelector(".next").disabled = Index === Pages.length - 1;
}

// The ShowPagePicture function shows the picture for one page on the left, each page has its own block of colour until its picture is drawn
function ShowPagePicture(Elem, Index, Page, Fetch)
{
  const Left = Elem.querySelector(".page.left");
  let Picture = Left.querySelector('.picture[data-page="' + Index + '"]');
  if (!Picture)
  {
    Picture = Make("canvas", "picture");
    Picture.dataset.page = String(Index);
    Picture.style.background = PictureColours[(NumberFrom(Elem.dataset.id) + Index) % PictureColours.length];
    if (Page.picture) Picture.dataset.picture = Page.picture;
    Left.append(Picture);
  }
  Left.querySelectorAll(".picture").forEach((Other) => { Other.hidden = Other !== Picture; });
  // Page 1's picture is fetched by ShowPicture when the book opens, the others the first time their page is looked at
  if (Fetch && Index > 0 && Picture.dataset.picture && !Picture.dataset.pictureShown)
  {
    Picture.dataset.pictureShown = "yes";
    PictureAddress(Picture.dataset.picture)
      .then(LoadPicture)
      .then((LoadedImage) => PaintPixelated(Picture, LoadedImage, BOOK_DOTS))
      .catch(console.error);                       // if it cannot be fetched, the block of colour stays
  }
}

// The left and right arrow keys turn the pages of the open book
document.addEventListener("keydown", (event) =>
{
  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
  if (event.target.closest && event.target.closest("input, textarea, select, dialog")) return;
  const Elem = document.querySelector(".book.is-open.has-pages");
  if (!Elem) return;
  const Book = Elem.BookOnPage;
  if (!Book) return;
  event.preventDefault();
  TurnTo(Elem, Book, Number(Elem.dataset.page) + (event.key === "ArrowRight" ? 1 : -1));
});

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

// The ShowOpenPage function fetches the picture of the page a book with pages is open at, when the book is opened on a later page
function ShowOpenPage(Elem)
{
  const Index = Number(Elem.dataset.page || 0);
  if (Index > 0 && Elem.BookOnPage) ShowPagePicture(Elem, Index, PagesOf(Elem.BookOnPage)[Index], true);
}

// The Place function puts a book's open pages just above its spine (or below when there is no room) and keeps them on the screen
function Place(Book)
{
  ShowPicture(Book);
  ShowOpenPage(Book);
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
