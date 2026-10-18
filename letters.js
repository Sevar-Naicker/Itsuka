// This file contains the letters on joint shelves: while a member is away, the changes their friends make on a joint shelf wait for them as a small letter on the shelf's plaque, opened as a journal page
// It loads after library.js and live.js and uses their functions, the changes come from the shelf log kept by supabase-letters.sql

// Section: The letters

// LETTER_DAYS is how far back the log goes, the database clears anything older
const LETTER_DAYS = 30;
// MOST_NAMES is how many book names a line lists before it says "and 2 more"
const MOST_NAMES = 3;

// LetterLog holds the changes on the member's shelves from the last 30 days, LetterSeen holds when the member last read each shelf's letter
let LetterLog = [];
const LetterSeen = new Map();
// LettersReady holds whether the log could be read, until supabase-letters.sql has been run there are no letters and nothing is said
let LettersReady = false;

// The parts of the letter page
const LetterDialog = document.getElementById("letterDialog");
const LetterTitle = document.getElementById("letterTitle");
const LetterSince = document.getElementById("letterSince");
const LetterList = document.getElementById("letterList");
const LetterShow = document.getElementById("letterShow");

// The FetchLetters function reads the shelf log and the member's seen times, then puts the letters on the plaques
async function FetchLetters()
{
  if (!DB || !MyId()) return;
  const Since = new Date(Date.now() - LETTER_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const [Log, Seen] = await Promise.all([
    Softly(() => DB.from("shelf_log").select("*").gt("at", Since).order("at")),
    Softly(() => DB.from("shelf_seen").select("*")),
  ]);
  if (Log.error || Seen.error)
  {
    LettersReady = false;                          // not set up yet, or a hiccup: no letters this time
    return;
  }
  LettersReady = true;
  LetterLog = Log.data || [];
  LetterSeen.clear();
  (Seen.data || []).forEach((Row) => LetterSeen.set(Row.section_id, Row.seen_at));
  PlaceLetters();
}

// The UnreadFor function returns the changes on a shelf the member has not read yet: newer than their last read and than when they joined, and made by someone else
function UnreadFor(Section)
{
  const Me = Section.people.find((Person) => Person.member_id === MyId());
  const Marks = [LetterSeen.get(Section.id), Me && Me.joined_at].filter(Boolean).map((When) => new Date(When).getTime());
  const After = Marks.length ? Math.max(...Marks) : 0;
  return LetterLog.filter((Row) => Row.section_id === Section.id && new Date(Row.at).getTime() > After && Row.by_member !== MyId());
}

// The PlaceLetters function puts a letter on the plaque of each shelf with unread changes, on its shelf and in the plaque row at the top
function PlaceLetters()
{
  document.querySelectorAll(".shelf-letter").forEach((Letter) => Letter.remove());
  TabsRoot.querySelectorAll(".tab[data-label]").forEach((Tab) => Tab.setAttribute("aria-label", Tab.dataset.label));
  if (!LettersReady) return;
  Library.forEach((Section) =>
  {
    const Unread = UnreadFor(Section);
    if (!Unread.length) return;
    const Count = String(LetterLines(Section, Unread).length);
    const Label = "A letter about what changed on " + Section.name + " while you were away";

    // On the shelf's own plaque the letter is a button of its own
    const ShelfPlaque = LibraryRoot.querySelector('.section[data-section="' + Section.id + '"] > .plaque');
    if (ShelfPlaque)
    {
      const Letter = Make("button", "shelf-letter");
      Letter.type = "button";
      Letter.setAttribute("aria-label", Label);
      Letter.append(Make("span", "", Count));
      Letter.addEventListener("click", () => OpenLetter(Section));
      ShelfPlaque.prepend(Letter);
    }

    // The plaque at the top is already a button, so its letter is a picture that opens the letter when pressed
    const Tab = TabsRoot.querySelector('.tab[data-section="' + Section.id + '"]');
    if (Tab)
    {
      const Letter = Make("span", "shelf-letter");
      Letter.setAttribute("aria-hidden", "true");
      Letter.append(Make("span", "", Count));
      Letter.addEventListener("click", (event) =>
      {
        event.stopPropagation();                     // reading the letter does not switch the shelf on or off
        OpenLetter(Section);
      });
      if (!Tab.dataset.label) Tab.dataset.label = Tab.getAttribute("aria-label") || Tab.textContent.trim();
      Tab.prepend(Letter);
      Tab.setAttribute("aria-label", Tab.dataset.label + ", with a letter waiting");
    }
  });
}

// Section: Writing the letter

// The PersonIn function finds the name and colour for someone in the log: from the shelf's people, or the name kept in the log for someone who has left
function PersonIn(Section, MemberId, KeptName)
{
  if (MemberId && MemberId === MyId()) return { name: "you", colour: "var(--page-ink)" };
  const Person = Section.people.find((Other) => Other.member_id === MemberId);
  if (Person) return { name: Person.name, colour: ColourOf(Person.key) };
  return { name: KeptName || "A former member", colour: "var(--faded)" };
}

// The NameList function joins book names as “A”, “B” and “C”, saying how many more there are past MOST_NAMES
function NameList(Names)
{
  const Quoted = Names.map((Name) => "“" + Name + "”");
  if (Quoted.length > MOST_NAMES) return Quoted.slice(0, MOST_NAMES).join(", ") + " and " + (Quoted.length - MOST_NAMES) + " more";
  if (Quoted.length === 1) return Quoted[0];
  return Quoted.slice(0, -1).join(", ") + " and " + Quoted[Quoted.length - 1];
}

// The LetterLines function turns the unread changes into the lines of the letter, joining one person's books added, removed or ticked one after another into one line
function LetterLines(Section, Rows)
{
  const Lines = [];
  Rows.forEach((Row) =>
  {
    const Last = Lines[Lines.length - 1];
    const Joins = ["added", "removed", "done"].includes(Row.kind);
    if (Joins && Last && Last.kind === Row.kind && Last.by === Row.by_member)
    {
      if (!Last.names.includes(Row.book_name)) Last.names.push(Row.book_name);
      if (Row.book_id) Last.ids.push(Row.book_id);
      return;
    }
    Lines.push({ kind: Row.kind, by: Row.by_member, byName: Row.by_name, person: Row.person, personName: Row.person_name,
      names: Row.book_name ? [Row.book_name] : [], ids: Row.book_id ? [Row.book_id] : [], oldName: Row.old_name });
  });
  return Lines;
}

// The LineWords function writes what one line says after the person's name, or the whole line when nobody in particular did it
function LineWords(Section, Line)
{
  const Other = PersonIn(Section, Line.person, Line.personName);
  if (Line.kind === "added") return "added " + NameList(Line.names);
  if (Line.kind === "removed") return "removed " + NameList(Line.names);
  if (Line.kind === "done") return "ticked " + NameList(Line.names) + " done";
  if (Line.kind === "renamed") return "renamed the shelf from “" + Line.oldName + "” to “" + Line.names[0] + "”";
  if (Line.kind === "joined") return "joined the shelf";
  if (Line.kind === "left") return "left the shelf";
  if (Line.kind === "removed_person") return "took " + Other.name + " off the shelf";
  if (Line.kind === "handover") return "The shelf passed to " + Other.name;
  return "";
}

// The SinceWords function says when the oldest unread change happened: earlier today, yesterday, on a weekday this week, or on a date
function SinceWords(When)
{
  const Then = new Date(When);
  const Today = new Date();
  const Days = Math.round((new Date(Today.toDateString()) - new Date(Then.toDateString())) / (24 * 60 * 60 * 1000));
  if (Days <= 0) return "earlier today";
  if (Days === 1) return "yesterday";
  if (Days < 7) return Then.toLocaleDateString("en-ZA", { weekday: "long" });
  return Then.toLocaleDateString("en-ZA", { day: "numeric", month: "long" });
}

// LetterOpenFor holds the shelf whose letter is open, and LetterNewBooks the books added in it that are still on the shelf
let LetterOpenFor = null;
let LetterNewBooks = [];

// The OpenLetter function opens a shelf's letter as a journal page and marks it read, on every device
function OpenLetter(Section)
{
  const Unread = UnreadFor(Section);
  if (!Unread.length) return;
  const Lines = LetterLines(Section, Unread);
  LetterOpenFor = Section;
  LetterTitle.textContent = Section.name;
  LetterSince.textContent = "While you were away, since " + SinceWords(Unread[0].at);
  LetterList.replaceChildren();
  Lines.forEach((Line) =>
  {
    const Row = Make("p", "letter-line");
    const Face = Make("i", "face");
    const Words = Make("span");
    if (Line.kind === "handover")
    {
      Face.style.setProperty("--who", PersonIn(Section, Line.person, Line.personName).colour);
      Words.append(LineWords(Section, Line));
    }
    else
    {
      const Who = PersonIn(Section, Line.by, Line.byName);
      Face.style.setProperty("--who", Who.colour);
      Words.append(Make("b", "", Who.name.charAt(0).toUpperCase() + Who.name.slice(1)), " " + LineWords(Section, Line));
    }
    Row.append(Face, Words);
    LetterList.append(Row);
  });
  const OnShelf = new Set(Section.books.map((Book) => Book.id));
  LetterNewBooks = Lines.filter((Line) => Line.kind === "added").flatMap((Line) => Line.ids).filter((Id) => OnShelf.has(Id));
  LetterShow.hidden = !LetterNewBooks.length;
  LetterShow.textContent = LetterNewBooks.length === 1 ? "Show me the new book" : "Show me the new books";
  MarkRead(Section, Unread[Unread.length - 1].at);
  LetterDialog.showModal();
}

// The MarkRead function remembers that the member has read a shelf's letter up to a change, and takes the letter off its plaques
async function MarkRead(Section, Upto)
{
  LetterSeen.set(Section.id, Upto);
  PlaceLetters();
  const { error } = await Softly(() => DB.from("shelf_seen").upsert({ section_id: Section.id, seen_at: Upto }, { onConflict: "section_id,member_id" }));
  if (error) console.error(error);                 // the letter is read on this device even if the note did not save
}

// The ShowLetterBooks function closes the letter and points at the books it said were added
function ShowLetterBooks()
{
  LetterDialog.close();
  const Find = () => LetterNewBooks.map((Id) => LibraryRoot.querySelector('.book[data-id="' + Id + '"]')).filter(Boolean);
  let Books = Find();
  if (!Books.length && Chosen.size)
  {
    // The shelf may be switched off at the top, so every shelf is shown first
    Chosen.clear();
    Update();
    Books = Find();
  }
  if (Books[0]) Books[0].scrollIntoView({ block: "center", behavior: "smooth" });
  Books.forEach((Book) =>
  {
    Book.classList.remove("is-pointed");
    void Book.offsetWidth;                         // restarts the pulse if it was already running
    Book.classList.add("is-pointed");
    setTimeout(() => Book.classList.remove("is-pointed"), 2600);
  });
}

// Section: Changes seen live

// HeardTimer waits a moment after live changes before acting on them
let HeardTimer = 0;
// The LettersHeard function is called by live.js after it shows changes as they happen: a shelf with no letter waiting counts as read, since the member saw it, and a shelf with a letter gets its letter brought up to date
function LettersHeard(Ids)
{
  if (!LettersReady) return;
  clearTimeout(HeardTimer);
  HeardTimer = setTimeout(async () =>
  {
    const Waiting = Ids.map((Id) => Library.find((Section) => Section.id === Id)).filter((Section) => Section && UnreadFor(Section).length);
    await FetchLetters();
    if (document.hidden) return;                   // a change while the page was out of sight was not seen
    Ids.forEach((Id) =>
    {
      const Section = Library.find((Other) => Other.id === Id);
      if (!Section || Waiting.includes(Section)) return;
      const Unread = UnreadFor(Section);
      if (Unread.length) MarkRead(Section, Unread[Unread.length - 1].at);
    });
  }, 1500);
}

document.getElementById("letterDone").addEventListener("click", () => LetterDialog.close());
LetterShow.addEventListener("click", ShowLetterBooks);
LibraryReady.then(FetchLetters);
