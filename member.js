// This file contains the library page's side of login, it sends anyone without a card to the landing page (index.html) and shows the signed-in member's card and photo

// The parts of the page this file works with
const MemberChip = document.getElementById("memberChip");
const MemberDialog = document.getElementById("memberDialog");
const MemberPhoto = document.getElementById("memberPhoto");           // the photo on the full card
const ChipPhoto = document.getElementById("chipPhoto");               // the tiny one on the button in the corner
const PhotoNote = document.getElementById("photoNote");
const PhotoPickLabel = document.getElementById("photoPickLabel");
const PhotoRemove = document.getElementById("photoRemove");

// SignedIn holds the member who is signed in, once we know
let SignedIn = null;

// The ShowMemberPhoto function draws the member's photo on the card and on the corner button, or the grey figure when they have none
async function ShowMemberPhoto()
{
  const Path = SignedIn.user_metadata && SignedIn.user_metadata.photo;
  PhotoPickLabel.textContent = Path ? "Change photo" : "Add a photo";
  PhotoRemove.hidden = !Path;
  PaintFigure(MemberPhoto, CARD_DOTS);
  PaintFigure(ChipPhoto, CHIP_DOTS);
  if (!Path) return;
  try
  {
    const LoadedImage = await LoadPicture(await PictureAddress(Path));
    PaintPixelated(MemberPhoto, LoadedImage, CARD_DOTS);
    PaintPixelated(ChipPhoto, LoadedImage, CHIP_DOTS);
  }
  catch (error)
  {
    console.error(error);                       // the photo could not be fetched: the grey figure stays
  }
}

// The TakeShelfReturn function reads and forgets the shared shelf or invite a visitor left to sign in (noted by shelf.js or join.js), it only returns it when it was noted in the last day
function TakeShelfReturn()
{
  let Note = null;
  try { Note = JSON.parse(Recall("library-return")); }
  catch (error) { Note = null; }
  if (!Note) return "";
  Remember("library-return", "");
  const Fresh = Date.now() - Number(Note.at) < 24 * 60 * 60 * 1000;
  return Fresh && /^(shelf|join)\.html\?k=[A-Za-z0-9_-]{24,64}$/.test(Note.to) ? Note.to : "";
}

// The StartMemberArea function checks who is signed in and returns the member, when nobody is signed in it sends them to the landing page
async function StartMemberArea()
{
  // login is switched off (config.js is empty): the library is open, so we show the page straight away
  if (!LoginIsSetUp)
  {
    document.body.classList.remove("checking");
    return null;
  }

  // If the sign-in cannot be read for any reason we treat it as nobody being signed in
  let Member = null;
  try
  {
    Member = await CurrentMember();
  }
  catch (error)
  {
    console.error(error);
  }

  if (!Member)
  {
    // A confirmation link that expired or was already used arrives here with an error on the address, so we tell the login page
    // Everyone else who is not signed in goes to the landing page
    location.replace(ArrivedWith.includes("error_code=") ? "login.html?confirm=expired" : "index.html");   // replace, not href, so the Back button does not bounce them here again
    return null;
  }
  // A visitor who left a shared shelf to sign in or get a card goes back to that shelf instead
  const ShelfAddress = TakeShelfReturn();
  if (ShelfAddress)
  {
    location.replace(ShelfAddress);
    return null;
  }
  SignedIn = Member;
  document.body.classList.remove("checking");   // we know who it is, so the page can be shown

  // The small card in the corner
  document.getElementById("chipName").textContent = MemberName(Member).split(" ")[0] + "\u2019s card";
  MemberChip.hidden = false;

  // The full card that opens from it
  document.getElementById("memberName").textContent = MemberName(Member);
  document.getElementById("memberEmail").textContent = Member.email;
  document.getElementById("memberSince").textContent = MemberSince(Member);
  document.getElementById("memberNumber").textContent = CardNumber(Member);
  ShowMemberPhoto();
  return Member;
}

// The SetMemberPhoto function saves a new photo path with the member's account and deletes the old photo
async function SetMemberPhoto(NewPath)
{
  const OldPath = SignedIn.user_metadata && SignedIn.user_metadata.photo;
  const { data: Data, error } = await DB.auth.updateUser({ data: { photo: NewPath } });
  if (error) throw error;
  SignedIn = Data.user;
  if (OldPath && OldPath !== NewPath) DiscardPicture(OldPath).catch(console.error);
  await ShowMemberPhoto();
}

// The ShowPhotoNote function shows a message on the member's card
function ShowPhotoNote(Message)
{
  PhotoNote.textContent = Message;
  PhotoNote.hidden = false;
}

// Choosing a photo: shrink it, store it, then save its path with the account.
document.getElementById("photoFile").addEventListener("change", async (event) =>
{
  const ChosenFile = event.target.files[0];
  event.target.value = "";                      // so choosing the same file again still counts as a change
  if (!ChosenFile) return;
  PhotoNote.hidden = true;
  PhotoPickLabel.textContent = "Saving photo\u2026";
  try
  {
    const Path = await StorePicture(await ShrinkPicture(ChosenFile, 200));
    await SetMemberPhoto(Path);
  }
  catch (error)
  {
    console.error(error);
    ShowPhotoNote(ExplainDatabase(error));
    ShowMemberPhoto();
  }
});

// Remove photo saves an empty path, which also deletes the old photo
PhotoRemove.addEventListener("click", async () =>
{
  PhotoNote.hidden = true;
  try
  {
    await SetMemberPhoto("");
  }
  catch (error)
  {
    console.error(error);
    ShowPhotoNote(ExplainDatabase(error));
  }
});

// The corner button opens the full card, the Close link or a click outside closes it
MemberChip.addEventListener("click", () => { PhotoNote.hidden = true; MemberDialog.showModal(); });
document.getElementById("memberClose").addEventListener("click", () => MemberDialog.close());
MemberDialog.addEventListener("click", (event) =>
{
  if (event.target === MemberDialog) MemberDialog.close();      // a click outside the card closes it
});
// Deleting the account:

// The parts of the delete card
const DeleteDialog = document.getElementById("deleteDialog");
const DeleteNote = document.getElementById("deleteNote");
const DeleteWord = document.getElementById("deleteWord");
const DeleteYes = document.getElementById("deleteYes");

// The ShowDeleteNote function shows a message on the delete card, Good makes it green instead of red
function ShowDeleteNote(Message, Good)
{
  DeleteNote.textContent = Message;
  DeleteNote.classList.toggle("good", Boolean(Good));
  DeleteNote.hidden = !Message;
}

// The RemoveAllPictures function deletes every file in the member's picture folder: book pictures and card photos
async function RemoveAllPictures()
{
  const Folder = SignedIn.id;
  // Pictures on a joint shelf that carries on without the member are kept (supabase-joint.sql lists them)
  const Keep = new Set();
  let Needed = { error: true };
  try { Needed = await DB.rpc("pictures_to_keep"); }
  catch (error) { console.error(error); }                    // before supabase-joint.sql there is nothing to keep
  if (!Needed.error && Array.isArray(Needed.data)) Needed.data.forEach((Path) => Keep.add(typeof Path === "string" ? Path : Object.values(Path)[0]));
  // Every file in the folder is listed a page at a time, then the ones no joint shelf needs are removed a hundred at a time
  const Paths = [];
  for (let Offset = 0; Offset < 10000; Offset += 100)               // a member has far fewer than 10000 files, this only stops a loop that never ends
  {
    const { data: Files, error } = await DB.storage.from(PICTURE_BUCKET).list(Folder, { limit: 100, offset: Offset });
    if (error) throw error;
    Files.forEach((File) => { if (!Keep.has(Folder + "/" + File.name)) Paths.push(Folder + "/" + File.name); });
    if (Files.length < 100) break;
  }
  for (let Start = 0; Start < Paths.length; Start += 100)
  {
    const { error } = await DB.storage.from(PICTURE_BUCKET).remove(Paths.slice(Start, Start + 100));
    if (error) throw error;
  }
}

// The DeleteAccount function deletes the member's pictures and then their account, the database removes their shelves and books with it
async function DeleteAccount()
{
  DeleteYes.disabled = true;
  DeleteWord.disabled = true;
  try
  {
    // First a check that deleting is set up, so no picture is removed when the account itself cannot be
    ShowDeleteNote("Checking\u2026", true);
    const Check = await DB.rpc("delete_my_account", { confirm: "check" });
    if (Check.error) throw Check.error;
    ShowDeleteNote("Deleting your pictures\u2026", true);
    await RemoveAllPictures();
    ShowDeleteNote("Deleting your account\u2026", true);
    const Result = await DB.rpc("delete_my_account", { confirm: "DELETE" });
    if (Result.error) throw Result.error;
    try { await DB.auth.signOut({ scope: "local" }); }
    catch (error) { console.error(error); }                   // the account is already gone, so forgetting it on this device is all that is left
    location.replace("index.html?deleted=1");
  }
  catch (error)
  {
    console.error(error);
    ShowDeleteNote("Your account was not deleted. " + ExplainDatabase(error));
    DeleteWord.disabled = false;
    DeleteYes.disabled = DeleteWord.value.trim().toUpperCase() !== "DELETE";
  }
}

// Delete my account on the library card opens the delete card
document.getElementById("deleteAccount").addEventListener("click", () =>
{
  MemberDialog.close();
  ShowDeleteNote("");
  DeleteWord.value = "";
  DeleteYes.disabled = true;
  DeleteDialog.showModal();
});
// The delete button only wakes up once DELETE has been typed
DeleteWord.addEventListener("input", () => { DeleteYes.disabled = DeleteWord.value.trim().toUpperCase() !== "DELETE"; });
DeleteYes.addEventListener("click", DeleteAccount);
// Download a copy saves the whole library first (DownloadLibrary is in library.js) and shows how it went on this card
document.getElementById("deleteDownload").addEventListener("click", async (event) =>
{
  ShowDeleteNote("Packing your library\u2026", true);
  await DownloadLibrary(event.currentTarget);
  ShowDeleteNote(LibraryStatus.textContent, !LibraryStatus.classList.contains("problem"));
});
// Keep my account, or a click outside the card, closes it
document.getElementById("deleteNo").addEventListener("click", () => DeleteDialog.close());
DeleteDialog.addEventListener("click", (event) => { if (event.target === DeleteDialog && !DeleteWord.disabled) DeleteDialog.close(); });

// Sign out forgets the sign-in on this device and goes to the login page
document.getElementById("signOut").addEventListener("click", async () =>
{
  await SignOut();
  location.replace("login.html");
});

// The library keeper:

// The ShowKeeperButton function shows the Ledger button on the card, only for the library keeper, the database decides who that is
async function ShowKeeperButton()
{
  try
  {
    const { data: Keeper, error } = await DB.rpc("is_keeper", {});
    document.getElementById("ledgerButton").hidden = Boolean(error) || Keeper !== true;
  }
  catch (error)
  {
    console.error(error);                    // without supabase-ledger.sql there is simply no Ledger button
  }
}

// MemberReady is what library.js waits on before it loads anyone's shelves
const MemberReady = StartMemberArea();
MemberReady.then((Member) => { if (Member && DB) ShowKeeperButton(); });
