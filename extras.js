// This file contains the little extras on the library page (library.html): the cat that wanders the shelves in the indoor backgrounds, the things in each background that do something when pressed, and the words that do something when typed
// It loads after library.js and uses backgrounds.js (CAT_SPOTS, CatOut, BlownOut, LightsOffUntil and the drawing helpers), shelves.js and library.js

// Section: The wandering cat

// WANDER_CAT holds the cat's pictures, written as rows of letters like the shelf ornaments: four steps of its walk (facing left), sitting up, and asleep breathing in and out
const WANDER_CAT = {
  walk0: [
    "...o....o...................",
    "..opo..opo..............ss..",
    "....oooo.................oo.",
    "..oooooooo...............oo.",
    "..ooeooooo...............oo.",
    ".oooeoooooo.osoosoos....oo..",
    ".oooooooooooosoosoosoo..oo..",
    ".pwwwwooooooosoosoosooooo...",
    "..wwwwoooooooooooooooooo....",
    "....owwwwooooooooooooooo....",
    ".....wwwwooooooooooooooo....",
    ".....wwwwoooooooooooooo.....",
    "........ooooooooooooood.....",
    "........dd.ddddddddd.dd.....",
    "........oo.dd.....ww.dd.....",
    "........ww...........dd.....",
    "............................",
    "............................",
  ],
  walk1: [
    "...o....o...................",
    "..opo..opo...............ss.",
    "....oooo..................oo",
    "..oooooooo................oo",
    "..ooeooooo...............oo.",
    ".oooeoooooo.osoosoos.....oo.",
    ".oooooooooooosoosoosoo..oo..",
    ".pwwwwooooooosoosoosooooo...",
    "..wwwwoooooooooooooooooo....",
    "....owwwwooooooooooooooo....",
    ".....wwwwooooooooooooooo....",
    ".....wwwwoooooooooooooo.....",
    ".........ooooooooooooo......",
    ".........ddddddddddddd......",
    ".........odd.......odd......",
    ".........wdd.......wdd......",
    "............................",
    "............................",
  ],
  walk2: [
    "...o....o...................",
    "..opo..opo..............ss..",
    "....oooo.................oo.",
    "..oooooooo...............oo.",
    "..ooeooooo...............oo.",
    ".oooeoooooo.osoosoos....oo..",
    ".oooooooooooosoosoosoo..oo..",
    ".pwwwwooooooosoosoosooooo...",
    "..wwwwoooooooooooooooooo....",
    "....owwwwooooooooooooooo....",
    ".....wwwwooooooooooooooo....",
    ".....wwwwoooooooooooooo.....",
    ".........ooooooooooooo......",
    ".........ddddddddddddd......",
    ".........ddw.......ddo......",
    ".........dd.........ww......",
    "............................",
    "............................",
  ],
  walk3: [
    "...o....o...................",
    "..opo..opo...............ss.",
    "....oooo..................oo",
    "..oooooooo................oo",
    "..ooeooooo...............oo.",
    ".oooeoooooo.osoosoos.....oo.",
    ".oooooooooooosoosoosoo..oo..",
    ".pwwwwooooooosoosoosooooo...",
    "..wwwwoooooooooooooooooo....",
    "....owwwwooooooooooooooo....",
    ".....wwwwooooooooooooooo....",
    ".....wwwwoooooooooooooo.....",
    ".........ooooooooooooo......",
    ".........ddddddddddddd......",
    ".........odd.......odd......",
    ".........wdd.......wdd......",
    "............................",
    "............................",
  ],
  sit: [
    "....o.......o.......",
    "...opo.....opo......",
    ".....ooooooo........",
    "....ooooooooo.......",
    "....ooooooooo.......",
    "....ooeoooeoo.......",
    "....ooeoooeoo.......",
    "....ooooooooo.......",
    "....oowwpwwooo......",
    ".....owwwwwoooo.....",
    "....oowwwwwooosss...",
    "....oowwwwwooooo....",
    "...oowwwwwwwooooo...",
    "...ooowwwwwooosss...",
    "...ooowwwwwoooooo...",
    "....ooowwwoooooo....",
    "....oooooooooosss...",
    ".....oooooooooooo...",
    ".....ooooooooo.oo...",
    "...sswwwowwwooooo...",
    "....ooooooooooooo...",
    "....................",
  ],
  sleep0: [
    "........................",
    "........................",
    "...o...o................",
    "...pooopoosoosoos..s....",
    "...ooooooosoosoosoos....",
    "..oooooooooooooooooooo..",
    "..okkokkoooooooooooooo..",
    "..oooooooooooooooooooo..",
    "..owwpwwoooooooooooooo..",
    "..wwwwwwooooooooooooo...",
    ".....ssoooooooooooooo...",
    ".........ooooooooooo....",
  ],
  sleep1: [
    "........................",
    "........................",
    "...o...o..oooo..........",
    "...pooopoosoosoosoos....",
    "...ooooooosoosoosooso...",
    "..oooooooooooooooooooo..",
    "..okkokkoooooooooooooo..",
    "..oooooooooooooooooooo..",
    "..owwpwwoooooooooooooo..",
    "..wwwwwwooooooooooooo...",
    ".....ssoooooooooooooo...",
    ".........ooooooooooo....",
  ],
};

// WANDER_COLOURS holds the cat's colours: the same orange as the cat asleep in the room, with a cream chest and muzzle and a pink nose
const WANDER_COLOURS = { o: "#D98A3A", s: "#B4682A", d: "#C27A32", w: "#F3DDB5", p: "#E58F86", e: "#3A2414", k: "#3A2414" };

// FIRST_WANDER and NEXT_WANDER hold how long the cat waits before setting off, in seconds: the first time a while after the page opens, then now and then after that
const FIRST_WANDER = [45, 120];
const NEXT_WANDER = [240, 480];

// Kitty holds the cat while it is out: its parts, the shelf it is on, and whether it has been told to leave or been startled
const Kitty = { cat: null, picture: null, shelf: null, leaving: false, startled: false };
let CatWalking = false;

// The Wait function waits a while
const Wait = (Ms) => new Promise((Done) => setTimeout(Done, Ms));

// The CatGone function checks whether the shelves were built again under the cat (a search, a move or a change from another device), so it stops where it is
const CatGone = () => !Kitty.cat || (!Kitty.cat.isConnected);

// The PaintCat function paints one of the cat's pictures onto its canvas, three screen pixels to a dot
function PaintCat(Name)
{
  const Picture = Kitty.picture;
  const Rows = WANDER_CAT[Name];
  if (Picture.width !== Rows[0].length || Picture.height !== Rows.length)
  {
    Picture.width = Rows[0].length;
    Picture.height = Rows.length;
    Picture.style.width = Picture.width * 3 + "px";
    Picture.style.height = Picture.height * 3 + "px";
  }
  const Pen = Picture.getContext("2d");
  Pen.clearRect(0, 0, Picture.width, Picture.height);
  Sprite(Pen, 0, 0, Rows, WANDER_COLOURS);
}

// The Rest function waits a while, but stops early if the cat is told to leave, gets startled or the shelves are built again
async function Rest(Ms)
{
  for (let Waited = 0; Waited < Ms && !Kitty.leaving && !Kitty.startled && !CatGone(); Waited += 50) await Wait(50);
}

// The WalkTo function walks the cat along its shelf to a spot, stepping through its four walking pictures, it stops early if the cat is told to leave (unless it is already on its way out)
async function WalkTo(To, Speed, Leaving)
{
  let At = parseFloat(Kitty.cat.style.left);
  const Left = To < At;
  Kitty.picture.style.transform = Left ? "" : "scaleX(-1)";
  let Step = 0;
  while (Math.abs(To - At) > Speed)
  {
    if (CatGone() || (!Leaving && (Kitty.leaving || Kitty.startled))) return;
    At += Left ? -Speed : Speed;
    Kitty.cat.style.left = At + "px";
    if (Step % 5 === 0) PaintCat("walk" + ((Step / 5) % 4));
    Step++;
    await Wait(30);
  }
}

// The PlaceOn function stands the cat on the bottom row of a shelf at a spot along it, and gives back that row's books
function PlaceOn(Shelf, Left)
{
  if (Kitty.shelf) Kitty.shelf.classList.remove("has-cat");
  Kitty.shelf = Shelf;
  Shelf.classList.add("has-cat");
  Kitty.cat.classList.remove("is-leaping");
  Shelf.append(Kitty.cat);
  const Books = [...Shelf.querySelectorAll(".book")];
  const LastRow = Books.filter((Book) => Book.offsetTop === Books[Books.length - 1].offsetTop);
  Kitty.cat.style.top = LastRow[0].offsetTop + LastRow[0].offsetHeight + "px";
  Kitty.cat.style.left = Left + "px";
  return LastRow;
}

// The CatHome function gives where the cat sleeps in this background on the screen, so it sets off from and heads back to that side of the shelves
function CatHome()
{
  const Spot = CAT_SPOTS[Current.id](Canvas.width, Canvas.height);
  return RoomToScreen({ x: Spot.x, y: Spot.y, w: 13, h: 6 });
}

// The NearEnd function gives the spot at the end of the cat's shelf nearest a place on the screen
function NearEnd(Place)
{
  const Here = Kitty.shelf.getBoundingClientRect();
  return Place.left + Place.width / 2 < Here.left + Here.width / 2 ? 0 : Kitty.shelf.clientWidth - 60;
}

// The Fly function moves the cat over the page in an arc, from where it is now to a spot given by its left edge and the line its feet stand on
async function Fly(ToLeft, ToBottom)
{
  const From = Kitty.cat.getBoundingClientRect();
  document.body.append(Kitty.cat);
  Kitty.cat.classList.add("is-leaping");
  Kitty.cat.style.left = From.left + "px";                            // it stays exactly where it was until the leap starts
  Kitty.cat.style.top = From.bottom + "px";
  Kitty.picture.style.transform = ToLeft < From.left ? "" : "scaleX(-1)";
  PaintCat("walk1");
  const Start = performance.now(), Time = 650 + Math.min(500, Math.hypot(ToLeft - From.left, ToBottom - From.bottom));
  const Height = 50 + Math.max(0, From.bottom - ToBottom) * 0.6;
  await new Promise((Done) =>
  {
    const Step = (Now) =>
    {
      const Share = Math.min(1, (Now - Start) / Time);
      Kitty.cat.style.left = From.left + (ToLeft - From.left) * Share + "px";
      Kitty.cat.style.top = From.bottom + (ToBottom - From.bottom) * Share - Math.sin(Share * Math.PI) * Height + "px";
      if (Share < 1) requestAnimationFrame(Step);
      else Done();
    };
    requestAnimationFrame(Step);
  });
}

// The LeapTo function jumps the cat from one shelf onto the nearer end of the next in an arc, so it never just appears
async function LeapTo(Shelf)
{
  const From = Kitty.cat.getBoundingClientRect();
  const Box = Shelf.getBoundingClientRect();
  const Land = From.left + From.width / 2 < Box.left + Box.width / 2 ? 6 : Shelf.clientWidth - 66;
  // Work out where it will stand on the new shelf with a hidden copy, then fly the real cat there over the page
  const Real = Kitty.cat, OldShelf = Kitty.shelf;
  Kitty.cat = Real.cloneNode(true);
  Kitty.cat.style.visibility = "hidden";
  PlaceOn(Shelf, Land);
  const To = Kitty.cat.getBoundingClientRect();
  Kitty.cat.remove();
  Kitty.cat = Real;
  Kitty.shelf = OldShelf;
  OldShelf.classList.add("has-cat");
  await Fly(To.left, To.bottom);
  const LastRow = PlaceOn(Shelf, Land);
  PaintCat("sit");
  return LastRow;
}

// The PetCat function is one press on the cat: a purr and a few hearts, it stays where it is
function PetCat()
{
  Say(Kitty.cat, "prrr");
  for (let n = 0; n < 3; n++)
  {
    const Heart = Make("span", "cat-heart");
    Heart.style.left = 30 + n * 14 + "%";
    Heart.style.animationDelay = n * 200 + "ms";
    Kitty.cat.append(Heart);
    setTimeout(() => Heart.remove(), 1600);
  }
}

// The CatCanWander function checks whether the cat may set off now: an indoor background, Wandering cat and moving backgrounds on, the page in view and nothing open
function CatCanWander()
{
  return !CatWalking && CAT_SPOTS[Current.id] && ShelfSettings.cat && MotionOn && !document.hidden && !document.querySelector("dialog[open], .book.is-open, .book.is-lifted");
}

// The SendCat function takes the cat for a wander over one to four shelves: it walks in at the end of the first, on each it sits by a book and nudges it crooked, leaps across to the next, then naps at the end of the last and walks off back to its spot
async function SendCat()
{
  const Shelves = [...LibraryRoot.querySelectorAll(".shelf")].filter((Shelf) => Shelf.querySelector(".book") && Shelf.offsetParent);
  if (!CatCanWander() || !Shelves.length) return;
  CatWalking = true;
  Kitty.leaving = false;
  Kitty.startled = false;
  Kitty.shelf = null;
  Kitty.cat = Make("div", "wander-cat");
  Kitty.cat.setAttribute("aria-hidden", "true");
  Kitty.picture = document.createElement("canvas");
  Kitty.cat.append(Kitty.picture);

  // One press pets it, two presses quickly send it away
  let PressTimer = 0;
  Kitty.cat.addEventListener("click", (event) =>
  {
    event.stopPropagation();
    if (PressTimer)
    {
      clearTimeout(PressTimer);
      PressTimer = 0;
      Kitty.leaving = true;
      Say(Kitty.cat, "hmph");
      return;
    }
    PressTimer = setTimeout(() => { PressTimer = 0; if (Kitty.cat) PetCat(); }, 280);
  });

  // It leaves its sleeping spot empty, and one to four shelves are picked in a random order
  CatOut = true;
  const Route = Shelves.sort(() => Math.random() - 0.5).slice(0, Math.min(Shelves.length, 1 + Math.floor(Math.random() * 4)));
  for (let i = 0; i < Route.length && !Kitty.leaving && (i === 0 || !CatGone()); i++)
  {
    Kitty.startled = false;
    let LastRow;
    if (i === 0)
    {
      // It comes walking in at the end of the first shelf nearest its sleeping spot, fading in
      const Home = CatHome(), Box = Route[0].getBoundingClientRect(), FromLeft = Home.left + Home.width / 2 < Box.left + Box.width / 2;
      LastRow = PlaceOn(Route[0], FromLeft ? -50 : Route[0].clientWidth - 10);
      Kitty.cat.classList.add("is-fading");
      void Kitty.cat.offsetWidth;
      Kitty.cat.classList.remove("is-fading");
      await WalkTo(FromLeft ? 6 : Route[0].clientWidth - 66, 2, true);
    }
    else
    {
      // Along to the end of this shelf nearest the next one, then a leap across to it
      await WalkTo(NearEnd(Route[i].getBoundingClientRect()), 3, true);
      if (CatGone()) break;
      PaintCat("sit");
      await Wait(300);
      if (Kitty.leaving || CatGone()) break;
      LastRow = await LeapTo(Route[i]);
    }
    await Rest(600);
    // Along to one of the books, where it sits and nudges the book with its head
    const Book = LastRow[Math.floor(Math.random() * LastRow.length)];
    await WalkTo(Book.offsetLeft + Book.offsetWidth - 20, 2, false);
    if (Kitty.leaving || Kitty.startled || CatGone()) continue;
    PaintCat("sit");
    Kitty.picture.style.transform = "";
    await Rest(1300);
    if (Kitty.leaving || Kitty.startled || CatGone()) continue;
    Book.classList.add("is-nudged");
    await Rest(1000);
  }

  // On the last shelf it walks all the way to the end nearest its sleeping spot and naps there a while (unless it was sent away)
  if (!Kitty.leaving && !CatGone() && Kitty.shelf)
  {
    await WalkTo(NearEnd(CatHome()), 2, false);
    if (!Kitty.leaving && !CatGone())
    {
      Kitty.cat.classList.add("is-asleep");
      for (let n = 0; n < 10 && !Kitty.leaving && !CatGone(); n++)
      {
        PaintCat(n % 2 ? "sleep1" : "sleep0");
        await Rest(900);
      }
      Kitty.cat.classList.remove("is-asleep");
      if (!CatGone()) PaintCat("sit");
      await Wait(700);
    }
  }

  // Then it walks off the end of the shelf and fades away, quicker if it was sent away, and is back asleep in its spot
  if (!CatGone() && Kitty.shelf)
  {
    Kitty.cat.classList.remove("is-asleep");
    const Speed = Kitty.leaving ? 4 : 2;
    const End = NearEnd(CatHome());
    await WalkTo(End, Speed, true);
    Kitty.cat.classList.add("is-fading");
    await WalkTo(End === 0 ? -50 : Kitty.shelf.clientWidth - 10, Speed, true);
  }
  if (Kitty.cat) Kitty.cat.remove();
  if (Kitty.shelf) Kitty.shelf.classList.remove("has-cat");
  Kitty.cat = null;
  Kitty.shelf = null;
  CatOut = false;
  CatWalking = false;
}

// The PlanWander function sets the cat off again after a while, waiting a little longer when it cannot go right then
function PlanWander(Range)
{
  const Seconds = Range[0] + Math.random() * (Range[1] - Range[0]);
  setTimeout(async () =>
  {
    if (!CatCanWander())
    {
      PlanWander([20, 40]);
      return;
    }
    await SendCat();
    PlanWander(NEXT_WANDER);
  }, Seconds * 1000);
}
LibraryReady.then(() => PlanWander(FIRST_WANDER));

// Switching Wandering cat off, or moving backgrounds off, sends the cat back to its spot straight away if it is out
SettingsList.addEventListener("change", (event) =>
{
  if (event.target.dataset.key === "cat" && !event.target.checked && Kitty.cat) Kitty.leaving = true;
});
if (MotionSwitch) MotionSwitch.addEventListener("change", () => { if (!MotionSwitch.checked && Kitty.cat) Kitty.leaving = true; });

// Pressing a book the cat knocked crooked stands it straight again instead of opening it, and if the cat is right beside it, it gets a fright and goes on to its next shelf
document.addEventListener("click", (event) =>
{
  const Book = event.target.closest("#library .book.is-nudged");
  if (!Book || !event.target.closest(".spine")) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  Book.classList.remove("is-nudged");
  Book.classList.add("is-straightened");
  setTimeout(() => Book.classList.remove("is-straightened"), 400);
  if (Kitty.cat && Kitty.shelf === Book.closest(".shelf") && !Kitty.leaving)
  {
    if (Math.abs(parseFloat(Kitty.cat.style.left) - Book.offsetLeft) < 160)
    {
      Kitty.startled = true;
      Kitty.cat.classList.remove("is-asleep");
      Say(Kitty.cat, "!");
    }
  }
}, true);


// Section: Little things that float up

// The Say function shows a small speech bubble over something on the page for a moment
function Say(Over, Words)
{
  const Bubble = Make("span", "say-bubble", Words);
  Bubble.setAttribute("aria-hidden", "true");
  const Box = Over.getBoundingClientRect();
  Bubble.style.left = Box.left + Box.width / 2 + "px";
  Bubble.style.top = Box.top + "px";
  document.body.append(Bubble);
  setTimeout(() => Bubble.remove(), 1600);
}

// The SayAt function shows a speech bubble over a dot of the background
function SayAt(X, Y, Words)
{
  const Box = Canvas.getBoundingClientRect();
  const Spot = Make("span", "say-spot");
  Spot.style.left = Box.left + X * Box.width / Canvas.width + "px";
  Spot.style.top = Box.top + Y * Box.height / Canvas.height + "px";
  document.body.append(Spot);
  Say(Spot, Words);
  Spot.remove();
}


// Section: Things flying in the room

// Bits holds everything flying in the room for a moment (sparks, smoke, leaves, petals, snow, hearts, a bird, a rabbit, a shooting star), Glows the lights that flare up and the rings from a bell, Doodles the smileys drawn on the café glass
const Bits = [];
const Glows = [];
const Doodles = [];

// The AddBit function adds one flying thing, From says where it starts and how it moves, in dots of the background
function AddBit(From)
{
  Bits.push(Object.assign({ at: performance.now(), life: 1.5, vx: 0, vy: 0, fall: 0, sway: 0, w: 1, h: 1 }, From));
}

// The AddGlow function makes a light flare up at a spot for a moment, A in the colour stands for how see-through it is
function AddGlow(X, Y, Size, Colour, Life)
{
  Glows.push({ x: X, y: Y, size: Size, colour: Colour, at: performance.now(), life: Life || 1.6 });
}

// SPRITES holds the little pictures some flying things use, each with two moments
const SPRITES = {
  heart: [["hh.hh", "hhhhh", ".hhh.", "..h.."], ["hh.hh", "hhhhh", ".hhh.", "..h.."]],
  bird: [["b...b", ".b.b.", "..b.."], [".....", "bbbbb", "..b.."]],
  rabbit: [["...ee", "..rrr", "rrrrr", "r.r.."], ["...ee", "rrrrr", "rrrr.", ".r..r"]],
  page: [["ww", "ww"], ["w.", "ww"]],
};
const SPRITE_COLOURS = { h: "#D04A5A", b: "#2A2A33", r: "#9A8A7A", e: "#B8A898", w: "#F4EFE2" };
const SMILEY = [".........", "..w...w..", "..w...w..", ".........", "w.......w", ".w.....w.", "..wwwww..", "........."];

// The ShowExtras function is called by backgrounds.js after each frame: the glows swell and fade, the rings spread, the flying things move and the smileys on the café glass fade
function ShowExtras(Pen)
{
  const Now = performance.now();
  for (let i = Glows.length - 1; i >= 0; i--)
  {
    const Glow = Glows[i];
    const Age = (Now - Glow.at) / 1000;
    if (Age > Glow.life) { Glows.splice(i, 1); continue; }
    if (Age < 0) continue;
    if (Glow.ring)
    {
      const R = Math.round(4 + Age * 22), Colour = Glow.colour.replace("A", (0.7 * (1 - Age / Glow.life)).toFixed(3));
      for (let a = 0; a < 40; a++) Rect(Pen, Glow.x + Math.cos(a / 40 * Math.PI * 2) * R, Glow.y + Math.sin(a / 40 * Math.PI * 2) * R * 0.5, 1, 1, Colour);
      continue;
    }
    const Strength = Math.sin(Math.PI * Age / Glow.life);
    Disc(Pen, Glow.x, Glow.y, Glow.size, Glow.colour.replace("A", (0.22 * Strength).toFixed(3)));
    Disc(Pen, Glow.x, Glow.y, Glow.size * 0.55, Glow.colour.replace("A", (0.3 * Strength).toFixed(3)));
  }
  for (let i = Bits.length - 1; i >= 0; i--)
  {
    const Bit = Bits[i];
    const Age = (Now - Bit.at) / 1000;
    if (Age > Bit.life) { Bits.splice(i, 1); continue; }
    if (Age < 0) continue;
    const X = Math.round(Bit.x + Bit.vx * Age + Math.sin(Age * 5 + i) * Bit.sway);
    let Y = Math.round(Bit.y + Bit.vy * Age + Bit.fall * Age * Age);
    if (Bit.stop !== undefined) Y = Math.min(Y, Bit.stop);                       // leaves and petals settle on the ground
    if (Bit.hop) Y -= Math.round(Math.abs(Math.sin(Age * 7)) * 4);                 // the rabbit bounces as it goes
    const Moment = Math.floor(Age * 6) % 2;
    if (Bit.sprite)
    {
      Sprite(Pen, X, Y, SPRITES[Bit.sprite][Moment], SPRITE_COLOURS);
      continue;
    }
    const Colour = Bit.fade ? Bit.colour.replace("A", (Bit.fade * (1 - Age / Bit.life)).toFixed(3)) : Age > Bit.life * 0.5 && Bit.later ? Bit.later : Bit.colour;
    if (Bit.tumble && Moment) Rect(Pen, X, Y, Bit.h, Bit.w, Colour);
    else Rect(Pen, X, Y, Bit.w, Bit.h, Colour);
  }
  for (let i = Doodles.length - 1; i >= 0; i--)
  {
    const Doodle = Doodles[i];
    const Age = (Now - Doodle.at) / 1000;
    if (Age > 5) { Doodles.splice(i, 1); continue; }
    if (Age < 0) continue;
    const Fade = Age < 4 ? 0.45 : 0.45 * (5 - Age);
    Disc(Pen, Doodle.x, Doodle.y, 9, `rgba(215,225,240,${(Fade * 0.5).toFixed(3)})`);
    Sprite(Pen, Doodle.x - 4, Doodle.y - 4, SMILEY, { w: `rgba(40,50,70,${Fade.toFixed(3)})` });
  }
}

// The Sparks function sends a burst of sparks up from a fire
function Sparks(X, Y, Count, Spread)
{
  for (let n = 0; n < Count; n++) AddBit({ x: X + (Math.random() - 0.5) * Spread, y: Y, vx: (Math.random() - 0.5) * 12, vy: -(16 + Math.random() * 26), sway: 1.2, at: performance.now() + Math.random() * 400, life: 1.2 + Math.random() * 0.9, colour: "#FFD15C", later: "#FF7A2A" });
}

// The Smoke function sends puffs of smoke or steam up from a spot
function Smoke(X, Y, Count, Colour, Rise)
{
  for (let n = 0; n < Count; n++) AddBit({ x: X, y: Y, vx: 2 + Math.random() * 2, vy: -(Rise || 7), sway: 1, w: 2, h: 2, at: performance.now() + n * 160, life: 1.8, colour: Colour || "rgba(200,196,190,A)", fade: 0.7 });
}

// The Shower function drops leaves, petals or snow from a tree, they flutter down and settle on the ground
function Shower(Spot, Count, Colours, Ground, Tumble)
{
  for (let n = 0; n < Count; n++)
  {
    AddBit({
      x: Spot.x + Math.random() * Spot.w, y: Spot.y + Math.random() * Spot.h * 0.7,
      vx: 2 + Math.random() * 4, vy: 3 + Math.random() * 3, fall: 2 + Math.random() * 3, sway: 2,
      w: 2, h: 1, tumble: Tumble, stop: Ground - Math.floor(Math.random() * 3),
      at: performance.now() + Math.random() * 900, life: 4 + Math.random() * 1.5,
      colour: Colours[n % Colours.length],
    });
  }
}

// The Ripple function sends rings out from a spot, like the sound of a bell
function Ripple(X, Y, Colour)
{
  [0, 350, 700].forEach((Delay) => Glows.push({ x: X, y: Y, size: 4, colour: Colour, at: performance.now() + Delay, life: 1.2, ring: true }));
}


// Section: What can be pressed in each background

// The TempleLanterns function lists the stone lanterns beside the temple steps, the same way DrawTemple places them
function TempleLanterns(W, H)
{
  const Cx = W >> 1, StepsTop = Math.round(H * 0.5);
  const Spots = [];
  [0.35, 0.6, 0.85].forEach((Near) =>
  {
    const y = StepsTop + Math.round(Near * (H - StepsTop)), Half = Math.round(10 + Near * W * 0.18), Size = 1 + Near;
    [-1, 1].forEach((Side) =>
    {
      const Lx = Cx + Side * (Half + 6 + Math.round(Near * 6));
      Spots.push({ x: Lx - 3 * Size, y: y - 10 * Size, w: 6 * Size, h: 10 * Size, cx: Lx, cy: y - 6 * Size, size: Size });
    });
  });
  return Spots;
}

// The CatPressSpot function is the sleeping cat in an indoor background, pressing it pets it and hearts float up
function CatPressSpot(Id, W, H)
{
  const Spot = CAT_SPOTS[Id](W, H);
  return { name: "the cat", x: Spot.x - 2, y: Spot.y - 3, w: 17, h: 9, skip: () => CatOut, press: (Pressed) => { for (let n = 0; n < 3; n++) AddBit({ sprite: "heart", x: Pressed.x + 4 + n * 3, y: Pressed.y - 2, vy: -7, sway: 0.8, at: performance.now() + n * 300, life: 1.6 }); } };
}

// ROOM_EXTRAS holds, for each background, the things that can be pressed (worked out from the same sums its Draw function uses), what each does, and what typing cozy does there
const ROOM_EXTRAS = {
  cabin: {
    spots: (W, H) =>
    {
      const FloorY = Math.round(H * 0.8), Cx = W >> 1;
      const Fw = Math.round(Math.min(72, Math.max(46, W * 0.36))), Fh = Math.round(Math.min(58, Math.max(34, H * 0.4)));
      const Fx = Cx - (Fw >> 1), Fy = FloorY - Fh, RugY = FloorY + Math.round((H - FloorY) * 0.38);
      return [
        CatPressSpot("cabin", W, H),
        { name: "a candle", x: Fx + 1, busy: 4000, y: Fy - 13, w: 5, h: 10, press: (Spot) => { BlownOut.cabin0 = performance.now() + 4000; Smoke(Spot.x + 2, Spot.y, 5); } },
        { name: "a candle", x: Fx + Fw - 5, busy: 4000, y: Fy - 12, w: 5, h: 9, press: (Spot) => { BlownOut.cabin1 = performance.now() + 4000; Smoke(Spot.x + 2, Spot.y, 5); } },
        { name: "the fire", x: Fx, y: Fy, w: Fw, h: Fh, press: () => { Sparks(Cx, FloorY - 10, 36, 16); AddGlow(Cx, FloorY - 12, 30, "rgba(255,170,60,A)"); } },
      ];
    },
    cozy: (W, H) => { const FloorY = Math.round(H * 0.8); Sparks(W >> 1, FloorY - 10, 50, 18); AddGlow(W >> 1, FloorY - 12, Math.min(W, H) * 0.6, "rgba(255,160,70,A)", 2.4); for (let n = 0; n < 3; n++) AddBit({ sprite: "heart", x: (W >> 1) + 12 + n * 3, y: FloorY + 2, vy: -8, sway: 0.8, at: performance.now() + 600 + n * 300, life: 1.6 }); },
    cat: true,
  },
  woodland: {
    spots: (W, H) =>
    {
      const Ground = Math.round(H * 0.7), NearH = Math.round(Math.min(H * 0.62, 110));
      const Tree = (Cx, Base, Tall) => ({ name: "a big pine", x: Cx - Tall * 0.28, y: Base - Tall, w: Tall * 0.56, h: Tall, press: (Spot) =>
      {
        Shower({ x: Spot.x + Spot.w * 0.2, y: Spot.y + Spot.h * 0.2, w: Spot.w * 0.6, h: Spot.h * 0.5 }, 14, ["#2A5E3E", "#3E7A45", "#5FA052"], H - 2, false);
        AddBit({ sprite: "bird", x: Cx, y: Base - Tall * 0.7, vx: (Cx < W / 2 ? 1 : -1) * 26, vy: -20, life: 3 });
      } });
      return [
        { name: "the path", x: (W >> 1) - 16, y: Ground + (H - Ground) * 0.35, w: 32, h: (H - Ground) * 0.65, press: (Spot) => AddBit({ sprite: "rabbit", x: -6, y: Spot.y + Spot.h * 0.4, vx: W / 3.2, sway: 0, life: 3.4, hop: true }) },
        Tree(Math.round(W * 0.06), H - 4, NearH),
        Tree(Math.round(W * 0.95), H - 2, Math.round(NearH * 0.9)),
      ];
    },
    cozy: (W, H) => { for (let n = 0; n < 40; n++) AddBit({ x: Math.random() * W, y: H * (0.2 + Math.random() * 0.6), vx: (Math.random() - 0.5) * 6, vy: -3, sway: 2, at: performance.now() + Math.random() * 800, life: 2.5, colour: "#FFF6C8" }); AddGlow(W * 0.65, H * 0.3, W * 0.5, "rgba(255,246,190,A)", 2.6); },
  },
  campfire: {
    spots: (W, H) =>
    {
      const Cx = W >> 1, FireY = Math.round(H * 0.84), MoonX = Math.round(W * 0.78), MoonY = Math.round(H * 0.16), TentX = Cx - 44;
      return [
        { name: "the fire", x: Cx - 10, y: FireY - 22, w: 20, h: 24, press: () => { Sparks(Cx, FireY - 6, 34, 10); AddGlow(Cx, FireY - 6, 26, "rgba(255,170,60,A)"); } },
        { name: "the tent", x: TentX, y: FireY - 22, w: 30, h: 20, press: (Spot) => { AddGlow(TentX + 15, FireY - 6, 10, "rgba(255,210,120,A)", 2.4); SayAt(Spot.x + Spot.w / 2, Spot.y, "zzz"); } },
        { name: "the moon", x: MoonX - 9, y: MoonY - 9, w: 18, h: 18, press: () => { for (let n = 0; n < 4; n++) AddBit({ x: MoonX - 14 - n, y: MoonY - 6 - n, vx: -W * 0.5, vy: H * 0.12, life: 0.9, at: performance.now() + n * 20, colour: n ? "rgba(255,246,216,A)" : "#FFF6D8", fade: n ? 0.8 - n * 0.18 : 0 }); } },
      ];
    },
    cozy: (W, H) => { const FireY = Math.round(H * 0.84); Sparks(W >> 1, FireY - 6, 50, 12); AddGlow(W >> 1, FireY - 6, Math.min(W, H) * 0.5, "rgba(255,160,70,A)", 2.4); for (let n = 0; n < 24; n++) AddBit({ x: Math.random() * W, y: H * (0.55 + Math.random() * 0.35), vx: (Math.random() - 0.5) * 8, vy: -4, sway: 2, at: performance.now() + Math.random() * 900, life: 2.6, colour: "#D8F27A" }); },
  },
  snow: {
    spots: (W, H) =>
    {
      const Cx = W >> 1, BaseY = Math.round(H * 0.76), X0 = Cx - 24, WallY = BaseY - 20, NearH = Math.round(Math.min(H * 0.6, 100));
      const Tree = (Cx2, Base, Tall) => ({ name: "a snowy pine", x: Cx2 - Tall * 0.28, y: Base - Tall, w: Tall * 0.56, h: Tall, press: (Spot) => Shower({ x: Spot.x + Spot.w * 0.15, y: Spot.y + Spot.h * 0.1, w: Spot.w * 0.7, h: Spot.h * 0.6 }, 26, ["#FFFFFF", "#EEF1F8", "#D5DCEE"], H - 2, false) });
      return [
        { name: "the chimney", x: X0 + 34, y: WallY - 22, w: 8, h: 14, press: () => { for (let n = 0; n < 8; n++) AddBit({ x: X0 + 38, y: WallY - 24, vx: 4 + n, vy: -10, sway: 1.5, w: 3, h: 3, at: performance.now() + n * 120, life: 2.4, colour: "rgba(214,218,232,A)", fade: 0.8 }); } },
        { name: "the cabin", busy: 1500, x: X0, y: WallY - 15, w: 48, h: 35, press: () => { LightsOffUntil = performance.now() + 1400; } },
        Tree(Math.round(W * 0.05), H - 2, NearH),
        Tree(Math.round(W * 0.96), H - 1, Math.round(NearH * 0.85)),
      ];
    },
    cozy: (W, H) => { const BaseY = Math.round(H * 0.76); AddGlow(W >> 1, BaseY - 10, 40, "rgba(255,210,130,A)", 2.6); for (let n = 0; n < 10; n++) AddBit({ x: (W >> 1) + 14, y: BaseY - 44, vx: 4 + n * 0.6, vy: -10, sway: 1.5, w: 3, h: 3, at: performance.now() + n * 150, life: 2.6, colour: "rgba(214,218,232,A)", fade: 0.8 }); },
  },
  cafe: {
    spots: (W, H) =>
    {
      const SillY = Math.round(H * 0.74), Gx = Math.round(W * 0.08), Gy = Math.round(H * 0.12), Gw = W - Gx * 2, Gh = SillY - Gy - 4;
      const Mx = Math.round(W * 0.66), Px = Math.round(W * 0.24), Lx = W >> 1;
      return [
        CatPressSpot("cafe", W, H),
        { name: "the mug", x: Mx - 2, y: SillY - 10, w: 13, h: 10, press: () => { Smoke(Mx + 3, SillY - 9, 6, "rgba(240,235,225,A)", 9); AddBit({ sprite: "heart", x: Mx + 1, y: SillY - 12, vy: -8, sway: 1, at: performance.now() + 500, life: 1.8 }); } },
        { name: "the plant", x: Px - 2, y: SillY - 12, w: 10, h: 12, press: () => Shower({ x: Px - 1, y: SillY - 11, w: 8, h: 4 }, 2, ["#4E8C5F", "#3F7A45"], SillY - 1, true) },
        { name: "the lamp", x: Lx - 6, y: 0, w: 13, h: Math.max(8, Gy - 2), press: () => AddGlow(Lx, Gy, Math.min(W, H) * 0.35, "rgba(255,190,110,A)", 2) },
        { name: "the glass", busy: 400, x: Gx, y: Gy, w: Gw, h: Gh, press: (Spot, At) => { Doodles.push({ x: At.x, y: At.y, at: performance.now() }); } },
      ];
    },
    cat: true,
    cozy: (W, H) => { const Gy = Math.round(H * 0.12); AddGlow(W >> 1, Gy, Math.min(W, H) * 0.6, "rgba(255,180,100,A)", 2.6); Doodles.push({ x: W / 2 - 14, y: H * 0.4, at: performance.now() }, { x: W / 2 + 14, y: H * 0.45, at: performance.now() + 400 }); },
  },
  autumn: {
    spots: (W, H) =>
    {
      const Horizon = Math.round(H * 0.55), Ground = Math.round(H * 0.68), NearH = Math.round(Math.min(H * 0.7, 120));
      const Fall = ["#E8A23A", "#C2502A", "#D9822B", "#F2C25A"];
      const Tree = (Cx, Tall) => ({ name: "a big oak", x: Cx - Tall * 0.35, y: H - Tall * 0.95, w: Tall * 0.7, h: Tall * 0.6, press: (Spot) => Shower(Spot, 22, Fall, H - 2, true) });
      return [
        { name: "the leaf path", busy: 600, x: (W >> 1) - 14, y: Ground + (H - Ground) * 0.4, w: 28, h: (H - Ground) * 0.6, press: (Spot, At) => { for (let n = 0; n < 14; n++) AddBit({ x: At.x + (Math.random() - 0.5) * 8, y: At.y, vx: (Math.random() - 0.5) * 30, vy: -(10 + Math.random() * 14), fall: 14, w: 2, h: 1, tumble: true, stop: At.y + 2, at: performance.now(), life: 2.4, colour: Fall[n % 4] }); } },
        Tree(Math.round(W * 0.06), NearH),
        Tree(Math.round(W * 0.95), Math.round(NearH * 0.9)),
      ];
    },
    cozy: (W, H) => { AddGlow(Math.round(W * 0.7), Math.round(H * 0.55), W * 0.6, "rgba(255,210,140,A)", 2.6); Shower({ x: 0, y: 0, w: W, h: H * 0.3 }, 40, ["#E8A23A", "#C2502A", "#D9822B", "#F2C25A"], H - 2, true); },
  },
  attic: {
    spots: (W, H) =>
    {
      const FloorY = Math.round(H * 0.82), Dx = Math.round(W * 0.66), Dy = FloorY - 12, Kx = Math.round(W * 0.3), Ky = FloorY - 22;
      const Plant = (Spot, i) =>
      {
        const Px = Math.round(W * Spot), Drop = Math.round(FloorY * (0.18 + i * 0.06));
        return { name: "a hanging plant", x: Px - 5, y: Drop - 2, w: 11, h: 14, press: () => Shower({ x: Px - 4, y: Drop + 4, w: 9, h: 4 }, 2, ["#4E8C5F", "#3F7A45"], FloorY + 2, true) };
      };
      return [
        CatPressSpot("attic", W, H),
        { name: "the clock", busy: 2400, x: Kx - 5, y: Ky - 1, w: 11, h: 23, press: (Spot) => { Ripple(Kx, Ky + 4, "rgba(237,227,200,A)"); [0, 700, 1400].forEach((Delay) => setTimeout(() => SayAt(Spot.x + Spot.w / 2, Spot.y, "dong"), Delay)); } },
        { name: "the lamp", x: Dx - 11, y: Dy - 13, w: 9, h: 13, press: () => AddGlow(Dx - 7, Dy - 6, 22, "rgba(255,200,110,A)", 2) },
        Plant(0.3, 0), Plant(0.68, 1),
      ];
    },
    cat: true,
    cozy: (W, H) => { const FloorY = Math.round(H * 0.82); AddGlow(Math.round(W * 0.66) - 7, FloorY - 18, Math.min(W, H) * 0.5, "rgba(255,190,100,A)", 2.6); for (let n = 0; n < 30; n++) AddBit({ x: Math.random() * W, y: Math.random() * FloorY, vx: 1, vy: -1.5, sway: 1.5, at: performance.now() + Math.random() * 900, life: 2.8, colour: "rgba(240,230,200,A)", fade: 0.8 }); },
  },
  library: {
    spots: (W, H) =>
    {
      const FloorY = Math.round(H * 0.84), Cx = W >> 1, Ty = FloorY - 9;
      const Aw = Math.round(Math.min(W * 0.26, H * 0.36)), Ax = Cx - (Aw >> 1), SideW = Ax - 6, Sy = Math.round(H * 0.32);
      const Sconce = (Sx, i) => ({ name: "a candle sconce", busy: 4000, x: Sx - 3, y: Sy - 8, w: 7, h: 10, press: () => { BlownOut["library" + i] = performance.now() + 4000; Smoke(Sx, Sy - 7, 5); } });
      return [
        CatPressSpot("library", W, H),
        { name: "the green lamp", x: Cx + 9, y: Ty - 10, w: 12, h: 10, press: () => AddGlow(Cx + 15, Ty - 3, 24, "rgba(255,220,140,A)", 2) },
        { name: "the open book", x: Cx - 16, y: Ty - 5, w: 12, h: 6, press: () => { for (let n = 0; n < 5; n++) AddBit({ sprite: "page", x: Cx - 12, y: Ty - 4, vx: (Math.random() - 0.3) * 16, vy: -(8 + Math.random() * 8), fall: 5, sway: 2, at: performance.now() + n * 160, life: 2.6 }); } },
        Sconce(Math.round(SideW * 0.25), 0), Sconce(W - Math.round(SideW * 0.25), 1),
      ];
    },
    cat: true,
    cozy: (W, H) => { const FloorY = Math.round(H * 0.84), Aw = Math.round(Math.min(W * 0.26, H * 0.36)), Ax = (W >> 1) - (Aw >> 1); AddGlow(W >> 1, FloorY - 12, Math.min(W, H) * 0.5, "rgba(255,210,140,A)", 2.6); for (let n = 0; n < 40; n++) AddBit({ x: Ax + Math.random() * Aw, y: H * 0.3 + Math.random() * (FloorY - H * 0.3), vx: 1, vy: -2, sway: 1.5, at: performance.now() + Math.random() * 900, life: 2.8, colour: "rgba(240,235,210,A)", fade: 0.9 }); },
  },
  temple: {
    spots: (W, H) =>
    {
      const Cx = W >> 1, TempleY = Math.round(H * 0.5), Tw = Math.round(Math.min(W * 0.3, 70)), Tall = Math.min(H * 0.7, 130);
      const Petals = ["#FBE0E6", "#EFA8BC", "#F2B8C6"];
      const Tree = (TreeX, Base, Height) => { const R = Height * 0.32; return { name: "a cherry tree", x: TreeX - R * 1.1, y: Base - Height * 0.45 - R * 1.1, w: R * 2.2, h: R * 1.3, press: (Spot) => Shower(Spot, 26, Petals, H - 2, true) }; };
      const Lanterns = TempleLanterns(W, H).map((Spot) => Object.assign(Spot, { name: "a stone lantern", press: () => AddGlow(Spot.cx, Spot.cy, 9 * Spot.size, "rgba(255,210,140,A)", 2) }));
      return [
        ...Lanterns,
        { name: "the temple bell", x: Cx - (Tw >> 1), y: TempleY - 42, w: Tw, h: 42, press: (Spot) => { Ripple(Cx, TempleY - 30, "rgba(255,240,220,A)"); SayAt(Spot.x + Spot.w / 2, Spot.y, "dong"); } },
        Tree(Math.round(W * 0.12), H + 4, Tall), Tree(Math.round(W * 0.88), H + 6, Tall * 0.95),
      ];
    },
    cozy: (W, H) => { TempleLanterns(W, H).forEach((Spot, i) => setTimeout(() => AddGlow(Spot.cx, Spot.cy, 10 * Spot.size, "rgba(255,210,140,A)", 2.2), i * 150)); Shower({ x: 0, y: 0, w: W, h: H * 0.4 }, 40, ["#FBE0E6", "#EFA8BC"], H - 2, true); },
  },
  keeper: {
    spots: (W, H) =>
    {
      const SillY = Math.round(H * 0.7), Ww = Math.round(Math.min(W * 0.62, H * 0.95)), Wx = (W - Ww) >> 1, Wy = Math.round(H * 0.16), Wh = SillY - Wy - 3;
      const SeaTop = Wy + Math.round(Wh * 0.55), Lx = Wx + Math.round(Ww * 0.72), LBase = SeaTop + 6, LTall = Math.round(Wh * 0.55);
      const Ox = Math.round(W * 0.3), Oy = SillY + 6, Kx = Math.round(W * 0.62);
      return [
        CatPressSpot("keeper", W, H),
        { name: "the lighthouse", x: Lx - 6, y: LBase - LTall - 9, w: 12, h: LTall + 10, press: () => { AddGlow(Lx, LBase - LTall - 3, Ww * 0.45, "rgba(255,240,190,A)", 1.4); } },
        { name: "the oil lamp", x: Ox - 3, y: Oy - 12, w: 8, h: 12, press: () => AddGlow(Ox + 1, Oy - 6, 22, "rgba(255,200,110,A)", 2) },
        { name: "the kettle", x: Kx - 1, y: Oy - 10, w: 13, h: 10, press: (Spot) => { Smoke(Kx + 11, Oy - 8, 9, "rgba(240,240,240,A)", 12); SayAt(Spot.x + Spot.w, Spot.y, "♪"); } },
      ];
    },
    cat: true,
    cozy: (W, H) => { const SillY = Math.round(H * 0.7), Oy = SillY + 6; AddGlow(Math.round(W * 0.3) + 1, Oy - 6, Math.min(W, H) * 0.55, "rgba(255,190,100,A)", 2.6); Smoke(Math.round(W * 0.62) + 11, Oy - 8, 8, "rgba(240,240,240,A)", 12); },
  },
};



// Section: Pressing the room

// The RoomSpotAt function finds which thing in the background is under a point on the screen, if nothing on the page is in front of it there
function RoomSpotAt(X, Y)
{
  const Extras = ROOM_EXTRAS[Current.id];
  if (!Extras || document.querySelector("dialog[open]")) return null;
  const Top = document.elementFromPoint(X, Y);
  if (!Top || Top.closest("button, a, input, select, textarea, label, dialog, .book, .plaque, .tabs-row, .ornament, .wander-cat, .shelf, .say-bubble, .undo-note, .signal-sign, .member-chip")) return null;
  const Box = Canvas.getBoundingClientRect();
  const At = { x: (X - Box.left) / Box.width * Canvas.width, y: (Y - Box.top) / Box.height * Canvas.height };
  const Spot = Extras.spots(Canvas.width, Canvas.height).find((Each) => (!Each.skip || !Each.skip()) && At.x >= Each.x && At.x < Each.x + Each.w && At.y >= Each.y && At.y < Each.y + Each.h);
  return Spot ? { spot: Spot, at: At } : null;
}

// The RoomToScreen function gives where a thing in the background sits on the screen
function RoomToScreen(Spot)
{
  const Box = Canvas.getBoundingClientRect();
  const Scale = Box.width / Canvas.width;
  const Left = Box.left + Spot.x * Scale, Top = Box.top + Spot.y * Scale;
  return { left: Left, top: Top, width: Spot.w * Scale, height: Spot.h * Scale, right: Left + Spot.w * Scale, bottom: Top + Spot.h * Scale };
}

// Busy holds, for each thing in the room, how many times it has been pressed during its current little show: up to three presses add on, after that it waits until the show is over
const Busy = {};
document.addEventListener("click", (event) =>
{
  const Found = RoomSpotAt(event.clientX, event.clientY);
  if (!Found) return;
  const Key = Current.id + Found.spot.name + Math.round(Found.spot.x);
  const Now = performance.now();
  const Was = Busy[Key] && Busy[Key].until > Now ? Busy[Key] : { count: 0, until: 0 };
  if (Was.count >= 3) return;
  Busy[Key] = { count: Was.count + 1, until: Now + (Found.spot.busy || 1800) };
  Found.spot.press(Found.spot, Found.at);
  if (!MotionOn) DrawFrame(20);                                                // with a still background the frame is drawn again so the press shows
});

// Over something that can be pressed, the pointer becomes a hand and a little twinkle shows it
let LastHinted = null;
document.addEventListener("mousemove", (event) =>
{
  const Found = RoomSpotAt(event.clientX, event.clientY);
  document.body.classList.toggle("over-room-spot", Boolean(Found));
  const Name = Found ? Found.spot.name + Found.spot.x : null;
  if (Found && Name !== LastHinted) Twinkle(RoomToScreen(Found.spot));
  LastHinted = Name;
});

// The Twinkle function shows a small four-pointed twinkle at the top corner of something that can be pressed
function Twinkle(Place)
{
  const Star = Make("span", "press-twinkle");
  Star.setAttribute("aria-hidden", "true");
  Star.style.left = Place.left + Place.width - 6 + "px";
  Star.style.top = Place.top - 6 + "px";
  document.body.append(Star);
  setTimeout(() => Star.remove(), 900);
}

// The Pressables function lists the things in this background that can be pressed and are showing right now (not behind the shelves)
function Pressables()
{
  const Extras = ROOM_EXTRAS[Current.id];
  if (!Extras) return [];
  return Extras.spots(Canvas.width, Canvas.height).filter((Spot) => !Spot.skip || !Spot.skip()).map((Spot) => RoomToScreen(Spot)).filter((Place) =>
  {
    return [[0.5, 0.5], [0.3, 0.3], [0.7, 0.3], [0.3, 0.7], [0.7, 0.7]].some(([Fx, Fy]) => RoomSpotAt(Place.left + Place.width * Fx, Place.top + Place.height * Fy));
  });
}

// Now and then one thing in the background twinkles by itself, as a hint that it does something (on a phone there is no pointer to find them with)
setInterval(() =>
{
  if (!MotionOn || document.hidden) return;
  const Places = Pressables();
  if (Places.length) Twinkle(Places[Math.floor(Math.random() * Places.length)]);
}, 30000);


// Section: Words typed on the page

// SECRET_WORDS holds the words that do something when typed anywhere (not in a box): the books hop, the background gets cozy, and the cat answers where there is one
const SECRET_WORDS = {
  itsuka: () => BooksHop(),
  cozy: () => { const Extras = ROOM_EXTRAS[Current.id]; if (Extras) Extras.cozy(Canvas.width, Canvas.height); },
  meow: () => CatSays(),
};
let Typed = "";
document.addEventListener("keydown", (event) =>
{
  if (event.target.closest("input, textarea, select, [contenteditable]") || document.querySelector("dialog[open]") || event.key.length !== 1) return;
  Typed = (Typed + event.key.toLowerCase()).slice(-10);
  Object.keys(SECRET_WORDS).forEach((Word) =>
  {
    if (!Typed.endsWith(Word)) return;
    Typed = "";
    SECRET_WORDS[Word]();
  });
});

// The BooksHop function sets the books hopping in a wave along the shelves
function BooksHop()
{
  LibraryRoot.querySelectorAll(".book").forEach((Elem, i) =>
  {
    Elem.style.setProperty("--hop-delay", i * 70 + "ms");
    Elem.classList.remove("is-hopping");
    void Elem.offsetWidth;
    Elem.classList.add("is-hopping");
    setTimeout(() => Elem.classList.remove("is-hopping"), 800 + i * 70);
  });
}

// The CatSays function has the cat answer back, only in a background with a cat (the indoor ones), from the shelf if it is out or from its sleeping spot
function CatSays()
{
  if (!CAT_SPOTS[Current.id]) return;
  if (Kitty.cat) { Say(Kitty.cat, "meow?"); return; }
  const Cat = CAT_SPOTS[Current.id](Canvas.width, Canvas.height);
  SayAt(Cat.x + 6, Cat.y, "meow?");
}
