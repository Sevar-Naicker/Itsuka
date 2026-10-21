// This file contains the reading record: a manila record card, opened from the library card, listing every book the member has ticked done with the day stamped beside it
// It loads after library.js and uses its functions, the database stamps the day and keeps each line (supabase-record.sql), even after the book itself is deleted

// Section: The record card

// MONTHS holds the short month names stamped on the record, MONTH_NAMES the full ones for each month's heading
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// The parts of the page this file works with
const RecordDialog = document.getElementById("recordDialog");
const RecordBody = document.getElementById("recordBody");
const RecordOwner = document.getElementById("recordOwner");

// RecordLines holds the member's record as it was last fetched
let RecordLines = [];

// The OpenRecord function opens the record card and fills it, fetching the record first
async function OpenRecord()
{
  RecordOwner.textContent = SignedIn ? MemberName(SignedIn) + " · card " + CardNumber(SignedIn) : "";
  RecordBody.replaceChildren(Make("p", "record-empty", "Finding your record…"));
  RecordDialog.showModal();
  if (!DB || !SignedIn)
  {
    RecordLines = [];                              // login is off: only the done books on the example shelves show
    FillRecord();
    return;
  }
  const { data: Data, error } = await Softly(() => DB.from("reading_record").select("*").order("done_at", { ascending: false }));
  if (error)
  {
    console.error(error);
    const Words = NoSignalNow() ? "Your reading record needs a signal. It comes back once you're connected." : ExplainDatabase(error);
    RecordBody.replaceChildren(Make("p", "record-empty", Words));
    return;
  }
  RecordLines = Data || [];
  FillRecord();
}

// The BookOnShelf function finds a book still on the member's shelves, with its shelf, or nothing for a book that has been deleted
function BookOnShelf(Id)
{
  for (const Section of Library)
  {
    const Book = Section.books.find((Other) => Other.id === Id);
    if (Book) return { Book, Section };
  }
  return null;
}

// The RecordEntries function joins the record with the shelves: a book still on a shelf shows its name and shelf as they are now, a deleted one as it was when ticked
// Books ticked done before the record began are added at the end with no day, only from the member's own shelves
function RecordEntries()
{
  const Entries = RecordLines.map((Line) =>
  {
    const Found = BookOnShelf(Line.book_id);
    return {
      Line,
      Id: Found ? Found.Book.id : "",
      Name: Found ? Found.Book.name : Line.book_name,
      Shelf: Found ? Found.Section.name : Line.shelf_name,
      Day: Line.done_at,
    };
  });
  const OnRecord = new Set(RecordLines.map((Line) => Line.book_id));
  Library.filter((Section) => Section.owner !== false).forEach((Section) => Section.books.forEach((Book) =>
  {
    if (Book.done && !Book.done_at && !OnRecord.has(Book.id)) Entries.push({ Line: null, Id: Book.id, Name: Book.name, Shelf: Section.name, Day: "" });
  }));
  return Entries;
}

// The FillRecord function writes the totals, the book waiting longest and every month's books onto the card
function FillRecord()
{
  RecordBody.replaceChildren();
  const Entries = RecordEntries();
  if (!Entries.length)
  {
    RecordBody.append(Make("p", "record-empty", "Nothing ticked done yet. Open a book and tick Done once you've visited, bought or used it, and it is stamped here with the day."));
    return;
  }

  // The totals: this month, all time, and the shelf with the most books done
  const Now = new Date();
  const ThisMonth = Entries.filter((Entry) => Entry.Day && new Date(Entry.Day).getMonth() === Now.getMonth() && new Date(Entry.Day).getFullYear() === Now.getFullYear()).length;
  const Counts = new Map();
  Entries.forEach((Entry) => Counts.set(Entry.Shelf, (Counts.get(Entry.Shelf) || 0) + 1));
  const Busiest = [...Counts.keys()].sort((a, b) => Counts.get(b) - Counts.get(a))[0] || "";
  const Tallies = Make("div", "record-tallies");
  [[String(ThisMonth), "this month", ""], [String(Entries.length), "all time", ""], [Busiest, "busiest shelf", "is-word"]].forEach(([Big, Small, Kind]) =>
  {
    const Tally = Make("div", "record-tally");
    Tally.append(Make("b", Kind, Big), Make("span", "", Small));
    Tallies.append(Tally);
  });
  RecordBody.append(Tallies);

  // The book that has waited longest without being ticked done
  const Waiting = Library.flatMap((Section) => Section.books).filter((Book) => !Book.done).sort((a, b) => String(a.created_at || "").localeCompare(String(b.created_at || "")))[0];
  if (Waiting)
  {
    const Line = Make("p", "record-waiting");
    const Sentence = Make("span");
    const Added = Waiting.created_at ? new Date(Waiting.created_at) : null;
    const Since = Added ? ", on your shelf since " + MONTH_NAMES[Added.getMonth()] + (Added.getFullYear() === Now.getFullYear() ? "" : " " + Added.getFullYear()) : "";
    Sentence.append("Waiting longest: ", Make("b", "", "“" + Waiting.name + "”"), Since + ".");
    const Open = Make("button", "", "Open it");
    Open.type = "button";
    Open.addEventListener("click", () => OpenFromRecord(Waiting.id));
    Line.append(Sentence, Open);
    RecordBody.append(Line);
  }

  // Each month, newest first, then the books ticked done before the record began
  const Groups = new Map();
  Entries.forEach((Entry) =>
  {
    const When = Entry.Day ? new Date(Entry.Day) : null;
    const Key = When ? When.getFullYear() + "-" + When.getMonth() : "earlier";
    if (!Groups.has(Key)) Groups.set(Key, { When, Entries: [] });
    Groups.get(Key).Entries.push(Entry);
  });
  Groups.forEach((Group) =>
  {
    const Head = Make("h3", "record-month");
    const Title = Group.When ? MONTH_NAMES[Group.When.getMonth()] + " " + Group.When.getFullYear() : "Before the record began";
    Head.append(Make("b", "", Title), Make("span", "", Group.Entries.length + (Group.Entries.length === 1 ? " book" : " books")));
    RecordBody.append(Head);
    Group.Entries.forEach((Entry) => RecordBody.append(RecordRow(Entry)));
  });
}

// The RecordRow function writes one book's line: the day stamped, its name and shelf, and Open it, or Take off for a deleted book
function RecordRow(Entry)
{
  const Row = Make("div", "record-row" + (Entry.Id ? "" : " is-gone"));
  const When = Entry.Day ? new Date(Entry.Day) : null;
  const Stamp = Make("span", "record-date" + (When ? "" : " is-blank"), When ? When.getDate() + " " + MONTHS[When.getMonth()] : "Earlier");
  if (When) Stamp.setAttribute("aria-label", "Done on " + When.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }));
  const Words = Make("div", "record-words");
  Words.append(Make("b", "", Entry.Name), Make("small", "", Entry.Id ? Entry.Shelf : Entry.Shelf + " · no longer on your shelves"));
  const Button = Make("button", "", Entry.Id ? "Open it" : "Take off");
  Button.type = "button";
  Button.setAttribute("aria-label", (Entry.Id ? "Open " : "Take off the record: ") + Entry.Name);
  Button.addEventListener("click", () => (Entry.Id ? OpenFromRecord(Entry.Id) : TakeOff(Entry.Line, Button)));
  Row.append(Stamp, Words, Button);
  return Row;
}

// The TakeOff function takes a deleted book's line off the record for good
async function TakeOff(Line, Button)
{
  Button.disabled = true;
  const { error } = await Softly(() => DB.from("reading_record").delete().eq("id", Line.id));
  if (error)
  {
    console.error(error);
    Button.disabled = false;
    Button.textContent = NoSignalNow() ? "Needs a signal" : "Not taken off, try again";
    Button.title = ExplainDatabase(error);         // pointing at it says why
    return;
  }
  RecordLines = RecordLines.filter((Other) => Other !== Line);
  FillRecord();
}

// The OpenFromRecord function closes the record and opens the book on its shelf, showing every shelf and the done books first if they are hidden
function OpenFromRecord(Id)
{
  RecordDialog.close();
  if (Chosen.size || HidingDone())
  {
    Chosen.clear();
    if (HidingDone()) DoneSwitch.click();
    Update();
  }
  const Elem = LibraryRoot.querySelector('.book[data-id="' + Id + '"]');
  if (!Elem) return;
  Elem.scrollIntoView({ block: "center", behavior: "smooth" });
  setTimeout(() => OpenBook(Elem), 350);
}

// Section: Opening and closing

// Reading record on the library card opens the record
document.getElementById("recordButton").addEventListener("click", () =>
{
  MemberDialog.close();
  OpenRecord();
});
document.getElementById("recordDone").addEventListener("click", () => RecordDialog.close());
RecordDialog.addEventListener("click", (event) => { if (event.target === RecordDialog) RecordDialog.close(); });     // a click outside the card closes it
