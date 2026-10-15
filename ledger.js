// This file contains the code for the Ledger page (ledger.html), only the library keeper can open it: how full the free plan is, how many members use Itsuka and how it is growing, all as totals

// LIMITS holds the free plan's limits the Ledger can measure: Supabase's pictures, database and members, and Resend's emails
const LIMITS = { pictures: 1024 * 1024 * 1024, database: 500 * 1024 * 1024, members: 50000, emailsDay: 100, emailsMonth: 3000 };

// VERSION_CHECKED is the day the pinned Supabase library was last checked for a newer version, change it after each check so the reminder moves on three months
const VERSION_CHECKED = "2026-10-15";

// The parts of the page this file fills in
const LedgerMain = document.getElementById("ledger");
const LedgerMessage = document.getElementById("ledgerMessage");
const LedgerUpdated = document.getElementById("ledgerUpdated");

// Small helpers:

// The Element function makes an element with a class and some text
function Element(Tag, ClassName, Text)
{
  const Made = document.createElement(Tag);
  if (ClassName) Made.className = ClassName;
  if (Text !== undefined) Made.textContent = Text;
  return Made;
}

// The Size function writes a number of bytes the way a person would say it
function Size(Bytes)
{
  if (Bytes >= 1024 * 1024 * 1024) return (Bytes / 1024 / 1024 / 1024).toFixed(2) + " GB";
  if (Bytes >= 1024 * 1024) return Math.round(Bytes / 1024 / 1024) + " MB";
  return Math.round(Bytes / 1024) + " KB";
}

// The Whole function writes a whole number with spaces between the thousands
function Whole(Value)
{
  return Math.round(Value).toLocaleString("en-ZA");
}

// The Share function writes one number as a percentage of another
function Share(Part, Total)
{
  return Total > 0 ? Math.round((Part / Total) * 100) + "%" : "0%";
}

// The DayName function writes a date from the database as a short day, like Wed 15 Oct
function DayName(Day)
{
  return new Date(Day + "T12:00:00").toLocaleDateString("en-ZA", { weekday: "short", day: "numeric", month: "short" });
}

// The ShowMessage function shows a message in place of the Ledger
function ShowMessage(Title, Text)
{
  document.getElementById("ledgerMessageTitle").textContent = Title;
  document.getElementById("ledgerMessageText").textContent = Text;
  LedgerMessage.hidden = false;
  LedgerMain.hidden = true;
}

// Drawing:

// The DrawGauge function fills a gauge: its name, how much is used out of how much, and 25 brass blocks, amber from 70% and red from 90%
function DrawGauge(Holder, Name, Used, Limit, Words)
{
  const Part = Used / Limit;
  Holder.replaceChildren();
  Holder.classList.toggle("is-amber", Part >= 0.7 && Part < 0.9);
  Holder.classList.toggle("is-red", Part >= 0.9);
  const Top = Element("div", "gauge-top");
  Top.append(Element("b", "", Name), Element("span", "", Words + " · " + Share(Used, Limit)));
  const Slot = Element("div", "gauge-slot");
  Slot.setAttribute("aria-hidden", "true");
  const Lit = Math.max(Used > 0 ? 1 : 0, Math.round(Math.min(1, Part) * 25));
  for (let i = 0; i < 25; i++) Slot.append(Element("i", i < Lit ? "on" : ""));
  Holder.append(Top, Slot);
}

// The DrawChart function draws bars or a stepped line in pixels, and reads out the value under the pointer (or finger) below it
function DrawChart(Canvas, Values, Kind, Read, Label)
{
  const Pen = Canvas.getContext("2d");
  const Width = Canvas.width;
  const Height = Canvas.height;
  const Top = Math.max(1, ...Values);
  Pen.clearRect(0, 0, Width, Height);
  // Faint guide lines at a quarter, half and three quarters
  Pen.fillStyle = "#DCCFAE";
  [0.25, 0.5, 0.75].forEach((Part) => Pen.fillRect(0, Math.round(Height - 2 - Part * (Height - 6)), Width, 1));
  const Each = Width / Values.length;
  Values.forEach((Value, i) =>
  {
    const Tall = Value > 0 ? Math.max(1, Math.round((Value / Top) * (Height - 6))) : 0;
    const Left = Math.floor(i * Each);
    if (Kind === "bars")
    {
      Pen.fillStyle = "#B8902F";
      Pen.fillRect(Left + 1, Height - 2 - Tall, Math.max(1, Math.floor(Each) - 2), Tall);
      Pen.fillStyle = "#E3C06A";
      if (Tall) Pen.fillRect(Left + 1, Height - 2 - Tall, Math.max(1, Math.floor(Each) - 2), 1);
    }
    else
    {
      Pen.fillStyle = "#E9D9AC";
      Pen.fillRect(Left, Height - 2 - Tall, Math.ceil(Each), Tall);
      Pen.fillStyle = "#8C2F39";
      Pen.fillRect(Left, Height - 4 - Tall, Math.ceil(Each), 2);
    }
  });
  Pen.fillStyle = "#2A1A10";
  Pen.fillRect(0, Height - 2, Width, 2);
  const Last = Values.length - 1;
  Read.textContent = Label(Last, Values[Last]);
  Canvas.onpointermove = (event) =>
  {
    const Box = Canvas.getBoundingClientRect();
    const Index = Math.min(Last, Math.max(0, Math.floor(((event.clientX - Box.left) / Box.width) * Values.length)));
    Read.textContent = Label(Index, Values[Index]);
  };
  Canvas.onpointerleave = () => { Read.textContent = Label(Last, Values[Last]); };
}

// The UpkeepLine function fills one upkeep line with a tick, a warning or an hourglass, a sentence and a smaller second line
function UpkeepLine(Holder, State, Mark, Text, Small)
{
  Holder.className = "upkeep-line is-" + State;
  const Words = Element("div");
  Words.append(Element("b", "", Text), Element("small", "", Small));
  Holder.replaceChildren(Element("i", "", Mark), Words);
}

// Filling in:

// The ShowRoom function fills the Room left card: the gauges, the average picture size and when the pictures will fill up at this rate
function ShowRoom(L)
{
  DrawGauge(document.getElementById("gaugePictures"), "Pictures", L.picture_bytes, LIMITS.pictures, Size(L.picture_bytes) + " of 1 GB");
  const Average = L.pictures ? L.picture_bytes / L.pictures : 0;
  const Recent = L.recent_pictures ? L.recent_picture_bytes / L.recent_pictures : 0;
  document.getElementById("pictureAverage").textContent = L.pictures
    ? Whole(L.pictures) + " pictures, " + Size(Average) + " each on average" + (L.recent_pictures ? ", " + Size(Recent) + " for the ones added in the last 4 weeks." : ".")
    : "No pictures yet.";
  DrawGauge(document.getElementById("gaugeDatabase"), "Database", L.database_bytes, LIMITS.database, Size(L.database_bytes) + " of 500 MB");
  DrawGauge(document.getElementById("gaugeMembers"), "Members", L.members, LIMITS.members, Whole(L.members) + " of 50 000");

  // The forecast uses the pictures added in the last 4 weeks
  const PerWeek = L.recent_picture_bytes / 4;
  const Left = Math.max(0, LIMITS.pictures - L.picture_bytes);
  let Forecast = "No pictures were added in the last 4 weeks, so the 1 GB is not filling up at the moment.";
  if (PerWeek > 0)
  {
    const Weeks = Left / PerWeek;
    Forecast = "At the last 4 weeks' rate, about " + Size(PerWeek) + " of pictures are added a week, so the 1 GB fills in about "
      + (Weeks < 1 ? "a week. Time to upgrade or tidy up." : Weeks > 8 ? Whole(Weeks / 4.35) + " months." : Whole(Weeks) + " weeks.");
    if (Weeks > 120) Forecast = "At the last 4 weeks' rate, about " + Size(PerWeek) + " of pictures are added a week, so the 1 GB will last well over two years.";
  }
  document.getElementById("forecast").textContent = Forecast;
}

// The ShowMembers function fills the Members card: active today, this week and this month, and the chart of members each day
function ShowMembers(L)
{
  document.getElementById("memberTotal").textContent = Whole(L.members) + (L.members === 1 ? " member" : " members");
  const Tiles = document.getElementById("activeTiles");
  Tiles.replaceChildren();
  [["Today", L.active_today], ["This week", L.active_week], ["This month", L.active_month]].forEach(([Name, Count]) =>
  {
    const Tile = Element("div", "ledger-tile");
    Tile.append(Element("small", "", Name), Element("b", "", Whole(Count)), Element("span", "", Share(Count, L.members) + " of members"));
    Tiles.append(Tile);
  });
  const Days = L.daily_active || [];
  const Values = Days.map((Day) => Day.members);
  DrawChart(document.getElementById("chartActive"), Values.length ? Values : [0], "line", document.getElementById("readActive"),
    (i, Value) => (Days[i] ? (i === Days.length - 1 ? "Today" : DayName(Days[i].day)) : "Today") + ": " + Whole(Value) + " members (" + Share(Value, L.members) + ")");
}

// The ShowGrowth function fills the Growth card: new members and books added each week for the last 12 weeks
function ShowGrowth(L)
{
  const Weeks = L.week_starts || [];
  const WeekName = (i) => i === Weeks.length - 1 ? "This week" : i === Weeks.length - 2 ? "Last week" : "Week of " + new Date(Weeks[i] + "T12:00:00").toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
  const Members = L.new_members_weeks || [0];
  const Books = L.books_weeks || [0];
  document.getElementById("newWeek").textContent = Whole(Members[Members.length - 1]) + " this week · " + Whole(L.new_this_month) + " this month";
  document.getElementById("booksWeek").textContent = Whole(Books[Books.length - 1]) + " this week";
  DrawChart(document.getElementById("chartMembers"), Members, "bars", document.getElementById("readMembers"), (i, Value) => WeekName(i) + ": " + Whole(Value) + " new members");
  DrawChart(document.getElementById("chartBooks"), Books, "bars", document.getElementById("readBooks"), (i, Value) => WeekName(i) + ": " + Whole(Value) + " books added");
}

// The ShowUpkeep function fills the Upkeep card: whether the keep-awake job came in, the emails gauges and when the Supabase version check is due
function ShowUpkeep(L)
{
  const Awake = document.getElementById("upkeepAwake");
  if (!L.last_snapshot)
  {
    UpkeepLine(Awake, "soon", "⌛", "No daily visit saved yet", "It starts with the next keep-awake run, or press Run workflow on the Actions tab on GitHub.");
  }
  else
  {
    const Hours = (Date.now() - new Date(L.last_snapshot).getTime()) / 3600000;
    const At = new Date(L.last_snapshot).toLocaleString("en-ZA", { weekday: "short", hour: "2-digit", minute: "2-digit" });
    if (Hours < 30) UpkeepLine(Awake, "good", "✓", "Daily visit came in " + At, "The keep-awake job is running, so Supabase will not pause the project.");
    else UpkeepLine(Awake, "bad", "!", "No daily visit for " + Math.floor(Hours / 24) + " days", "Check the Actions tab on GitHub. After 7 quiet days Supabase pauses the project.");
  }
  DrawGauge(document.getElementById("gaugeEmailsDay"), "Emails today", L.emails_day, LIMITS.emailsDay, "About " + Whole(L.emails_day) + " of 100");
  DrawGauge(document.getElementById("gaugeEmailsMonth"), "Emails this month", L.emails_month, LIMITS.emailsMonth, "About " + Whole(L.emails_month) + " of 3 000");

  // The pinned version is read from this page's own Supabase script tag
  const Script = document.querySelector('script[src*="supabase-js@"]');
  const Version = Script ? Script.src.split("@").pop() : "";
  const Due = new Date(VERSION_CHECKED + "T12:00:00");
  Due.setMonth(Due.getMonth() + 3);
  const DaysLeft = Math.ceil((Due - Date.now()) / 86400000);
  const DueText = Due.toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" });
  UpkeepLine(document.getElementById("upkeepVersion"), DaysLeft < 0 ? "bad" : DaysLeft <= 14 ? "soon" : "good", DaysLeft < 0 ? "!" : DaysLeft <= 14 ? "⌛" : "✓",
    "Supabase library " + Version + " · check " + (DaysLeft < 0 ? "was due " : "due ") + DueText,
    "Every three months, see if a newer version is out and test it before updating, then change VERSION_CHECKED in ledger.js.");
}

// The ShowTotals function fills the On the shelves card with totals across everyone
function ShowTotals(L)
{
  const Totals = document.getElementById("totals");
  Totals.replaceChildren();
  [["Shelves", L.shelves], ["Books", L.books], ["Pictures", L.pictures], ["Joint shelves", L.joint_shelves], ["Share links", L.share_links], ["Done books", L.done_books]].forEach(([Name, Count]) =>
  {
    const Total = Element("div");
    Total.append(Element("small", "", Name), Element("b", "", Whole(Count)));
    Totals.append(Total);
  });
}

// Start:

// The StartLedger function checks who is visiting, asks the database for the numbers and fills in every card
async function StartLedger()
{
  if (!DB)
  {
    ShowMessage("The Ledger could not be opened", LoginIsSetUp ? "Could not load the library service. Check your internet connection and reload this page." : "Login is not connected, so there is nothing to count.");
    return;
  }
  let Member = null;
  try { Member = await CurrentMember(); }
  catch (error) { console.error(error); }
  if (!Member)
  {
    ShowMessage("Sign in first", "The Ledger is for the library keeper. Sign in on the library page, then come back here.");
    return;
  }
  const { data: L, error } = await DB.rpc("ledger", {});
  if (error)
  {
    console.error(error);
    const Keeper = /library keeper/i.test(error.message || "");
    if (Keeper) ShowMessage("This page is only for the library keeper", "Your shelves are waiting on the library page.");
    else ShowMessage("The Ledger could not be opened", /ledger|function|schema cache/i.test(error.message || "") ? "Run supabase-ledger.sql in the SQL Editor, then reload this page." : ExplainDatabase(error));
    return;
  }
  LedgerMain.hidden = false;
  ShowRoom(L);
  ShowMembers(L);
  ShowGrowth(L);
  ShowUpkeep(L);
  ShowTotals(L);
  const Counted = new Date(L.counted_at).toLocaleString("en-ZA", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  LedgerUpdated.textContent = "Counted " + Counted + (L.history_since ? " · daily snapshots since " + DayName(L.history_since) : "") + " · visits are counted from the day the Ledger was added";
}
StartLedger();
