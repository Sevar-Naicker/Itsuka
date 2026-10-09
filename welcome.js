// This file contains the code for the landing page (welcome.html), it loads after backgrounds.js and uses its Sprite, Rect, Remember and Recall functions

// The pictures for the title shelf:

// Each picture is made of letters like the ones in backgrounds.js, one letter is one dot and a full stop means empty

// BigCatShape is the sleeping cat, a bigger one than the cat by the fireplace so its face shows
const BigCatShape = [
  "...o.....o................",
  "..ooo...ooo...............",
  "..opo...opo.....oooooo....",
  "..ooooooooo...oosoosoosoo.",
  ".ooooooooooo.ooosoosoosooo",
  ".oooooooooooooosooooosoooo",
  ".ookkoookkoooooooooooooooo",
  "woooowpwoooooooooooooooooo",
  ".woowwwwwooooooooooooooott",
  "w..owwwwwootttttttttttttts",
  "....oooooodwwossossossosss",
  ".....wwowwdwwossossossoss.",
];

// CurledCatShape is the smaller cat that sleeps on the armchair
const CurledCatShape = [
  "o.....o.........",
  "oo...oo...oooo..",
  "ooooooo.oosoosoo",
  "okkokkooosoosooo",
  "oowpwooooooooooo",
  ".owwwootttttttts",
  "..ooowwossossoss",
  "...wwwwossossos.",
];

// ArmchairShape is the armchair on its own, the curled cat is painted on top of it
const ArmchairShape = [
  "......HHHHHHHHHHHHHH......",
  "....HHFFFFFFFFFFFFFFFD....",
  "...HFFFFFFFFFFFFFFFFFFD...",
  "...HFFFFFFFFFFFFFFFFFFD...",
  "...HFFFFDFFFFFFFFDFFFFD...",
  "...HFFFFFFFFFFFFFFFFFFD...",
  "...HFFFFFFFFFFFFFFFFFFD...",
  "...HFFFFFFFFFFFFFFFFFFD...",
  "...HFFFFFFFFFFFFFFFFFFD...",
  "...HFFFFFFFFFFFFFFFFFFD...",
  ".HHHFFFFFFFFFFFFFFFFFFHHH.",
  "HFFFDFFFFFFFFFFFFFFFFHFFFD",
  "HFFFDFFFFFFFFFFFFFFFFHFFFD",
  "HFFFDFFFFFFFFFFFFFFFFHFFFD",
  "HFFFDHHHHHHHHHHHHHHHHHFFFD",
  "HFFFDFFFFFFFFFFFFFFFFHFFFD",
  "HFFFDFFFFFFFFFFFFFFFFHFFFD",
  "HFFFDDDDDDDDDDDDDDDDDHFFFD",
  "HFFFFFFFFFFFFFFFFFFFFFFFFD",
  "HFFFFFFFFFFFFFFFFFFFFFFFFD",
  ".DDDDDDDDDDDDDDDDDDDDDDDD.",
  "..WW..................WW..",
  "..WW..................WW..",
];

// TeaShape is a steaming cup on a stack of three books and SteamDrift holds the top three rows for when the steam has moved
const TeaShape = [
  "...........v..v.........",
  "..........v..v..........",
  "...........v..v.........",
  "........................",
  ".........cccccccc.......",
  ".........cccccccxcc.....",
  ".........cccccccx.c.....",
  "..........cccccxcc......",
  "........xxxxxxxxxxx.....",
  "....AAAAAAAAAAAAAAAAAA..",
  "....AaAwwwwwwwwwwwwwww..",
  "....AAAAAAAAAAAAAAAAAA..",
  "..BBBBBBBBBBBBBBBBBBBBB.",
  "..BbBwwwwwwwwwwwwwwwwww.",
  "..BBBBBBBBBBBBBBBBBBBBB.",
  "EEEEEEEEEEEEEEEEEEEEEE..",
  "EeEwwwwwwwwwwwwwwwwwww..",
  "EEEEEEEEEEEEEEEEEEEEEE..",
];
const SteamDrift = [
  "..........v..v..........",
  "...........v..v.........",
  "..........v..v..........",
];

// PlantShape is a leafy plant in a pot
const PlantShape = [
  "........LL..........",
  "...LL..LGGL...LL....",
  "..LGGL.LGGK..LGGL...",
  "..LGGKLGGGK.LGGGK...",
  ".LGGGKLGGKKLGGGGK...",
  ".LGGKKGGGKLGGGGKK.L.",
  "..GKKLGGGKLGGGKKLGGL",
  "LL.KLGGGKKGGGKKLGGGK",
  "LGLLGGGGKLGGKK.LGGKK",
  "LGGLGGGKKGGKK..GGKK.",
  ".GGKGGKK.GKK...KKK..",
  "..KK.KK..GK.........",
  ".....QQQQQQQQQQ.....",
  ".....PPPPPPPPPR.....",
  "......PPPPPPPR......",
  "......PPPPPPPR......",
  "......PPPPPPPR......",
  ".......PPPPPR.......",
];

// LanternShape is a candle lantern
const LanternShape = [
  ".....MMMM.....",
  "....M....M....",
  "....M....M....",
  ".....MMMM.....",
  "....NMMMMM....",
  "...NMMMMMMM...",
  "..NMMMMMMMMM..",
  "..MggggggggM..",
  "..MgggggyggM..",
  "..MggyyOyygM..",
  "..MgyyOOyygM..",
  "..MgyyOCOyyM..",
  "..MgyOCCOyyM..",
  "..MgyOCCOygM..",
  "..MggyOOyggM..",
  "..MgggccgggM..",
  "..MgggccgggM..",
  "..NMMMMMMMMM..",
  ".NMMMMMMMMMMM.",
  ".MMMMMMMMMMMM.",
];

// ShelfItems holds the list the picker is built from, each with its name, id and picture
const ShelfItems = [
  { name: "Cat", id: "cat", rows: BigCatShape },
  { name: "Armchair", id: "armchair", rows: ArmchairShape },
  { name: "Tea and books", id: "tea", rows: TeaShape },
  { name: "Plant", id: "plant", rows: PlantShape },
  { name: "Lantern", id: "lantern", rows: LanternShape },
];
// DEFAULT_ITEM is the id of the item shown until the visitor chooses another
const DEFAULT_ITEM = "tea";

// Painting the item on the title shelf:

// ShelfCanvas is the small canvas at the end of the title shelf and ShelfPen is the pen that draws on it
const ShelfCanvas = document.getElementById("shelfItem");
const ShelfPen = ShelfCanvas.getContext("2d");

// ShelfList is the row in the picker that holds one button per item
const ShelfList = document.getElementById("shelfList");

// CurrentItem holds the item that is on the shelf
let CurrentItem = ShelfItems[0];

// Tick swaps between true and false every little while so the items can move
let Tick = false;

// The Blend function mixes a colour with white when Amount is above 0 and with black when it is below 0
function Blend(Hex, Amount)
{
  const Target = Amount > 0 ? 255 : 0;
  const Share = Math.abs(Amount);
  const Parts = [1, 3, 5].map((i) => Math.round(parseInt(Hex.slice(i, i + 2), 16) * (1 - Share) + Target * Share));
  return "rgb(" + Parts.join(",") + ")";
}

// The ShelfColours function returns the colour of every letter, the armchair and the stacked books take theirs from the chosen background
function ShelfColours()
{
  const Books = Current.theme.books;
  const Colours =
  {
    // the cats: fur, stripes, two shades, cream, pink and the closed eyes
    o: "#D98A3A", s: "#B4682A", t: "#C27A32", d: "#9A5522", w: "#F3DDB5", p: "#E58F86", k: "#3A2414",
    // the armchair: fabric, its lit edge, its shadow and the wooden legs
    F: Books[0], H: Blend(Books[0], 0.28), D: Blend(Books[0], -0.35), W: "#2A1A10",
    // the tea and books: steam, cup, saucer and three covers each with a lighter mark on the spine
    v: "#D5DCEE", c: "#F4EFE2", x: "#B9B09A",
    A: Books[1], a: Blend(Books[1], 0.4), B: Books[4], b: Blend(Books[4], 0.4), E: Books[3], e: Blend(Books[3], 0.4),
    // the plant: three greens and the pot with its rim and shadow
    G: "#4E8B3A", L: "#7DB356", K: "#2F5E2A", P: "#B5532E", Q: "#D0714A", R: "#8E4226",
    // the lantern: metal, lit metal, glass, glow, flame and the heart of the flame
    M: "#2E2620", N: "#5A4A3C", g: "#6B4420", y: "#C98A32", O: "#F08A2A", C: "#FFF2B0",
  };
  return Colours;
}

// The PaintItem function paints an item with the given pen, when Moving is true it paints the item's second moment
function PaintItem(Pen, Item, Moving)
{
  const Colours = ShelfColours();
  Pen.clearRect(0, 0, Item.rows[0].length, Item.rows.length);
  Sprite(Pen, 0, 0, Item.rows, Colours);
  if (Item.id === "armchair") Sprite(Pen, 5, 7, CurledCatShape, Colours);
  if (!Moving) return;

  if (Item.id === "cat") Rect(Pen, 16, 1, 6, 1, Colours.o);            // the cat's back rises as it breathes
  if (Item.id === "armchair") Rect(Pen, 15, 7, 4, 1, Colours.o);       // and so does the curled cat's
  if (Item.id === "lantern")                                           // the tip of the flame leans over
  {
    Rect(Pen, 8, 8, 1, 1, Colours.g);
    Rect(Pen, 7, 8, 1, 1, Colours.y);
  }
  if (Item.id === "tea")                                               // the steam drifts
  {
    Pen.clearRect(0, 0, Item.rows[0].length, SteamDrift.length);
    Sprite(Pen, 0, 0, SteamDrift, Colours);
  }
}

// The PaintShelf function paints the current item on the title shelf, it only moves when moving backgrounds are on
function PaintShelf()
{
  PaintItem(ShelfPen, CurrentItem, MotionOn && Tick);
}

// The SizeShelf function sizes the canvas from the width of a title book, each dot is a whole number of screen pixels so the picture stays sharp
function SizeShelf()
{
  const BookWidth = document.querySelector(".title-shelf .book").offsetWidth;
  const Dot = Math.max(2, Math.floor(BookWidth / 15));      // rounded down so the item never grows wider than the room left on the shelf
  ShelfCanvas.style.width = Dot * ShelfCanvas.width + "px";
  ShelfCanvas.style.height = Dot * ShelfCanvas.height + "px";
}

// The PaintChoices function repaints the small pictures in the picker, as two of them take the colours of the background
function PaintChoices()
{
  ShelfList.querySelectorAll(".shelf-choice").forEach((Button) =>
  {
    const Item = ShelfItems.find((Each) => Each.id === Button.dataset.id);
    PaintItem(Button.querySelector("canvas").getContext("2d"), Item, false);
  });
}

// The SetShelfItem function puts an item on the shelf by its id and remembers the choice, an unknown id gives the default item
function SetShelfItem(Id)
{
  CurrentItem = ShelfItems.find((Item) => Item.id === Id) || ShelfItems.find((Item) => Item.id === DEFAULT_ITEM);
  ShelfCanvas.width = CurrentItem.rows[0].length;
  ShelfCanvas.height = CurrentItem.rows.length;
  PaintShelf();
  SizeShelf();
  Remember("library-shelf-item", CurrentItem.id);

  ShelfList.querySelectorAll(".shelf-choice").forEach((Button) =>
  {
    Button.setAttribute("aria-pressed", String(Button.dataset.id === CurrentItem.id));
  });
}

// Build one button per item, each has a small canvas with the item painted on it
ShelfItems.forEach((Item) =>
{
  const Button = document.createElement("button");
  Button.className = "shelf-choice";
  Button.type = "button";
  Button.dataset.id = Item.id;

  const Thumbnail = document.createElement("canvas");
  Thumbnail.width = Item.rows[0].length;
  Thumbnail.height = Item.rows.length;
  Thumbnail.style.width = Thumbnail.width * 2 + "px";
  Thumbnail.style.height = Thumbnail.height * 2 + "px";

  const Frame = document.createElement("span");
  Frame.className = "shelf-thumb";
  Frame.append(Thumbnail);
  Button.append(Frame, Item.name);

  Button.addEventListener("click", () => SetShelfItem(Item.id));
  ShelfList.append(Button);
});
PaintChoices();

// Start with whatever was chosen last time on this device
SetShelfItem(Recall("library-shelf-item"));
window.addEventListener("resize", SizeShelf);

// Every little while the item moves a little: the cats breathe, the steam drifts and the flame leans
setInterval(() =>
{
  Tick = !Tick;
  PaintShelf();
}, 1200);

// When another background is chosen the item and the small pictures are repainted in its colours
document.getElementById("sceneList").addEventListener("click", () =>
{
  PaintShelf();
  PaintChoices();
});

// The how it works card:

// HowDialog is the how it works card, it stays closed until its button is pressed
const HowDialog = document.getElementById("howDialog");

// The How it works button opens the card and the Got it button closes it
document.getElementById("howButton").addEventListener("click", () => HowDialog.showModal());
document.getElementById("howDone").addEventListener("click", () => HowDialog.close());

// A click outside the card closes it as well
HowDialog.addEventListener("click", (event) =>
{
  if (event.target === HowDialog) HowDialog.close();
});
