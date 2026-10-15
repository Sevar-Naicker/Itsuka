// This file contains the Add to home screen buttons on the landing page and in the library's settings: a real install where the browser allows it (Chrome, Edge and Samsung Internet), and the steps everywhere else, like on iPhone

// InstallAsk holds the browser's offer to install Itsuka, it only arrives on browsers that can install a site with one tap
let InstallAsk = null;

// The parts of the page this file works with
const InstallButtons = document.querySelectorAll(".install-button");
const InstallDialog = document.getElementById("installDialog");
const InstallSteps = document.getElementById("installSteps");

// INSTALL_STEPS holds the steps for each kind of phone, shown on the Add to home screen card when the browser cannot install Itsuka itself
const INSTALL_STEPS = {
  "iphone-safari": [
    ["1", "Tap Share, the square with an arrow, in Safari's bar. If you cannot see it, tap ⋯ first."],
    ["2", "Scroll down a little and tap Add to Home Screen."],
    ["3", "Tap Add. Itsuka is now on your home screen."],
  ],
  "iphone-other": [
    ["1", "This page is open inside another app or browser. Open itsuka.co.za in Safari instead."],
    ["2", "In Safari, tap Share, then Add to Home Screen."],
    ["3", "Tap Add. Itsuka is now on your home screen."],
  ],
  "samsung": [
    ["1", "Tap the menu ≡ at the bottom of Samsung Internet."],
    ["2", "Tap Add page to, then Home screen."],
    ["3", "Tap Add. Itsuka is now on your home screen."],
  ],
  "android": [
    ["1", "Tap the menu ⋮ at the top of your browser."],
    ["2", "Tap Add to home screen, or Install app."],
    ["3", "Tap Install. Itsuka is now on your home screen."],
  ],
};

// Small helpers:

// The OnHomeScreen function checks whether Itsuka was opened from the home screen, or as an installed app on a laptop
function OnHomeScreen()
{
  return matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
}

// The PhoneKind function works out which steps fit this phone: Safari on iPhone, another app or browser on iPhone, Samsung Internet or another Android browser, and nothing on a laptop
function PhoneKind()
{
  const Agent = navigator.userAgent;
  const Apple = /iPhone|iPad|iPod/.test(Agent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (Apple) return /CriOS|FxiOS|EdgiOS|OPiOS|Instagram|FBAN|FBAV|Pinterest/.test(Agent) ? "iphone-other" : "iphone-safari";
  if (/Android/.test(Agent)) return /SamsungBrowser/.test(Agent) ? "samsung" : "android";
  return "";
}

// The ShowInstallButtons function shows the buttons wherever adding Itsuka is possible and it is not on the home screen already
// A button that installs straight away says so, one that opens the steps says Show me how
function ShowInstallButtons()
{
  const Show = !OnHomeScreen() && (Boolean(InstallAsk) || PhoneKind() !== "");
  InstallButtons.forEach((Button) =>
  {
    Button.hidden = !Show;
    Button.textContent = InstallAsk ? Button.dataset.install : Button.dataset.steps;
  });
}

// Adding Itsuka:

// The AddToHomeScreen function asks the browser to install Itsuka when it can, otherwise it opens the card with the steps for this phone
async function AddToHomeScreen()
{
  if (InstallAsk)
  {
    const Ask = InstallAsk;
    InstallAsk = null;                       // the browser's offer can only be used once
    Ask.prompt();
    try { await Ask.userChoice; }
    catch (error) { console.error(error); }
    ShowInstallButtons();
    return;
  }
  InstallSteps.replaceChildren();
  (INSTALL_STEPS[PhoneKind()] || INSTALL_STEPS.android).forEach(([Step, Text]) =>
  {
    const Line = document.createElement("div");
    const Count = document.createElement("span");
    const Words = document.createElement("b");
    Line.className = "card-line";
    Count.textContent = Step;
    Words.textContent = Text;
    Line.append(Count, Words);
    InstallSteps.append(Line);
  });
  document.querySelectorAll("dialog.card-dialog[open]").forEach((Card) => Card.close());     // a card already open, like How it works, makes way
  InstallDialog.showModal();
}

InstallButtons.forEach((Button) => Button.addEventListener("click", AddToHomeScreen));
document.getElementById("installDone").addEventListener("click", () => InstallDialog.close());
InstallDialog.addEventListener("click", (event) => { if (event.target === InstallDialog) InstallDialog.close(); });

// Browsers that can install a site send their offer once the page has loaded, it is kept for the button instead of showing the browser's own banner
window.addEventListener("beforeinstallprompt", (event) =>
{
  event.preventDefault();
  InstallAsk = event;
  ShowInstallButtons();
});

// Once installed the buttons go away
window.addEventListener("appinstalled", () =>
{
  InstallAsk = null;
  ShowInstallButtons();
});

ShowInstallButtons();
