// This file contains the pixel-art scenes, the background picker and the colour themes, it loads first as library.js uses some of its functions

// Canvas is the sheet behind the page and Ctx is the pen that draws on it
const Canvas = document.getElementById("backdrop");
const Ctx = Canvas.getContext("2d");

// Small helpers used by every scene:

// The Hash function returns a repeatable random number between 0 and 1 for any pair of numbers, so a scene looks the same every time
function Hash(x, y)
{
  const v = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return v - Math.floor(v);
}

// The Rect function paints one filled rectangle snapped to whole dots
function Rect(c, x, y, w, h, Colour)
{
  c.fillStyle = Colour;
  c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

// The Disc function paints a filled circle built from rows of dots so its edge stays blocky
function Disc(c, Cx, Cy, r, Colour)
{
  c.fillStyle = Colour;
  Cx = Math.round(Cx); Cy = Math.round(Cy); r = Math.round(r);
  for (let Dy = -r; Dy <= r; Dy++)
  {
    const Half = Math.floor(Math.sqrt(r * r - Dy * Dy));
    c.fillRect(Cx - Half, Cy + Dy, Half * 2 + 1, 1);
  }
}

// The Bands function paints horizontal stripes of colour between two heights (skies, snow and grass)
function Bands(c, W, Top, Bottom, Colours)
{
  const Step = (Bottom - Top) / Colours.length;
  Colours.forEach((Colour, i) => Rect(c, 0, Top + i * Step, W, Step + 1, Colour));
}

// The Sprite function paints a small picture written as rows of letters, each letter is looked up in the colours and a dot means empty
function Sprite(c, x, y, Rows, Colours)
{
  Rows.forEach((Row, j) =>
  {
    for (let i = 0; i < Row.length; i++)
    {
      if (Colours[Row[i]]) Rect(c, x + i, y + j, 1, 1, Colours[Row[i]]);
    }
  });
}

// The Pine function paints a pine tree made of stacked triangles, light on the left and shaded on the right with snow on top if given
function Pine(c, Cx, BaseY, Height, Light, Dark, Snow, TrunkColour)
{
  const Trunk = Math.max(2, Math.round(Height * 0.12));
  Rect(c, Cx - 1, BaseY - Trunk, 2, Trunk, TrunkColour || "#2E1C10");
  const Rows = Height - Trunk;
  const Tiers = Math.max(3, Math.round(Height / 9));
  const TierRows = Rows / Tiers;
  for (let r = 0; r < Rows; r++)
  {
    const Tier = Math.floor(r / TierRows);
    const Within = (r - Tier * TierRows) / TierRows;                 // 0 at the top of a tier, 1 at its bottom
    const Half = Math.max(1, Math.round(((Tier + 1) / Tiers) * Height * 0.28 * (0.35 + 0.65 * Within)));
    const y = BaseY - Height + r;
    Rect(c, Cx - Half, y, Half, 1, Light);
    Rect(c, Cx, y, Half, 1, Dark);
    if (Snow && Within < 0.3) Rect(c, Cx - Half, y, Half + 1, 1, Snow);
  }
}

// The Forest function paints a row of pines across the screen
function Forest(c, W, BaseY, MinH, MaxH, Spacing, Seed, Light, Dark, Snow, TrunkColour)
{
  for (let i = -1; i * Spacing < W + Spacing; i++)
  {
    const Cx = Math.round(i * Spacing + Hash(i, Seed) * Spacing * 0.7);
    const Height = Math.round(MinH + Hash(i, Seed + 5) * (MaxH - MinH));
    Pine(c, Cx, BaseY + Math.round(Hash(i, Seed + 9) * 3), Height, Light, Dark, Snow, TrunkColour);
  }
}

// The Fire function paints the flames and a few sparks, time moves in steps so it flickers like old game art
function Fire(c, Cx, BaseY, Width, Height, t)
{
  const Step = Math.floor(t * 10) / 10;
  for (let i = 0; i < Width; i++)
  {
    const FromMiddle = 1 - Math.abs(i - (Width - 1) / 2) / (Width / 2);         // 1 in the middle, 0 at the sides
    const Wave = 0.5 + 0.25 * Math.sin(i * 0.9 + Step * 9) + 0.15 * Math.sin(i * 1.7 - Step * 13) + 0.1 * Math.sin(i * 0.4 + Step * 5);
    const Tall = Math.round(Height * Wave * Math.pow(FromMiddle, 0.6));
    for (let j = 0; j < Tall; j++)
    {
      const Heat = (1 - j / Tall) * Math.sqrt(FromMiddle);                       // hottest low down in the middle
      const Colour = Heat > 0.72 ? "#FFF1B8" : Heat > 0.5 ? "#FFD15C" : Heat > 0.3 ? "#FF9A3C" : Heat > 0.15 ? "#EE6A26" : "#C23E1A";
      Rect(c, Cx - (Width >> 1) + i, BaseY - 1 - j, 1, 1, Colour);
    }
  }
  // A few sparks drifting up out of the fire
  for (let n = 0; n < 6; n++)
  {
    const Life = (t * 0.45 + n * 0.17) % 1;
    if (Hash(n, Math.floor(t * 10)) > 0.35)
    {
      Rect(c, Cx + Math.sin(n * 12.9 + Life * 6) * Width * 0.45, BaseY - Height * 0.7 - Life * Height * 1.6, 1, 1, Life < 0.5 ? "#FFD15C" : "#EE6A26");
    }
  }
}

// The FireGlow function paints the warm light around a fire as a few see-through circles that pulse with the flames
function FireGlow(c, Cx, Cy, Size, t)
{
  const Pulse = 0.85 + 0.15 * Math.sin(Math.floor(t * 10) * 1.7);
  [[1.9, 0.05], [1.45, 0.06], [1.05, 0.08], [0.7, 0.09]].forEach(([Scale, Strength]) =>
  {
    Disc(c, Cx, Cy, Size * Scale, `rgba(255,150,60,${Strength * Pulse})`);
  });
}

// Scene 1 (a log cabin with a fireplace):

// The CabinWindow function paints one cabin window looking out on a snowy night
function CabinWindow(c, x, y, w, h, t)
{
  Rect(c, x, y, w, h, "#3A2314");                                     // frame
  Rect(c, x + 2, y + 2, w - 4, h - 4, "#141C3D");                     // night sky through the glass
  Rect(c, x + 2, y + 2 + (h - 4) * 0.5, w - 4, (h - 4) * 0.5, "#1B2650");
  for (let i = 0; i * 5 < w - 4; i++)
{                               // far trees outside
    const Th = 4 + Math.round(Hash(i, x) * 5);
    Rect(c, x + 2 + i * 5, y + h - 4 - Th, 3, Th, "#0D1530");
  }
  for (let n = 0; n < Math.round(w * h / 60); n++)
{                  // snow falling outside
    const Sx = x + 2 + Math.floor(Hash(n, 1 + x) * (w - 4));
    const Sy = y + 2 + Math.floor((Hash(n, 2 + x) * (h - 4) + t * 5 * (0.5 + Hash(n, 3))) % (h - 4));
    Rect(c, Sx, Sy, 1, 1, "#DCE5F5");
  }
  Rect(c, x + 2, y + h - 4, w - 4, 2, "#C4CFE6");                     // snow piled on the outside ledge
  Rect(c, x + (w >> 1) - 1, y, 2, h, "#3A2314");                      // the cross in the middle
  Rect(c, x, y + (h >> 1) - 1, w, 2, "#3A2314");
  Rect(c, x - 1, y + h, w + 2, 2, "#5E3C24");                         // sill
}

// CatShape and CatColours hold the sleeping cat as a picture made of letters
const CatShape = [
  "..o.o........",
  ".ooooo.ssos..",
  "oooooooooosoo",
  "ooooooooooooo",
  ".oooooooooott",
  "...ttttttttt.",
];
const CatColours = { o: "#D98A3A", s: "#B4682A", t: "#C27A32" };

// The DrawCabin function paints scene 1: a log cabin with a fireplace
function DrawCabin(c, W, H, t)
{
  const Tick = Math.floor(t * 8);
  const FloorY = Math.round(H * 0.8);
  const Cx = W >> 1;

  // Log wall
  for (let y = 0, Row = 0; y < FloorY; y += 7, Row++)
  {
    Rect(c, 0, y, W, 7, Row % 2 ? "#5A3921" : "#633F25");
    Rect(c, 0, y, W, 1, "#734B2C");
    Rect(c, 0, y + 6, W, 1, "#3B2415");
    for (let x = 0; x < W; x++)
    {
      if (Hash(x * 0.37, Row) > 0.93) Rect(c, x, y + 2 + Math.floor(Hash(x, Row * 7) * 3), 3, 1, "#4E3019");
    }
  }
  // Floorboards
  Rect(c, 0, FloorY, W, H - FloorY, "#4A2E1A");
  Rect(c, 0, FloorY, W, 1, "#2A190E");
  for (let x = Cx % 14; x < W; x += 14) Rect(c, x, FloorY + 1, 1, H - FloorY, "#3A2314");

  // The fireplace's size adapts a little to the screen
  const Fw = Math.round(Math.min(72, Math.max(46, W * 0.36)));
  const Fh = Math.round(Math.min(58, Math.max(34, H * 0.4)));
  const Fx = Cx - (Fw >> 1), Fy = FloorY - Fh;

  // Above the mantel: a big window if the wall is tall (phones), otherwise a small framed picture
  const SpaceAbove = Fy - 4;
  if (SpaceAbove >= 70)
  {
    const Wh = Math.min(60, SpaceAbove - 30);
    CabinWindow(c, Cx - 24, Fy - 16 - Wh, 48, Wh, t);
  }
  else if (SpaceAbove >= 22)
  {
    const Py = Math.round(SpaceAbove / 2) - 7;
    Rect(c, Cx - 12, Py, 24, 15, "#C9A14A");
    Rect(c, Cx - 10, Py + 2, 20, 11, "#9CC7D8");
    Rect(c, Cx - 10, Py + 8, 20, 5, "#4E8C5F");
    Disc(c, Cx + 4, Py + 5, 2, "#FFE9A3");
  }
  // Windows either side of the fireplace when the screen is wide (laptops)
  const SideSpace = Fx - 4;
  if (SideSpace >= 40)
  {
    const Wy = Math.max(6, Math.round(FloorY * 0.3));
    const Wh = Math.min(36, FloorY - Wy - 16);
    CabinWindow(c, Math.round(SideSpace / 2) - 15, Wy, 30, Wh, t);
    CabinWindow(c, W - Math.round(SideSpace / 2) - 15, Wy, 30, Wh, t + 7);
  }

  // Rug, with the cat asleep on it
  const RugW = Fw + 12, RugY = FloorY + Math.round((H - FloorY) * 0.38), RugH = Math.max(6, Math.round((H - FloorY) * 0.42));
  Rect(c, Cx - RugW / 2 + 2, RugY, RugW - 4, RugH, "#7A2E2E");
  Rect(c, Cx - RugW / 2, RugY + 1, RugW, RugH - 2, "#7A2E2E");
  Rect(c, Cx - RugW / 2 + 3, RugY + 1, RugW - 6, 1, "#C9A14A");
  Rect(c, Cx - RugW / 2 + 3, RugY + RugH - 2, RugW - 6, 1, "#C9A14A");
  for (let x = Cx - RugW / 2 + 5; x < Cx + RugW / 2 - 5; x += 4) Rect(c, x, RugY + (RugH >> 1), 2, 1, "#A8483F");
  const CatX = Cx + 8, CatY = RugY - 4;
  Sprite(c, CatX, CatY, CatShape, CatColours);
  if (Math.floor(Tick / 10) % 2) Rect(c, CatX + 6, CatY, 5, 1, CatColours.o);      // its back rises as it breathes

  // Stone surround
  Rect(c, Fx, Fy, Fw, Fh, "#3D3936");
  for (let Row = 0; Row * 6 < Fh; Row++)
  {
    for (let Bx = Row % 2 ? -5 : 0; Bx < Fw; Bx += 10)
    {
      const Start = Math.max(0, Bx), End = Math.min(Fw, Bx + 9), Tall = Math.min(5, Fh - Row * 6);
      if (End <= Start) continue;
      const Shade = Hash(Bx, Row);
      Rect(c, Fx + Start, Fy + Row * 6, End - Start, Tall, Shade < 0.33 ? "#6E6964" : Shade < 0.66 ? "#7B766F" : "#625D59");
      Rect(c, Fx + Start, Fy + Row * 6, End - Start, 1, "#8A857D");
    }
  }
  Rect(c, Fx - 3, FloorY - 2, Fw + 6, 3, "#57534F");                  // hearth slab
  Rect(c, Fx - 4, Fy - 4, Fw + 8, 4, "#3E2618");                      // mantel beam
  Rect(c, Fx - 4, Fy - 4, Fw + 8, 1, "#6A4528");
  // On the mantel: two candles and a pot plant
  Rect(c, Fx + 2, Fy - 10, 2, 6, "#EDE3C8");
  Rect(c, Fx + Fw - 4, Fy - 9, 2, 5, "#EDE3C8");
  Rect(c, Cx - 3, Fy - 8, 6, 4, "#B5532E");
  Rect(c, Cx - 4, Fy - 11, 3, 3, "#4E8C5F"); Rect(c, Cx, Fy - 13, 3, 5, "#3F7A45"); Rect(c, Cx + 2, Fy - 10, 3, 2, "#4E8C5F");

  // Evening darkness over the whole room, then the firelight on top of it
  Rect(c, 0, 0, W, H, "rgba(14,7,3,0.40)");
  const Ow = Fw - 16, Oh = Fh - 14, Ox = Cx - (Ow >> 1), Oy = FloorY - 2 - Oh;
  FireGlow(c, Cx, FloorY - Oh / 2, Fw, t);

  // The opening, logs and fire are drawn last so nothing dulls them
  Rect(c, Ox, Oy, Ow, Oh, "#150B07");
  Rect(c, Ox, Oy, 2, 2, "#625D59"); Rect(c, Ox + Ow - 2, Oy, 2, 2, "#625D59");       // rounded top corners
  Rect(c, Cx - 10, FloorY - 5, 20, 3, "#3A2314");
  Rect(c, Cx - 8, FloorY - 7, 16, 2, "#4A2E1A");
  Rect(c, Cx - 6, FloorY - 5, 3, 1, "#FF9A3C"); Rect(c, Cx + 2, FloorY - 6, 2, 1, "#FFD15C");
  Fire(c, Cx, FloorY - 6, Math.min(Ow - 8, 22), Oh - 10, t);
  // Candle flames
  Rect(c, Fx + 2 + (Tick % 2), Fy - 12, 1, 2, "#FFD15C");
  Rect(c, Fx + Fw - 4 + ((Tick + 1) % 2), Fy - 11, 1, 2, "#FFD15C");
}

// Scene 2 (a green woodland):

// The DrawWoodland function paints scene 2: a green woodland
function DrawWoodland(c, W, H, t)
{
  const Tick = Math.floor(t * 8);
  const Horizon = Math.round(H * 0.56);
  const Ground = Math.round(H * 0.7);

  Bands(c, W, 0, Horizon, ["#A9D4A2", "#B7DCAC", "#C6E4B8", "#D3EBC4"]);         // misty light between the trees
  Forest(c, W, Horizon + 2, 16, 30, 11, 1, "#8DBE93", "#80B287", null, "#80B287"); // far trees, pale with distance
  Rect(c, 0, Horizon + 2, W, Ground - Horizon, "#6FA877");
  Forest(c, W, Ground, 28, 46, 17, 2, "#4E8C5F", "#417A51");                     // middle trees
  Bands(c, W, Ground, H, ["#3F7A45", "#3A7241", "#35693C", "#2F6037"]);          // grass

  // Slanting shafts of sunlight
  const Shimmer = 0.07 + 0.02 * Math.sin(t * 0.5);
  for (let Beam = 0; Beam < 3; Beam++)
  {
    const StartX = W * (0.55 + Beam * 0.22), BeamW = 7 + Beam * 3;
    for (let y = 0; y < Ground + 6; y++) Rect(c, StartX - y * 0.55, y, BeamW, 1, `rgba(255,246,190,${Shimmer})`);
  }

  // A path winding away from us
  for (let y = H; y > Ground - 1; y--)
  {
    const Far = (H - y) / (H - Ground);                                           // 0 at our feet, 1 in the distance
    const PathW = Math.round(24 - 20 * Far);
    const Px = (W >> 1) + Math.round(Math.sin(Far * 3.2) * 12 * Far);
    Rect(c, Px - (PathW >> 1), y, PathW, 1, "#B8925E");
    Rect(c, Px - (PathW >> 1), y, 1, 1, "#96744A");
    if (Hash(y, 4) > 0.6) Rect(c, Px - (PathW >> 1) + 2 + Hash(y, 5) * (PathW - 4), y, 1, 1, "#A07E52");
  }
  // Flowers and toadstools in the grass
  for (let n = 0; n < W * 0.5; n++)
  {
    const Fx = Math.floor(Hash(n, 11) * W), Fy = Ground + 3 + Math.floor(Hash(n, 12) * (H - Ground - 4));
    if (Math.abs(Fx - (W >> 1)) < 16) continue;                                   // keep the path clear
    const Kind = Hash(n, 13);
    if (Kind < 0.5) Rect(c, Fx, Fy, 1, 1, Kind < 0.2 ? "#FFF6C8" : Kind < 0.35 ? "#F6A8C0" : "#FFD15C");
    else if (Kind < 0.8) { Rect(c, Fx, Fy, 1, 2, "#5FA052"); Rect(c, Fx + 2, Fy + 1, 1, 1, "#5FA052"); }
    else if (Kind > 0.95) { Rect(c, Fx, Fy, 3, 1, "#C23E2E"); Rect(c, Fx + 1, Fy - 1, 1, 1, "#C23E2E"); Rect(c, Fx + 1, Fy + 1, 1, 2, "#EDE3C8"); }
  }

  // Big trees close to us at both edges, with bushes at their feet
  const NearH = Math.round(Math.min(H * 0.62, 110));
  Pine(c, Math.round(W * 0.06), H - 4, NearH, "#2A5E3E", "#1F4C31");
  Pine(c, Math.round(W * 0.95), H - 2, Math.round(NearH * 0.9), "#2A5E3E", "#1F4C31");
  if (W > 150) { Pine(c, Math.round(W * 0.2), H - 9, Math.round(NearH * 0.7), "#2F6844", "#245536"); Pine(c, Math.round(W * 0.82), H - 8, Math.round(NearH * 0.72), "#2F6844", "#245536"); }
  for (let i = 0; i * 9 < W; i++)
  {
    const Bx = i * 9 + Hash(i, 21) * 6;
    if (Math.abs(Bx - (W >> 1)) < 20) continue;
    Disc(c, Bx, H - 1 + Hash(i, 22) * 2, 4 + Math.round(Hash(i, 23) * 3), i % 2 ? "#2A5E3E" : "#245536");
  }

  // Leaves overhead, so the top of the screen is shaded
  Rect(c, 0, 0, W, Math.round(H * 0.07), "#1C4630");
  for (let i = 0; i * 6 < W + 6; i++)
  {
    const Depth = H * (0.06 + Hash(i, 31) * 0.07);
    Disc(c, i * 6, Depth, 5 + Math.round(Hash(i, 32) * 4), i % 3 ? "#1C4630" : "#245536");
    if (Hash(i, 33) > 0.7) Rect(c, i * 6 + 2, Depth + 5, 1, 4 + Hash(i, 34) * 8, "#245536");    // hanging vines
  }

  // Drifting pollen and two butterflies
  for (let n = 0; n < 16; n++)
  {
    const x = (Hash(n, 41) * W + t * (1.5 + Hash(n, 42) * 2)) % W;
    const y = H * (0.2 + Hash(n, 43) * 0.6) + Math.sin(t * 0.6 + n) * 4;
    if (Hash(n, Math.floor(Tick / 5)) > 0.25) Rect(c, x, y, 1, 1, "#FFF6C8");
  }
  for (let n = 0; n < 2; n++)
  {
    const x = W * (0.3 + n * 0.4) + Math.sin(t * 0.35 + n * 2) * W * 0.18;
    const y = H * (0.6 + n * 0.12) + Math.sin(t * 0.9 + n) * 6;
    const Colour = n ? "#F6A8C0" : "#FFD15C";
    Rect(c, x, y, 1, 1, "#3A2314");
    if (Tick % 2) { Rect(c, x - 1, y - 1, 1, 1, Colour); Rect(c, x + 1, y - 1, 1, 1, Colour); }
    else { Rect(c, x - 1, y, 1, 1, Colour); Rect(c, x + 1, y, 1, 1, Colour); }
  }
}

// Scene 3 (a campfire under the stars):

// The DrawCampfire function paints scene 3: a campfire under the stars
function DrawCampfire(c, W, H, t)
{
  const Tick = Math.floor(t * 8);
  const Horizon = Math.round(H * 0.6);
  const Cx = W >> 1, FireY = Math.round(H * 0.84);

  Bands(c, W, 0, Horizon + 2, ["#070B1D", "#0A1026", "#0E1630", "#131D3C", "#182448"]);
  // Stars: each one blinks off now and then
  for (let n = 0; n < W * 0.5; n++)
  {
    const Sx = Math.floor(Hash(n, 51) * W), Sy = Math.floor(Hash(n, 52) * Horizon * 0.9);
    if (Hash(n, Math.floor(Tick / 7) + n) < 0.15) continue;
    Rect(c, Sx, Sy, 1, 1, Hash(n, 53) > 0.7 ? "#FFF6D8" : "#AEB8DC");
    if (Hash(n, 54) > 0.93) { Rect(c, Sx - 1, Sy, 3, 1, "#FFF6D8"); Rect(c, Sx, Sy - 1, 1, 3, "#FFF6D8"); }
  }
  // Moon
  const MoonX = Math.round(W * 0.78), MoonY = Math.round(H * 0.16);
  Disc(c, MoonX, MoonY, 11, "rgba(244,235,200,0.08)");
  Disc(c, MoonX, MoonY, 7, "#F4EBC8");
  Rect(c, MoonX - 3, MoonY - 2, 2, 2, "#DCD1A6"); Rect(c, MoonX + 1, MoonY + 2, 2, 1, "#DCD1A6"); Rect(c, MoonX + 2, MoonY - 3, 1, 1, "#DCD1A6");

  Rect(c, 0, Horizon, W, H - Horizon, "#0B1422");                               // dark land behind the trees
  Forest(c, W, Horizon + 4, 16, 28, 10, 3, "#101C34", "#0D1830", null, "#0D1830");
  Forest(c, W, Math.round(H * 0.72), 30, 50, 16, 4, "#0C1626", "#09111F", null, "#09111F");
  Bands(c, W, Math.round(H * 0.7), H, ["#10201C", "#0E1C19", "#0C1816", "#0A1413"]);

  // Tent on the left of the fire, a log to sit on at the right
  const TentX = Cx - 44;
  for (let r = 0; r < 20; r++)
  {
    const Half = Math.round(r * 0.75);
    Rect(c, TentX + 15 - Half, FireY - 22 + r, Half, 1, "#8E4226");
    Rect(c, TentX + 15, FireY - 22 + r, Half, 1, "#B5532E");
    if (r > 7) Rect(c, TentX + 15 - Math.round((r - 7) * 0.3), FireY - 22 + r, Math.round((r - 7) * 0.6), 1, "#2A140C");
  }
  Rect(c, Cx + 20, FireY - 5, 18, 5, "#4A2E1A");
  Rect(c, Cx + 20, FireY - 5, 18, 1, "#6A4528");
  Disc(c, Cx + 38, FireY - 3, 2, "#8A6238");

  // Firelight, then the fire itself inside a ring of stones
  FireGlow(c, Cx, FireY - 4, 22, t);
  for (let i = -8; i <= 8; i += 3) Rect(c, Cx + i - 1, FireY - 1 + (Math.abs(i) > 5 ? -1 : 0), 2, 2, i % 2 ? "#6E6964" : "#57534F");
  Rect(c, Cx - 7, FireY - 3, 14, 2, "#3A2314");
  Rect(c, Cx - 5, FireY - 5, 10, 2, "#4A2E1A");
  Fire(c, Cx, FireY - 4, 13, 17, t);

  // Fireflies
  for (let n = 0; n < 10; n++)
  {
    const x = Hash(n, 61) * W + Math.sin(t * 0.3 + n * 1.7) * 9;
    const y = H * (0.55 + Hash(n, 62) * 0.35) + Math.sin(t * 0.5 + n) * 5;
    if (Math.sin(t * (1 + Hash(n, 63)) + n * 3) > 0.1) Rect(c, x, y, 1, 1, "#D8F27A");
  }
  // Grass at our feet
  for (let x = 0; x < W; x += 2)
  {
    const Tall = 2 + Math.round(Hash(x, 71) * 4);
    Rect(c, x, H - Tall, 1, Tall, "#07100E");
  }
}

// Scene 4 (a cabin in the snow):

// The DrawSnowyCabin function paints scene 4: a cabin in the snow
function DrawSnowyCabin(c, W, H, t)
{
  const Tick = Math.floor(t * 8);
  const Horizon = Math.round(H * 0.6);
  const Cx = W >> 1, BaseY = Math.round(H * 0.76);

  Bands(c, W, 0, Horizon + 1, ["#1B2048", "#262859", "#383168", "#523C72", "#73497A", "#99597C", "#C4767A"]);
  for (let n = 0; n < W * 0.25; n++)
  {
    if (Hash(n, Math.floor(Tick / 8) + n) > 0.2) Rect(c, Hash(n, 81) * W, Hash(n, 82) * Horizon * 0.45, 1, 1, "#D9D6F0");
  }
  // Mountains with snowy tops
  for (let x = 0; x < W; x++)
  {
    const Peak = 26 + 14 * Math.sin(x * 0.045 + 1) + 9 * Math.sin(x * 0.11 + 2.5) + 4 * Math.sin(x * 0.31);
    const Top = Math.round(Horizon - Math.max(6, Peak));
    Rect(c, x, Top, 1, Horizon - Top, "#544E86");
    if (Peak > 26) Rect(c, x, Top, 1, Math.min(6, Math.round((Peak - 26) * 0.5) + 1), "#CFCBE6");
  }
  Forest(c, W, Horizon + 3, 14, 24, 9, 6, "#34506A", "#2A4460", "#DDE3F2", "#2A4460");
  Bands(c, W, Horizon + 1, H, ["#E6EAF5", "#DCE2F1", "#D0D8EC", "#C4CEE6"]);
  Forest(c, W, BaseY - 4, 26, 40, 19, 7, "#27495A", "#1E3C4D", "#EEF1F8");

  // The cabin: log walls, a snowy roof, two lit windows and a smoking chimney
  const Cw = 48, Ch = 20, X0 = Cx - (Cw >> 1), WallY = BaseY - Ch;
  Rect(c, X0 + Cw - 13, WallY - 20, 6, 12, "#5C5854");
  Rect(c, X0 + Cw - 14, WallY - 22, 8, 2, "#EEF1F8");
  Rect(c, X0, WallY, Cw, Ch, "#6B4428");
  for (let y = WallY + 3; y < BaseY; y += 4) Rect(c, X0, y, Cw, 1, "#4A2E1A");
  for (let r = 0; r < 15; r++)
{                                                // roof, wider with each row down
    const Half = Math.round((Cw / 2 + 4) * (r + 1) / 15);
    Rect(c, Cx - Half, WallY - 15 + r, Half * 2, 1, r > 11 ? "#C7D0E6" : "#F1F4FA");
  }
  Rect(c, X0 - 4, WallY, Cw + 8, 2, "#3A2314");                                 // eaves
  const Lit = Math.floor(Tick / 6) % 5 === 0 ? "#FFC766" : "#FFD98A";
  [X0 + 6, X0 + Cw - 15].forEach((Wx) =>
  {
    Rect(c, Wx - 1, WallY + 5, 11, 10, "#3A2314");
    Rect(c, Wx, WallY + 6, 9, 8, Lit);
    Rect(c, Wx + 4, WallY + 6, 1, 8, "#3A2314"); Rect(c, Wx, WallY + 9, 9, 1, "#3A2314");
    Rect(c, Wx - 1, BaseY + 1, 11, 4, "rgba(255,205,120,0.35)");              // light spilling onto the snow
  });
  Rect(c, Cx - 4, WallY + 7, 8, Ch - 7, "#3E2618");
  Rect(c, Cx - 2, WallY + 9, 4, 3, Lit);
  Rect(c, Cx + 2, WallY + 14, 1, 1, "#C9A14A");
  Rect(c, X0 - 3, BaseY, Cw + 6, 2, "#B9C4DE");                                 // shadow where the cabin meets the snow
  // Chimney smoke: puffs rise, drift and thin out, then start again
  for (let n = 0; n < 6; n++)
  {
    const Life = (t * 0.12 + n / 6) % 1;
    Disc(c, X0 + Cw - 10 + Life * 12 + Math.sin(Life * 5 + n) * 2, WallY - 24 - Life * 34, 1 + Math.round(Life * 3), `rgba(214,218,232,${0.6 * (1 - Life)})`);
  }
  // Footprints leading to the door
  for (let y = BaseY + 5, i = 0; y < H; y += 5, i++) Rect(c, Cx + (i % 2 ? 2 : -3) + Math.round(Math.sin(i * 0.6) * 3), y, 2, 1, "#B4BFDA");

  // Trees close to us at the edges
  const NearH = Math.round(Math.min(H * 0.6, 100));
  Pine(c, Math.round(W * 0.05), H - 2, NearH, "#1F3F4E", "#17323F", "#F1F4FA");
  Pine(c, Math.round(W * 0.96), H - 1, Math.round(NearH * 0.85), "#1F3F4E", "#17323F", "#F1F4FA");

  // Falling snow, drawn over everything
  for (let n = 0; n < W * 0.7; n++)
  {
    const Near = Hash(n, 91);
    const x = (Hash(n, 92) * W + Math.sin(t * 0.5 + n) * 3 + t * 1.5 * Near) % W;
    const y = (Hash(n, 93) * H + t * (5 + Near * 9)) % H;
    Rect(c, x, y, 1, 1, Near > 0.5 ? "#FFFFFF" : "#D5DCEE");
  }
}

// Backgrounds holds the list the picker is built from, each with its name, id, dim (extra darkening), draw function and colour theme
const Backgrounds = [
  { name: "Cabin fireplace", id: "cabin", dim: 0, draw: DrawCabin, theme: {
      books: ["#5A2E1B", "#8B5A2B", "#C19A6B", "#3E2618", "#9A5527", "#6F4527", "#D8BC94", "#7A3F22"],   // leather
      shelf: "#2A1A10", edge: "#6A4526", plaque: "#C9A14A" } },
  { name: "Green woodland", id: "woodland", dim: 0.22, draw: DrawWoodland, theme: {
      books: ["#2F5D3A", "#6B4428", "#A9B665", "#1F4C31", "#8A5A2B", "#D9C28A", "#3E7A45", "#B5532E"],   // moss, bark, fern, toadstool
      shelf: "#3B2415", edge: "#7A5230", plaque: "#D9C28A" } },
  { name: "Campfire night", id: "campfire", dim: 0, draw: DrawCampfire, theme: {
      books: ["#24305E", "#B5532E", "#3A4A82", "#E0A23A", "#162040", "#8E4226", "#55608F", "#F0D9A0"],   // night sky, embers, moonlight
      shelf: "#241710", edge: "#5E3C24", plaque: "#E0A23A" } },
  { name: "Snowy cabin", id: "snow", dim: 0.15, draw: DrawSnowyCabin, theme: {
      books: ["#8C2F39", "#1F3F4E", "#D8DEE9", "#5E81AC", "#6B4428", "#B48EAD", "#2E3A5F", "#C9A14A"],   // berries, spruce, frost, lamplight
      shelf: "#3A2314", edge: "#EEF1F8", plaque: "#E8ECF6" } },      // the lit edge is white: snow lying on the shelves
];

// The LetteringFor function picks dark or light lettering for a cover colour, whichever is easier to read on it
function LetteringFor(Hex)
{
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(Hex.slice(i, i + 2), 16) / 255);
  const Brightness = 0.2126 * r * r + 0.7152 * g * g + 0.0722 * b * b;      // roughly how bright the eye finds it
  return Brightness > 0.3 ? "#22180F" : "#F6E9C8";
}

// The ApplyTheme function recolours the shelves, plaques and every book to go with the current background
function ApplyTheme(Theme)
{
  const Page = document.documentElement.style;
  Page.setProperty("--shelf", Theme.shelf);
  Page.setProperty("--edge", Theme.edge);
  Page.setProperty("--brass", Theme.plaque);
  document.querySelectorAll(".book").forEach((Book) =>
  {
    const Cover = Theme.books[Number(Book.dataset.number) % Theme.books.length];
    Book.style.setProperty("--cover", Cover);
    Book.style.setProperty("--title", LetteringFor(Cover));
  });
}

// Running the chosen background:

// The picker only exists on the main page, on login.html these three are null and the picker code is skipped
const ScenePicker = document.getElementById("scenePicker");
const SceneList = document.getElementById("sceneList");
const MotionSwitch = document.getElementById("motionSwitch");

let Current = Backgrounds[0];   // the background in use
let Width = 0, Height = 0;      // the screen size the canvas was last fitted to

// The Remember function saves a small note in this browser so a choice is still there on the next visit
function Remember(Key, Value)
{
  try { localStorage.setItem(Key, Value); }
  catch (error) {}
}

// The Recall function reads a note saved by the Remember function
function Recall(Key)
{
  try { return localStorage.getItem(Key); }
  catch (error) { return null; }
}

// MotionOn holds whether the background moves, it uses the saved choice or otherwise follows the device's setting
let MotionOn = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
if (Recall("library-motion") !== null) MotionOn = Recall("library-motion") === "on";
if (MotionSwitch) MotionSwitch.checked = MotionOn;

// The DrawFrame function paints one frame of the current scene
function DrawFrame(Seconds)
{
  Current.draw(Ctx, Canvas.width, Canvas.height, Seconds);
}

// The FitCanvas function sizes the canvas in dots so the art looks equally chunky on a phone and a laptop
function FitCanvas()
{
  const NewWidth = document.documentElement.clientWidth;
  const NewHeight = document.documentElement.clientHeight;
  // Phones change height slightly as the address bar slides away; ignore those small changes.
  if (NewWidth === Width && Math.abs(NewHeight - Height) < 120) return;
  Width = NewWidth;
  Height = NewHeight;
  const Dot = Math.max(3, Math.round(Math.min(Width, Height) / 110));
  Canvas.width = Math.ceil(Width / Dot);
  Canvas.height = Math.ceil(Height / Dot);
  DrawFrame(20);
}

// LastFrame and Looping keep track of the loop
let LastFrame = 0;
let Looping = false;
// The Loop function paints a new frame ten times a second while the background is set to move
function Loop(Now)
{
  if (!MotionOn) { Looping = false; return; }
  requestAnimationFrame(Loop);
  if (Now - LastFrame < 100) return;      // 10 frames a second: the stepped look of old game art, and easy on batteries
  LastFrame = Now;
  DrawFrame(Now / 1000);
}
// The StartOrStop function starts the loop, or paints one still frame when motion is switched off
function StartOrStop()
{
  if (MotionOn && !Looping) { Looping = true; requestAnimationFrame(Loop); }
  if (!MotionOn) DrawFrame(20);           // one fixed moment, shown as a still
}

// The SetBackground function switches to a background, remembers the choice and marks its thumbnail
function SetBackground(Id)
{
  Current = Backgrounds.find((b) => b.id === Id) || Backgrounds[0];   // unknown or nothing saved -> the first one
  document.body.style.setProperty("--dim", Current.dim);
  ApplyTheme(Current.theme);
  Remember("library-background", Current.id);
  DrawFrame(20);
  StartOrStop();

  if (SceneList)
  {
    SceneList.querySelectorAll(".scene").forEach((Button) =>
    {
      Button.setAttribute("aria-pressed", String(Button.dataset.id === Current.id));
    });
  }
}

if (ScenePicker)
{
  // Build one thumbnail button per background. Each thumbnail is a tiny canvas with one frame painted on it.
  Backgrounds.forEach((Background) =>
  {
    const Button = document.createElement("button");
    Button.className = "scene";
    Button.type = "button";
    Button.dataset.id = Background.id;

    const Thumbnail = document.createElement("canvas");
    Thumbnail.width = 126;
    Thumbnail.height = 78;
    Background.draw(Thumbnail.getContext("2d"), 126, 78, 20);
    Button.append(Thumbnail, Background.name);

    Button.addEventListener("click", () => SetBackground(Background.id));
    SceneList.append(Button);
  });

  MotionSwitch.addEventListener("change", () =>
  {
    MotionOn = MotionSwitch.checked;
    Remember("library-motion", MotionOn ? "on" : "off");
    StartOrStop();
  });
}

window.addEventListener("resize", FitCanvas);
FitCanvas();

// Start with whatever was chosen last time on this device.
SetBackground(Recall("library-background"));

if (ScenePicker)
{
  document.getElementById("sceneButton").addEventListener("click", () => ScenePicker.showModal());
  document.getElementById("sceneDone").addEventListener("click", () => ScenePicker.close());
  ScenePicker.addEventListener("click", (event) =>
  {
    if (event.target === ScenePicker) ScenePicker.close();    // a click outside the strip closes it
  });
}
