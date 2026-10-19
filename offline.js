// This file contains opening the library with no signal: a copy of the shelves is kept on this device after every change, and when the library cannot be reached the copy is shown under a hanging sign until the signal comes back
// It loads after library.js and live.js and uses their functions, sw.js keeps a copy of the site's own files so the page itself can open with no signal

// Section: The copy on this device

// COPY_KEY is where the copy is kept, auth.js removes it when the member signs out
const COPY_KEY = "library-copy";
// RETRY_TIME is how often the library tries to reach the internet again while there is no signal
const RETRY_TIME = 30 * 1000;

// NoSignal holds whether the shelves on the page are the copy, CopyAt when the copy was saved, CopyTimer, RetryTimer and TipTimer the waits before saving, trying again and hiding a tip
let NoSignal = false;
let CopyAt = 0;
let CopyTimer = 0;
let RetryTimer = 0;
let TipTimer = 0;

// The parts of the page this file works with
const SignalSign = document.getElementById("signalSign");
const SignalWords = document.getElementById("signalWords");

// The SaveCopy function saves a copy of the shelves on this device a moment after they change, while there is a signal
function SaveCopy()
{
  if (!SignedIn || NoSignal) return;
  clearTimeout(CopyTimer);
  CopyTimer = setTimeout(() =>
  {
    CopyAt = Date.now();
    Remember(COPY_KEY, JSON.stringify({ member: MyId(), at: CopyAt, joint: JointIsSetUp, library: Library }));
  }, 500);
}

// The ReadCopy function reads the copy saved on this device, only when it belongs to the member signed in
function ReadCopy()
{
  try
  {
    const Copy = JSON.parse(Recall(COPY_KEY));
    return Copy && Copy.member === MyId() && Array.isArray(Copy.library) ? Copy : null;
  }
  catch (error)
  {
    return null;
  }
}

// The LostSignal function checks whether an error means the internet could not be reached, rather than something else going wrong
function LostSignal(error)
{
  return !navigator.onLine || /failed to fetch|networkerror|network request failed|load failed/i.test(String((error && error.message) || error));
}

// The OpenCopy function is called by library.js when the shelves could not be fetched, with no signal it opens the copy and returns true
function OpenCopy(error)
{
  if (!LostSignal(error)) return false;
  const Copy = ReadCopy();
  if (!Copy) return false;
  Library = Copy.library;
  JointIsSetUp = Copy.joint !== false;
  CopyAt = Copy.at;
  ShowNoSignal();
  return true;
}

// Section: The sign

// The WhenWords function says when the copy was saved: a time today, or a date and time before that
function WhenWords(When)
{
  const Then = new Date(When);
  const Time = Then.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  if (Then.toDateString() === new Date().toDateString()) return "at " + Time;
  return "on " + Then.toLocaleDateString("en-GB", { day: "numeric", month: "long" }) + " at " + Time;
}

// The ShowNoSignal function hangs the sign, the shelves can then be read but not changed until the signal comes back
function ShowNoSignal()
{
  NoSignal = true;
  document.body.classList.add("no-signal");
  SignalWords.textContent = "These are your shelves as they were " + WhenWords(CopyAt || Date.now()) + ". Adding and changing books comes back with the signal.";
  SignalSign.classList.remove("is-going");
  SignalSign.hidden = false;
  clearTimeout(RetryTimer);
  RetryTimer = setTimeout(TryAgain, RETRY_TIME);
}

// The TryAgain function tries to fetch the shelves again, when it works the sign comes down and a note says the shelves are up to date
async function TryAgain()
{
  clearTimeout(RetryTimer);
  if (!NoSignal) return;
  if (!navigator.onLine)
  {
    RetryTimer = setTimeout(TryAgain, RETRY_TIME);
    return;
  }
  try
  {
    await DB.auth.getSession();                    // renews the sign-in first if it ran out while there was no signal
    await LoadLibrary();
  }
  catch (error)
  {
    console.error(error);
    RetryTimer = setTimeout(TryAgain, RETRY_TIME);
    return;
  }
  NoSignal = false;
  document.body.classList.remove("no-signal");
  SignalSign.classList.add("is-going");
  setTimeout(() => { SignalSign.hidden = true; SignalSign.classList.remove("is-going"); }, 400);
  RenderTabs();
  Update();
  PinNote(["Back online. Your shelves are up to date."]).classList.add("is-back");
  SyncLive();                                      // live.js starts listening to joint shelves again
  if (typeof FetchLetters === "function") FetchLetters();
}

// The ShowSignalTip function shows a small note beside a button that needs a signal
function ShowSignalTip(Near, Words)
{
  document.querySelectorAll(".signal-tip").forEach((Tip) => Tip.remove());
  const Tip = Make("p", "signal-tip", Words);
  document.body.append(Tip);
  const Box = Near.getBoundingClientRect();
  Tip.style.left = Math.min(Math.max(8, Box.left), innerWidth - Tip.offsetWidth - 8) + "px";
  Tip.style.top = (Box.top > Tip.offsetHeight + 16 ? Box.top - Tip.offsetHeight - 8 : Box.bottom + 8) + "px";
  clearTimeout(TipTimer);
  TipTimer = setTimeout(() => Tip.remove(), 2800);
}

// Section: Changes need a signal

// With no signal, anything that changes the shelves says it needs a signal instead, reading, Find and Pull a book still work
document.addEventListener("click", (event) =>
{
  if (!NoSignal) return;
  const Blocked = event.target.closest("#addBook, .edit-book, #editSections, .done-box");
  if (!Blocked) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  ShowSignalTip(Blocked, "This needs a signal. Your shelves can still be read, changes come back when you are connected.");
}, true);

// Losing the signal while the library is open hangs the sign too, with the shelves as they were last fetched
window.addEventListener("offline", () =>
{
  if (!SignedIn || NoSignal) return;
  clearTimeout(CopyTimer);
  CopyAt = (ReadCopy() || {}).at || Date.now();
  ShowNoSignal();
});

// The signal coming back takes the sign down once the shelves have been fetched again
window.addEventListener("online", () =>
{
  if (NoSignal) setTimeout(TryAgain, 1000);       // a moment for the connection to settle
});

// Section: The site's own files

// sw.js keeps a copy of the site's pages, styles and scripts, so the library can open with no signal at all
if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(console.error);
