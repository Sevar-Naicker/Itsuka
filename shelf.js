// This file contains the code for the shared shelf page (shelf.html), it shows one shelf a member shared and lets the visitor add its books to their own library

// ShareKey is the key on the end of the shelf's link (shelf.html?k=...)
const ShareKey = new URLSearchParams(location.search).get("k") || "";

// Shelf holds the shared shelf once it has been fetched: its name, how it is sorted, its owner's first name and its books
let Shelf = null;
// Visitor holds the signed-in visitor, or null when nobody is signed in
let Visitor = null;
// Mine holds the visitor's own sections, each with its books, fetched once they are signed in
let Mine = null;
// Adding holds whether books are being added right now, so the buttons cannot start a second round
let Adding = false;
// AddedNow holds the ids of the books added during this visit, their buttons read Added instead of On your shelf
const AddedNow = new Set();

// RETURN_KEY is the note this device keeps of the shelf a visitor left to sign in, member.js sends them back here after signing in
const RETURN_KEY = "library-return";

// The parts of the page this file fills in
const ShareBanner = document.getElementById("shareBanner");
const ShareFrom = document.getElementById("shareFrom");
const ShareTitle = document.getElementById("shareTitle");
const ShareCount = document.getElementById("shareCount");
const AddAll = document.getElementById("addAll");
const ShareStatus = document.getElementById("shareStatus");
const TopLink = document.getElementById("topLink");
const CardAsk = document.getElementById("cardAsk");

// Small helpers:

// The Same function checks whether two names match, ignoring capital letters and spaces at the ends
function Same(A, B)
{
  return String(A || "").trim().toLowerCase() === String(B || "").trim().toLowerCase();
}

// The Plural function returns a count with the right word, such as 1 book or 3 books
function Plural(Count, Word)
{
  return Count + " " + Word + (Count === 1 ? "" : "s");
}

// The ShowStatus function shows how adding is going under the Add all button, Problem makes it red and Link adds a way into the library
function ShowStatus(Message, Problem, Link)
{
  ShareStatus.replaceChildren(Message);
  if (Link)
  {
    const Into = Make("a", "", "Open your library");
    Into.href = "library.html";
    ShareStatus.append(" ", Into);
  }
  ShareStatus.classList.toggle("problem", Boolean(Problem));
  ShareStatus.hidden = !Message;
}

// The ShowGone function shows a message in place of the shelf, for a link that is broken or no longer shared
function ShowGone(Title, Text)
{
  ShareBanner.hidden = true;
  const Gone = Make("div", "empty-library");
  Gone.setAttribute("role", "alert");
  Gone.append(Make("h2", "", Title), Make("p", "", Text));
  const Home = Make("a", "plain-button gone-home", "Go to Itsuka");
  Home.href = "index.html";
  Gone.append(Home);
  LibraryRoot.replaceChildren(Gone);
}

// The ShowLoading function shows a short message where the shelf will be while it is being fetched
function ShowLoading()
{
  const Loading = Make("div", "empty-library");
  Loading.setAttribute("role", "status");
  Loading.append(Make("h2", "", "Fetching the shelf…"), Make("p", "", "The books will be here in a moment."));
  LibraryRoot.replaceChildren(Loading);
}

// Showing the shared shelf:

// The RenderShelf function builds the banner and the one shared shelf, each book gets an Add button in the foot of its page
function RenderShelf()
{
  const Count = Shelf.books.length;
  ShareFrom.textContent = Shelf.owner ? "Shared by " + Shelf.owner : "Shared with you";
  ShareTitle.textContent = Shelf.name;
  ShareCount.textContent = Count ? Plural(Count, "book") + ". Open one to have a look, and add the ones you like to your own library." : "There are no books on this shelf yet.";
  AddAll.hidden = !Count;
  ShareBanner.hidden = false;
  document.title = Shelf.name + ": Itsuka";

  const Block = Make("section", "section");
  Block.append(Make("h2", "plaque", Shelf.name));
  const Row = Make("div", "shelf");
  Shelf.books.forEach((Book, i) =>
  {
    const Elem = MakeBook(Book, i);
    const Add = Make("button", "link-button add-one", "+ Add");
    Add.type = "button";
    Add.setAttribute("aria-label", "Add " + Book.name + " to my library");
    Elem.querySelector(".page-foot").append(Add);
    Row.append(Elem);
  });
  Row.append(MakeOrnament(NumberFrom(ShareKey)));
  Block.append(Row);
  LibraryRoot.replaceChildren(Block);
  ApplyTheme(Current.theme);     // colour the books to match the background
  TidyOrnaments();
}

// The MySection function finds the visitor's own shelf with the same name as the shared one
function MySection()
{
  return Mine && Mine.find((Section) => Same(Section.name, Shelf.name));
}

// The HaveAlready function checks whether a book is already on the visitor's shelf of the same name (same name and link)
function HaveAlready(Book)
{
  const Section = MySection();
  return Boolean(Section && Section.books.some((Other) => Same(Other.name, Book.name) && (Other.link || "") === (Book.link || "")));
}

// The ShowAdded function marks the books the visitor already has, and turns Add all off once they have every one
function ShowAdded()
{
  if (!Mine) return;
  Shelf.books.forEach((Book) =>
  {
    const Add = LibraryRoot.querySelector(`.book[data-id="${Book.id}"] .add-one`);
    if (!Add || !HaveAlready(Book)) return;
    Add.textContent = AddedNow.has(Book.id) ? "Added" : "On your shelf";
    Add.removeAttribute("aria-label");
    Add.disabled = true;
  });
  const Left = Shelf.books.filter((Book) => !HaveAlready(Book)).length;
  AddAll.disabled = Left === 0;
  AddAll.textContent = Left === 0 ? "All on your shelf" : Left === Shelf.books.length ? "Add all to my library" : "Add the other " + Plural(Left, "book");
}

// Adding books to the visitor's library:

// The LoadMine function fetches the visitor's own sections and books, so books they already have are not added twice
async function LoadMine()
{
  const [Sections, Books] = await Promise.all([
    DB.from("sections").select("*"),
    DB.from("books").select("*"),
  ]);
  if (Sections.error) throw Sections.error;
  if (Books.error) throw Books.error;
  Books.data.forEach((Book) => { Book.position = Number(Book.position ?? Date.parse(Book.created_at) / 1000); });
  Mine = Sections.data.map((Section) => ({
    id: Section.id,
    name: Section.name,
    sort_by: Section.sort_by || "",
    position: Number(Section.position ?? Date.parse(Section.created_at) / 1000),
    hasPosition: Section.position !== undefined,
    hasSort: Section.sort_by !== undefined,
    books: Books.data.filter((Book) => Book.section_id === Section.id).sort((a, b) => a.position - b.position),
  })).sort((a, b) => a.position - b.position);
}

// The ShelfToAddTo function returns the visitor's shelf with the shared shelf's name, making it after their last shelf when they have none
async function ShelfToAddTo()
{
  const Found = MySection();
  if (Found) return Found;
  const Last = Mine[Mine.length - 1];
  const New = { name: Shelf.name };
  if (!Last || Last.hasPosition) New.position = Last ? Math.max(NowInSeconds(), Last.position + 1) : NowInSeconds();
  if ((!Last || Last.hasSort) && Shelf.sort_by) New.sort_by = Shelf.sort_by;     // it keeps the order the shared shelf is sorted in
  const { data: Data, error } = await DB.from("sections").insert(New).select("*").single();
  if (error) throw error;
  const Section = { id: Data.id, name: Data.name, sort_by: Data.sort_by || "", position: Number(Data.position ?? NowInSeconds()), hasPosition: Data.position !== undefined, hasSort: Data.sort_by !== undefined, books: [] };
  Mine.push(Section);
  return Section;
}

// The CopyBook function adds one shared book to the visitor's shelf, its picture is copied into their own storage so it stays theirs
async function CopyBook(Section, Book)
{
  const Details = { section_id: Section.id, name: Book.name, link: Book.link || "", notes: Book.notes || "", picture: "" };
  if (Book.picture)
  {
    try
    {
      const Picture = await (await fetch(await PictureAddress(Book.picture))).blob();
      Details.picture = await StorePicture(Picture);
    }
    catch (error)
    {
      console.error(error);                      // a picture that cannot be copied is left out, the book still goes in
    }
  }
  // It goes on the end of the shelf, or into its sorted spot when the visitor's shelf keeps an order
  const Spot = SpotFor(Section, { name: Book.name, added: Date.now() });
  if (Section.hasPosition) Details.position = Spot.Position;
  const { data: Data, error } = await DB.from("books").insert(Details).select("*").single();
  if (error) throw error;
  Data.position = Number(Data.position ?? Spot.Position);
  Section.books.splice(Spot.Index, 0, Data);
}

// The AskForCard function opens the card for visitors who are not signed in, and notes this shelf so they come back to it after signing in
function AskForCard()
{
  Remember(RETURN_KEY, JSON.stringify({ to: "shelf.html?k=" + ShareKey, at: Date.now() }));
  CardAsk.showModal();
}

// The AddBooks function adds a list of shared books to the visitor's library, skipping the ones they already have
async function AddBooks(Books)
{
  if (!Visitor) { AskForCard(); return; }
  if (Adding) return;
  Adding = true;
  AddAll.disabled = true;
  let Added = 0;
  try
  {
    if (!Mine) await LoadMine();
    const ToAdd = Books.filter((Book) => !HaveAlready(Book));
    const Section = ToAdd.length ? await ShelfToAddTo() : MySection();
    for (const Book of ToAdd)
    {
      if (ToAdd.length > 1) ShowStatus("Adding books: " + (Added + 1) + " of " + ToAdd.length + "…");
      await CopyBook(Section, Book);
      AddedNow.add(Book.id);
      Added++;
    }
    const Skipped = Books.length - ToAdd.length;
    if (!Added) ShowStatus(Books.length === 1 ? "That book is already on your " + Shelf.name + " shelf." : "These books are already on your " + Shelf.name + " shelf.", false, true);
    else ShowStatus("Added " + Plural(Added, "book") + " to your “" + Section.name + "” shelf." + (Skipped ? " " + Plural(Skipped, "book") + (Skipped === 1 ? " was" : " were") + " already there." : ""), false, true);
  }
  catch (error)
  {
    console.error(error);
    ShowStatus((Added ? "Stopped after adding " + Plural(Added, "book") + ". " : "") + ExplainDatabase(error), true);
  }
  Adding = false;
  AddAll.disabled = false;
  ShowAdded();
}

// Add all adds every book on the shelf, the Add button inside an open book adds just that one
AddAll.addEventListener("click", () => AddBooks(Shelf.books));
LibraryRoot.addEventListener("click", (event) =>
{
  const Button = event.target.closest(".add-one");
  if (!Button) return;
  const Id = Button.closest(".book").dataset.id;
  const Book = Shelf.books.find((Other) => String(Other.id) === Id);
  if (Book) AddBooks([Book]);
});

// Not now closes the card, a click outside it does too
document.getElementById("cardAskClose").addEventListener("click", () => CardAsk.close());
CardAsk.addEventListener("click", (event) => { if (event.target === CardAsk) CardAsk.close(); });

// Start:

// The StartShelfPage function runs when the page opens: it checks who is visiting, fetches the shared shelf and shows it
async function StartShelfPage()
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
    TopLink.addEventListener("click", () => Remember(RETURN_KEY, JSON.stringify({ to: "shelf.html?k=" + ShareKey, at: Date.now() })));
  }
  document.body.classList.remove("checking");

  if (!/^[A-Za-z0-9_-]{24,64}$/.test(ShareKey))
  {
    ShowGone("This link is not complete", "The end of the link seems to be missing. Ask whoever sent it for the full link.");
    return;
  }
  if (!DB)
  {
    ShowGone("The shelf could not be opened", LoginIsSetUp ? "Could not load the library service. Check your internet connection and reload this page." : "Login is not connected yet, so shared shelves cannot be opened.");
    return;
  }

  // If the shelf takes more than a moment to arrive we say so, a quick load shows nothing extra
  const Waiting = setTimeout(ShowLoading, 300);
  let Data = null;
  try
  {
    const Result = await DB.rpc("shared_shelf", { key: ShareKey });
    if (Result.error) throw Result.error;
    Data = Result.data;
  }
  catch (error)
  {
    clearTimeout(Waiting);
    console.error(error);
    ShowGone("The shelf could not be opened", ExplainDatabase(error));
    return;
  }
  clearTimeout(Waiting);
  if (!Data)
  {
    ShowGone("This shelf is not shared any more", "Its owner may have stopped sharing it, or the link was not copied in full. Ask them for a fresh link.");
    return;
  }
  Shelf = Data;
  Shelf.books = Array.isArray(Shelf.books) ? Shelf.books : [];
  RenderShelf();

  // For a signed-in visitor we check which books they already have
  if (Visitor)
  {
    try
    {
      await LoadMine();
      ShowAdded();
    }
    catch (error)
    {
      console.error(error);                      // the Add buttons still work, LoadMine is tried again when one is pressed
    }
  }
}
StartShelfPage();
