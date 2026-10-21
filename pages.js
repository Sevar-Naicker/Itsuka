// This file contains the pages of a book on the library page: the page slips on the catalogue card, the card for one page, taking a page out to be its own book or moving it into another, dragging a page out of an open book onto another book, and putting a whole book inside another
// It loads after library.js and uses its functions, shelves.js shows the pages in an open book and turns them

// Section: Small helpers

// The parts of the page this file works with
const PageSlips = document.getElementById("pageSlips");
const PageDialog = document.getElementById("pageDialog");
const PageForm = document.getElementById("pageForm");
const PageNote = document.getElementById("pageNote");
const PageName = document.getElementById("pageName");
const PageLink = document.getElementById("pageLink");
const PageNotes = document.getElementById("pageNotes");
const PagePictureFile = document.getElementById("pagePictureFile");
const PagePicturePreview = document.getElementById("pagePicturePreview");
const PagePictureLabel = document.getElementById("pagePictureLabel");
const PagePictureRemove = document.getElementById("pagePictureRemove");
const PageSave = document.getElementById("pageSave");
const PageRemove = document.getElementById("pageRemove");
const PageOwnLine = document.getElementById("pageOwnLine");
const PageMoveLine = document.getElementById("pageMoveLine");
const PageMove = document.getElementById("pageMove");

// The LocalPageId function makes an id for a page while login is off, when nothing is saved
function LocalPageId()
{
  return "local-page-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
}

// The LastPlace function gives the place number for a new page on the end of a book
function LastPlace(Book)
{
  return (Book.pages || []).reduce((Most, Page) => Math.max(Most, Number(Page.position) || 0), 0) + 1;
}

// The PictureFor function makes sure a picture may be used on a shelf: the member's own pictures and the shelf's own folder can be, anything else is copied into the right place first
async function PictureFor(Path, Section)
{
  if (!Path || !DB) return Path || "";
  if (Path.startsWith(MyId() + "/") || Path.startsWith("shelves/" + Section.id + "/")) return Path;
  const Picture = await (await fetch(await PictureAddress(Path))).blob();
  return StorePicture(Picture, Section.joint ? "shelves/" + Section.id : "");
}

// The AddPage function saves a new page on the end of a book and returns it
async function AddPage(Book, Details)
{
  const Row = { id: LocalPageId(), book_id: Book.id, title: "", link: "", notes: "", picture: "", ...Details, position: Details.position ?? LastPlace(Book) };
  if (!DB) return Row;
  const { data: Data, error } = await DB.from("book_pages").insert({ book_id: Book.id, title: Row.title, link: Row.link, notes: Row.notes, picture: Row.picture, position: Row.position }).select("*").single();
  if (error) throw error;
  return Data;
}

// The PageWords function shortens a book's words to what a page can hold
function PageWords(Book)
{
  return { title: Book.name.slice(0, 100), link: (Book.link || "").slice(0, 2000), notes: (Book.notes || "").slice(0, 4000) };
}

// Section: The page slips on the catalogue card

// CardBook is the book on the catalogue card (null while adding a new one), CardPages its extra pages while the card is open, saved with the card
let CardBook = null;
let CardPages = [];
// SlipDrag holds the slip being dragged, SlipMovedAt when the last one was put down so the click that follows does not open it
let SlipDrag = null;
let SlipMovedAt = 0;

// The CopyPages function copies a book's pages for the card, so nothing changes on the shelf until the card is saved
function CopyPages(Book)
{
  return (Book && Book.pages ? Book.pages : []).map((Page) => ({ ...Page, chosen: null, changed: false }));
}

// The FillPagesLine function is called by library.js when the catalogue card opens, it writes the book's pages as slips
function FillPagesLine(Book)
{
  CardBook = Book || null;
  CardPages = CopyPages(Book);
  FillPageSlips();
  // Moves and deletes still waiting on their Undo note are saved now, so the card shows the book as it really is
  const Pending = [...Waiting].map((SaveNow) => SaveNow());
  if (Pending.length && Book) Promise.all(Pending).then(() =>
  {
    if (!CatalogueDialog.open || CardBook !== Book || PageDialog.open || CardPages.some((Page) => Page.changed || !Page.id)) return;
    CardPages = CopyPages(Book);
    FillPageSlips();
  });
}

// The FillPageSlips function writes a slip for every page on the catalogue card, then Add a page
function FillPageSlips()
{
  PageSlips.replaceChildren();
  const First = Make("button", "is-first");
  First.type = "button";
  First.append(Make("b", "", "1"), Make("span", "", BookName.value.trim() || "This book"));
  First.title = "Page 1 is the book itself, filled in above";
  PageSlips.append(First);
  CardPages.forEach((Page, Index) =>
  {
    const Slip = Make("button", "page-slip");
    Slip.type = "button";
    Slip.dataset.index = String(Index);
    Slip.append(Make("b", "", String(Index + 2)), Make("span", "", Page.title));
    Slip.addEventListener("click", () => { if (performance.now() - SlipMovedAt > 300) OpenPageCard(Index); });
    Slip.addEventListener("pointerdown", (event) => StartSlipDrag(event, Slip, Index));
    PageSlips.append(Slip);
  });
  const Add = Make("button", "add-page", "+ Add a page");
  Add.type = "button";
  Add.disabled = CardPages.length + 1 >= MOST_PAGES;
  if (Add.disabled) Add.textContent = "This book is full";
  Add.addEventListener("click", () => OpenPageCard(-1));
  PageSlips.append(Add);
}
// Page 1's slip shows the book's name as it is typed
BookName.addEventListener("input", () => { const First = PageSlips.querySelector(".is-first span"); if (First) First.textContent = BookName.value.trim() || "This book"; });

// The StartSlipDrag function notes a press on a slip, it only picks the slip up once the pointer has moved a little
function StartSlipDrag(event, Slip, Index)
{
  if (event.button !== 0) return;
  SlipDrag = { Slip, From: Index, X: event.clientX, Y: event.clientY, Moving: false };
  Slip.setPointerCapture(event.pointerId);
}

// The slip slides next to whichever slip is nearest the pointer, dropping it on page 1 puts it first and on Add a page puts it last
document.addEventListener("pointermove", (event) =>
{
  if (!SlipDrag) return;
  if (!SlipDrag.Moving && Math.hypot(event.clientX - SlipDrag.X, event.clientY - SlipDrag.Y) < 6) return;
  SlipDrag.Moving = true;
  SlipDrag.Slip.classList.add("is-moving");
  const Distance = (Other) =>
  {
    const Box = Other.getBoundingClientRect();
    return Math.hypot(event.clientX - (Box.left + Box.width / 2), event.clientY - (Box.top + Box.height / 2));
  };
  const Others = [...PageSlips.querySelectorAll(".page-slip")].filter((Other) => Other !== SlipDrag.Slip);
  const Near = [PageSlips.querySelector(".is-first"), ...Others, PageSlips.querySelector(".add-page")].sort((a, b) => Distance(a) - Distance(b))[0];
  if (Near.classList.contains("is-first")) { Near.after(SlipDrag.Slip); return; }
  if (Near.classList.contains("add-page")) { Near.before(SlipDrag.Slip); return; }
  const Box = Near.getBoundingClientRect();
  const After = event.clientY > Box.bottom || (event.clientY >= Box.top && event.clientX > Box.left + Box.width / 2);
  if (After) Near.after(SlipDrag.Slip);
  else Near.before(SlipDrag.Slip);
});

// Letting go of a slip keeps the new order, read from the slips as they now stand
document.addEventListener("pointerup", () =>
{
  if (!SlipDrag) return;
  const Was = SlipDrag;
  SlipDrag = null;
  if (!Was.Moving) return;
  SlipMovedAt = performance.now();
  const Order = [...PageSlips.querySelectorAll(".page-slip")].map((Slip) => Number(Slip.dataset.index));
  CardPages = Order.map((i) => CardPages[i]);
  FillPageSlips();
});
document.addEventListener("pointercancel", () =>
{
  if (!SlipDrag) return;
  SlipDrag = null;
  FillPageSlips();
});

// The SavePagesLine function is called by library.js once the book on the catalogue card is saved, it saves the pages removed, changed, added and put in a new order
// The book is already saved by then, so a problem here only leaves a note instead of stopping the card
async function SavePagesLine(Book, Section)
{
  const Before = Book.pages || [];
  const Same = Before.length === CardPages.length && CardPages.every((Page, i) => Page.id === Before[i].id && !Page.changed);
  if (Same) return;
  const Folder = Section.joint ? "shelves/" + Section.id : "";
  if (!DB)
  {
    Book.pages = CardPages.map((Page, i) => ({ id: Page.id || LocalPageId(), book_id: Book.id, title: Page.title, link: Page.link || "", notes: Page.notes || "", picture: Page.chosen ? URL.createObjectURL(Page.chosen) : Page.picture || "", position: i + 1 }));
    return;
  }
  try
  {
    // Removed pages go first, so the book has room for the new ones
    const Gone = Before.filter((Old) => !CardPages.some((Page) => Page.id === Old.id));
    if (Gone.length)
    {
      const { error } = await DB.from("book_pages").delete().in("id", Gone.map((Page) => Page.id));
      if (error) throw error;
      Gone.forEach((Page) => DiscardPicture(Page.picture).catch(console.error));
    }
    const Saved = [];
    for (const [i, Page] of CardPages.entries())
    {
      const Picture = Page.chosen ? await StorePicture(await ShrinkPicture(Page.chosen, 352), Folder) : Page.picture || "";
      const Details = { title: Page.title, link: Page.link || "", notes: Page.notes || "", picture: Picture, position: i + 1 };
      const Old = Before.find((Other) => Other.id === Page.id);
      if (!Old)
      {
        Saved.push(await AddPage(Book, Details));
        continue;
      }
      if (Object.keys(Details).some((Key) => Details[Key] !== Old[Key]))
      {
        const { error } = await DB.from("book_pages").update(Details).eq("id", Old.id);
        if (error) throw error;
        if (Old.picture && Old.picture !== Picture) DiscardPicture(Old.picture).catch(console.error);   // the old picture is no longer used
      }
      Saved.push({ ...Old, ...Details });
    }
    Book.pages = Saved;
  }
  catch (error)
  {
    console.error(error);
    // The pages are fetched again so the shelf shows what was really saved
    const Fresh = await Softly(() => DB.from("book_pages").select("*").eq("book_id", Book.id));
    if (!Fresh.error) GivePages([Book], Fresh.data);
    PinNote(["The book is saved, but its pages could not all be. " + ExplainDatabase(error)]);
  }
}

// Section: The card for one page

// PageIndex is the page open on the card, -1 for a new one, PageChosen a picture picked on it and PageKept the picture the page already has
let PageIndex = -1;
let PageChosen = null;
let PageKept = "";

// The ShowPagePictureChoice function shows whichever picture the page card holds: a newly chosen file, the page's own or none
async function ShowPagePictureChoice()
{
  const Has = Boolean(PageChosen || PageKept);
  PagePicturePreview.hidden = !Has;
  PagePictureRemove.hidden = !Has;
  PagePictureLabel.textContent = Has ? "Change picture" : "Choose a picture";
  if (!Has) return;
  try
  {
    const Address = PageChosen ? URL.createObjectURL(PageChosen) : await PictureAddress(PageKept);
    PaintPixelated(PagePicturePreview, await LoadPicture(Address), THUMB_DOTS);
    if (PageChosen) URL.revokeObjectURL(Address);
  }
  catch (error)
  {
    if (PageChosen) { PageChosen = null; ShowPagePictureChoice(); ShowCardNote(PageNote, ExplainDatabase(error)); }
  }
}
PagePictureFile.addEventListener("change", (event) =>
{
  const ChosenFile = event.target.files[0];
  event.target.value = "";                       // so choosing the same file again still counts as a change
  if (ChosenFile) { PageChosen = ChosenFile; ShowPagePictureChoice(); }
});
PagePictureRemove.addEventListener("click", () => { PageChosen = null; PageKept = ""; ShowPagePictureChoice(); });

// The OpenPageCard function opens the small card for one page, or a blank one for a new page
function OpenPageCard(Index)
{
  PageIndex = Index;
  const Page = Index >= 0 ? CardPages[Index] : null;
  PageForm.reset();
  PageNote.hidden = true;
  PageChosen = Page ? Page.chosen : null;
  PageKept = Page ? Page.picture || "" : "";
  document.getElementById("pageTitle").textContent = Page ? "Edit page" : "Add a page";
  document.getElementById("pageKind").textContent = "Page " + (Index >= 0 ? Index + 2 : CardPages.length + 2);
  PageName.value = Page ? Page.title : "";
  PageLink.value = Page ? (Page.link || "").replace(/^https:\/\//i, "") : "";
  PageNotes.value = Page ? Page.notes || "" : "";
  PageSave.textContent = Page ? "Save page" : "Add this page";
  PageRemove.hidden = !Page;

  // A page already saved can leave the book: on its own next to it, or into another book with room, listed by shelf
  const Saved = Boolean(Page && Page.id && CardBook && CardBook.pages && CardBook.pages.some((Other) => Other.id === Page.id));
  PageOwnLine.hidden = !Saved;
  PageMove.replaceChildren(Make("option", "", "Pick a book…"));
  PageMove.options[0].value = "";
  Library.forEach((Section) =>
  {
    const Group = document.createElement("optgroup");
    Group.label = Section.name;
    Section.books.filter((Other) => Other !== CardBook && CanEdit(Other) && PagesOf(Other).length < MOST_PAGES && !WaitingGone.has(Other.id)).forEach((Other) =>
    {
      const Choice = Make("option", "", Other.name);
      Choice.value = Other.id;
      Group.append(Choice);
    });
    if (Group.children.length) PageMove.append(Group);
  });
  PageMoveLine.hidden = !Saved || PageMove.options.length < 2;
  ShowPagePictureChoice();
  PageDialog.showModal();
  PageName.focus();
}

// Saving the page card keeps the page on the catalogue card, it is saved with the book
PageForm.addEventListener("submit", (event) =>
{
  event.preventDefault();
  PageNote.hidden = true;
  const Title = PageName.value.trim();
  const Link = TidyLink(PageLink.value);
  if (!Title) { ShowCardNote(PageNote, "Give the page a title, like Etsy shop or Saturday market."); PageName.focus(); return; }
  if (PageLink.value.trim() && !Link) { ShowCardNote(PageNote, "That link does not look like a web address. Fix it or leave it empty."); PageLink.focus(); return; }
  const Old = PageIndex >= 0 ? CardPages[PageIndex] : {};
  const Page = {
    ...Old,
    title: Title,
    link: Link || "",
    notes: PageNotes.value.split("\n").map((Line) => Line.trim()).filter(Boolean).join("\n"),
    picture: PageKept,
    chosen: PageChosen,
    changed: true,
  };
  if (PageIndex >= 0) CardPages[PageIndex] = Page;
  else CardPages.push(Page);
  PageDialog.close();
  FillPageSlips();
});

// Remove page takes it off the card, it is removed for good when the book is saved
PageRemove.addEventListener("click", () =>
{
  CardPages.splice(PageIndex, 1);
  PageDialog.close();
  FillPageSlips();
});
document.getElementById("pageCancel").addEventListener("click", () => PageDialog.close());

// The TakeOffCard function takes a page that has left the book off the book and off the catalogue card, other changes on the card stay as they are
function TakeOffCard(Page)
{
  CardBook.pages = (CardBook.pages || []).filter((Other) => Other.id !== Page.id);
  CardPages = CardPages.filter((Other) => Other.id !== Page.id);
  FillPageSlips();
}

// Make this page its own book: the page leaves the book and stands on the shelf right next to it, with its title, link, notes and picture
document.getElementById("pageOwn").addEventListener("click", async (event) =>
{
  const Page = CardBook.pages.find((Other) => Other.id === CardPages[PageIndex].id);
  const Book = CardBook;
  const Section = SectionOf(Book);
  const Button = event.currentTarget;
  Button.disabled = true;
  try
  {
    // Right next to the book it came from, or into its sorted spot when the shelf keeps an order
    const Index = Section.sort_by ? null : Section.books.indexOf(Book) + 1;
    const Spot = Section.sort_by ? SpotFor(Section, { name: Page.title, added: Date.now() }) : { Index, Position: PlaceBetween(Book, Section.books[Index]) };
    const Details = { name: Page.title.slice(0, 200), link: Page.link || "", notes: Page.notes || "", picture: await PictureFor(Page.picture, Section), position: Spot.Position };
    let Row = { id: "local-" + Date.now(), ...Details, pages: [] };
    if (DB)
    {
      const { data: Data, error } = await DB.from("books").insert({ section_id: Section.id, ...Details }).select("*").single();
      if (error) throw error;
      Row = { ...Data, pages: [] };
      const { error: Problem } = await DB.from("book_pages").delete().eq("id", Page.id);
      if (Problem) throw Problem;
    }
    Section.books.splice(Spot.Index, 0, Row);
    TakeOffCard(Page);
    PageDialog.close();
    RenderTabs();
    Update();
    PinNote([Quoted(Page.title), " is its own book now, next to ", Quoted(Book.name), "."]).classList.add("is-back");
  }
  catch (error)
  {
    console.error(error);
    ShowCardNote(PageNote, ExplainDatabase(error));
  }
  Button.disabled = false;
});

// Move to: the page leaves this book and becomes the last page of the book picked
PageMove.addEventListener("change", async () =>
{
  const Into = BookWithId(PageMove.value);
  if (!Into) return;
  const Page = CardBook.pages.find((Other) => Other.id === CardPages[PageIndex].id);
  PageMove.disabled = true;
  try
  {
    const Position = LastPlace(Into);
    if (DB)
    {
      const { error } = await DB.from("book_pages").update({ book_id: Into.id, position: Position }).eq("id", Page.id);
      if (error) throw error;
    }
    Into.pages = [...(Into.pages || []), { ...Page, book_id: Into.id, position: Position }];
    TakeOffCard(Page);
    PageDialog.close();
    RenderTabs();
    Update();
    PinNote(["Moved ", Quoted(Page.title), " into ", Quoted(Into.name), " as page " + PagesOf(Into).length + "."]).classList.add("is-back");
  }
  catch (error)
  {
    console.error(error);
    PageMove.value = "";
    ShowCardNote(PageNote, ExplainDatabase(error));
  }
  PageMove.disabled = false;
});

// Section: Dragging a page out of an open book onto another book

// PagePress holds a press on an open page that has not lifted it yet, PageCarry the page being carried
let PagePress = null;
let PageCarry = null;

// The ForgetPagePress function drops a press on a page that did not turn into a drag
function ForgetPagePress()
{
  if (PagePress) clearTimeout(PagePress.Timer);
  PagePress = null;
}

// A press on page 2 or later of an open book may become a drag, page 1 is the book itself and moves by its spine
// Either side of the open book can be grabbed, whether it was opened by a click or by pointing at it, but not its links and buttons
document.addEventListener("pointerdown", (event) =>
{
  const Open = event.target.closest("#library .open-book");
  if (!Open || event.button !== 0 || event.target.closest("a, button, input") || Carry || PageCarry) return;
  const Elem = Open.closest(".book");
  const Book = BookWithId(Elem.dataset.id);
  const Index = Number(Elem.dataset.page);
  if (!Book || !(Index > 0) || !ShelfSettings.drag || NoSignalNow() || !CanEdit(Book)) return;
  if (event.pointerType === "mouse") event.preventDefault();          // no text is selected while the page is dragged
  const Touch = event.pointerType !== "mouse";
  PagePress = { Elem, Book, Index, X: event.clientX, Y: event.clientY, Touch, Timer: null };
  if (Touch) PagePress.Timer = setTimeout(() => LiftPage(PagePress.X, PagePress.Y), HOLD_TIME);     // on a phone the finger rests on the page first
});

// The LiftPage function closes the book and picks the page up as a paper slip that follows the pointer
function LiftPage(X, Y)
{
  if (!PagePress) return;
  clearTimeout(PagePress.Timer);
  const Page = PagesOf(PagePress.Book)[PagePress.Index];
  const Copy = Make("p", "page-carried", Page.title);
  Copy.append(Make("small", "", "Page " + (PagePress.Index + 1) + " of " + PagePress.Book.name));
  document.body.append(Copy);
  document.body.classList.add("carrying-page");
  PageCarry = { ...PagePress, Page, Copy, Target: null };
  PagePress = null;
  CloseAll();
  if (navigator.vibrate) navigator.vibrate(15);
  CarryPage(X, Y);
}

// The PageTargetClass function says how a book takes a page held over it: it can, it is full, or the member cannot change it
function PageTargetClass(Book, Coming)
{
  if (!Book || !CanEdit(Book) || WaitingGone.has(Book.id)) return "is-page-no";
  return PagesOf(Book).length + Coming > MOST_PAGES ? "is-page-full" : "is-page-target";
}

// The CarryPage function moves the slip and lights up the book under it
function CarryPage(X, Y)
{
  PageCarry.Copy.style.left = X + 12 + "px";
  PageCarry.Copy.style.top = Y - 34 + "px";
  const Under = document.elementFromPoint(X, Y);
  const Over = Under && Under.closest("#library .book");
  const Next = Over && Over !== PageCarry.Elem ? Over : null;
  if (PageCarry.Target === Next) return;
  if (PageCarry.Target) PageCarry.Target.classList.remove("is-page-target", "is-page-full", "is-page-no");
  PageCarry.Target = Next;
  if (Next) Next.classList.add(PageTargetClass(BookWithId(Next.dataset.id), 1));
}

// The StopCarryingPage function takes away the slip and returns the page that was being carried
function StopCarryingPage()
{
  const Was = PageCarry;
  PageCarry = null;
  PageDroppedAt = performance.now();
  Was.Copy.remove();
  document.body.classList.remove("carrying-page");
  if (Was.Target) Was.Target.classList.remove("is-page-target", "is-page-full", "is-page-no");
  return Was;
}

document.addEventListener("pointermove", (event) =>
{
  if (PageCarry) { CarryPage(event.clientX, event.clientY); return; }
  if (!PagePress) return;
  const Moved = Math.hypot(event.clientX - PagePress.X, event.clientY - PagePress.Y);
  if (PagePress.Touch) { if (Moved > TOUCH_SLACK) ForgetPagePress(); return; }     // a finger that moves first is scrolling or swiping
  if (Moved > MOUSE_SLACK) LiftPage(event.clientX, event.clientY);
});

// Letting go over another book moves the page there as its last page, with a note to undo it, anywhere else puts it back
document.addEventListener("pointerup", () =>
{
  ForgetPagePress();
  if (!PageCarry) return;
  const Was = StopCarryingPage();
  const Into = Was.Target && BookWithId(Was.Target.dataset.id);
  if (!Into || PageTargetClass(Into, 1) !== "is-page-target") return;
  MovePageLater(Was.Book, Was.Page, Into);
});
document.addEventListener("pointercancel", () =>
{
  ForgetPagePress();
  if (PageCarry) StopCarryingPage();
});
document.addEventListener("keydown", (event) =>
{
  if (event.key === "Escape" && PageCarry) StopCarryingPage();
});

// While a page is carried the screen must not scroll under the finger, and a long press does not bring up the browser's menu
document.addEventListener("touchmove", (event) => { if (PageCarry) event.preventDefault(); }, { passive: false });
LibraryRoot.addEventListener("contextmenu", (event) => { if (event.target.closest(".open-book") && (PagePress || PageCarry)) event.preventDefault(); });
// The click that comes straight after putting a page down does not open the book under it
document.addEventListener("click", (event) => { if (performance.now() - PageDroppedAt < 400 && event.target.closest && event.target.closest("#library")) event.stopPropagation(); }, true);

// The MovePageLater function moves a page into another book straight away on the page, the move is saved when its Undo note runs out
function MovePageLater(From, Page, Into)
{
  const FromId = From.id;
  const IntoId = Into.id;
  const Index = (From.pages || []).findIndex((Other) => Other.id === Page.id);
  const Position = LastPlace(Into);
  const PageNumber = PagesOf(Into).length + 1;
  DeleteLater(Page.id, Page.title, ["Moved ", Quoted(Page.title), " into ", Quoted(Into.name), " as page " + PageNumber + "."], () =>
  {
    From.pages = From.pages.filter((Other) => Other.id !== Page.id);
    Into.pages = [...(Into.pages || []), { ...Page, book_id: IntoId, position: Position }];
  }, () =>
  {
    // The books may have been fetched again in the meantime, so they are found by id
    const Was = BookWithId(FromId);
    const Now = BookWithId(IntoId);
    if (Now) Now.pages = (Now.pages || []).filter((Other) => Other.id !== Page.id);
    if (Was && !(Was.pages || []).some((Other) => Other.id === Page.id)) (Was.pages = Was.pages || []).splice(Math.max(Index, 0), 0, Page);
    return FromId;
  }, async () =>
  {
    if (!DB) return;
    const { error } = await DB.from("book_pages").update({ book_id: IntoId, position: Position }).eq("id", Page.id);
    if (error) throw error;
  }, "“" + Page.title + "” could not be moved, so it is back in “" + From.name + "”.");
}

// Section: Putting a whole book inside another

// InsideOf holds the book a carried book is held over the middle of, so letting go puts it inside as a page
let InsideOf = null;

// The CarryOver function is called by library.js as a book is carried: over the middle of another book's spine that book lights up and returns true, at its edges the books make room as before
function CarryOver(X, Y)
{
  const Under = document.elementFromPoint(X, Y);
  const Over = Under && Under.closest("#library .book");
  const Book = BookWithId(Carry.Elem.dataset.id);
  let Next = null;
  if (Over && Over !== Carry.Elem && Book && CanEdit(Book))
  {
    // The middle of the spine, leaving a thin edge either side for moving along the shelf
    const Spine = Over.querySelector(".spine").getBoundingClientRect();
    if (X > Spine.left + Spine.width * 0.2 && X < Spine.right - Spine.width * 0.2 && Y > Spine.top) Next = Over;
  }
  if (InsideOf !== Next)
  {
    if (InsideOf) InsideOf.classList.remove("is-target", "is-page-full", "is-page-no");
    InsideOf = Next;
    if (Next)
    {
      const Kind = PageTargetClass(BookWithId(Next.dataset.id), PagesOf(Book).length);
      Next.classList.add(Kind === "is-page-target" ? "is-target" : Kind);
    }
  }
  if (!Next) return false;
  Carry.X = X;
  Carry.Y = Y;
  Carry.Copy.style.left = X - Carry.GrabX + "px";
  Carry.Copy.style.top = Y - Carry.GrabY - 12 + "px";
  return true;
}

// The ForgetInside function lets go of the book lit up when a carried book is put back instead
function ForgetInside()
{
  if (InsideOf) InsideOf.classList.remove("is-target", "is-page-full", "is-page-no");
  InsideOf = null;
}
document.addEventListener("pointercancel", ForgetInside);
document.addEventListener("keydown", (event) => { if (event.key === "Escape") ForgetInside(); });

// The DropInside function is called by library.js when a carried book is let go, over the middle of another book it is put inside after asking, and returns true
function DropInside()
{
  if (!InsideOf) return false;
  const Target = InsideOf;
  InsideOf = null;
  Target.classList.remove("is-target", "is-page-full", "is-page-no");
  const Was = StopCarrying();
  Was.HomeShelf.insertBefore(Was.Elem, Was.HomeNext);
  const Book = BookWithId(Was.Elem.dataset.id);
  const Into = BookWithId(Target.dataset.id);
  if (Book && Into) PutInside(Book, Into);
  return true;
}

// The PutInside function asks, then puts a book inside another as its next page, the book's own pages follow it, saved when the Undo note runs out
async function PutInside(Book, Into)
{
  const Kind = PageTargetClass(Into, PagesOf(Book).length);
  if (Kind === "is-page-no") { ShowLibraryNote("Only the shelf's owner and whoever added “" + Into.name + "” can add pages to it."); return; }
  const Count = PagesOf(Into).length;
  const Extra = PagesOf(Book).length - 1;
  if (Kind === "is-page-full") { ShowLibraryNote("“" + Into.name + "” has no room for that, a book holds up to " + MOST_PAGES + " pages."); return; }
  const Long = (Book.notes || "").length > 4000 ? " Its notes are long, so only the first part comes with it." : "";
  const Words = "Put “" + Book.name + "” inside “" + Into.name + "” as page " + (Count + 1) + (Extra ? ", with its " + Extra + (Extra === 1 ? " other page" : " other pages") : "") + "? Its link, notes and picture come with it." + Long;
  if (!(await AskToConfirm(Words, "Put it inside", true))) return;

  const SectionId = SectionOf(Book).id;
  const Index = SectionOf(Book).books.indexOf(Book);
  const IntoId = Into.id;
  const Before = (Into.pages || []).slice();
  const Start = LastPlace(Into);
  const AsPage = { id: LocalPageId(), book_id: IntoId, ...PageWords(Book), picture: Book.picture || "", position: Start };
  const Moved = (Book.pages || []).map((Page, i) => ({ ...Page, book_id: IntoId, position: Start + 1 + i }));
  DeleteLater(Book.id, Book.name, ["Put ", Quoted(Book.name), " inside ", Quoted(Into.name), "."], () =>
  {
    Library.forEach((Section) => { Section.books = Section.books.filter((Other) => Other !== Book); });
    Into.pages = [...Before, AsPage, ...Moved];
  }, () =>
  {
    const Section = Library.find((Other) => Other.id === SectionId);
    const Now = BookWithId(IntoId);
    if (Now) Now.pages = (Now.pages || []).filter((Page) => Page !== AsPage && !Moved.some((Other) => Other.id === Page.id));
    if (Section && !Section.books.some((Other) => Other.id === Book.id)) Section.books.splice(Math.min(Index, Section.books.length), 0, Book);
    return Book.id;
  }, async () =>
  {
    if (!DB) return;
    // The book becomes a page first, then its own pages move across, and only then does the book itself go
    const Section = SectionOf(BookWithId(IntoId) || Into) || Library.find((Other) => Other.id === Into.section_id);
    const Picture = Section ? await PictureFor(Book.picture, Section) : Book.picture || "";
    const Row = await AddPage(Into, { ...PageWords(Book), picture: Picture, position: Start });
    Object.assign(AsPage, Row);                    // the page on the shelf takes the saved page's id
    for (const Page of Moved)
    {
      const { error } = await DB.from("book_pages").update({ book_id: IntoId, position: Page.position }).eq("id", Page.id);
      if (error) throw error;
    }
    const { error } = await DB.from("books").delete().eq("id", Book.id);
    if (error) throw error;
    if (Picture !== (Book.picture || "")) DiscardPicture(Book.picture).catch(console.error);      // a picture that was copied across is not needed twice
  }, "“" + Book.name + "” could not be put inside, so it is back on its shelf.");
}
