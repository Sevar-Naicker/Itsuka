// This file contains the code for choosing, shrinking, storing and drawing pictures, it is used for book pictures and library card photos and loads after auth.js

// PICTURE_BUCKET is the name of the storage area in Supabase (made by supabase-pictures.sql)
const PICTURE_BUCKET = "pictures";

// The DOTS values are the grid sizes each kind of picture is drawn at, every dot is shown 2 screen pixels wide
const BOOK_DOTS = [64, 88];             // the left page of an open book
const CARD_DOTS = [40, 40];             // the photo on a library card
const CHIP_DOTS = [12, 12];             // the tiny photo on the card button in the corner
const THUMB_DOTS = [32, 44];            // the preview on the catalogue card

// The LoadPicture function turns an address (or a chosen file's temporary address) into a loaded picture
function LoadPicture(Source)
{
  return new Promise((Resolve, Reject) =>
  {
    const LoadedImage = new Image();
    LoadedImage.onload = () => Resolve(LoadedImage);
    LoadedImage.onerror = () => Reject(new Error("That file could not be read as a picture."));
    LoadedImage.src = Source;
  });
}

// The ShrinkPicture function makes a chosen picture smaller before it is stored and returns it as a JPEG ready to upload
async function ShrinkPicture(ChosenFile, LongestSide)
{
  const Address = URL.createObjectURL(ChosenFile);
  const LoadedImage = await LoadPicture(Address);
  const Scale = Math.min(1, LongestSide / Math.max(LoadedImage.naturalWidth, LoadedImage.naturalHeight));
  const Canvas = document.createElement("canvas");
  Canvas.width = Math.max(1, Math.round(LoadedImage.naturalWidth * Scale));
  Canvas.height = Math.max(1, Math.round(LoadedImage.naturalHeight * Scale));
  const c = Canvas.getContext("2d");
  c.fillStyle = "#FFFFFF";                                 // see-through pictures get a white backing
  c.fillRect(0, 0, Canvas.width, Canvas.height);
  c.imageSmoothingQuality = "high";
  c.drawImage(LoadedImage, 0, 0, Canvas.width, Canvas.height);
  URL.revokeObjectURL(Address);
  return new Promise((Resolve, Reject) =>
  {
    Canvas.toBlob((ImageBlob) => (ImageBlob ? Resolve(ImageBlob) : Reject(new Error("That file could not be read as a picture."))), "image/jpeg", 0.85);
  });
}

// The PaintPixelated function draws a picture onto a canvas as a small grid of dots, it uses the middle of the picture so nothing is squashed
function PaintPixelated(Canvas, LoadedImage, [DotsWide, DotsHigh])
{
  Canvas.width = DotsWide;
  Canvas.height = DotsHigh;
  const Scale = Math.max(DotsWide / LoadedImage.naturalWidth, DotsHigh / LoadedImage.naturalHeight);
  let Source = LoadedImage;
  let w = DotsWide / Scale, h = DotsHigh / Scale;
  let x = (LoadedImage.naturalWidth - w) / 2, y = (LoadedImage.naturalHeight - h) / 2;

  // Shrinking a big photo in one jump looks speckled, so halve it a few times first.
  while (w > DotsWide * 2 && h > DotsHigh * 2)
  {
    const Half = document.createElement("canvas");
    Half.width = Math.ceil(w / 2);
    Half.height = Math.ceil(h / 2);
    Half.getContext("2d").drawImage(Source, x, y, w, h, 0, 0, Half.width, Half.height);
    Source = Half; x = 0; y = 0; w = Half.width; h = Half.height;
  }
  const c = Canvas.getContext("2d");
  c.imageSmoothingQuality = "high";
  c.drawImage(Source, x, y, w, h, 0, 0, DotsWide, DotsHigh);
}

// The PaintFigure function draws the grey head and shoulders shown where a member has no photo
function PaintFigure(Canvas, [DotsWide, DotsHigh])
{
  Canvas.width = DotsWide;
  Canvas.height = DotsHigh;
  const c = Canvas.getContext("2d");
  const u = DotsWide / 11;
  c.fillStyle = "#C9C2AE";
  c.fillRect(0, 0, DotsWide, DotsHigh);
  c.fillStyle = "#8A8676";
  c.fillRect(4 * u, 2 * u, 3 * u, u); c.fillRect(3 * u, 3 * u, 5 * u, 3 * u); c.fillRect(4 * u, 6 * u, 3 * u, u);     // head
  c.fillRect(2 * u, 8 * u, 7 * u, u); c.fillRect(u, 9 * u, 9 * u, 2 * u);                                              // shoulders
}

// The StorePicture function uploads a shrunken picture and returns the path that is saved with the book or the member
async function StorePicture(ImageBlob)
{
  if (!DB) return URL.createObjectURL(ImageBlob);               // login is off: keep it in this tab only, nothing is uploaded
  const Member = await CurrentMember();
  const Path = Member.id + "/" + crypto.randomUUID() + ".jpg";
  const { error } = await DB.storage.from(PICTURE_BUCKET).upload(Path, ImageBlob, {
    contentType: "image/jpeg",
    cacheControl: "31536000",                              // browsers may keep their copy for a year: a path never changes its picture
  });
  if (error) throw error;
  return Path;
}

// The PictureAddress function returns the full web address of a stored picture from its path
function PictureAddress(Path)
{
  if (!Path) return "";
  if (Path.startsWith("blob:") || Path.startsWith("data:") || !DB) return Path;
  return DB.storage.from(PICTURE_BUCKET).getPublicUrl(Path).data.publicUrl;
}

// The DiscardPicture function deletes a stored picture that is no longer used
async function DiscardPicture(Path)
{
  if (DB && Path && !Path.startsWith("blob:")) await DB.storage.from(PICTURE_BUCKET).remove([Path]);
}
