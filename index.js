// This file contains the code for the landing page (index.html), it loads after backgrounds.js and auth.js and uses their functions

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

// FishbowlShape is a goldfish in a round bowl with sand and weed, FishbowlSwim is the fish further along with the bubbles risen
const FishbowlShape = [
  "......................",
  ".....JJJJJJJJJJJJ.....",
  "......JJJJJJJJJJ......",
  ".....jjiiiiiiiijj.....",
  "....jiiiiiiiiiiiij....",
  "...jisiiiiqiiiiiiij...",
  "..jjAAAAAAAAAAAAAAjj..",
  "..jasaaaaqaaaaaaaaaj..",
  "..jasaaaaaaaaaaaaaaj..",
  ".jjaaaaaaaaafffafaajj.",
  ".jjaaaGaaaafFkFffaajj.",
  ".jjaaGaaaaaafffafaajj.",
  "..jaaaGaaaaaaaaaaaaj..",
  "..jaaGaGaaaaaaaaaaaj..",
  "..jjaGGaaaaaaaaaaajj..",
  "...juuUuuUuuUuuUuuj...",
  "....jUuuUuuUuuUuuj....",
  ".....jjaaaaaaaajj.....",
  "......jjjjjjjjjj......",
];
const FishbowlSwim = [
  "......................",
  ".....JJJJJJJJJJJJ.....",
  "......JJJJJJJJJJ......",
  ".....jjiiiiiiiijj.....",
  "....jiiiiiiiiiiiij....",
  "...jisiiiiiiiiiiiij...",
  "..jjAAAAAqAAAAAAAAjj..",
  "..jasaaaaaaaaaaaaaaj..",
  "..jasaaaaaqaaaaaaaaj..",
  ".jjaaaafafffaaaaaaajj.",
  ".jjaaaGffFkFfaaaaaajj.",
  ".jjaaGafafffaaaaaaajj.",
  "..jaaaGaaaaaaaaaaaaj..",
  "..jaaGaGaaaaaaaaaaaj..",
  "..jjaGGaaaaaaaaaaajj..",
  "...juuUuuUuuUuuUuuj...",
  "....jUuuUuuUuuUuuj....",
  ".....jjaaaaaaaajj.....",
  "......jjjjjjjjjj......",
];

// FirefliesShape is a big jar of fireflies over long grass, FirefliesGlow has the other half of them lit
const FirefliesShape = [
  "...llllllll...",
  "...LLLLLLLL...",
  "...llllllll...",
  "..jjjjjjjjjj..",
  ".jaaaaaaaaaaj.",
  "jasahaaaazaaaj",
  "jashYhaaaaaaaj",
  "jasahaaaaaazaj",
  "jaaaaahaaaaaaj",
  "jaaaahYhaaaaaj",
  "jaaaaahaaazaaj",
  "jaahaaaaaaaaaj",
  "jahYhaaaaaaaaj",
  "jaahaaaazaaaaj",
  "jaaaahaaaaaaaj",
  "jaGahYhaGaagaj",
  "jGgagGaGgagGaj",
  "jgGgGgGgGgGgGj",
  ".GgGgGgGgGgGg.",
  "..jjjjjjjjjj..",
];
const FirefliesGlow = [
  "...llllllll...",
  "...LLLLLLLL...",
  "...llllllll...",
  "..jjjjjjjjjj..",
  ".jaaaaaaahaaj.",
  "jasaaaaahYhaaj",
  "jasazaaaahahaj",
  "jasaaaaaaahYhj",
  "jaaaaaaaaaahaj",
  "jaaaaazaaahaaj",
  "jaaaaaaaahYhaj",
  "jaaaaaaaaahaaj",
  "jaazaaaahaaaaj",
  "jaaaaaahYhaaaj",
  "jaaaaaaahaaaaj",
  "jaGaazaaGaagaj",
  "jGgagGaGgagGaj",
  "jgGgGgGgGgGgGj",
  ".GgGgGgGgGgGg.",
  "..jjjjjjjjjj..",
];

// GlobeShape is a globe on a brass stand, GlobeTurned is the same globe turned a little
const GlobeShape = [
  "...........n......",
  "........bb...n....",
  ".....bbbmmbbb..n..",
  "....bBBBmmmVVb.n..",
  "...bBsBBBmmVVVb.n.",
  "..bBsBBBBmBVVVVb.n",
  "..bBBBBBBBBVmmmb.n",
  "..bmBBBBBBBmmmmb.n",
  ".bmBBBBBBBBVmmmVbn",
  ".bBBBmmmBBBVVmmVbn",
  "..bBmmmmmBBVmmmb.n",
  "..bBBmmmmBBVVmmb.n",
  "..bBBmmmBBBVVmVb.n",
  "...bBBmmBBBVVVb.n.",
  "....bBmBBBBVVb.n..",
  ".....bbbBmbbb..n..",
  "........bb...n....",
  "...........n......",
  "........nN........",
  "........nN........",
  "........nN........",
  ".....NNNNNNNN.....",
  "....nnnnnnnnnn....",
];
const GlobeTurned = [
  "...........n......",
  "........bb...n....",
  ".....bbbmmbbb..n..",
  "....bBBmmmBVVb.n..",
  "...bBsBBmmBVVVb.n.",
  "..bBsBBBmBBVVVVb.n",
  "..bBBBBBBBBmmmVb.n",
  "..bBBBBBBBmmmmmb.n",
  ".bBBBBBBBBBmmmVVbn",
  ".bBBmmmBBBBVmmVVbn",
  "..bmmmmmBBBmmmmb.n",
  "..bBmmmmBBBVmmmb.n",
  "..bBmmmBBBBVmVVb.n",
  "...bBmmBBBBVVVb.n.",
  "....bmBBBBBVVb.n..",
  ".....bbbmmbbb..n..",
  "........bb...n....",
  "...........n......",
  "........nN........",
  "........nN........",
  "........nN........",
  ".....NNNNNNNN.....",
  "....nnnnnnnnnn....",
];

// HourglassShape is an hourglass, HourglassFall has the falling sand a dot further down
const HourglassShape = [
  "WWWWWWWWWWWWW",
  "wwwwwwwwwwwww",
  ".PgcccccccgP.",
  ".PgsccccccgP.",
  ".PgsccccccgP.",
  ".P.gcccccg.P.",
  ".P.gSSSSSg.P.",
  ".P..gSSSg..P.",
  ".P...gSg...P.",
  ".P...gSg...P.",
  ".P...gSg...P.",
  ".P..gcccg..P.",
  ".P.gccSccg.P.",
  ".P.gcccccg.P.",
  ".PgccSSSccgP.",
  ".PgcSSSSScgP.",
  ".PgSSSSSSSgP.",
  ".PgSSSSSSSgP.",
  ".PgcccccccgP.",
  "wwwwwwwwwwwww",
  "WWWWWWWWWWWWW",
];
const HourglassFall = [
  "WWWWWWWWWWWWW",
  "wwwwwwwwwwwww",
  ".PgcccccccgP.",
  ".PgsccccccgP.",
  ".PgsccccccgP.",
  ".P.gcccccg.P.",
  ".P.gSSSSSg.P.",
  ".P..gSSSg..P.",
  ".P...gSg...P.",
  ".P...gSg...P.",
  ".P...gcg...P.",
  ".P..gcScg..P.",
  ".P.gcccccg.P.",
  ".P.gccSccg.P.",
  ".PgccSSSccgP.",
  ".PgcSSSSScgP.",
  ".PgSSSSSSSgP.",
  ".PgSSSSSSSgP.",
  ".PgcccccccgP.",
  "wwwwwwwwwwwww",
  "WWWWWWWWWWWWW",
];

// CassetteShape is a cassette player, CassetteTurn has the reels turned
const CassetteShape = [
  ".......hhhhhhhhhhhhhh.......",
  ".......h............h.......",
  ".......h............h.......",
  "RRRRRRRRRRRRRRRRRRRRRRRRRRRD",
  "RrrrrrrrrrrrrrrrrrrrrrrrerrD",
  "RrrrrrrrrCCCCCCCCCCrrrrrrrrD",
  "RrrkkkkrrCckcccckcCrrkkkkrrD",
  "RrkKKKKkrCkwkttkwkCrkKKKKkrD",
  "RkKKKKKKkCckcccckcCkKKKKKKkD",
  "RkKKkkKKkCccccccccCkKKkkKKkD",
  "RkKKkkKKkCcttttttcCkKKkkKKkD",
  "RkKKKKKKkCCCCCCCCCCkKKKKKKkD",
  "RrkKKKKkrrrrrrrrrrrrkKKKKkrD",
  "RrrkkkkrrryrnrnrnrrrrkkkkrrD",
  "RrrrrrrrrrrrrrrrrrrrrrrrrrrD",
  "RDDDDDDDDDDDDDDDDDDDDDDDDDDD",
];
const CassetteTurn = [
  ".......hhhhhhhhhhhhhh.......",
  ".......h............h.......",
  ".......h............h.......",
  "RRRRRRRRRRRRRRRRRRRRRRRRRRRD",
  "RrrrrrrrrrrrrrrrrrrrrrrryrrD",
  "RrrrrrrrrCCCCCCCCCCrrrrrrrrD",
  "RrrkkkkrrCkckcckckCrrkkkkrrD",
  "RrkKKKKkrCcwttttwcCrkKKKKkrD",
  "RkKKKKKKkCkckcckckCkKKKKKKkD",
  "RkKKkkKKkCccccccccCkKKkkKKkD",
  "RkKKkkKKkCcttttttcCkKKkkKKkD",
  "RkKKKKKKkCCCCCCCCCCkKKKKKKkD",
  "RrkKKKKkrrrrrrrrrrrrkKKKKkrD",
  "RrrkkkkrrryrnrnrnrrrrkkkkrrD",
  "RrrrrrrrrrrrrrrrrrrrrrrrrrrD",
  "RDDDDDDDDDDDDDDDDDDDDDDDDDDD",
];

// OwlShape is an owl sitting on two books, OwlBlink has its eyes closed
const OwlShape = [
  "...o........o.....",
  "...oo......oo.....",
  "...oooooooooo.....",
  "..ooWWWooWWWoo....",
  "..oWWkWooWkWWo....",
  "..oWWWWooWWWWo....",
  "..ooWWWyyWWWoo....",
  "..oooooyyooooo....",
  "..oOOOOOOOOOOo....",
  "..oOOoOOoOOoOo....",
  "..oOOOOOOOOOOo....",
  "..oOoOOoOOoOOo....",
  "..ooOOOOOOOOoo....",
  "...oOOOOOOOOo.....",
  "....yy....yy......",
  "EEEEEEEEEEEEEEEEE.",
  "EeEwwwwwwwwwwwwww.",
  "EEEEEEEEEEEEEEEEE.",
  ".AAAAAAAAAAAAAAAAA",
  ".AaAwwwwwwwwwwwwww",
  ".AAAAAAAAAAAAAAAAA",
];
const OwlBlink = [
  "...o........o.....",
  "...oo......oo.....",
  "...oooooooooo.....",
  "..oooooooooooo....",
  "..oddddoodddddo...",
  "..oooooooooooo....",
  "..ooWWWyyWWWoo....",
  "..oooooyyooooo....",
  "..oOOOOOOOOOOo....",
  "..oOOoOOoOOoOo....",
  "..oOOOOOOOOOOo....",
  "..oOoOOoOOoOOo....",
  "..ooOOOOOOOOoo....",
  "...oOOOOOOOOo.....",
  "....yy....yy......",
  "EEEEEEEEEEEEEEEEE.",
  "EeEwwwwwwwwwwwwww.",
  "EEEEEEEEEEEEEEEEE.",
  ".AAAAAAAAAAAAAAAAA",
  ".AaAwwwwwwwwwwwwww",
  ".AAAAAAAAAAAAAAAAA",
];

// ShelfItems holds the list the picker is built from, each with its name, id and picture, the newer ones also carry their second moment (moving) and their own colours
const ShelfItems = [
  { name: "Cat", id: "cat", rows: BigCatShape },
  { name: "Armchair", id: "armchair", rows: ArmchairShape },
  { name: "Tea and books", id: "tea", rows: TeaShape },
  { name: "Plant", id: "plant", rows: PlantShape },
  { name: "Lantern", id: "lantern", rows: LanternShape },
  { name: "Fishbowl", id: "fishbowl", rows: FishbowlShape, moving: FishbowlSwim, colours: { j: "#BFD6DA", J: "#E6F0F2", i: "#2B3A48", a: "#3E7FA6", A: "#7FB6D3", u: "#E3C27A", U: "#C9A14A", G: "#4E8B3A", f: "#E07A2E", F: "#F5A04A", k: "#22231F", q: "#D5EAF2", s: "#F4FAFB" } },
  { name: "Fireflies", id: "fireflies", rows: FirefliesShape, moving: FirefliesGlow, colours: { l: "#7A5A3A", L: "#A0784E", j: "#9CB8C0", a: "#1E2A38", G: "#2F5E2A", g: "#3E7A35", Y: "#FFF2A0", h: "#6E6A3A", z: "#1E2A38", s: "#D5EAF2" } },
  { name: "Globe", id: "globe", rows: GlobeShape, moving: GlobeTurned, colours: { b: "#1A2448", B: "#55608F", V: "#3F4A7A", m: "#6E9E4A", n: "#8A6A2E", N: "#C9A14A", s: "#A9B4D6" } },
  { name: "Hourglass", id: "hourglass", rows: HourglassShape, moving: HourglassFall, colours: { W: "#6B4226", w: "#8E5A34", P: "#5A3921", g: "#BFD6DA", c: "#2E3A46", S: "#E3C27A", s: "#F4FAFB" } },
  { name: "Cassette player", id: "cassette", rows: CassetteShape, moving: CassetteTurn, colours: { h: "#3A3A3A", r: "#C2505E", R: "#E07A6A", D: "#8A3440", k: "#22231F", K: "#4A4A4A", c: "#F4EFE2", C: "#8A8270", t: "#6B4226", w: "#F4EFE2", y: "#F6E27F", n: "#E6EAF5", e: "#7A2A34" } },
  { name: "Owl", id: "owl", rows: OwlShape, moving: OwlBlink, colours: { o: "#8A5A3C", O: "#C49A6C", W: "#F6ECD2", k: "#22231F", y: "#E3A13C", d: "#5A3921", E: "#2F5D3A", e: "#6E9E7A", A: "#8C2F39", a: "#C2707A", w: "#F4EFE2" } },
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
  const Colours = Object.assign(ShelfColours(), Item.colours);         // the newer items bring their own colours
  Pen.clearRect(0, 0, Item.rows[0].length, Item.rows.length);
  Sprite(Pen, 0, 0, Moving && Item.moving ? Item.moving : Item.rows, Colours);
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

// Every little while the item moves a little: the cats breathe, the steam drifts, the flame leans, the fish swims, the fireflies glow, the globe turns, the sand falls, the reels turn and the owl blinks
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

// The buttons for a signed-in member:

// ActionsRow is the row of buttons, CardButton is Get a library card and SignInButton is Sign in
const ActionsRow = document.querySelector(".welcome-actions");
const CardButton = document.getElementById("cardButton");
const SignInButton = document.getElementById("signInButton");

// The StartWelcomePage function checks who is signed in and shows the right buttons, a signed-in member gets a Library button in place of Sign in
async function StartWelcomePage()
{
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

  // Email links that land on this page are passed on: a used or expired one to the library card and a working one into the library
  if (ArrivedWith.includes("error_code="))
  {
    location.replace("login.html?confirm=expired");
    return;
  }
  if (Member && ArrivedWith.includes("access_token="))
  {
    location.replace("library.html");
    return;
  }

  // A member already has a card, so Get a library card is hidden and Sign in becomes Library
  // When login is switched off (config.js is empty) the library is open to everyone, so they get the Library button as well
  if (Member || !LoginIsSetUp)
  {
    CardButton.hidden = true;
    SignInButton.textContent = "Library";
    SignInButton.href = "library.html";
    ActionsRow.classList.add("member");
  }
  ActionsRow.classList.remove("waiting");      // we know who it is, so the buttons can be shown

  // Someone who has just deleted their account arrives with deleted=1 on the address and gets a goodbye line
  if (ArrivedWith.includes("deleted=1"))
  {
    document.getElementById("goneNote").hidden = false;
    history.replaceState(null, "", location.pathname);           // tidy the address bar
  }
}
StartWelcomePage();