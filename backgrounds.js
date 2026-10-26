// This file contains the pixel-art scenes, the background picker and the colour themes, it loads first as library.js uses some of its functions

// Canvas is the sheet behind the page and Ctx is the pen that draws on it
const Canvas = document.getElementById("backdrop");
const Ctx = Canvas.getContext("2d", { willReadFrequently: true });     // daylight.js reads each frame back to light it for the time of day

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

// The PaintedRain function checks whether a background's own painted rain should fall: always with the weather off, otherwise only when it is raining in the chosen city (weather.js)
function PaintedRain()
{
  return typeof WeatherPlace === "undefined" || WeatherPlace === "off" || WeatherKind === "rain" || WeatherKind === "storm";
}

// The MixColour function blends two colours like "#13203A", Share 0 gives the first and 1 the second, the answer is a colour of the same kind so the sky map still reads it
function MixColour(From, To, Share)
{
  const Part = (Colour, At) => parseInt(Colour.slice(At, At + 2), 16);
  let Answer = "#";
  for (let At = 1; At < 7; At += 2) Answer += Math.round(Part(From, At) + (Part(To, At) - Part(From, At)) * Share).toString(16).padStart(2, "0");
  return Answer.toUpperCase();
}

// The FirefliesOut function checks whether the fireflies outside the cabin are out: only at night (always, with day and night off) and never in the rain (weather.js)
function FirefliesOut()
{
  if (typeof WeatherPlace !== "undefined" && WeatherPlace !== "off" && (WeatherKind === "rain" || WeatherKind === "storm")) return false;
  if (typeof DaylightOn !== "undefined" && DaylightOn) return LightAt(HourNow()).sky < 0.5;
  return true;
}

// The CabinWindow function paints one cabin window looking out over rolling hills at night, with a few stars and fireflies blinking above the grass
function CabinWindow(c, x, y, w, h, t)
{
  const Tick = Math.floor(t * 8);
  Rect(c, x, y, w, h, "#3A2314");                                     // frame
  Rect(c, x + 2, y + 2, w - 4, h - 4, "#141C3D");                     // night sky through the glass
  Rect(c, x + 2, y + 2 + (h - 4) * 0.5, w - 4, (h - 4) * 0.5, "#1B2650");
  for (let n = 0; n < Math.round(w * h / 80); n++)
  {                                                                   // stars, each blinking off now and then
    if (Hash(n + x, Math.floor(Tick / 9) + n) < 0.2) continue;
    const Sx = x + 2 + Math.floor(Hash(n, 31 + x) * (w - 4));
    const Sy = y + 2 + Math.floor(Hash(n, 32 + x) * (h - 4) * 0.6);
    Rect(c, Sx, Sy, 1, 1, Hash(n, 33) > 0.6 ? "#FFF6D8" : "#AEB8DC");
  }
  const HillColour = MixColour("#13203A", "#4F7A3F", typeof DaylightOn !== "undefined" && DaylightOn ? LightAt(HourNow()).sky : 0);
  for (let i = x + 2; i < x + w - 2; i++)
  {                                                                   // rolling hills in the distance, dark at night and green by day
    const Hill = Math.round(Math.sin((i + x) * 0.18) * 2 + Math.sin((i + x) * 0.07) * 3);
    Rect(c, i, y + h - 10 + Hill, 1, 10 - Hill, HillColour);
  }
  for (let n = 0; n < (FirefliesOut() ? Math.max(3, Math.round(w / 6)) : 0); n++)
  {                                                                   // fireflies, each glowing and fading on its own
    if (Hash(n + x, Math.floor(t * 2) + n * 3) < 0.45) continue;
    const Fx = x + 3 + Math.floor(Hash(n, 41 + x) * (w - 6)) + Math.round(Math.sin(t + n) * 1.5);
    const Fy = y + h - 12 - Math.floor(Hash(n, 42 + x) * 8);
    Rect(c, Fx, Fy, 1, 1, "#F2E36A");
  }
  Rect(c, x + 2, y + h - 4, w - 4, 2, "#2A1A10");                     // the dark outside ledge
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

// Scene 5 (a rainy café window):

// The DrawCafe function paints scene 5: looking out of a café window at a rainy street in the evening
function DrawCafe(c, W, H, t)
{
  const Tick = Math.floor(t * 8);
  const SillY = Math.round(H * 0.74);
  const Gx = Math.round(W * 0.08), Gy = Math.round(H * 0.12), Gw = W - Gx * 2, Gh = SillY - Gy - 4;

  // The café wall around the window
  Rect(c, 0, 0, W, H, "#4A3226");
  for (let x = 0; x < W; x += 6) Rect(c, x, 0, 1, H, "#40291F");
  // Outside: a rainy evening sky and the buildings across the street
  Bands(c, W, Gy, Gy + Gh, ["#2B3550", "#33405E", "#3D4B69", "#475674", "#52607D"]);
  for (let i = 0, x = Gx - 4; x < Gx + Gw; i++)
  {
    const Bw = 14 + Math.round(Hash(i, 101) * 14), Bh = Math.round(Gh * (0.35 + Hash(i, 102) * 0.4));
    const By = Gy + Gh - Bh;
    Rect(c, x, By, Bw, Bh, i % 2 ? "#232A40" : "#283049");
    for (let wy = By + 3; wy < Gy + Gh - 6; wy += 6)
    {
      for (let wx = x + 2; wx < x + Bw - 3; wx += 5)
      {
        if (Hash(wx, wy) > 0.55) Rect(c, wx, wy, 2, 3, Hash(wx + 1, wy) > 0.5 ? "#E8B65A" : "#C98E4A");
      }
    }
    x += Bw + 1;
  }
  // The wet street with lamp glow reflected in it
  const StreetY = Gy + Gh - Math.round(Gh * 0.16);
  Rect(c, Gx, StreetY, Gw, Gy + Gh - StreetY, "#1E2436");
  for (let i = 0; i < 3; i++)
  {
    const Lx = Gx + Math.round(Gw * (0.2 + i * 0.3));
    Rect(c, Lx, StreetY - Math.round(Gh * 0.35), 1, Math.round(Gh * 0.35), "#151A28");
    Disc(c, Lx, StreetY - Math.round(Gh * 0.35), 5, "rgba(255,200,110,0.18)");
    Rect(c, Lx - 1, StreetY - Math.round(Gh * 0.35) - 1, 3, 2, "#FFD98A");
    for (let r = 1; r < Gy + Gh - StreetY; r += 2) if (Hash(r, Lx + Tick % 3) > 0.35) Rect(c, Lx - 1 + Math.round(Math.sin(r + t * 3)), StreetY + r, 2, 1, "rgba(255,200,110,0.35)");
  }
  // Rain falling outside, in short slanting streaks
  for (let n = 0; n < W * 0.9; n++)
  {
    const x = Gx + (Hash(n, 111) * Gw + t * 6) % Gw;
    const y = Gy + (Hash(n, 112) * Gh + t * (40 + Hash(n, 113) * 20)) % Gh;
    Rect(c, x, y, 1, 2, "rgba(190,205,230,0.45)");
  }
  // Drops running down the glass, slowly
  for (let n = 0; n < 14; n++)
  {
    const x = Gx + 2 + Math.floor(Hash(n, 121) * (Gw - 4));
    const Life = (t * (0.04 + Hash(n, 122) * 0.05) + Hash(n, 123)) % 1;
    const y = Gy + Math.floor(Life * Gh);
    Rect(c, x, Math.max(Gy, y - 6), 1, Math.min(6, y - Gy), "rgba(220,230,245,0.25)");
    Rect(c, x, y, 1, 2, "rgba(235,242,252,0.8)");
  }
  // The window frame and its cross bars
  Rect(c, Gx - 3, Gy - 3, Gw + 6, 3, "#2A1A12"); Rect(c, Gx - 3, Gy + Gh, Gw + 6, 3, "#2A1A12");
  Rect(c, Gx - 3, Gy, 3, Gh, "#2A1A12"); Rect(c, Gx + Gw, Gy, 3, Gh, "#2A1A12");
  Rect(c, Gx + (Gw >> 1) - 1, Gy, 2, Gh, "#2A1A12");
  Rect(c, Gx, Gy + Math.round(Gh * 0.32), Gw, 2, "#2A1A12");
  // A striped awning edge at the top of the glass
  for (let x = Gx; x < Gx + Gw; x += 6) Rect(c, x, Gy, 3, 3, "#8C2F39");

  // The sill: a wooden counter with a steaming mug and a little plant
  Rect(c, 0, SillY, W, 5, "#6E4A30"); Rect(c, 0, SillY, W, 1, "#8C6440");
  Rect(c, 0, SillY + 5, W, H - SillY - 5, "#3A261C");
  for (let x = 0; x < W; x += 10) Rect(c, x, SillY + 5, 1, H - SillY - 5, "#2E1E16");
  const Mx = Math.round(W * 0.66);
  Rect(c, Mx, SillY - 6, 7, 6, "#E8DCC4"); Rect(c, Mx + 7, SillY - 5, 2, 3, "#E8DCC4"); Rect(c, Mx + 1, SillY - 6, 5, 1, "#6B3E26");
  for (let n = 0; n < 3; n++)
  {
    const Life = (t * 0.25 + n / 3) % 1;
    Rect(c, Mx + 2 + n + Math.round(Math.sin(Life * 6 + n) * 1.5), SillY - 8 - Math.round(Life * 10), 1, 2, `rgba(240,235,225,${0.5 * (1 - Life)})`);
  }
  const Px = Math.round(W * 0.24);
  Rect(c, Px, SillY - 5, 6, 5, "#B5532E");
  Rect(c, Px - 1, SillY - 9, 3, 4, "#4E8C5F"); Rect(c, Px + 2, SillY - 11, 2, 6, "#3F7A45"); Rect(c, Px + 4, SillY - 8, 3, 3, "#4E8C5F");

  // A warm pendant lamp hanging over the window, and its light
  const Lx = W >> 1;
  Rect(c, Lx, 0, 1, Math.max(4, Gy - 6), "#1E140E");
  Rect(c, Lx - 4, Math.max(4, Gy - 6), 9, 3, "#C9A14A");
  Disc(c, Lx, Gy + 2, Math.round(Math.min(W, H) * 0.35), "rgba(255,190,110,0.06)");
  Disc(c, Lx, Gy, Math.round(Math.min(W, H) * 0.2), "rgba(255,190,110,0.07)");
}

// Scene 6 (an autumn forest):

// The Oak function paints a round leafy tree: a trunk and clusters of leaves in a few colours
function Oak(c, Cx, BaseY, Height, Colours, Seed)
{
  Rect(c, Cx - 1, BaseY - Math.round(Height * 0.45), 3, Math.round(Height * 0.45), "#4A2E1E");
  const R = Math.round(Height * 0.3);
  for (let n = 0; n < 9; n++)
  {
    const Dx = Math.round((Hash(n, Seed) - 0.5) * R * 1.4), Dy = Math.round((Hash(n, Seed + 1) - 0.5) * R * 1.1);
    Disc(c, Cx + Dx, BaseY - Math.round(Height * 0.62) + Dy, Math.max(2, Math.round(R * (0.5 + Hash(n, Seed + 2) * 0.4))), Colours[n % Colours.length]);
  }
}

// The DrawAutumn function paints scene 6: an autumn forest in low golden light, with leaves drifting down
function DrawAutumn(c, W, H, t)
{
  const Tick = Math.floor(t * 8);
  const Horizon = Math.round(H * 0.55), Ground = Math.round(H * 0.68);
  Bands(c, W, 0, Horizon + 2, ["#E8B86A", "#EEC47A", "#F2CE88", "#F4D898", "#F2DCA8"]);
  Disc(c, Math.round(W * 0.7), Horizon - 4, 9, "#FFF0C8");
  Disc(c, Math.round(W * 0.7), Horizon - 4, 16, "rgba(255,240,200,0.25)");
  // Far trees, pale with distance
  for (let i = 0; i * 9 < W + 9; i++) Oak(c, i * 9 + Math.round(Hash(i, 151) * 5), Horizon + 4, 18 + Math.round(Hash(i, 152) * 10), ["#D9A06A", "#E0AE78", "#CC9466"], 150 + i);
  Rect(c, 0, Horizon + 3, W, Ground - Horizon, "#C88A4A");
  // Middle trees in deep autumn colours
  for (let i = 0; i * 16 < W + 16; i++) Oak(c, i * 16 + Math.round(Hash(i, 161) * 8), Ground + 2, 32 + Math.round(Hash(i, 162) * 16), ["#C2502A", "#D9822B", "#E8A23A", "#A63E22"], 160 + i * 3);
  Bands(c, W, Ground, H, ["#A65A2A", "#9A5226", "#8C4A22", "#7E421E"]);
  // A path of fallen leaves winding away
  for (let y = H; y > Ground - 1; y--)
  {
    const Far = (H - y) / (H - Ground);
    const PathW = Math.round(22 - 18 * Far), Px = (W >> 1) + Math.round(Math.sin(Far * 3) * 10 * Far);
    Rect(c, Px - (PathW >> 1), y, PathW, 1, "#C9965E");
    if (Hash(y, 171) > 0.5) Rect(c, Px - (PathW >> 1) + Hash(y, 172) * PathW, y, 2, 1, "#D9822B");
  }
  // Leaves lying on the ground
  for (let n = 0; n < W * 0.6; n++)
  {
    const x = Hash(n, 181) * W, y = Ground + 2 + Hash(n, 182) * (H - Ground - 2);
    Rect(c, x, y, 2, 1, ["#E8A23A", "#C2502A", "#D9822B", "#F2C25A"][n % 4]);
  }
  // Big trees close to us at the edges
  const NearH = Math.round(Math.min(H * 0.7, 120));
  Oak(c, Math.round(W * 0.06), H, NearH, ["#A63E22", "#C2502A", "#8C3420"], 191);
  Oak(c, Math.round(W * 0.95), H, Math.round(NearH * 0.9), ["#D9822B", "#C2502A", "#A63E22"], 197);
  // Golden light across the top
  for (let y = 0; y < Ground; y++) Rect(c, 0, y, W, 1, `rgba(255,210,140,${0.06 * (1 - y / Ground)})`);
  // Leaves drifting down, tumbling as they fall
  for (let n = 0; n < W * 0.25; n++)
  {
    const Fall = 6 + Hash(n, 201) * 6;
    const y = (Hash(n, 202) * H + t * Fall) % H;
    const x = (Hash(n, 203) * W + Math.sin(t * 0.8 + n) * 6 + t * 2) % W;
    const Colour = ["#E8A23A", "#C2502A", "#D9822B", "#F2C25A"][n % 4];
    if ((Tick + n) % 4 < 2) Rect(c, x, y, 2, 1, Colour);
    else Rect(c, x, y, 1, 2, Colour);
  }
}

// Scene 7 (an attic reading nook):

// The DrawAttic function paints scene 7: an attic under a slanted roof, a round window full of stars, a desk lamp and plants
function DrawAttic(c, W, H, t)
{
  const Tick = Math.floor(t * 8);
  const FloorY = Math.round(H * 0.82), Cx = W >> 1;
  // Back wall of planks
  Rect(c, 0, 0, W, FloorY, "#4E3524");
  for (let x = 0; x < W; x += 7) { Rect(c, x, 0, 1, FloorY, "#3E2A1C"); if (Hash(x, 211) > 0.7) Rect(c, x + 3, Hash(x, 212) * FloorY, 1, 2, "#3A261A"); }
  // The round window with stars and a moon
  const R = Math.round(Math.min(W, H) * 0.16), Wy = Math.round(FloorY * 0.4);
  Disc(c, Cx, Wy, R + 3, "#2A1A12");
  Disc(c, Cx, Wy, R, "#141C3D");
  for (let n = 0; n < R * 3; n++)
  {
    const a = Hash(n, 221) * Math.PI * 2, d = Math.sqrt(Hash(n, 222)) * (R - 2);
    if (Hash(n, Math.floor(Tick / 6) + n) > 0.2) Rect(c, Cx + Math.cos(a) * d, Wy + Math.sin(a) * d, 1, 1, Hash(n, 223) > 0.7 ? "#FFF6D8" : "#AEB8DC");
  }
  Disc(c, Cx + Math.round(R * 0.4), Wy - Math.round(R * 0.35), Math.max(2, Math.round(R * 0.22)), "#F4EBC8");
  Rect(c, Cx - R, Wy - 1, R * 2, 2, "#2A1A12"); Rect(c, Cx - 1, Wy - R, 2, R * 2, "#2A1A12");
  // The slanted roof on both sides, coming down to the floor
  for (let y = 0; y < FloorY; y++)
  {
    const Reach = Math.round((1 - y / FloorY) * W * 0.32);
    Rect(c, 0, y, Reach, 1, y % 6 ? "#6B4A30" : "#5A3E28");
    Rect(c, W - Reach, y, Reach, 1, y % 6 ? "#6B4A30" : "#5A3E28");
  }
  // A beam across, with plants hanging from it
  Rect(c, 0, Math.round(FloorY * 0.08), W, 4, "#3A2618");
  [0.3, 0.68].forEach((Spot, i) =>
  {
    const Px = Math.round(W * Spot), Drop = Math.round(FloorY * (0.18 + i * 0.06));
    Rect(c, Px, Math.round(FloorY * 0.08) + 4, 1, Drop - Math.round(FloorY * 0.08) - 4, "#2A1A12");
    Rect(c, Px - 3, Drop, 7, 4, "#B5532E");
    for (let v = 0; v < 5; v++) Rect(c, Px - 4 + v * 2, Drop + 3, 1, 3 + Math.round(Hash(v, 230 + i) * 7), v % 2 ? "#3F7A45" : "#4E8C5F");
  });
  // Floor and a rug
  Rect(c, 0, FloorY, W, H - FloorY, "#3E2A1C");
  for (let x = 0; x < W; x += 12) Rect(c, x, FloorY, 1, H - FloorY, "#2E1E14");
  Rect(c, Cx - 26, FloorY + 4, 52, Math.max(4, H - FloorY - 7), "#3E4A6B");
  Rect(c, Cx - 24, FloorY + 5, 48, 1, "#C9A14A");
  // A little desk with the lamp, a stack of books and a ticking clock
  const Dx = Math.round(W * 0.66), Dy = FloorY - 12;
  Rect(c, Dx - 14, Dy, 28, 3, "#6E4A30"); Rect(c, Dx - 12, Dy + 3, 2, 9, "#4A2E1E"); Rect(c, Dx + 10, Dy + 3, 2, 9, "#4A2E1E");
  Rect(c, Dx + 4, Dy - 2, 6, 2, "#3A4A6B"); Rect(c, Dx + 5, Dy - 4, 5, 2, "#A84B3A"); Rect(c, Dx + 4, Dy - 6, 6, 2, "#C9A66B");
  Rect(c, Dx - 9, Dy - 1, 5, 1, "#2A1A12"); Rect(c, Dx - 7, Dy - 9, 1, 8, "#2A1A12"); Rect(c, Dx - 10, Dy - 12, 7, 3, "#C9A14A");
  Disc(c, Dx - 7, Dy - 4, 14, "rgba(255,200,110,0.07)"); Disc(c, Dx - 7, Dy - 4, 8, "rgba(255,200,110,0.08)");
  const Kx = Math.round(W * 0.3), Ky = FloorY - 22;
  Rect(c, Kx - 4, Ky, 9, 22, "#5A3A24"); Disc(c, Kx, Ky + 4, 3, "#EDE3C8");
  Rect(c, Kx, Ky + 4, 1, 1, "#2A1A12");
  Rect(c, Kx + (Tick % 8 < 4 ? -1 : 1), Ky + 10, 1, 6, "#C9A14A");          // the pendulum swinging
  Rect(c, 0, 0, W, H, "rgba(14,7,3,0.25)");
}

// Scene 8 (a grand old library at night):

// The Bookcase function paints a tall bookcase filled with rows of books of different heights and colours
function Bookcase(c, X, Y, Wide, Tall, Seed)
{
  Rect(c, X, Y, Wide, Tall, "#3A2214");
  Rect(c, X, Y, Wide, 3, "#5A3820"); Rect(c, X, Y, 2, Tall, "#4A2C18"); Rect(c, X + Wide - 2, Y, 2, Tall, "#2A180E");
  const Colours = ["#7A2E2E", "#2E4A3A", "#C9A14A", "#3A3A6A", "#8C5A2B", "#5A2E4A", "#D8C8A8", "#4A6A7A"];
  for (let Shelf = Y + 4; Shelf + 12 < Y + Tall; Shelf += 14)
  {
    for (let x = X + 3; x < X + Wide - 4;)
    {
      const Bw = 2 + Math.floor(Hash(x, Shelf + Seed) * 2), Bh = 8 + Math.floor(Hash(x + 1, Shelf + Seed) * 4);
      if (Hash(x, Shelf * 3 + Seed) > 0.08) Rect(c, x, Shelf + 12 - Bh, Bw, Bh, Colours[Math.floor(Hash(x + 2, Shelf + Seed) * Colours.length)]);
      x += Bw + (Hash(x + 3, Shelf + Seed) > 0.85 ? 2 : 0);
    }
    Rect(c, X + 2, Shelf + 12, Wide - 4, 2, "#5A3820");
  }
}

// The DrawGrandLibrary function paints scene 8: a grand old library at night, tall bookcases, a rolling ladder, an arched window full of moonlight and dust drifting in the light
function DrawGrandLibrary(c, W, H, t)
{
  const Tick = Math.floor(t * 8);
  const FloorY = Math.round(H * 0.84), Cx = W >> 1;
  Rect(c, 0, 0, W, FloorY, "#3A2A22");
  // The arched window in the middle, moonlit
  const Aw = Math.round(Math.min(W * 0.26, H * 0.36)), Ax = Cx - (Aw >> 1), Ay = Math.round(H * 0.1), Ah = Math.round(FloorY * 0.62);
  for (let y = 0; y < Ah; y++)
  {
    const Arch = y < Aw / 2 ? Math.round(Aw / 2 - Math.sqrt(Math.pow(Aw / 2, 2) - Math.pow(Aw / 2 - y, 2))) : 0;
    Rect(c, Ax + Arch - 2, Ay + y, Aw - Arch * 2 + 4, 1, "#2A180E");
    Rect(c, Ax + Arch, Ay + y, Aw - Arch * 2, 1, y < Ah * 0.6 ? "#1A2448" : "#202C52");
  }
  for (let n = 0; n < Aw * 1.2; n++) if (Hash(n, Math.floor(Tick / 7) + n) > 0.25) Rect(c, Ax + 3 + Hash(n, 451) * (Aw - 6), Ay + Aw * 0.3 + Hash(n, 452) * Ah * 0.5, 1, 1, "#D9D6F0");
  Disc(c, Ax + Math.round(Aw * 0.65), Ay + Math.round(Aw * 0.45), Math.max(3, Math.round(Aw * 0.12)), "#F4EBC8");
  Rect(c, Cx - 1, Ay + Math.round(Aw * 0.2), 2, Ah - Math.round(Aw * 0.2), "#2A180E");
  for (let y = Ay + Math.round(Aw * 0.5); y < Ay + Ah; y += Math.round(Ah / 4)) Rect(c, Ax, y, Aw, 1, "#2A180E");
  Rect(c, Ax - 4, Ay + Ah, Aw + 8, 3, "#5A3820");
  // Tall bookcases filling both sides
  const SideW = Ax - 6;
  for (let x = 0, i = 0; x < SideW; x += 30, i++) Bookcase(c, x, Math.round(H * 0.04), Math.min(28, SideW - x), FloorY - Math.round(H * 0.04), i * 7);
  for (let x = Ax + Aw + 6, i = 0; x < W; x += 30, i++) Bookcase(c, x, Math.round(H * 0.04), Math.min(28, W - x), FloorY - Math.round(H * 0.04), 40 + i * 7);
  // A rolling ladder against the left bookcases, on its rail
  Rect(c, 0, Math.round(H * 0.08), SideW, 1, "#C9A14A");
  const Lx = Math.round(SideW * 0.6);
  for (let y = Math.round(H * 0.08); y < FloorY; y++)
  {
    const Lean = Math.round((y - H * 0.08) * 0.12);
    Rect(c, Lx + Lean, y, 1, 1, "#8C6440"); Rect(c, Lx + 7 + Lean, y, 1, 1, "#8C6440");
    if ((y - Math.round(H * 0.08)) % 7 === 0) Rect(c, Lx + Lean, y, 8, 1, "#8C6440");
  }
  // The floor, a long reading table with a green lamp and an open book
  Rect(c, 0, FloorY, W, H - FloorY, "#4A3226");
  for (let x = 0; x < W; x += 8) Rect(c, x, FloorY, 1, H - FloorY, (x >> 3) % 2 ? "#3E2A1E" : "#56392A");
  Rect(c, 0, FloorY, W, 1, "#2A180E");
  const Ty = FloorY - 9;
  Rect(c, Cx - 30, Ty, 60, 3, "#5A3820"); Rect(c, Cx - 28, Ty + 3, 2, 6, "#3A2214"); Rect(c, Cx + 26, Ty + 3, 2, 6, "#3A2214");
  Rect(c, Cx + 12, Ty - 1, 6, 1, "#2A180E"); Rect(c, Cx + 14, Ty - 6, 1, 5, "#C9A14A"); Rect(c, Cx + 10, Ty - 9, 10, 3, "#2E6A4A");
  Disc(c, Cx + 15, Ty - 3, 14, "rgba(255,220,140,0.08)"); Disc(c, Cx + 15, Ty - 3, 7, "rgba(255,220,140,0.1)");
  Rect(c, Cx - 14, Ty - 2, 8, 2, "#EDE3C8"); Rect(c, Cx - 10, Ty - 2, 1, 2, "#B8A888");
  // Moonlight falling from the window across the floor, with dust drifting in it
  for (let y = Ay + Ah; y < H; y++)
  {
    const Spread = Math.round((y - Ay - Ah) * 0.35);
    Rect(c, Ax + 4 - Spread, y, Aw - 8 + Spread * 2, 1, "rgba(200,210,255,0.06)");
  }
  for (let n = 0; n < 24; n++)
  {
    const x = Ax + Hash(n, 461) * Aw + Math.sin(t * 0.4 + n) * 4, y = Ay + Ah * 0.4 + ((Hash(n, 462) * Ah + t * 1.5) % (FloorY - Ay - Ah * 0.4));
    if (Hash(n, Math.floor(Tick / 4)) > 0.3) Rect(c, x, y, 1, 1, "rgba(240,235,210,0.7)");
  }
  // Candle sconces between the bookcases, flickering
  [Math.round(SideW * 0.25), W - Math.round(SideW * 0.25)].forEach((Sx, i) =>
  {
    const Sy = Math.round(H * 0.32);
    Rect(c, Sx - 2, Sy, 5, 2, "#C9A14A"); Rect(c, Sx, Sy - 4, 1, 4, "#EDE3C8");
    Rect(c, Sx + ((Tick + i) % 2), Sy - 6, 1, 2, "#FFD15C");
    Disc(c, Sx, Sy - 4, 10, "rgba(255,190,100,0.08)");
  });
  Rect(c, 0, 0, W, H, "rgba(14,7,10,0.2)");
}

// Shrine helpers (used by scene 9):

// The Blossom function paints a cherry branch: it bends out from a point and is covered in clusters of pink
function Blossom(c, X, Y, Length, Angle, Depth, Seed)
{
  const Ex = X + Math.cos(Angle) * Length, Ey = Y + Math.sin(Angle) * Length;
  for (let s = 0; s <= Length; s++) Rect(c, X + Math.cos(Angle) * s, Y + Math.sin(Angle) * s, Math.max(1, Depth), Math.max(1, Depth), "#3A2626");
  if (Depth < 2) for (let n = 0; n < 3; n++) Disc(c, (X + Ex) / 2 + (Hash(n, Seed + 5) - 0.5) * 6, (Y + Ey) / 2 + (Hash(n, Seed + 6) - 0.5) * 5, 2, ["#F6C4D0", "#EFA8BC"][n % 2]);
  if (Depth <= 0)
  {
    for (let n = 0; n < 6; n++) Disc(c, Ex + (Hash(n, Seed) - 0.5) * 8, Ey + (Hash(n, Seed + 1) - 0.5) * 6, 2 + Math.round(Hash(n, Seed + 2) * 2), ["#F6C4D0", "#EFA8BC", "#F9D8E0"][n % 3]);
    return;
  }
  Blossom(c, Ex, Ey, Length * 0.72, Angle - 0.45 - Hash(Seed, 1) * 0.3, Depth - 1, Seed * 3 + 1);
  Blossom(c, Ex, Ey, Length * 0.68, Angle + 0.35 + Hash(Seed, 2) * 0.3, Depth - 1, Seed * 3 + 2);
}

// The CherryTree function paints a whole cherry tree: a dark trunk that forks and a big soft crown of pink clusters
function CherryTree(c, Cx, BaseY, Height, Seed)
{
  const Trunk = Math.round(Height * 0.45);
  for (let y = 0; y < Trunk; y++) Rect(c, Cx - 1 + Math.round(Math.sin(y * 0.15 + Seed) * 1), BaseY - y, 3, 1, "#3A2626");
  Blossom(c, Cx, BaseY - Trunk, Height * 0.22, -Math.PI / 2 - 0.5, 2, Seed);
  Blossom(c, Cx, BaseY - Trunk, Height * 0.22, -Math.PI / 2 + 0.5, 2, Seed + 9);
  const R = Math.round(Height * 0.32);
  for (let n = 0; n < 14; n++)
  {
    const Dx = Math.round((Hash(n, Seed) - 0.5) * R * 1.8), Dy = Math.round((Hash(n, Seed + 1) - 0.5) * R * 1.1);
    Disc(c, Cx + Dx, BaseY - Trunk - R * 0.5 + Dy, Math.max(2, Math.round(R * (0.35 + Hash(n, Seed + 2) * 0.3))), ["#F2B8C6", "#E89AB0", "#F9D0DA", "#EFA8BC"][n % 4]);
  }
}

// The Torii function paints a red shrine gate: two posts, a tie beam and the curved top beam
function Torii(c, Cx, BaseY, Wide, Tall, Light)
{
  const Post = Math.max(1, Math.round(Wide * 0.06));
  const Red = Light ? "#D8442E" : "#A8321F", Dark = Light ? "#2A1A1A" : "#1E1214";
  Rect(c, Cx - (Wide >> 1), BaseY - Tall, Post, Tall, Red);
  Rect(c, Cx + (Wide >> 1) - Post, BaseY - Tall, Post, Tall, Red);
  Rect(c, Cx - (Wide >> 1) - 1, BaseY - Math.round(Tall * 0.78), Wide + 2, Math.max(1, Math.round(Tall * 0.06)), Red);
  for (let x = -((Wide >> 1) + 3); x <= (Wide >> 1) + 3; x++)
  {
    const Lift = Math.round(Math.pow(Math.abs(x) / ((Wide >> 1) + 3), 3) * 2);
    Rect(c, Cx + x, BaseY - Tall - 2 - Lift, 1, Math.max(2, Math.round(Tall * 0.1)), Dark);
  }
}

// Scene 9 (a temple up the mountain steps):

// The DrawTemple function paints scene 9: stone steps climbing between cherry trees to a red temple, a snowy mountain behind it in the evening
function DrawTemple(c, W, H, t)
{
  const Tick = Math.floor(t * 8);
  const Cx = W >> 1, Horizon = Math.round(H * 0.5);
  Bands(c, W, 0, Horizon + 4, ["#F2C6B4", "#F4CDB8", "#F2C0B6", "#EDB2B6", "#E3A2B4", "#D494B2"]);
  Disc(c, Math.round(W * 0.78), Math.round(H * 0.2), 7, "#FFF0DC");
  // The mountain behind, with snow on top and soft clouds across it
  for (let x = 0; x < W; x++)
  {
    const Rise = Math.max(0, Math.round(H * 0.34 - Math.abs(x - Cx) * 0.62));
    if (!Rise) continue;
    Rect(c, x, Horizon - Rise, 1, Rise, "#8C7CA6");
    if (Rise > H * 0.25) Rect(c, x, Horizon - Rise, 1, Math.round((Rise - H * 0.25) * 0.9) + 1, "#FBF4F4");
  }
  for (let n = 0; n < 5; n++)
  {
    const Drift = (Hash(n, 501) * W + t * (1 + n * 0.3)) % (W + 40) - 20, Cy = Math.round(H * (0.32 + n * 0.035));
    Rect(c, Drift, Cy, 22 + n * 4, 2, "rgba(255,240,240,0.5)"); Rect(c, Drift + 5, Cy - 1, 12, 1, "rgba(255,240,240,0.4)");
  }
  // Hills of trees in front of the mountain
  for (let x = 0; x < W; x++)
  {
    const Hill = Math.round(H * 0.1 + 6 * Math.sin(x * 0.05) + 4 * Math.sin(x * 0.13));
    Rect(c, x, Horizon + 6 - Hill, 1, Hill, "#6E5A86");
  }
  // The temple at the top of the steps
  const TempleY = Math.round(H * 0.5), Tw = Math.round(Math.min(W * 0.3, 70));
  Rect(c, Cx - (Tw >> 1) + 4, TempleY - 14, Tw - 8, 14, "#B4382A");
  for (let x = Cx - (Tw >> 1) + 7; x < Cx + (Tw >> 1) - 6; x += 6) Rect(c, x, TempleY - 12, 3, 10, "#2A1A1A");
  for (let Roof = 0; Roof < 2; Roof++)
  {
    const Ry = TempleY - 15 - Roof * 11, Rw = Tw + 10 - Roof * 18;
    for (let x = -(Rw >> 1); x <= Rw >> 1; x++)
    {
      const Lift = Math.round(Math.pow(Math.abs(x) / (Rw / 2), 3) * 3);
      Rect(c, Cx + x, Ry - 3 - Lift, 1, 4, "#3A2A36");
    }
    if (Roof === 0) { Rect(c, Cx - (Rw >> 1) + 12, Ry - 10, Rw - 24, 7, "#B4382A"); }
  }
  Rect(c, Cx - 1, TempleY - 40, 2, 4, "#C9A14A");
  // Stone steps coming down towards us, wider as they come closer
  const StepsTop = TempleY, StepsBottom = H;
  for (let y = StepsTop; y < StepsBottom; y++)
  {
    const Near = (y - StepsTop) / (StepsBottom - StepsTop);
    const Half = Math.round(6 + Near * W * 0.18);
    Rect(c, Cx - Half, y, Half * 2, 1, Math.floor(Near * 26) % 2 ? "#A89AA0" : "#968890");
    Rect(c, Cx - Half - 2, y, 2, 1, "#6E6070"); Rect(c, Cx + Half, y, 2, 1, "#6E6070");
  }
  // Ground either side of the steps, then the torii gate over the steps
  for (let y = StepsTop + 2; y < H; y++)
  {
    const Near = (y - StepsTop) / (StepsBottom - StepsTop), Half = Math.round(8 + Near * W * 0.18);
    Rect(c, 0, y, Cx - Half - 2, 1, "#4E6A48"); Rect(c, Cx + Half + 2, y, W - Cx - Half - 2, 1, "#4E6A48");
  }
  Torii(c, Cx, Math.round(H * 0.72), Math.round(W * 0.24 + 16), Math.round(H * 0.28), true);
  // Stone lanterns lining the steps, glowing
  [0.35, 0.6, 0.85].forEach((Near, i) =>
  {
    const y = StepsTop + Math.round(Near * (StepsBottom - StepsTop)), Half = Math.round(10 + Near * W * 0.18), Size = 1 + Near;
    [-1, 1].forEach((Side) =>
    {
      const Lx = Cx + Side * (Half + 6 + Math.round(Near * 6));
      Rect(c, Lx - 2 * Size, y - 2, 4 * Size, 2, "#8A8A92"); Rect(c, Lx - Size, y - 8 * Size, 2 * Size, 6 * Size, "#9A9AA2");
      Rect(c, Lx - 3 * Size, y - 10 * Size, 6 * Size, 2 * Size, "#7A7A82");
      Rect(c, Lx - Size / 2, y - 7 * Size, Size, 2 * Size, (Tick + i) % 8 ? "#FFD98A" : "#FFC766");
      Disc(c, Lx, y - 6 * Size, 4 * Size, "rgba(255,210,140,0.12)");
    });
  });
  // Cherry trees on both sides, the nearest ones biggest
  const Tall = Math.min(H * 0.7, 130);
  CherryTree(c, Math.round(W * 0.12), H + 4, Tall, 11);
  CherryTree(c, Math.round(W * 0.88), H + 6, Tall * 0.95, 29);
  if (W > 160) { CherryTree(c, Math.round(W * 0.28), Math.round(H * 0.72), Tall * 0.55, 47); CherryTree(c, Math.round(W * 0.72), Math.round(H * 0.7), Tall * 0.5, 61); }
  // Petals drifting across everything
  for (let n = 0; n < W * 0.3; n++)
  {
    const x = (Hash(n, 511) * W * 1.3 + t * (5 + Hash(n, 512) * 5)) % (W + 10) - 5;
    const y = (Hash(n, 513) * H + t * (4 + Hash(n, 514) * 4) + Math.sin(t * 1.3 + n) * 3) % H;
    Rect(c, x, y, (Tick + n) % 4 < 2 ? 2 : 1, 1, Hash(n, 515) > 0.5 ? "#FBE0E6" : "#EFA8BC");
  }
}

// Scene 10 (a lighthouse keeper's cottage on a stormy night):

// The DrawKeepersCottage function paints scene 10: inside the keeper's cottage on a stormy night, the lighthouse beam sweeping past the rain-streaked window, a lamp, a kettle and a sea chart
function DrawKeepersCottage(c, W, H, t)
{
  const Tick = Math.floor(t * 8);
  const SillY = Math.round(H * 0.7);
  const Ww = Math.round(Math.min(W * 0.62, H * 0.95)), Wx = (W - Ww) >> 1, Wy = Math.round(H * 0.16), Wh = SillY - Wy - 3;
  // Whitewashed stone walls inside the cottage
  Rect(c, 0, 0, W, H, "#C8BEAA");
  for (let Row = 0; Row * 8 < H; Row++) for (let x = Row % 2 ? -6 : 0; x < W; x += 12) Rect(c, x, Row * 8, 1, 8, "#B4AA96");
  for (let y = 0; y < H; y += 8) Rect(c, 0, y, W, 1, "#B4AA96");
  // The stormy sea outside, and the lighthouse on its rock
  Bands(c, W, Wy, Wy + Math.round(Wh * 0.55), ["#24304A", "#2C3854", "#36425E", "#424E6A"]);
  const MoonX = Wx + Math.round(Ww * 0.28), MoonY = Wy + Math.round(Wh * 0.16);
  Disc(c, MoonX, MoonY, 9, "rgba(240,235,210,0.12)"); Disc(c, MoonX, MoonY, 5, "#F0EBD2");
  for (let n = 0; n < 6; n++)
  {
    const Drift = Wx + (Hash(n, 551) * Ww + t * (2 + n)) % Ww;
    Rect(c, Drift - 10, Wy + 4 + n * 4, 20 + n * 3, 3, "rgba(60,70,90,0.6)");                       // clouds rolling past
  }
  const SeaTop = Wy + Math.round(Wh * 0.55);
  Bands(c, W, SeaTop, Wy + Wh, ["#2A3A54", "#24334C", "#1E2C44", "#1A263C"]);
  for (let y = SeaTop + 1; y < Wy + Wh; y += 2) if (Hash(y, Tick % 5) > 0.45) Rect(c, MoonX - 3 + Math.round((Hash(y, 9) - 0.5) * 8), y, 4, 1, "rgba(240,235,210,0.4)");
  for (let Row = 0; Row < 8; Row++)
  {
    const y = SeaTop + 2 + Row * Math.round((Wh * 0.45) / 8);
    for (let x = Wx; x < Wx + Ww; x += 6) if (Hash(x, Row + Tick % 4) > 0.6) Rect(c, x + Math.round(Math.sin(t * 2 + Row) * 2), y, 4, 1, "#6A7A92");     // white caps
  }
  const Lx = Wx + Math.round(Ww * 0.72), LBase = SeaTop + 6, LTall = Math.round(Wh * 0.55);
  Rect(c, Lx - 10, LBase - 2, 20, 7, "#2A2A34");
  for (let y = 0; y < LTall; y++)
  {
    const Half = Math.round(5 - (y / LTall) * 2);
    Rect(c, Lx - Half, LBase - y, Half * 2, 1, Math.floor(y / (LTall / 5)) % 2 ? "#B4383A" : "#E8E0D4");
  }
  Rect(c, Lx - 4, LBase - LTall - 5, 8, 5, "#FFF0B8"); Rect(c, Lx - 5, LBase - LTall - 8, 10, 3, "#B4383A"); Rect(c, Lx - 5, LBase - LTall, 10, 1, "#2A2A34");
  // The beam sweeping round, crossing the window towards us every so often
  const Angle = t * 0.9, Facing = Math.cos(Angle), Toward = Math.sin(Angle) > 0 ? -1 : 1;
  for (let d = 3; d < Ww; d++)
  {
    const Spread = Math.round(1 + d * 0.08), Bx = Lx + Toward * d;
    if (Bx < Wx || Bx > Wx + Ww) break;
    Rect(c, Bx, LBase - LTall - 2 - Spread, 1, Spread * 2 + 1, `rgba(255,240,190,${(0.25 + 0.35 * Math.max(0, Facing)) * (1 - d / Ww)})`);
  }
  if (Facing > 0.92) Rect(c, Wx, Wy, Ww, Wh, "rgba(255,240,200,0.12)");                                  // the flash when it points straight at us
  // Rain lashing the glass at a slant, and drops running down, only when it rains (or with the weather off)
  for (let n = 0; n < (PaintedRain() ? W * 0.8 : 0); n++)
  {
    const x = Wx + (Hash(n, 561) * Ww + t * 14) % Ww, y = Wy + (Hash(n, 562) * Wh + t * (50 + Hash(n, 563) * 20)) % Wh;
    Rect(c, x, y, 1, 2, "rgba(200,215,235,0.4)");
  }
  for (let n = 0; n < (PaintedRain() ? 12 : 0); n++)
  {
    const x = Wx + 2 + Math.floor(Hash(n, 571) * (Ww - 4)), Life = (t * (0.05 + Hash(n, 572) * 0.05) + Hash(n, 573)) % 1;
    Rect(c, x, Wy + Math.floor(Life * Wh), 1, 2, "rgba(230,238,250,0.75)");
  }
  // The window frame, painted blue like a seaside cottage
  Rect(c, Wx - 3, Wy - 3, Ww + 6, 3, "#3E5A7A"); Rect(c, Wx - 3, Wy + Wh, Ww + 6, 3, "#3E5A7A");
  Rect(c, Wx - 3, Wy, 3, Wh, "#3E5A7A"); Rect(c, Wx + Ww, Wy, 3, Wh, "#3E5A7A");
  Rect(c, Wx + (Ww >> 1) - 1, Wy, 2, Wh, "#3E5A7A"); Rect(c, Wx, Wy + (Wh >> 1), Ww, 2, "#3E5A7A");
  // A sea chart pinned to the wall, a ship's wheel and a rope coil
  if (Wx > 30)
  {
    const Mx = Math.round(Wx / 2) - 9;
    Rect(c, Mx, Wy + 6, 18, 14, "#E8D9B0"); Rect(c, Mx + 3, Wy + 9, 8, 5, "#9AB8C8"); Rect(c, Mx + 10, Wy + 12, 5, 5, "#9AB8C8"); Rect(c, Mx + 8, Wy + 6, 2, 1, "#B4383A");
    const Sx = W - Math.round(Wx / 2);
    Disc(c, Sx, Wy + 16, 8, "#6E4A30"); Disc(c, Sx, Wy + 16, 5, "#C8BEAA"); Disc(c, Sx, Wy + 16, 2, "#6E4A30");
    for (let k = 0; k < 8; k++) Rect(c, Sx + Math.round(Math.cos(k * 0.785) * 9), Wy + 16 + Math.round(Math.sin(k * 0.785) * 9), 2, 2, "#6E4A30");
  }
  // The sill and the table under the window: a lamp, a kettle steaming and a mug
  Rect(c, Wx - 6, SillY, Ww + 12, 3, "#E8E0D0");
  Rect(c, 0, SillY + 6, W, H - SillY - 6, "#5A3E2A");
  for (let x = 0; x < W; x += 12) Rect(c, x, SillY + 6, 1, H - SillY - 6, "#4A3020");
  Rect(c, 0, SillY + 6, W, 2, "#7A5638");
  const Ox = Math.round(W * 0.3), Oy = SillY + 6;
  Rect(c, Ox - 2, Oy - 2, 6, 2, "#C9A14A"); Rect(c, Ox - 1, Oy - 10, 4, 8, "rgba(255,240,200,0.6)"); Rect(c, Ox - 1, Oy - 11, 4, 1, "#C9A14A");
  Rect(c, Ox, Oy - 7, 2, 3, Tick % 3 ? "#FFD15C" : "#FFC244");                                          // the oil lamp's flame
  Disc(c, Ox + 1, Oy - 6, Math.round(Math.min(W, H) * 0.25), "rgba(255,200,110,0.06)"); Disc(c, Ox + 1, Oy - 6, 10, "rgba(255,200,110,0.1)");
  const Kx = Math.round(W * 0.62);
  Rect(c, Kx, Oy - 7, 9, 7, "#3A4A5A"); Rect(c, Kx + 9, Oy - 5, 3, 1, "#3A4A5A"); Rect(c, Kx + 2, Oy - 9, 5, 2, "#2A3644");
  for (let n = 0; n < 3; n++)
  {
    const Life = (t * 0.3 + n / 3) % 1;
    Rect(c, Kx + 11 + Math.round(Life * 4), Oy - 7 - Math.round(Life * 10), 1, 2, `rgba(240,240,240,${0.55 * (1 - Life)})`);
  }
  Rect(c, Kx + 16, Oy - 5, 5, 5, "#B4383A"); Rect(c, Kx + 21, Oy - 4, 1, 2, "#B4383A");
  Rect(c, 0, 0, W, H, "rgba(20,14,10,0.1)");
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
  { name: "Rainy café", id: "cafe", dim: 0.08, draw: DrawCafe, theme: {
      books: ["#6B4E3D", "#C08552", "#3C4F65", "#E6C79C", "#8C3B2E", "#5D7285", "#2E2A35", "#D9A066"],   // coffee, street lamps, rainy blues
      shelf: "#2B1D16", edge: "#7A5640", plaque: "#D9A066" } },
  { name: "Autumn forest", id: "autumn", dim: 0.2, draw: DrawAutumn, theme: {
      books: ["#8C3B1E", "#D9822B", "#E8B04A", "#5C3A1E", "#A6542B", "#3E4A2A", "#C9693A", "#F0D9A0"],   // falling leaves and bark
      shelf: "#3A2214", edge: "#9A5A2A", plaque: "#E8A23A" } },
  { name: "Attic nook", id: "attic", dim: 0, draw: DrawAttic, theme: {
      books: ["#3A4A6B", "#8C5A3C", "#C9A66B", "#2A2438", "#6B8E7A", "#A84B3A", "#D8C9A8", "#4E3A5C"],   // night sky, old wood, lamplight
      shelf: "#2A1C14", edge: "#6E4A30", plaque: "#D8B060" } },
  { name: "Grand library", id: "library", dim: 0.05, draw: DrawGrandLibrary, theme: {
      books: ["#7A2E2E", "#2E4A3A", "#C9A14A", "#3A3A6A", "#8C5A2B", "#5A2E4A", "#D8C8A8", "#4A6A7A"],   // old cloth bindings and gilt
      shelf: "#2A180E", edge: "#8C6440", plaque: "#D4A84A" } },
  { name: "Mountain temple", id: "temple", dim: 0.18, draw: DrawTemple, theme: {
      books: ["#B4382A", "#F2C4CE", "#5A4A7A", "#E8DCC4", "#8C2F39", "#EFA8BC", "#3A2A36", "#C9A14A"],   // temple red, blossom, mountain dusk
      shelf: "#3A2626", edge: "#EFA8BC", plaque: "#F2C4CE" } },      // the lit edge is pink: petals settled on the shelves
  { name: "Keeper's cottage", id: "keeper", dim: 0.1, draw: DrawKeepersCottage, theme: {
      books: ["#3E5A7A", "#B4383A", "#E8D9B0", "#2A3644", "#9AB8C8", "#C9A14A", "#6E4A30", "#E8E0D4"],   // sea blues, lighthouse red, sailcloth
      shelf: "#2A2420", edge: "#9AB8C8", plaque: "#E8D9B0" } },
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

// The picker only exists on the main page and the landing page, elsewhere these are null and the picker code is skipped
const ScenePicker = document.getElementById("scenePicker");
const SceneList = document.getElementById("sceneList");
const MotionSwitch = document.getElementById("motionSwitch");
const ShuffleOptions = document.getElementById("shuffleOptions");
const JournalTabs = document.getElementById("journalTabs");

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

// The RememberForVisit function saves a note that only lasts until this tab or the home screen app is closed
function RememberForVisit(Key, Value)
{
  try { sessionStorage.setItem(Key, Value); }
  catch (error) {}
}

// The RecallForVisit function reads a note saved by the RememberForVisit function
function RecallForVisit(Key)
{
  try { return sessionStorage.getItem(Key); }
  catch (error) { return null; }
}

// MotionOn holds whether the background moves, it uses the saved choice or otherwise follows the device's setting
let MotionOn = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
if (Recall("library-motion") !== null) MotionOn = Recall("library-motion") === "on";
if (MotionSwitch) MotionSwitch.checked = MotionOn;

// The DrawFrame function paints one frame of the current scene
function DrawFrame(Seconds)
{
  if (typeof StartDaylight === "function") StartDaylight();                         // daylight.js starts a fresh sky map for this frame
  Current.draw(Ctx, Canvas.width, Canvas.height, Seconds);
  if (typeof Daylight === "function") Daylight(Ctx, Canvas.width, Canvas.height);    // and then lights the frame for the time of day
  if (typeof ShowWeather === "function") ShowWeather(Ctx, Canvas.width, Canvas.height, Seconds);    // weather.js adds clouds and rain
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

// Section: Shuffle

// Shuffle holds the shuffle choices for this device: whether it is on, how often a new background comes, and the backgrounds left out of the mix
const Shuffle = {
  on: Recall("library-background") === "shuffle",
  when: Recall("library-shuffle-when") === "day" ? "day" : "visit",
  leftOut: new Set((Recall("library-shuffle-out") || "").split(",").filter((Id) => Backgrounds.some((b) => b.id === Id))),
};

// The Today function returns today's date on this device, such as 2026-10-16
function Today()
{
  const Now = new Date();
  return Now.getFullYear() + "-" + String(Now.getMonth() + 1).padStart(2, "0") + "-" + String(Now.getDate()).padStart(2, "0");
}

// The ShuffleMix function returns the backgrounds that are in the shuffle
function ShuffleMix()
{
  const Mix = Backgrounds.filter((b) => !Shuffle.leftOut.has(b.id));
  return Mix.length >= 2 ? Mix : Backgrounds;      // a saved mix that is too small falls back to all of them
}

// The PickShuffled function picks a background from the mix that is not Avoid, and notes it for this visit and this day
function PickShuffled(Avoid)
{
  const Mix = ShuffleMix();
  const Choices = Mix.filter((b) => b.id !== Avoid);
  const Pick = (Choices.length ? Choices : Mix)[Math.floor(Math.random() * (Choices.length || Mix.length))];
  Remember("library-shuffle-last", Pick.id);
  Remember("library-shuffle-day", Today());
  RememberForVisit("library-shuffle-visit", Pick.id);
  return Pick.id;
}

// The ShuffledBackground function returns the background to show while shuffling: the same one for the whole visit, or for the whole day
function ShuffledBackground()
{
  const InMix = (Id) => ShuffleMix().some((b) => b.id === Id);
  const Last = Recall("library-shuffle-last");
  if (Shuffle.when === "day" && Recall("library-shuffle-day") === Today() && InMix(Last)) return Last;
  const ThisVisit = RecallForVisit("library-shuffle-visit");
  if (Shuffle.when === "visit" && InMix(ThisVisit)) return ThisVisit;
  return PickShuffled(Last);                        // a new visit or a new day never repeats the last one
}

// Section: Showing a background

// The ShowBackground function paints a background and colours the shelves to match, without saving it as the choice
function ShowBackground(Id)
{
  Current = Backgrounds.find((b) => b.id === Id) || Backgrounds[0];   // unknown or nothing saved -> the first one
  document.body.style.setProperty("--dim", Current.dim);
  document.body.dataset.scene = Current.id;                           // the No signal sign takes on the look of the background
  ApplyTheme(Current.theme);
  DrawFrame(20);
  StartOrStop();
  MarkPicker();
}

// The SetBackground function switches to one background and remembers it, which also turns Shuffle off
function SetBackground(Id)
{
  Shuffle.on = false;
  ShowBackground(Id);
  Remember("library-background", Current.id);
}

// The StartShuffle function turns Shuffle on and swaps straight to a different background so it is clear it worked
function StartShuffle()
{
  Shuffle.on = true;
  Remember("library-background", "shuffle");
  ShowBackground(PickShuffled(Current.id));
}

// The MarkPicker function marks the chosen thumbnail, or the Shuffle tile with the mix buttons and options while shuffling
function MarkPicker()
{
  if (!SceneList) return;
  ScenePicker.classList.toggle("is-shuffle", Shuffle.on);
  SceneList.querySelectorAll(".scene").forEach((Button) =>
  {
    const IsShuffle = Button.classList.contains("shuffle-tile");
    Button.setAttribute("aria-pressed", String(IsShuffle ? Shuffle.on : !Shuffle.on && Button.dataset.id === Current.id));
    Button.classList.toggle("is-showing", Shuffle.on && Button.dataset.id === Current.id);
  });
  SceneList.querySelectorAll(".scene-mix").forEach((Mix) =>
  {
    const In = !Shuffle.leftOut.has(Mix.dataset.id);
    Mix.setAttribute("aria-pressed", String(In));
    Mix.textContent = In ? "✓" : "✕";
    Mix.title = In ? "In the shuffle" : "Left out of the shuffle";
    Mix.closest(".scene-cell").classList.toggle("left-out", !In);
  });
  ShuffleOptions.hidden = !Shuffle.on;
  ShuffleOptions.querySelectorAll("[data-when]").forEach((Button) => Button.setAttribute("aria-pressed", String(Button.dataset.when === Shuffle.when)));
}

// Section: The picker

// The MakeThumbnail function paints one small still frame of a background onto a new canvas
function MakeThumbnail(Background)
{
  const Thumbnail = document.createElement("canvas");
  Thumbnail.width = 126;
  Thumbnail.height = 78;
  Background.draw(Thumbnail.getContext("2d"), 126, 78, 20);
  return Thumbnail;
}

// The MakeShuffleTile function paints the Shuffle thumbnail: slices of five backgrounds with a dice on top
function MakeShuffleTile()
{
  const Tile = document.createElement("canvas");
  Tile.width = 126;
  Tile.height = 78;
  const Paint = Tile.getContext("2d");
  const Slice = Math.ceil(126 / 5);
  ["temple", "snow", "cafe", "autumn", "keeper"].forEach((Id, Index) =>
  {
    const Picture = MakeThumbnail(Backgrounds.find((b) => b.id === Id) || Backgrounds[Index]);
    Paint.drawImage(Picture, Index * Slice, 0, Slice, 78, Index * Slice, 0, Slice, 78);
  });
  Paint.fillStyle = "rgba(0, 0, 0, 0.45)";
  Paint.fillRect(43, 19, 40, 40);
  Paint.fillStyle = "#FAF8F2";
  Paint.fillRect(47, 23, 32, 32);
  Paint.fillStyle = "#2A1A10";
  [[53, 29], [69, 29], [61, 37], [53, 45], [69, 45]].forEach(([X, Y]) => Paint.fillRect(X, Y, 5, 5));
  return Tile;
}

// The OpenSettingsPage function turns the journal to one page and marks its bookmark
function OpenSettingsPage(Page)
{
  if (!JournalTabs) return;
  JournalTabs.querySelectorAll("[role=tab]").forEach((Tab) =>
  {
    const Open = Tab.dataset.page === Page;
    Tab.setAttribute("aria-selected", String(Open));
    Tab.tabIndex = Open ? 0 : -1;
  });
  ScenePicker.querySelectorAll(".journal-section").forEach((Section) => { Section.hidden = Section.dataset.page !== Page; });
  document.getElementById("journalPage").scrollTop = 0;
}

if (ScenePicker)
{
  // The Shuffle tile comes first, then one thumbnail per background, each with a small button to leave it out of the shuffle
  const ShuffleCell = document.createElement("div");
  ShuffleCell.className = "scene-cell";
  const ShuffleTile = document.createElement("button");
  ShuffleTile.className = "scene shuffle-tile";
  ShuffleTile.type = "button";
  ShuffleTile.append(MakeShuffleTile(), "Shuffle");
  ShuffleTile.addEventListener("click", StartShuffle);
  ShuffleCell.append(ShuffleTile);
  SceneList.append(ShuffleCell);

  Backgrounds.forEach((Background) =>
  {
    const Cell = document.createElement("div");
    Cell.className = "scene-cell";

    const Button = document.createElement("button");
    Button.className = "scene";
    Button.type = "button";
    Button.dataset.id = Background.id;
    Button.append(MakeThumbnail(Background), Background.name);
    Button.addEventListener("click", () => SetBackground(Background.id));

    const Mix = document.createElement("button");
    Mix.className = "scene-mix";
    Mix.type = "button";
    Mix.dataset.id = Background.id;
    Mix.setAttribute("aria-label", Background.name + " in the shuffle");
    Mix.addEventListener("click", () =>
    {
      // Ticking it back in always works, leaving it out only while at least two stay in
      if (Shuffle.leftOut.has(Background.id)) Shuffle.leftOut.delete(Background.id);
      else if (Backgrounds.length - Shuffle.leftOut.size > 2) Shuffle.leftOut.add(Background.id);
      Remember("library-shuffle-out", [...Shuffle.leftOut].join(","));
      MarkPicker();
    });

    Cell.append(Button, Mix);
    SceneList.append(Cell);
  });

  ShuffleOptions.querySelectorAll("[data-when]").forEach((Button) => Button.addEventListener("click", () =>
  {
    Shuffle.when = Button.dataset.when;
    Remember("library-shuffle-when", Shuffle.when);
    Remember("library-shuffle-last", Current.id);    // the background showing now counts as today's
    Remember("library-shuffle-day", Today());
    RememberForVisit("library-shuffle-visit", Current.id);
    MarkPicker();
  }));

  MotionSwitch.addEventListener("change", () =>
  {
    MotionOn = MotionSwitch.checked;
    Remember("library-motion", MotionOn ? "on" : "off");
    StartOrStop();
  });

  // The bookmarks: a click turns to that page, the arrow keys move between them
  if (JournalTabs)
  {
    const Tabs = [...JournalTabs.querySelectorAll("[role=tab]")];
    Tabs.forEach((Tab, Index) =>
    {
      Tab.addEventListener("click", () => OpenSettingsPage(Tab.dataset.page));
      Tab.addEventListener("keydown", (event) =>
      {
        const Step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[event.key];
        if (!Step) return;
        event.preventDefault();
        const Next = Tabs[(Index + Step + Tabs.length) % Tabs.length];
        OpenSettingsPage(Next.dataset.page);
        Next.focus();
      });
    });
    OpenSettingsPage("background");
  }
}

window.addEventListener("resize", FitCanvas);
FitCanvas();

// Start with whatever was chosen last time on this device, or a shuffled one.
ShowBackground(Shuffle.on ? ShuffledBackground() : Recall("library-background"));

if (ScenePicker)
{
  document.getElementById("sceneButton").addEventListener("click", () =>
  {
    OpenSettingsPage("background");
    ScenePicker.showModal();
  });
  document.getElementById("sceneDone").addEventListener("click", () => ScenePicker.close());
  ScenePicker.addEventListener("click", (event) =>
  {
    if (event.target === ScenePicker) ScenePicker.close();    // a click outside the journal closes it
  });
}
