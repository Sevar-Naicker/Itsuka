// This file contains day and night: the background follows the time on the member's own device, a pink dawn, bright day, golden sunset and a dark blue night with the fires, candles and lamps still glowing
// It loads straight after backgrounds.js on every page and lights each frame backgrounds.js paints, the Day and night switch on the Background page of Settings turns it off on this device

// DAYLIGHT_KEY is where this device keeps whether day and night is on, like the background itself it is chosen on each device
const DAYLIGHT_KEY = "library-daylight";
// DaylightOn holds whether the background follows the time of day, it starts on
let DaylightOn = Recall(DAYLIGHT_KEY) !== "off";

// Section: How the room looks through the day

// LIGHT holds how the room looks at each hour: how much each colour is kept, how much light is added, and the sky through the windows (none at night)
const LIGHT = [
  { at: 0,    keep: [0.52, 0.58, 0.86], add: [0, 0, 10],   sky: null },
  { at: 5,    keep: [0.52, 0.58, 0.86], add: [0, 0, 10],   sky: null },
  { at: 6.5,  keep: [0.88, 0.80, 0.90], add: [20, 6, 14],  sky: [231, 169, 181] },
  { at: 9,    keep: [1.10, 1.08, 1.04], add: [12, 12, 10], sky: [143, 195, 232] },
  { at: 15.5, keep: [1.10, 1.08, 1.04], add: [12, 12, 10], sky: [143, 195, 232] },
  { at: 17.5, keep: [1.12, 0.94, 0.76], add: [22, 8, 0],   sky: [242, 182, 110] },
  { at: 19,   keep: [0.92, 0.74, 0.76], add: [24, 4, 12],  sky: [224, 122, 85] },
  { at: 20.5, keep: [0.58, 0.60, 0.86], add: [2, 0, 10],   sky: null },
  { at: 24,   keep: [0.52, 0.58, 0.86], add: [0, 0, 10],   sky: null },
];

// NIGHT_SKY holds the exact colours the scenes paint their night skies with, only these dots turn into the day's sky
const NIGHT_SKY = new Set([
  "#141C3D", "#1B2650",                                              // cabin windows
  "#070B1D", "#0A1026", "#0E1630", "#131D3C", "#182448",             // campfire
  "#1B2048", "#262859", "#383168", "#523C72",                        // snowy cabin, the darker part of its dusk
  "#2B3550", "#33405E", "#3D4B69", "#475674", "#52607D",             // rainy café, the sky over the street
  "#1A2448", "#202C52",                                              // grand library window
  "#24304A", "#2C3854", "#36425E", "#424E6A",                        // keeper's cottage window
].map((Hex) => Hex.toLowerCase()));
// DAY_SKY holds the colours of the skies painted in daylight (woodland, autumn forest, mountain temple), these turn to night after dark
const DAY_SKY = new Set([
  "#A9D4A2", "#B7DCAC", "#C6E4B8", "#D3EBC4",                        // green woodland
  "#E8B86A", "#EEC47A", "#F2CE88", "#F4D898", "#F2DCA8",             // autumn forest
  "#F2C6B4", "#F4CDB8", "#F2C0B6", "#EDB2B6", "#E3A2B4", "#D494B2",  // mountain temple
].map((Hex) => Hex.toLowerCase()));

// MOON holds the colours the moons are painted with, they sit in the sky so clouds can pass in front of them (weather.js)
const MOON = new Set(["#F4EBC8", "#DCD1A6", "#F0EBD2"].map((Hex) => Hex.toLowerCase()));

// SNOWY holds the backgrounds where the white dots in the windows are falling snow, which stays by day, everywhere else they are stars, which fade by day
const SNOWY = new Set(["snow"]);

// SkyMap is a hidden copy of the background where every dot of night sky is white, day sky grey, the moon nearly black and everything else black, so the sky is still found after the room's evening shade is laid over it
const SkyMap = document.createElement("canvas");
const SkyPen = SkyMap.getContext("2d", { willReadFrequently: true });
// The SkyMapWanted function checks whether the sky map is needed: for day and night, or for weather.js when the sky is not clear
function SkyMapWanted()
{
  return DaylightOn || (typeof WeatherPlace !== "undefined" && WeatherPlace !== "off" && WeatherKind !== "clear");
}

// Every rectangle painted on the background is painted on the map too, white for night sky, grey for day sky and black for anything else
const RealFillRect = Ctx.fillRect;
Ctx.fillRect = function (X, Y, W, H)
{
  RealFillRect.call(this, X, Y, W, H);
  if (!SkyMapWanted()) return;
  // Only solid colours count, see-through shade and glows leave the map as it is
  if (typeof this.fillStyle !== "string" || this.fillStyle[0] !== "#") return;
  SkyPen.fillStyle = NIGHT_SKY.has(this.fillStyle) ? "#FFFFFF" : DAY_SKY.has(this.fillStyle) ? "#808080" : MOON.has(this.fillStyle) ? "#202020" : "#000000";
  SkyPen.fillRect(X, Y, W, H);
};


// Section: Lighting each frame

// The HourNow function gives the hour on this device as a number, like 18.5 for half past six
function HourNow()
{
  const Now = new Date();
  return Now.getHours() + Now.getMinutes() / 60;
}

// The StartDaylight function is called by backgrounds.js before each frame, it sizes the sky map to the background and clears it, weather.js uses the map too
function StartDaylight()
{
  if (!SkyMapWanted()) return;
  if (SkyMap.width !== Canvas.width || SkyMap.height !== Canvas.height)
  {
    SkyMap.width = Canvas.width;
    SkyMap.height = Canvas.height;
  }
  SkyPen.fillStyle = "#000000";
  SkyPen.fillRect(0, 0, SkyMap.width, SkyMap.height);
}

// The LightAt function blends the two nearest hours in LIGHT, so the room changes slowly through the day
function LightAt(Hour)
{
  const After = LIGHT.findIndex((Step) => Step.at >= Hour);
  const B = LIGHT[Math.max(After, 1)];
  const A = LIGHT[Math.max(After, 1) - 1];
  const Share = B.at === A.at ? 0 : (Hour - A.at) / (B.at - A.at);
  const Mix = (X, Y) => X.map((Value, i) => Value + (Y[i] - Value) * Share);
  // The sky fades in and out with the light, a missing sky counts as none
  const SkyA = A.sky ? 1 : 0, SkyB = B.sky ? 1 : 0;
  const Sky = SkyA + (SkyB - SkyA) * Share;
  const Colour = Mix(A.sky || B.sky || [0, 0, 0], B.sky || A.sky || [0, 0, 0]);
  return { keep: Mix(A.keep, B.keep), add: Mix(A.add, B.add), sky: Sky, skyColour: Colour };
}

// The Daylight function lights a painted frame for the time of day: night skies in the windows turn to day, the room is lit or darkened, and fires, candles and lamps keep glowing in the dark
function Daylight(Pen, Wide, High)
{
  if (!DaylightOn || !Wide || !High) return;
  const Light = LightAt(HourNow());
  const Frame = Pen.getImageData(0, 0, Wide, High);
  const Dots = Frame.data;
  const Sky = SkyPen.getImageData(0, 0, Wide, High).data;
  const Stars = Light.sky > 0 && !SNOWY.has(Current.id);
  // The NightSkyAt function checks whether a dot is night sky, dots off the edge are not
  const NightSkyAt = (X, Y) => X >= 0 && Y >= 0 && X < Wide && Y < High && Sky[(Y * Wide + X) * 4] >= 192;
  for (let i = 0; i < Dots.length; i += 4)
  {
    let R = Dots[i], G = Dots[i + 1], B = Dots[i + 2];
    const Bright = Math.max(R, G, B);
    // A bright dot with night sky on both sides of it is a star, by day it fades into the sky like the sky around it (the cabin's firelight dims its stars, so a little under full bright still counts)
    let Star = false;
    if (Stars && Sky[i] < 64 && Bright > 110)
    {
      const X = (i >> 2) % Wide, Y = Math.floor((i >> 2) / Wide);
      for (let Gap = 1; Gap <= 3 && !Star; Gap++) Star = (NightSkyAt(X - Gap, Y) && NightSkyAt(X + Gap, Y)) || (NightSkyAt(X, Y - Gap) && NightSkyAt(X, Y + Gap));
    }
    // A warm, bright dot is a flame or a lamp, it stays as it is however dark the room gets
    const Glowing = ((R > 235 && G > 140) || (R > 220 && R > B + 110)) && Sky[i] < 64 && !Star;
    // A dot of sky painted in daylight turns to a night sky after dark
    const DaySky = Sky[i] > 64 && Sky[i] < 192;
    if (DaySky && Light.sky < 1)
    {
      const Shade = 0.7 + Bright / 255 * 0.5;
      R += (22 * Shade - R) * (1 - Light.sky);
      G += (30 * Shade - G) * (1 - Light.sky);
      B += (66 * Shade - B) * (1 - Light.sky);
    }
    // A dot of night sky through a window takes the day's sky colour by day
    if (Light.sky > 0 && (Sky[i] >= 192 || Star))
    {
      const Shade = Star ? 0.97 : 0.8 + Bright / 255 * 0.9;           // the sky's bands stay a little lighter towards the horizon, a faded star is just sky
      R += (Light.skyColour[0] * Shade - R) * Light.sky;
      G += (Light.skyColour[1] * Shade - G) * Light.sky;
      B += (Light.skyColour[2] * Shade - B) * Light.sky;
    }
    if (!Glowing)
    {
      R = R * Light.keep[0] + Light.add[0];
      G = G * Light.keep[1] + Light.add[1];
      B = B * Light.keep[2] + Light.add[2];
    }
    Dots[i] = R; Dots[i + 1] = G; Dots[i + 2] = B;
  }
  Pen.putImageData(Frame, 0, 0);
}


// Section: Switching it on and off

// The SetDaylight function turns day and night on or off on this device, the background is painted again straight away
function SetDaylight(On)
{
  if (DaylightOn === On) return;
  DaylightOn = On;
  Remember(DAYLIGHT_KEY, On ? "on" : "off");
  DrawFrame(MotionOn ? performance.now() / 1000 : 20);
}

// The Day and night switch on the Background page of Settings, only on the library page
const DaylightSwitch = document.getElementById("daylightSwitch");
if (DaylightSwitch)
{
  DaylightSwitch.checked = DaylightOn;
  DaylightSwitch.addEventListener("change", () => SetDaylight(DaylightSwitch.checked));
}

// A still background (moving backgrounds off) is painted again every minute so it keeps up with the time, a moving one does so by itself
setInterval(() => { if (DaylightOn && !MotionOn) DrawFrame(20); }, 60 * 1000);

// The first frame was painted before this file loaded, so it is painted again lit for the time of day
DrawFrame(20);
