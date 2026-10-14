// This file contains live shelves: everyone on a joint shelf sees each other's changes straight away, without reloading, it loads after joint.js and uses library.js to redraw the shelves

// LIVE_WAIT is how long changes gather before the shelves are fetched again, so a burst of changes becomes one fetch
const LIVE_WAIT = 600;
// BUSY_WAIT is how often a waiting change checks whether the member has finished dragging, reading or editing
const BUSY_WAIT = 500;
// SLEEP_AFTER is how long the page can be out of sight before it stops listening, it catches up when it is looked at again
const SLEEP_AFTER = 2 * 60 * 1000;
// NOTE_TIME is how long a note about someone else's change stays on screen
const NOTE_TIME = 4500;

// Channels holds one open channel per joint shelf, by the shelf's id
const Channels = new Map();
// Changed holds the shelves that changed and still need fetching, Heard holds the changes still to be told about in notes
const Changed = new Set();
const Heard = [];
// FlushTimer is the wait before the next fetch, SleepTimer the wait before the page stops listening, Asleep is true once it has
let FlushTimer = null;
let SleepTimer = null;
let Asleep = false;

// The notes in the corner of the screen
const LiveNotes = document.getElementById("liveNotes");

// Listening:

// The LiveShelfIds function lists the shelves worth listening to: joint shelves, and the member's own shelves with the invite link on, so they hear when someone joins
function LiveShelfIds()
{
  return Library.filter((Section) => Section.joint || (Section.owner && Section.invite_key)).map((Section) => Section.id);
}

// The SyncLive function opens a channel for every shelf worth listening to and closes the ones no longer needed
async function SyncLive()
{
  if (!DB || !SignedIn || !JointIsSetUp || Asleep) return;
  const Wanted = new Set(LiveShelfIds());
  Channels.forEach((Channel, Id) =>
  {
    if (Wanted.has(Id)) return;
    DB.removeChannel(Channel);
    Channels.delete(Id);
  });
  const Missing = [...Wanted].filter((Id) => !Channels.has(Id));
  if (!Missing.length) return;
  try { await DB.realtime.setAuth(); }            // private channels need the member's sign-in
  catch (error) { console.error(error); }
  Missing.forEach((Id) =>
  {
    if (Channels.has(Id)) return;
    let Joined = false;
    const Channel = DB.channel("shelf:" + Id, { config: { private: true } });
    Channel.on("broadcast", { event: "change" }, (Message) => HearChange(Message.payload));
    Channel.subscribe((Status) =>
    {
      // After the connection drops and comes back, anything missed in between is fetched
      if (Status === "SUBSCRIBED" && Joined) NoteChange({ section: Id });
      if (Status === "SUBSCRIBED") Joined = true;
    });
    Channels.set(Id, Channel);
  });
}

// The StopListening function closes every channel, used while the page is out of sight
function StopListening()
{
  Channels.forEach((Channel) => DB.removeChannel(Channel));
  Channels.clear();
}

// Hearing a change:

// The HearChange function takes in a change someone made to a joint shelf
function HearChange(Change)
{
  if (!Change || !Change.section) return;
  // A book someone else deleted closes straight away if it is open, instead of waiting
  if (Change.table === "books" && Change.op === "DELETE")
  {
    const Open = LibraryRoot.querySelector(".book.is-open");
    if (Open && Open.dataset.id === Change.id) CloseAll();
  }
  if (Change.by && Change.by !== MyId()) Heard.push(Change);
  NoteChange(Change);
}

// The NoteChange function marks a shelf as changed and fetches it again after a short wait
function NoteChange(Change)
{
  Changed.add(Change.section);
  clearTimeout(FlushTimer);
  FlushTimer = setTimeout(FetchChanges, LIVE_WAIT);
}

// The IsBusy function checks whether the member is in the middle of something a redraw would spoil: dragging, an open book, a card or a pick
function IsBusy()
{
  return Boolean(Carry) || Pulling || Boolean(LibraryRoot.querySelector(".book.is-open")) || Boolean(document.querySelector("dialog[open]"));
}

// The FetchChanges function fetches the changed shelves again and redraws them, it waits while the member is busy so nothing moves under them
async function FetchChanges()
{
  if (!Changed.size) return;
  if (IsBusy())
  {
    FlushTimer = setTimeout(FetchChanges, BUSY_WAIT);
    return;
  }
  const Ids = [...Changed];
  Changed.clear();
  const Told = Heard.splice(0);
  const Before = new Map(Library.map((Section) => [Section.id, Section]));
  try
  {
    await FetchShelves(Ids);
  }
  catch (error)
  {
    console.error(error);
    Ids.forEach((Id) => Changed.add(Id));          // try again in a little while
    Heard.unshift(...Told);
    FlushTimer = setTimeout(FetchChanges, 5000);
    return;
  }
  // The member may have opened a book or picked one up while the fetch was on its way
  if (IsBusy())
  {
    Ids.forEach((Id) => Changed.add(Id));
    Heard.unshift(...Told);
    FlushTimer = setTimeout(FetchChanges, BUSY_WAIT);
    return;
  }
  RenderTabs();
  Update();
  Told.forEach((Change) => ShowNote(Change, Before));
}

// The FetchShelves function fetches some shelves again and puts them in the library in place of the old ones, a shelf the member can no longer see leaves it
async function FetchShelves(Ids)
{
  const [Sections, Books, Rows, People] = await Promise.all([
    DB.from("sections").select("*").in("id", Ids),
    DB.from("books").select("*").in("section_id", Ids),
    DB.from("shelf_members").select("*").in("section_id", Ids).eq("member_id", MyId()),
    DB.rpc("shelf_people"),
  ]);
  const Failed = [Sections, Books, Rows, People].find((Result) => Result.error);
  if (Failed) throw Failed.error;
  const Everyone = Array.isArray(People.data) ? People.data : [];
  Ids.forEach((Id) =>
  {
    const Old = Library.find((Section) => Section.id === Id);
    const Row = Sections.data.find((Section) => Section.id === Id);
    if (!Row)
    {
      Library = Library.filter((Section) => Section !== Old);
      Chosen.delete(Id);
      return;
    }
    const Fresh = MakeShelf(Row, Books.data, Rows.data, Everyone);
    if (Old) Library[Library.indexOf(Old)] = Fresh;
    else Library.push(Fresh);
  });
  Library.sort((a, b) => a.position - b.position);
}

// The CatchUp function loads the whole library again after the page has been asleep or offline, unless the member is busy
async function CatchUp()
{
  if (IsBusy())
  {
    setTimeout(CatchUp, BUSY_WAIT);
    return;
  }
  try
  {
    await LoadLibrary();
    RenderTabs();
    Update();
  }
  catch (error)
  {
    console.error(error);
  }
}

// Notes:

// The NameOf function finds a person's first name and colour on a shelf, looking at the shelf as it was before the change too, for someone who has just left
function NameOf(MemberId, Section, Old)
{
  const People = [...(Section ? Section.people : []), ...(Old ? Old.people : [])];
  const Person = People.find((Other) => Other.member_id === MemberId);
  return Person ? { name: Person.name, colour: ColourOf(Person.key) } : { name: "Someone", colour: "var(--brass)" };
}

// The NoteText function writes the line for a change, or returns nothing for changes not worth a note, like moving a book
function NoteText(Change, Who, Shelf)
{
  const Book = "“" + (Change.name || "a book") + "”";
  if (Change.table === "books")
  {
    if (Change.op === "INSERT") return Who + " added " + Book + " to " + Shelf;
    if (Change.op === "DELETE") return Who + " removed " + Book + " from " + Shelf;
    if (Change.done === true && Change.was_done === false) return Who + " ticked " + Book + " done";
    return "";
  }
  if (Change.table === "sections")
  {
    if (Change.op === "DELETE") return Who + " deleted the shelf “" + Change.name + "”";
    if (Change.was_name && Change.was_name !== Change.name) return Who + " renamed “" + Change.was_name + "” to “" + Change.name + "”";
    return "";
  }
  if (Change.table === "shelf_members")
  {
    if (Change.op === "INSERT") return Who + " joined " + Shelf;
    if (Change.op === "DELETE" && Change.member === MyId()) return "You are no longer on " + Shelf;
    if (Change.op === "DELETE" && Change.member === Change.by) return Who + " left " + Shelf;
  }
  return "";
}

// The ShowNote function shows a small paper note about someone else's change for a few seconds
function ShowNote(Change, Before)
{
  const Section = Library.find((Other) => Other.id === Change.section);
  const Old = Before.get(Change.section);
  const Person = NameOf(Change.member && Change.table === "shelf_members" && Change.op === "INSERT" ? Change.member : Change.by, Section, Old);
  const ShelfName = "“" + ((Section || Old || {}).name || "a shelf") + "”";
  const Text = NoteText(Change, Person.name, ShelfName);
  if (!Text) return;
  const Note = Make("p", "live-note");
  const Face = Make("i", "face");
  Face.style.setProperty("--who", Person.colour);
  Note.append(Face, Make("span", "", Text));
  LiveNotes.append(Note);
  // Only the newest three stay, older ones make way
  while (LiveNotes.children.length > 3) LiveNotes.firstElementChild.remove();
  setTimeout(() =>
  {
    Note.classList.add("is-leaving");
    setTimeout(() => Note.remove(), 400);
  }, NOTE_TIME);
}

// Sleeping and waking:

// Out of sight for a while the page stops listening, so it does not hold a connection open for nothing, and catches up when it is looked at again
document.addEventListener("visibilitychange", () =>
{
  clearTimeout(SleepTimer);
  if (document.hidden)
  {
    SleepTimer = setTimeout(() =>
    {
      if (!Channels.size) return;
      StopListening();
      Asleep = true;
    }, SLEEP_AFTER);
    return;
  }
  if (!Asleep) return;
  Asleep = false;
  CatchUp().then(SyncLive);
});

// Coming back online catches up on anything missed
window.addEventListener("online", () =>
{
  if (Channels.size) CatchUp();
});

// Start listening once the library has loaded
LibraryReady.then(SyncLive);
