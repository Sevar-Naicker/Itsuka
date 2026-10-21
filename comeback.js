// This file contains the Books due slip: a member can give any book a day to come back to it, and when that day comes a manila date due slip greets them with the books that are due
// It loads after library.js and uses its functions, each member's days are kept by the database (supabase-due.sql) and are only theirs, even on a joint shelf

// Section: The days

// STAMP_MONTHS holds the short month names stamped on the slip, the same three letters every time
const STAMP_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// ComeBack holds the day to come back to each book, by the book's id, and ComeBackReady whether the days could be read (until supabase-due.sql has been run they cannot)
let ComeBack = new Map();
let ComeBackReady = !LoginIsSetUp;

// The DayToday function gives today's date on this device, like 2026-10-24
function DayToday()
{
  const Now = new Date();
  return Now.getFullYear() + "-" + String(Now.getMonth() + 1).padStart(2, "0") + "-" + String(Now.getDate()).padStart(2, "0");
}

// The DayAfter function moves a date on by a number of days
function DayAfter(Day, Count)
{
  const When = new Date(Day + "T12:00:00");
  When.setDate(When.getDate() + Count);
  return When.getFullYear() + "-" + String(When.getMonth() + 1).padStart(2, "0") + "-" + String(When.getDate()).padStart(2, "0");
}

// The DayWords function writes a date like Saturday 24 October, with the year only when it is not this year
function DayWords(Day)
{
  const When = new Date(Day + "T12:00:00");
  const Options = { weekday: "long", day: "numeric", month: "long" };
  if (When.getFullYear() !== new Date().getFullYear()) Options.year = "numeric";
  return When.toLocaleDateString("en-GB", Options);
}

// The DayIsFine function checks a new day to come back: it must be tomorrow or later, a day that has passed cannot be come back to
function DayIsFine(Day)
{
  return !Day || Day > DayToday();
}

// The DayProblem function says what is wrong with a day that is not fine
function DayProblem(Day)
{
  return Day === DayToday() ? "Today is already here. Pick tomorrow or a later day." : "That day has already passed. Pick tomorrow or a later day.";
}

// The FetchComeBacks function reads the member's days
async function FetchComeBacks()
{
  if (!DB || !SignedIn) return;
  const { data: Data, error } = await Softly(() => DB.from("come_back").select("book_id, day"));
  if (error)
  {
    if (!NoSignalNow()) ComeBackReady = false;     // not set up yet: no days, and nothing about them is shown
    return;
  }
  ComeBack = new Map((Data || []).map((Row) => [Row.book_id, Row.day]));
  ComeBackReady = true;
}

// The SaveComeBack function saves the day to come back to a book, or clears it when Day is empty
async function SaveComeBack(BookId, Day)
{
  if (DB && SignedIn)
  {
    const { error } = Day
      ? await DB.from("come_back").upsert({ book_id: BookId, day: Day }, { onConflict: "member_id,book_id" })
      : await DB.from("come_back").delete().eq("book_id", BookId);
    if (error) throw error;
  }
  if (Day) ComeBack.set(BookId, Day);
  else ComeBack.delete(BookId);
}

// The DueBooks function lists the books whose day has come, oldest day first, a done book is never due
function DueBooks()
{
  const Today = DayToday();
  return Library.flatMap((Section) => Section.books)
    .filter((Book) => !Book.done && ComeBack.has(Book.id) && ComeBack.get(Book.id) <= Today)
    .sort((a, b) => ComeBack.get(a.id).localeCompare(ComeBack.get(b.id)));
}

// Section: Choosing a day

// The ChooseDay function gives the choices for a day: next week, next month, or a date of their own, Picked is told the day once it is saved
function ChooseDay(Book, Picked)
{
  const Holder = Make("div", "come-back-choose");
  const Row = Make("div", "come-back-again");
  const Warning = Make("p", "come-back-warning");
  Warning.setAttribute("role", "alert");
  Warning.hidden = true;
  const Pick = document.createElement("input");
  Pick.type = "date";
  Pick.min = DayAfter(DayToday(), 1);              // the calendar starts at tomorrow
  Pick.setAttribute("aria-label", "Come back on");
  const Choose = async (Day) =>
  {
    if (!DayIsFine(Day))
    {
      // a typed day can get past the calendar's limit, so it is checked here too
      Warning.textContent = DayProblem(Day);
      Warning.hidden = false;
      Pick.value = "";
      Pick.focus();
      return;
    }
    try
    {
      await SaveComeBack(Book.id, Day);
      Picked(Day);
    }
    catch (error)
    {
      console.error(error);
      Warning.textContent = /already passed/i.test(error.message || "") ? DayProblem(Day) : ExplainDatabase(error);
      Warning.hidden = false;
    }
  };
  [["Next week", 7], ["Next month", 30]].forEach(([Words, Days]) =>
  {
    const Button = Make("button", "needs-signal", Words);
    Button.type = "button";
    Button.addEventListener("click", (event) => { event.stopPropagation(); Choose(DayAfter(DayToday(), Days)); });
    Row.append(Button);
  });
  Pick.addEventListener("click", (event) => event.stopPropagation());
  Pick.addEventListener("change", () => { if (Pick.value) Choose(Pick.value); });
  Row.append(Pick);
  Holder.append(Row, Warning);
  return Holder;
}

// Section: Inside the book

// The DressComeBack function is called by library.js for every book drawn, it adds the place inside the book where its day is shown
function DressComeBack(Elem, Book)
{
  const Part = Make("div", "come-back-part");
  const After = Elem.querySelector(".page.right .added-by") || Elem.querySelector(".page.right h3");
  After.after(Part);
  FillComeBackPart(Part, Book);
}

// The FillComeBackPart function writes the day inside a book: a note on the day and after it, a quiet line before it, or a small link to set one
function FillComeBackPart(Part, Book)
{
  Part.replaceChildren();
  if (!ComeBackReady) return;
  const Day = ComeBack.get(Book.id);
  const Refill = () => FillComeBackPart(Part, Book);
  if (Day && Day <= DayToday() && !Book.done)
  {
    // The day has come: a note with Remind me again and Thanks, that's it
    const Note = Make("div", "come-back-note");
    Note.append(Make("b", "", Day === DayToday() ? "You wanted to come back to this today." : "You wanted to come back to this on " + DayWords(Day) + "."));
    const Buttons = Make("div", "note-buttons");
    const Again = Make("button", "needs-signal", "Remind me again");
    Again.type = "button";
    const Clear = Make("button", "needs-signal", "Thanks, that’s it");
    Clear.type = "button";
    Buttons.append(Again, Clear);
    Note.append(Buttons);
    Again.addEventListener("click", (event) =>
    {
      event.stopPropagation();
      Buttons.replaceWith(ChooseDay(Book, (Day) => { Part.replaceChildren(Make("p", "come-back-line", "I’ll show it again on " + DayWords(Day) + ".")); }));
    });
    Clear.addEventListener("click", async (event) =>
    {
      event.stopPropagation();
      try
      {
        await SaveComeBack(Book.id, "");
        Part.replaceChildren(Make("p", "come-back-line", "Reminder cleared."));
      }
      catch (error)
      {
        console.error(error);
      }
    });
    Part.append(Note);
    return;
  }
  const Line = Make("p", "come-back-line");
  const Change = Make("button", "come-back-set needs-signal", Day ? "Change" : "Remind me to come back");
  Change.type = "button";
  Change.addEventListener("click", (event) =>
  {
    event.stopPropagation();
    const Choose = ChooseDay(Book, Refill);
    if (Day)
    {
      const Clear = Make("button", "needs-signal", "No date");
      Clear.type = "button";
      Clear.addEventListener("click", async (Click) =>
      {
        Click.stopPropagation();
        try { await SaveComeBack(Book.id, ""); Refill(); }
        catch (error) { console.error(error); }
      });
      Choose.querySelector(".come-back-again").append(Clear);
    }
    Line.replaceWith(Choose);
  });
  if (Day && !Book.done) Line.append(Make("i"), "Come back on " + DayWords(Day) + " ", Change);
  else if (!Day && !Book.done) Line.append(Change);
  else return;                                     // a done book needs no reminder
  Part.append(Line);
}

// Section: The date on the catalogue card

// The parts of the catalogue card this file works with
const ComeBackLine = document.getElementById("comeBackLine");
const ComeBackDate = document.getElementById("bookComeBack");
const ComeBackPicks = document.getElementById("comeBackPicks");
const ComeBackWarning = document.getElementById("comeBackWarning");

// The quick picks under the date: in a week, in a month, or no date
[["In a week", 7], ["In a month", 30], ["No date", 0]].forEach(([Words, Days]) =>
{
  const Button = Make("button", "", Words);
  Button.type = "button";
  Button.addEventListener("click", () =>
  {
    ComeBackDate.value = Days ? DayAfter(DayToday(), Days) : "";
    ComeBackDate.dispatchEvent(new Event("change"));
  });
  ComeBackPicks.append(Button);
});

// The FillComeBackLine function is called by library.js when the catalogue card opens, it fills in the book's day
function FillComeBackLine(Book)
{
  ComeBackLine.hidden = !ComeBackReady;
  ComeBackPicks.hidden = !ComeBackReady;
  ComeBackDate.value = Book && ComeBack.get(Book.id) ? ComeBack.get(Book.id) : "";
  ComeBackDate.min = DayAfter(DayToday(), 1);       // the calendar starts at tomorrow
  ComeBackDate.dataset.was = ComeBackDate.value;    // a day already there that has since passed may stay, only a changed day is checked
  ComeBackWarning.hidden = true;
}

// The ComeBackProblem function is called by library.js before the card is saved, it says so and returns true when the day has already passed
function ComeBackProblem()
{
  if (!ComeBackReady || ComeBackDate.value === ComeBackDate.dataset.was || DayIsFine(ComeBackDate.value)) return false;
  ComeBackWarning.textContent = DayProblem(ComeBackDate.value);
  ComeBackWarning.hidden = false;
  ComeBackDate.focus();
  return true;
}

// The SaveComeBackLine function is called by library.js once the book is saved, it saves the day if it changed, a book saved without it is still saved
async function SaveComeBackLine(Book)
{
  if (!ComeBackReady || ComeBackDate.value === ComeBackDate.dataset.was) return;
  try
  {
    await SaveComeBack(Book.id, ComeBackDate.value);
  }
  catch (error)
  {
    console.error(error);
    // The book itself is saved, so the card still closes, a note says the day was not
    PinProblem(["The book is saved, but its come back day could not be. " + ExplainDatabase(error) + " Open the book and press Remind me to come back to try again."]);
  }
}

// A changed day is checked straight away, so a day that has passed is caught before saving
ComeBackDate.addEventListener("change", () =>
{
  if (ComeBackDate.value !== ComeBackDate.dataset.was && !DayIsFine(ComeBackDate.value))
  {
    ComeBackWarning.textContent = DayProblem(ComeBackDate.value);
    ComeBackWarning.hidden = false;
    ComeBackDate.value = ComeBackDate.dataset.was;
    ComeBackDate.focus();
    return;
  }
  ComeBackWarning.hidden = true;
});

// Section: The Books due slip

// The parts of the slip
const DueDialog = document.getElementById("dueDialog");
const DueTable = document.getElementById("dueTable");
const DueStamp = document.getElementById("dueStamp");

// The ShowDueSlip function opens the slip with a stamped line for every book whose day has come
function ShowDueSlip()
{
  const Due = DueBooks();
  if (!Due.length) return;
  DueTable.replaceChildren();
  Due.forEach((Book, Index) => DueTable.append(DueRow(Book, Index)));
  // OVERDUE is stamped in the corner when a day has already gone by, DUE TODAY when every book is due today
  const Late = Due.some((Book) => ComeBack.get(Book.id) < DayToday());
  DueStamp.textContent = Late ? "Overdue" : "Due today";
  DueStamp.style.animation = "none";
  void DueStamp.offsetWidth;                       // the stamp comes down again each time the slip opens
  DueStamp.style.animation = "";
  if (!DueDialog.open) DueDialog.showModal();
}

// The DueRow function writes one book's line on the slip: the date stamped the way a library stamp prints it, the book's name, and Open it, Later and Clear
function DueRow(Book, Index)
{
  const Day = ComeBack.get(Book.id);
  const When = new Date(Day + "T12:00:00");
  const Row = Make("div", "slip-row");
  const Stamp = Make("span", "slip-date");
  Stamp.setAttribute("aria-label", "Due " + DayWords(Day));
  Stamp.append(Make("span", "day", String(When.getDate())), Make("span", "month", STAMP_MONTHS[When.getMonth()]), Make("span", "year", String(When.getFullYear())));
  Stamp.style.setProperty("--tilt", [-3, 2, -1, 3][Index % 4] + "deg");     // each stamp lands a little crooked, like a real one
  Row.append(Stamp, Make("b", "", Book.name));
  const Actions = Make("div", "slip-actions");
  const OpenIt = Make("button", "", "Open it");
  OpenIt.type = "button";
  OpenIt.addEventListener("click", () => OpenDueBook(Book.id));
  const Later = Make("button", "needs-signal", "Later");
  Later.type = "button";
  Later.addEventListener("click", () =>
  {
    Actions.replaceWith(ChooseDay(Book, (Picked) =>
    {
      Row.querySelector(".come-back-choose").replaceWith(Make("p", "come-back-line", "I’ll show it again on " + DayWords(Picked) + "."));
      Update();
    }));
  });
  const Clear = Make("button", "needs-signal", "Clear");
  Clear.type = "button";
  Clear.addEventListener("click", async () =>
  {
    try
    {
      await SaveComeBack(Book.id, "");
      Row.remove();
      Update();
      if (!DueTable.children.length) DueDialog.close();
    }
    catch (error)
    {
      console.error(error);
    }
  });
  Actions.append(OpenIt, Later, Clear);
  Row.append(Actions);
  return Row;
}

// The OpenDueBook function closes the slip and opens the book on its shelf, showing every shelf first
function OpenDueBook(Id)
{
  DueDialog.close();
  if (Chosen.size)
  {
    Chosen.clear();
    Update();
  }
  const Elem = LibraryRoot.querySelector('.book[data-id="' + Id + '"]');
  if (!Elem) return;
  Elem.scrollIntoView({ block: "center", behavior: "smooth" });
  setTimeout(() => OpenBook(Elem), 350);
}

// The WhenFree function waits until no other card is open (What's new or the welcome tour), then does what it was given
function WhenFree(Do)
{
  if (document.querySelector("dialog[open]") || !document.getElementById("tourLayer").hidden)
  {
    setTimeout(() => WhenFree(Do), 800);
    return;
  }
  Do();
}

document.getElementById("dueDone").addEventListener("click", () => DueDialog.close());

// Once the shelves have loaded the days are read, and the slip is shown once a day on each device when a book is due
LibraryReady.then(async () =>
{
  await FetchComeBacks();
  Update();                                        // the books are drawn again with their days
  setTimeout(() => WhenFree(() =>
  {
    if (!DueBooks().length || Recall("library-due-shown") === DayToday()) return;
    Remember("library-due-shown", DayToday());
    ShowDueSlip();
  }), 1200);
});
