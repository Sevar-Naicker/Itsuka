// This file contains the main page's side of login, it sends anyone without a card to the landing page (welcome.html) and shows the signed-in member's card and photo

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
    const LoadedImage = await LoadPicture(PictureAddress(Path));
    PaintPixelated(MemberPhoto, LoadedImage, CARD_DOTS);
    PaintPixelated(ChipPhoto, LoadedImage, CHIP_DOTS);
  }
  catch (error)
  {
    console.error(error);                       // the photo could not be fetched: the grey figure stays
  }
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
    location.replace(ArrivedWith.includes("error_code=") ? "login.html?confirm=expired" : "welcome.html");   // replace, not href, so the Back button does not bounce them here again
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
    const Path = await StorePicture(await ShrinkPicture(ChosenFile, 400));
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
// Sign out forgets the sign-in on this device and goes to the login page
document.getElementById("signOut").addEventListener("click", async () =>
{
  await SignOut();
  location.replace("login.html");
});

// MemberReady is what library.js waits on before it loads anyone's shelves
const MemberReady = StartMemberArea();
