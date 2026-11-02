// This file contains the code for the page shown when an address cannot be found (404.html): the librarian's desk, drawn in the same dots as the backgrounds and in the colours of the visitor's chosen one, with the 404 on the desk and the message on a brass plate on its front
// It loads after backgrounds.js and daylight.js, and uses their drawing helpers (Rect, Disc, Hash, Sprite, Bookcase, CatShape, HourNow and the rest)

// DIGITS holds the 4 and the 0 as rows of dots, a hash is a dot
const DIGITS = {
  4: ["...#.", "..##.", ".#.#.", "#..#.", "#####", "...#.", "...#."],
  0: [".###.", "#...#", "#..##", "#.#.#", "##..#", "#...#", ".###."],
};


// Section: Small drawing helpers

// The Mix function blends two colours like "#13203A" by a share, for lighter and darker edges
function Mix(From, To, Share)
{
  const Part = (Colour, At) => parseInt(Colour.slice(At, At + 2), 16);
  let Answer = "#";
  for (let At = 1; At < 7; At += 2) Answer += Math.round(Part(From, At) + (Part(To, At) - Part(From, At)) * Share).toString(16).padStart(2, "0");
  return Answer;
}

// The Write404 function writes 404 in dots, Size dots to each dot of the letters, Skip leaves out a dot now and then (for chalk)
function Write404(c, X, Y, Size, Colour, Skip)
{
  ["4", "0", "4"].forEach((Digit, d) =>
  {
    DIGITS[Digit].forEach((Row, r) =>
    {
      for (let k = 0; k < 5; k++)
      {
        if (Row[k] !== "#") continue;
        if (Skip && Hash(d * 9 + k, r) < Skip) continue;
        Rect(c, X + (d * 6 + k) * Size, Y + r * Size, Size, Size, Colour);
      }
    });
  });
}

// The Hand function draws one hand of the clock as a line of dots from the middle
function Hand(c, X, Y, Angle, Long, Colour)
{
  for (let n = 1; n <= Long; n++) Rect(c, Math.round(X + Math.sin(Angle) * n), Math.round(Y - Math.cos(Angle) * n), 1, 1, Colour);
}


// Section: The things that can show the 404

// TINY holds a small letter set, three dots across and five down, for the words NOT FOUND on the computer and the chalkboard
const TINY = {
  D: "##.|#.#|#.#|#.#|##.", F: "###|#..|##.|#..|#..", N: "##.|#.#|#.#|#.#|#.#", O: "###|#.#|#.#|#.#|###", T: "###|.#.|.#.|.#.|.#.",
  U: "#.#|#.#|#.#|#.#|###", "?": "##.|..#|.#.|...|.#.", " ": "...|...|...|...|...",
};

// The Tiny function writes a few words in the small letters, centred on X when Centre is set, and gives back how wide they were
function Tiny(c, Text, X, Y, Colour, Centre)
{
  const Wide = Text.length * 4 - 1;
  const Left = Centre ? Math.round(X - Wide / 2) : X;
  [...Text].forEach((Letter, i) =>
  {
    (TINY[Letter] || TINY[" "]).split("|").forEach((Row, r) => { for (let k = 0; k < 3; k++) if (Row[k] === "#") Rect(c, Left + i * 4 + k, Y + r, 1, 1, Colour); });
  });
  return Wide;
}

// Each of the three things below draws one way of showing the 404 in the middle of the desk, centred on Cx and standing on the desk top at DeskY

// The OpenBook function draws a book lying open on the desk beside the 404, its pages curling up at the spine, lines of writing, a ribbon and a pen
function OpenBook(c, X, DeskY, Cover)
{
  const Y = DeskY - 4;
  Rect(c, X - 1, Y + 2, 22, 2, Cover); Rect(c, X - 1, Y + 3, 22, 1, Mix(Cover, "#000000", 0.3));
  Rect(c, X, Y + 1, 9, 2, "#F2EAD6"); Rect(c, X + 1, Y, 8, 1, "#F2EAD6"); Rect(c, X, Y + 2, 9, 1, "#E6DCC4");
  Rect(c, X + 11, Y + 1, 9, 2, "#F2EAD6"); Rect(c, X + 11, Y, 8, 1, "#F2EAD6"); Rect(c, X + 11, Y + 2, 9, 1, "#E6DCC4");
  Rect(c, X + 9, Y + 1, 2, 2, "#D8CDB2"); Rect(c, X + 9, Y - 1, 1, 2, "#FFF8E6"); Rect(c, X + 10, Y - 1, 1, 2, "#E6DCC4");
  Rect(c, X + 2, Y + 1, 5, 1, "rgba(90,70,40,0.35)"); Rect(c, X + 13, Y + 1, 4, 1, "rgba(90,70,40,0.35)");
  Rect(c, X + 10, Y + 3, 1, 3, "#B5483C");
  Rect(c, X + 22, Y + 3, 6, 1, "#2A2A33"); Rect(c, X + 27, Y + 3, 1, 1, Mix(Current.theme.plaque, "#FFFFFF", 0.3));
}

// The Ledger function draws the big loans ledger lying open on a low book rest, a few lines of writing, 404 stamped across them in red in a worn frame, with the ink pad and the rubber stamp beside it
function Ledger(c, Cx, DeskY)
{
  const Lw = 64, Lh = 26, X = Cx - 32, Y = DeskY - Lh - 2;
  // The book rest, a low dark wedge under the book
  Rect(c, X + 4, DeskY - 2, Lw - 8, 2, "#3A2416"); Rect(c, X + 4, DeskY - 2, Lw - 8, 1, "#5A3A22");
  // The cover, a little wider than the pages, and the edges of the pages under them
  Rect(c, X - 2, Y + 1, Lw + 4, Lh - 1, "#6A2626"); Rect(c, X - 2, Y + 1, 1, Lh - 1, "#8A3A34"); Rect(c, X + Lw + 1, Y + 1, 1, Lh - 1, "#4A1A1A");
  Rect(c, X - 1, Y + Lh - 2, Lw + 2, 1, "#C8B48C"); Rect(c, X - 1, Y + Lh - 1, Lw + 2, 1, "#A8926A");
  // The two pages, shaded into the spine
  Rect(c, X, Y, 31, Lh - 2, "#F4ECD8"); Rect(c, X + 33, Y, 31, Lh - 2, "#F4ECD8");
  Rect(c, X + 28, Y, 3, Lh - 2, "#E6D8B8"); Rect(c, X + 33, Y, 3, Lh - 2, "#E6D8B8");
  Rect(c, X + 31, Y + 1, 2, Lh - 3, "#B8A27E");
  Rect(c, X, Y, 1, 1, "#6A2626"); Rect(c, X + Lw - 1, Y, 1, 1, "#6A2626");
  // A few lines of handwriting showing either side of the stamp
  for (let r = 0; r < 6; r++) { Rect(c, X + 2, Y + 3 + r * 4, 3 + Math.floor(Hash(r, 7) * 5), 1, "#5A4A40"); Rect(c, X + Lw - 9, Y + 3 + r * 4, 3 + Math.floor(Hash(r, 8) * 5), 1, "#5A4A40"); }
  // The ribbon peeking out of the top of the spine
  Rect(c, Cx - 1, Y - 3, 1, 4, "#B5483C"); Rect(c, Cx, Y - 2, 1, 1, "#8C2F39");
  // The stamp across both pages: a red frame round the 404, worn thin in a few places
  const Ink = "#A8343A", Paper = "#F4ECD8", Sx = Cx - 21, Sy = Y + 2;
  Rect(c, Sx, Sy, 42, 20, Ink); Rect(c, Sx + 2, Sy + 2, 38, 16, Paper);
  Rect(c, Sx + 8, Sy, 4, 1, Paper); Rect(c, Sx + 29, Sy + 19, 5, 1, Paper); Rect(c, Sx + 41, Sy + 5, 1, 4, Paper); Rect(c, Sx, Sy + 12, 1, 3, Paper);
  Write404(c, Sx + 4, Sy + 3, 2, Ink, 0.04);
  // The ink pad in its tin, and the rubber stamp standing beside it with its round wooden handle
  Rect(c, Cx + 35, DeskY - 3, 10, 3, "#4A4A55"); Rect(c, Cx + 35, DeskY - 3, 10, 1, "#6A6A78"); Rect(c, Cx + 36, DeskY - 3, 8, 1, "#8C2F39");
  Rect(c, Cx + 47, DeskY - 2, 7, 2, "#3A2A20"); Rect(c, Cx + 47, DeskY - 1, 7, 1, "#8C2F39");
  Rect(c, Cx + 48, DeskY - 4, 5, 2, "#7A5230"); Rect(c, Cx + 50, DeskY - 6, 1, 2, "#6B4428");
  Rect(c, Cx + 48, DeskY - 9, 5, 3, "#9A6A40"); Rect(c, Cx + 49, DeskY - 10, 3, 1, "#9A6A40"); Rect(c, Cx + 49, DeskY - 9, 2, 1, "#C49A6A");
}

// The Computer function draws the library's old computer: a cream monitor with a curved green screen saying 404 and NOT FOUND with a blinking cursor, a floppy slot and power light, the keyboard and the mouse in front
function Computer(c, Cx, DeskY, Tick)
{
  const Mw = 48, Mh = 32, X = Cx - 24, My = DeskY - Mh - 5;
  Disc(c, Cx, My + 13, 30, "rgba(110,230,140,0.07)");
  // The monitor's case, lit from the lamp's side
  Rect(c, X + 2, My + 2, Mw, Mh, "rgba(0,0,0,0.35)");
  Rect(c, X, My, Mw, Mh, "#D6CDB4"); Rect(c, X, My, Mw, 1, "#EEE7D4"); Rect(c, X, My, 1, Mh, "#EEE7D4"); Rect(c, X + Mw - 1, My, 1, Mh, "#A69C84"); Rect(c, X, My + Mh - 1, Mw, 1, "#A69C84");
  Rect(c, X, My, 1, 1, "#2A1C14"); Rect(c, X + Mw - 1, My, 1, 1, "#2A1C14");
  // The screen set into the case, its corners rounded, its lines and a little shine
  const Sx = X + 3, Sy = My + 3, Sw = Mw - 6, Sh = 23;
  Rect(c, Sx - 1, Sy - 1, Sw + 2, Sh + 2, "#B8AE96");
  Rect(c, Sx, Sy, Sw, Sh, "#0B1F14");
  Rect(c, Sx, Sy, 1, 1, "#B8AE96"); Rect(c, Sx + Sw - 1, Sy, 1, 1, "#B8AE96"); Rect(c, Sx, Sy + Sh - 1, 1, 1, "#B8AE96"); Rect(c, Sx + Sw - 1, Sy + Sh - 1, 1, 1, "#B8AE96");
  Write404(c, Sx + 4, Sy + 2, 2, "#6BE38A", 0);
  Tiny(c, "NOT FOUND", Sx + 4, Sy + 17, "#4FBF6E");
  if (Tick % 8 < 4) Rect(c, Sx + 4 + 37, Sy + 21, 3, 1, "#6BE38A");                                         // the cursor blinking
  for (let r = 1; r < Sh; r += 2) Rect(c, Sx, Sy + r, Sw, 1, "rgba(0,0,0,0.22)");                              // the screen's lines
  Rect(c, Sx + 2, Sy + 1, 4, 1, "rgba(255,255,255,0.14)"); Rect(c, Sx + 1, Sy + 2, 1, 3, "rgba(255,255,255,0.14)");
  // Under the screen: the floppy slot, a row of vents and the power light
  Rect(c, X + 5, My + Mh - 4, 10, 1, "#3A3A30"); Rect(c, X + 5, My + Mh - 3, 10, 1, "#E6DECA");
  for (let k = 0; k < 4; k++) Rect(c, X + 22 + k * 3, My + Mh - 4, 2, 1, "#A69C84");
  Rect(c, X + Mw - 7, My + Mh - 4, 2, 2, Tick % 16 < 12 ? "#6BE38A" : "#2A5A3A");
  // The stand, then the keyboard with its rows of keys and the mouse on its cord
  Rect(c, Cx - 6, My + Mh, 12, 2, "#B8AE96"); Rect(c, Cx - 10, My + Mh + 2, 20, 2, "#CFC6AE"); Rect(c, Cx - 10, My + Mh + 2, 20, 1, "#E6DECA");
  Rect(c, Cx - 20, DeskY - 3, 40, 3, "#C2B9A0"); Rect(c, Cx - 20, DeskY - 3, 40, 1, "#DCD4C0");
  for (let k = 0; k < 12; k++) { Rect(c, Cx - 19 + k * 3, DeskY - 2, 2, 1, "#EEE7D4"); }
  Rect(c, Cx - 12, DeskY - 1, 18, 1, "#EEE7D4");
  Rect(c, Cx + 24, DeskY - 2, 4, 2, "#D6CDB4"); Rect(c, Cx + 24, DeskY - 2, 4, 1, "#EEE7D4"); Rect(c, Cx + 20, DeskY - 1, 4, 1, "#8A8270");
}

// The Chalkboard function draws a chalkboard on a wooden easel, 404 and NOT FOUND? written in chalk, old smudges where it was wiped, and chalk and a duster on its ledge
function Chalkboard(c, Cx, DeskY)
{
  const Bw = 50, Bh = 32, X = Cx - 25, By = DeskY - Bh - 4;
  // The easel's legs and the peg at the top
  Rect(c, X + 6, By + Bh, 2, 4, "#4A2E1A"); Rect(c, X + Bw - 8, By + Bh, 2, 4, "#4A2E1A"); Rect(c, Cx - 1, By - 3, 2, 4, "#5A3A22"); Rect(c, Cx - 2, By - 3, 4, 1, "#7A5230");
  // The frame with its grain, and the slate inside
  Rect(c, X + 2, By + 2, Bw, Bh, "rgba(0,0,0,0.35)");
  Rect(c, X, By, Bw, Bh, "#7A5230"); Rect(c, X, By, Bw, 1, "#9A6A40"); Rect(c, X, By, 1, Bh, "#9A6A40"); Rect(c, X + Bw - 1, By, 1, Bh, "#5A3A22");
  for (let g = 0; g < 6; g++) Rect(c, X + 3 + g * 8, By + 1, 3, 1, "#6B4428");
  Rect(c, X + 3, By + 3, Bw - 6, Bh - 8, "#25352D"); Rect(c, X + 3, By + 3, Bw - 6, 1, "#1C2A23");
  for (let n = 0; n < 16; n++) Rect(c, X + 4 + Math.floor(Hash(n, 5) * (Bw - 12)), By + 4 + Math.floor(Hash(n, 6) * (Bh - 11)), 4 + Math.floor(Hash(n, 7) * 4), 1, "rgba(237,239,230,0.06)");
  Rect(c, X + 30, By + 6, 12, 3, "rgba(237,239,230,0.05)");
  // The writing: 404, a line under it and NOT FOUND?
  const Chalk = "rgba(240,240,232,0.92)";
  Write404(c, X + 8, By + 4, 2, Chalk, 0.09);
  Rect(c, X + 8, By + 19, 33, 1, "rgba(240,240,232,0.5)");
  Tiny(c, "NOT FOUND?", Cx, By + 21, "rgba(240,240,232,0.8)", true);
  // The ledge, a stick of white chalk, a stub of pink and the duster
  Rect(c, X - 1, By + Bh - 3, Bw + 2, 3, "#5A3A22"); Rect(c, X - 1, By + Bh - 3, Bw + 2, 1, "#8A5E3A");
  Rect(c, X + 6, By + Bh - 4, 4, 1, "#F2F2EA"); Rect(c, X + 12, By + Bh - 4, 2, 1, "#E8A0B4");
  Rect(c, X + Bw - 14, By + Bh - 6, 8, 2, "#7A5230"); Rect(c, X + Bw - 14, By + Bh - 4, 8, 1, "#8A8A90");
}

// SHOW_FOR holds which of the three shows the 404 in each background: the open ledger in the older, quieter places, the computer where a library or café would have one at the desk, and the chalkboard in the homely and outdoor ones (a background not listed gets the ledger)
const SHOW_FOR = { temple: Ledger, keeper: Ledger, attic: Ledger, library: Computer, cafe: Computer, cabin: Chalkboard, snow: Chalkboard, woodland: Chalkboard, autumn: Chalkboard, campfire: Chalkboard };


// Section: The message on the desk

// PlateAt holds where on the desk the brass plate goes, worked out as the desk is drawn
let PlateAt = null;

// The ShowExtras function is called by backgrounds.js once the room has been lit for the time of day, and draws the brass plate then, only a little dimmed at night as if the lamp catches it, so the words on it stay easy to read; then it fits the words onto it
function ShowExtras(c)
{
  if (!PlateAt) return;
  const Space = BrassPlate(c, PlateAt.x, PlateAt.y, PlateAt.w, PlateAt.h, "#C9A14A", PlateAt.t);      // real brass whatever the background
  const Hour = HourNow(), Night = Hour < 6 || Hour >= 19 ? 0.12 : Hour < 7 || Hour >= 18 ? 0.06 : 0;
  if (Night) Rect(c, PlateAt.x, PlateAt.y, PlateAt.w, PlateAt.h, "rgba(26,16,22," + Night + ")");
  PlaceMessage(Space);
}

// LastPanel holds where the words were last fitted, so they are only fitted again when that changes
let LastPanel = "";

// The PlaceMessage function fits the words into the space inside the brass plate, making them a little smaller if the space is too small for them
function PlaceMessage(Space)
{
  const Message = document.querySelector(".lost"), Box = Canvas.getBoundingClientRect();
  if (!Message) return;
  const Scale = Box.height / Canvas.height;
  const Left = Box.left + Space.left * Scale, Top = Box.top + Space.top * Scale, Right = Box.left + Space.right * Scale, Bottom = Box.top + Space.bottom * Scale;
  const Key = [Left, Top, Right, Bottom].map(Math.round).join(",");
  if (Key === LastPanel) return;
  LastPanel = Key;
  Shrink(Message, 1);
  Message.style.left = Math.round((Left + Right) / 2) + "px";
  Message.style.top = Math.round((Top + Bottom) / 2) + "px";
  // Try it at full size first, then a little smaller (and so a little wider) each time, until it fits the space
  let Size = 1;
  for (; Size > 0.72; Size -= 0.04)
  {
    Message.style.width = Math.round((Right - Left) / Size) + "px";
    if (Message.offsetHeight * Size <= Bottom - Top && Message.scrollWidth <= Message.offsetWidth + 1) break;
  }
  Shrink(Message, Size);
  // Last, if anything still reaches past the space (a long button, say), it is made just small enough to fit
  const Parts = [...Message.querySelectorAll(".lost-head, .lost-text, .lost-actions a")].map((Part) => Part.getBoundingClientRect());
  const Wide = Math.max(...Parts.map((Part) => Part.right)) - Math.min(...Parts.map((Part) => Part.left)), Tall = Math.max(...Parts.map((Part) => Part.bottom)) - Math.min(...Parts.map((Part) => Part.top));
  const Over = Math.max(Wide / (Right - Left), Tall / (Bottom - Top));
  if (Over > 1) Shrink(Message, Size / Over);
}

// The Shrink function sets how big the message is drawn, keeping it centred on its spot
function Shrink(Message, Size)
{
  Message.style.transform = "translate(-50%, -50%)" + (Size < 1 ? " scale(" + Size.toFixed(3) + ")" : "");
}

// The Moulding function draws a raised wooden moulding round the desk's middle panel, carved from the same wood as the desk, lit from the lamp's side along the top and left and in shade along the bottom and right, so the plate on the panel looks built into the desk
function Moulding(c, X, Y, W, H)
{
  Rect(c, X - 3, Y - 3, W + 6, H + 6, "#3A2416");
  Rect(c, X - 2, Y - 2, W + 4, 1, "#9A6A40"); Rect(c, X - 2, Y - 2, 1, H + 4, "#8A5E3A");                  // the lit edges
  Rect(c, X - 1, Y - 1, W + 2, 1, "#7A5230"); Rect(c, X - 1, Y - 1, 1, H + 2, "#7A5230");
  Rect(c, X - 2, Y + H + 1, W + 4, 1, "#2A1A10"); Rect(c, X + W + 1, Y - 2, 1, H + 4, "#2A1A10");          // the shaded edges
  Rect(c, X - 1, Y + H, W + 2, 1, "#4A2E1A"); Rect(c, X + W, Y - 1, 1, H + 2, "#4A2E1A");
  Rect(c, X, Y, W, H, "#3A2416"); Rect(c, X, Y, W, 1, "#24160C"); Rect(c, X, Y, 1, H, "#24160C");          // the recess inside it, in shadow at the top and left
  [[X - 2, Y - 2], [X + W + 1, Y - 2], [X - 2, Y + H + 1], [X + W + 1, Y + H + 1]].forEach(([Kx, Ky]) => Rect(c, Kx, Ky, 1, 1, "#5A3A22"));   // the mitred corners
}

// The BrassPlate function draws a brass plate screwed to the desk: a two dot bevel lit from the top left, faint brushed lines across it, an engraved border with its corners cut, a round slotted screw at each end, and now and then a gleam of light sweeping across it
function BrassPlate(c, X, Y, W, H, Brass, t)
{
  const Px = X + 1, Py = Y, Pw = W - 2, Ph = H - 1;
  const Light = Mix(Brass, "#FFFFFF", 0.4), Soft = Mix(Brass, "#FFFFFF", 0.2), Dark = Mix(Brass, "#000000", 0.3), Deep = Mix(Brass, "#000000", 0.5);
  Rect(c, Px + 1, Py + 1, Pw, Ph, "rgba(0,0,0,0.45)");                                         // its shadow on the panel
  Rect(c, Px, Py, Pw, Ph, Deep);
  Rect(c, Px + 1, Py + 1, Pw - 2, Ph - 2, Brass);
  // The bevel: two dots of light along the top and left, two of shade along the bottom and right
  Rect(c, Px + 1, Py + 1, Pw - 2, 1, Light); Rect(c, Px + 1, Py + 2, Pw - 3, 1, Soft);
  Rect(c, Px + 1, Py + 1, 1, Ph - 2, Light); Rect(c, Px + 2, Py + 2, 1, Ph - 4, Soft);
  Rect(c, Px + 1, Py + Ph - 2, Pw - 2, 1, Dark); Rect(c, Px + 2, Py + Ph - 3, Pw - 3, 1, Mix(Brass, "#000000", 0.15));
  Rect(c, Px + Pw - 2, Py + 1, 1, Ph - 2, Dark); Rect(c, Px + Pw - 3, Py + 2, 1, Ph - 4, Mix(Brass, "#000000", 0.15));
  // Faint brushed lines across the face
  for (let r = Py + 4; r < Py + Ph - 4; r += 2) Rect(c, Px + 4 + Math.floor(Hash(r, 3) * 6), r, Pw - 12 - Math.floor(Hash(r, 4) * 8), 1, Hash(r, 5) < 0.5 ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)");
  // The engraved border: a dark line with a light one inside it, its corners cut in
  const Ex = Px + 7, Ey = Py + 3, Ew = Pw - 14, Eh = Ph - 6;
  Rect(c, Ex + 2, Ey, Ew - 4, 1, Dark); Rect(c, Ex + 2, Ey + Eh - 1, Ew - 4, 1, Dark); Rect(c, Ex, Ey + 2, 1, Eh - 4, Dark); Rect(c, Ex + Ew - 1, Ey + 2, 1, Eh - 4, Dark);
  Rect(c, Ex + 2, Ey + 1, Ew - 4, 1, Soft); Rect(c, Ex + 1, Ey + 2, 1, Eh - 4, Soft);
  [[Ex + 1, Ey + 1], [Ex + Ew - 2, Ey + 1], [Ex + 1, Ey + Eh - 2], [Ex + Ew - 2, Ey + Eh - 2]].forEach(([Kx, Ky]) => Rect(c, Kx, Ky, 1, 1, Dark));
  // A screw at each end, halfway up: a round head with a slot, lit on the top left
  const Mid = Py + (Ph >> 1) - 1;
  [Px + 3, Px + Pw - 6].forEach((Sx) =>
  {
    Rect(c, Sx + 1, Mid - 1, 1, 1, Deep); Rect(c, Sx, Mid, 3, 1, Deep); Rect(c, Sx + 1, Mid + 1, 1, 1, Deep);
    Rect(c, Sx, Mid - 1, 1, 1, Light); Rect(c, Sx + 2, Mid - 1, 1, 1, Soft); Rect(c, Sx, Mid + 1, 1, 1, Soft); Rect(c, Sx + 2, Mid + 1, 1, 1, Dark);
    Rect(c, Sx + 1, Mid, 1, 1, Light);
  });
  // The lamp's warm light falling on the left of the plate, fading off to the right
  for (let k = 0; k < 4; k++) Rect(c, Px + 1, Py + 1, Math.round(Pw * (0.45 - k * 0.1)), Ph - 2, "rgba(255,226,150,0.05)");
  // Brass brackets over each corner, holding the plate to the desk, each with a pin into the wood
  [[Px - 1, Py - 1, 1, 1], [Px + Pw - 3, Py - 1, -1, 1], [Px - 1, Py + Ph - 3, 1, -1], [Px + Pw - 3, Py + Ph - 3, -1, -1]].forEach(([Bx, By, Fx, Fy]) =>
  {
    Rect(c, Bx, Fy > 0 ? By : By + 3, 4, 1, Deep); Rect(c, Fx > 0 ? Bx : Bx + 3, By, 1, 4, Deep);
    Rect(c, Bx, Fy > 0 ? By + 1 : By + 2, 4, 1, Light); Rect(c, Fx > 0 ? Bx + 1 : Bx + 2, By, 1, 4, Fx > 0 ? Light : Dark);
    Rect(c, Fx > 0 ? Bx + 1 : Bx + 2, Fy > 0 ? By + 1 : By + 2, 1, 1, Deep);
  });
  // Now and then a gleam of light sweeps across the plate
  const Phase = (t % 10) / 2.5;
  if (MotionOn && Phase < 1)
  {
    const Along = Px - Ph + Math.round(Phase * (Pw + Ph * 2));
    for (let r = 1; r < Ph - 1; r++) { const Gx = Along + (Ph - r); if (Gx > Px + 1 && Gx < Px + Pw - 3) Rect(c, Gx, Py + r, 2, 1, "rgba(255,255,240,0.16)"); }
  }
  return { left: Ex + 4, top: Ey + 2, right: Ex + Ew - 4, bottom: Ey + Eh - 2 };
}

// Section: The librarian's desk

// The LibraryDesk function draws the librarian's desk: the bookcases behind, a clock telling the real time, the desk with its panels, the green lamp, the bell, the cat asleep, an open book, and the 404 in the middle shown the way the background picks
function LibraryDesk(c, W, H, t)
{
  const Books = Current.theme.books, Brass = Current.theme.plaque;
  const Tick = Math.floor(t * 8);
  const Cx = W >> 1, DeskY = Math.round(H * 0.6);
  // The wall of bookcases behind, and the floor (lit for the time of day by daylight.js, the same as the library's own backgrounds)
  Rect(c, 0, 0, W, H, "#2A1C14");
  for (let x = -6, i = 0; x < W; x += 30, i++) Bookcase(c, x, Math.round(H * 0.04), 28, DeskY - Math.round(H * 0.04), i * 13);
  Rect(c, 0, DeskY + Math.round(H * 0.22), W, H, "#3A261A");
  // A clock on the wall above the desk, its hands at the time it is on this device
  const Kx = Cx, Ky = Math.round(H * 0.14), Kr = Math.max(4, Math.round(H * 0.06));
  Disc(c, Kx, Ky, Kr + 1, "#5A3A22"); Disc(c, Kx, Ky, Kr, "#EDE3C8");
  const Hour = HourNow();
  Hand(c, Kx, Ky, (Hour % 12) / 12 * Math.PI * 2, Math.round(Kr * 0.5), "#2A1A10");
  Hand(c, Kx, Ky, (Hour % 1) * Math.PI * 2, Math.round(Kr * 0.8), "#2A1A10");
  // The desk: a wide top, and a front of three panels, the middle one wider for the message to sit on (on a phone, one wide panel)
  const Narrow = window.innerWidth <= 560;
  const Dw = Math.round(Math.min(W * 0.92, 150)), Dx = Cx - (Dw >> 1), Dh = Math.round(H * 0.3);
  Rect(c, Dx - 2, DeskY, Dw + 4, 3, "#7A5230"); Rect(c, Dx - 2, DeskY, Dw + 4, 1, "#9A6A40");
  Rect(c, Dx, DeskY + 3, Dw, Dh, "#5A3A22");
  const Sw = Narrow ? -4 : Math.round(Dw * 0.17), Mw = Narrow ? Dw - 8 : Dw - 16 - Sw * 2;
  const Panels = Narrow ? [[Dx + 4, Mw]] : [[Dx + 4, Sw], [Dx + 8 + Sw, Mw], [Dx + 12 + Sw + Mw, Sw]];
  Panels.forEach(([Px, Pw]) =>
  {
    Rect(c, Px, DeskY + 7, Pw, Dh - 9, "#4A2E1A"); Rect(c, Px, DeskY + 7, Pw, 1, "#2E1C10"); Rect(c, Px, DeskY + Dh - 3, Pw, 1, "#6A4526");
  });
  PlateAt = { x: Dx + 8 + Sw, y: DeskY + 7, w: Mw, h: Dh - 9, t: t };                      // the brass plate goes on the middle panel, drawn once the room is lit (see ShowExtras)
  Moulding(c, PlateAt.x, PlateAt.y, PlateAt.w, PlateAt.h);                                    // the moulding is part of the desk, so it is lit with the room
  // The green lamp, left on, and its pool of light
  const Lx = Dx + Math.round(Dw * 0.16);
  Disc(c, Lx + 4, DeskY - 2, Math.round(Dw * 0.42), "rgba(255,220,140,0.06)");
  Disc(c, Lx + 4, DeskY - 2, Math.round(Dw * 0.22), "rgba(255,220,140,0.08)");
  Rect(c, Lx - 3, DeskY - 2, 10, 2, Brass); Rect(c, Lx + 1, DeskY - 12, 2, 10, Brass);
  Rect(c, Lx - 6, DeskY - 16, 16, 4, "#2E6A4A"); Rect(c, Lx - 6, DeskY - 16, 16, 1, "#4E9A6A"); Rect(c, Lx - 5, DeskY - 12, 14, 1, "#FFE9A3");
  // The 404 in the middle of the desk, shown the way this background picks, and an open book beside it (the ledger is the open book when it shows the 404)
  const Show = SHOW_FOR[Current.id] || Ledger;
  Show(c, Cx, DeskY, Tick);
  if (Show !== Ledger) OpenBook(c, Cx + 30, DeskY, Books[2 % Books.length]);
  // The brass bell on the lamp's side, and the cat asleep at the other end of the desk
  const Bx = Lx + 16;
  Rect(c, Bx - 3, DeskY - 1, 7, 1, Mix(Brass, "#000000", 0.3)); Rect(c, Bx - 2, DeskY - 4, 5, 3, Brass); Rect(c, Bx, DeskY - 5, 1, 1, Brass); Rect(c, Bx - 1, DeskY - 4, 1, 1, Mix(Brass, "#FFFFFF", 0.4));
  const CatX = Dx + Dw - 17, CatY = DeskY - 6;
  Sprite(c, CatX, CatY, CatShape, CatColours);
  if (Math.floor(Tick / 10) % 2) Rect(c, CatX + 6, CatY, 5, 1, CatColours.o);
  // A few books stacked at the front corner, in the theme's colours
  [0, 1, 2].forEach((n) => { const Cover = Books[(n * 3) % Books.length]; Rect(c, Dx + 3 + n, DeskY - 3 - n * 3, 14 - n * 2, 3, Cover); Rect(c, Dx + 3 + n, DeskY - 3 - n * 3, 14 - n * 2, 1, Mix(Cover, "#FFFFFF", 0.25)); });
}

// The desk is drawn in place of the chosen background's own room, the background still decides the colours of the books and the brass, and the light of the time of day falls over it
Backgrounds.forEach((Background) =>
{
  Background.draw = ((Own) => (c, W, H, t) => (c === Ctx ? LibraryDesk(c, W, H, t) : Own(c, W, H, t)))(Background.draw);
});
DrawFrame(MotionOn ? performance.now() / 1000 : 20);

// The words are fitted to the plate again once the pixel font has loaded, as it changes their size
document.fonts.ready.then(() =>
{
  LastPanel = "";
  DrawFrame(MotionOn ? performance.now() / 1000 : 20);
});
