// This file contains the weather in the windows: every half hour the weather in the member's chosen city is fetched from Open-Meteo, and the skies of every background show it, clear, cloudy, rain or a thunderstorm
// It loads after daylight.js on every page and uses its sky map, the Weather choice on the Background page of Settings picks the city on this device, or turns it off

// Section: The places and the weather

// WEATHER_PLACES holds the cities the weather can come from, only these coordinates are ever sent, nothing about the member
const WEATHER_PLACES = {
  joburg: { name: "Johannesburg", latitude: -26.2041, longitude: 28.0473 },
  pretoria: { name: "Pretoria", latitude: -25.7479, longitude: 28.2293 },
  capetown: { name: "Cape Town", latitude: -33.9249, longitude: 18.4241 },
};
// WEATHER_KEY is where this device keeps the city chosen, or off, WEATHER_SEEN where it keeps the last weather fetched so a new page does not ask again straight away
const WEATHER_KEY = "library-weather";
const WEATHER_SEEN = "library-weather-seen";
// WEATHER_WAIT is how long the weather is kept before it is fetched again
const WEATHER_WAIT = 30 * 60 * 1000;
// OUTSIDE holds the backgrounds that are outdoors, where rain falls over the whole scene, indoors it only falls past the windows
const OUTSIDE = new Set(["woodland", "campfire", "snow", "autumn", "temple"]);
// DAY_SCENES holds the backgrounds painted in daylight, the others are painted at night, used when day and night is switched off
const DAY_SCENES = new Set(["woodland", "autumn", "temple"]);

// WeatherPlace holds the city chosen on this device (Johannesburg to start with) or off, WeatherKind what the sky is doing there: clear, cloudy, rain or storm
const SavedPlace = Recall(WEATHER_KEY);
let WeatherPlace = SavedPlace === "off" || WEATHER_PLACES[SavedPlace] ? SavedPlace : "joburg";
let WeatherKind = "clear";

// The KindOf function turns a weather code from Open-Meteo into one of the four kinds the library draws
function KindOf(Code)
{
  if (Code >= 95) return "storm";                                                  // thunderstorms
  if ((Code >= 51 && Code <= 67) || (Code >= 80 && Code <= 82)) return "rain";     // drizzle, rain and showers
  if (Code >= 2) return "cloudy";                                                  // cloud, fog and the rare snow
  return "clear";
}

// The FetchWeather function asks Open-Meteo for the weather in the chosen city, a fetch from the last half hour is used again, with no signal the sky stays clear
async function FetchWeather()
{
  if (WeatherPlace === "off") return;
  try
  {
    const Seen = JSON.parse(Recall(WEATHER_SEEN));
    if (Seen && Seen.place === WeatherPlace && Date.now() - Seen.at < WEATHER_WAIT)
    {
      WeatherKind = Seen.kind;
      return;
    }
  }
  catch (error)
  {
    // nothing kept yet, so it is fetched below
  }
  const Place = WEATHER_PLACES[WeatherPlace];
  try
  {
    const Address = "https://api.open-meteo.com/v1/forecast?latitude=" + Place.latitude + "&longitude=" + Place.longitude + "&current=weather_code";
    const Answer = await (await fetch(Address)).json();
    WeatherKind = KindOf(Answer.current.weather_code);
    Remember(WEATHER_SEEN, JSON.stringify({ place: WeatherPlace, kind: WeatherKind, at: Date.now() }));
  }
  catch (error)
  {
    console.error(error);                         // the weather is only decoration, so a failed fetch leaves the sky as it is painted
  }
}

// Section: Drawing the weather

// CLOUDS holds the cloud shapes as rows of letters like the shelf ornaments, w is the lit top of a cloud and s its shaded underside
const CLOUDS = [
  [
    ".....wwww.........",
    "...wwwwwwww.ww....",
    "..wwwwwwwwwwwwww..",
    ".wwwwwwwwwwwwwwwww",
    "sssssssssssssssss.",
  ],
  [
    "......www....",
    "..wwwwwwwww..",
    ".wwwwwwwwwwww",
    "sssssssssssss",
  ],
  [
    "........wwwww..........",
    "....wwwwwwwwwww.wwww...",
    "..wwwwwwwwwwwwwwwwwwww.",
    "wwwwwwwwwwwwwwwwwwwwwww",
    ".sssssssssssssssssssss.",
  ],
];

// CloudPen paints the clouds for each frame on a hidden canvas the size of the background, they are then laid only over the sky
const CloudMap = document.createElement("canvas");
const CloudPen = CloudMap.getContext("2d", { willReadFrequently: true });

// The PaintClouds function paints clouds drifting slowly across, more and lower ones when it rains, each keeps its own height and speed
function PaintClouds(Wide, High, Seconds, Sky)
{
  // The clouds only float where there is sky, so the rows with sky in them are found first
  let Top = High, Bottom = 0;
  for (let y = 0; y < High; y++)
  {
    for (let x = 0; x < Wide; x += 2)
    {
      if (Sky[(y * Wide + x) * 4] > 64) { Top = Math.min(Top, y); Bottom = y; break; }
    }
  }
  if (CloudMap.width !== Wide || CloudMap.height !== High) { CloudMap.width = Wide; CloudMap.height = High; }
  CloudPen.clearRect(0, 0, Wide, High);
  if (Bottom <= Top) return CloudPen.getImageData(0, 0, Wide, High).data;
  const Count = Math.max(4, Math.round(Wide / (WeatherKind === "cloudy" ? 28 : 13)));
  for (let n = 0; n < Count; n++)
  {
    const Rows = CLOUDS[n % CLOUDS.length];
    const Size = n % 3 === 0 ? 3 : 2;                                // each letter is painted as a block of dots, so the clouds are big and chunky
    const Width = Rows[0].length * Size;
    const Speed = 0.6 + Hash(n, 91) * 0.8;                          // dots a second
    const X = Math.round((Hash(n, 92) * (Wide + Width) + Seconds * Speed) % (Wide + Width)) - Width;
    const Y = Top - 2 + Math.round(Hash(n, 93) * Math.max(1, (Bottom - Top) * (WeatherKind === "cloudy" ? 0.7 : 0.85)));
    Rows.forEach((Row, j) =>
    {
      for (let i = 0; i < Row.length; i++)
      {
        if (Row[i] === ".") continue;
        // white for the lit part, grey for the shade, and the very top edge brighter still
        const Edge = Row[i] === "w" && (j === 0 || Rows[j - 1][i] === ".");
        CloudPen.fillStyle = Row[i] === "s" ? "#808080" : Edge ? "#FFFFFF" : "#C8C8C8";
        CloudPen.fillRect(X + i * Size, Y + j * Size, Size, Size);
      }
    });
  }
  return CloudPen.getImageData(0, 0, Wide, High).data;
}

// The ShowWeather function is called by backgrounds.js after each frame is painted and lit: grey skies and drifting clouds, rain streaks, and the odd flash of lightning in a storm
function ShowWeather(Pen, Wide, High, Seconds)
{
  if (WeatherPlace === "off" || WeatherKind === "clear" || !Wide || !High) return;
  const Frame = Pen.getImageData(0, 0, Wide, High);
  const Dots = Frame.data;
  const Sky = SkyPen.getImageData(0, 0, Wide, High).data;
  const Outside = OUTSIDE.has(Current.id);
  const Grey = WeatherKind === "cloudy" ? 0.35 : 0.6;                      // how much colour the sky loses
  const Heavy = WeatherKind === "storm" ? 0.2 : 0.11;                      // the share of columns that have rain falling
  const Flash = WeatherKind === "storm" && (Math.floor(Seconds * 10) % 70 === 0 || Math.floor(Seconds * 10) % 70 === 2);
  const Puffs = PaintClouds(Wide, High, Seconds, Sky);
  // With day and night on the time of day decides, otherwise each background keeps the time it was painted at
  const Night = DaylightOn ? LightAt(HourNow()).sky < 0.5 : !DAY_SCENES.has(Current.id);
  // Rain clouds are a darker grey than the clouds of a cloudy day
  const CloudColours = WeatherKind === "cloudy"
    ? { dayTop: [255, 255, 255], dayLit: [236, 240, 246], dayShade: [184, 194, 210], nightTop: [104, 110, 134], nightLit: [78, 84, 106], nightShade: [50, 55, 72] }
    : { dayTop: [206, 211, 222], dayLit: [170, 177, 190], dayShade: [126, 134, 150], nightTop: [84, 89, 106], nightLit: [60, 64, 79], nightShade: [38, 41, 52] };
  // The At function checks whether a dot is sky, dots off the edge are not
  const At = (X, Y) => X >= 0 && Y >= 0 && X < Wide && Y < High && Sky[(Y * Wide + X) * 4] > 64;
  for (let y = 0; y < High; y++)
  {
    for (let x = 0; x < Wide; x++)
    {
      const i = (y * Wide + x) * 4;
      // Stars and snowflakes painted on the sky count as sky too, so the clouds cover them
      let IsSky = Sky[i] > 64;
      let Behind = -1;                                                 // for a star, the sky dot beside it, already clouded over
      const Bright = Math.max(Dots[i], Dots[i + 1], Dots[i + 2]) > 110;      // only bright dots can be stars, so window frames stay
      for (let Gap = 1; Gap <= 3 && !IsSky && Bright; Gap++)
      {
        if (At(x - Gap, y) && At(x + Gap, y)) Behind = i - Gap * 4;
        else if (At(x, y - Gap) && At(x, y + Gap)) Behind = i - Gap * Wide * 4;
        IsSky = Behind >= 0;
      }
      // The moon is hidden behind any cloud passing in front of it
      if (!IsSky && Sky[i] >= 24 && Puffs[i] > 0)
      {
        const Tone = Puffs[i] > 230 ? "Top" : Puffs[i] > 150 ? "Lit" : "Shade";
        const Tint = CloudColours[(Night ? "night" : "day") + Tone];
        Dots[i] = Tint[0]; Dots[i + 1] = Tint[1]; Dots[i + 2] = Tint[2];
        continue;
      }
      let R = Dots[i], G = Dots[i + 1], B = Dots[i + 2];
      // A star behind the clouds takes the colour of the clouded sky beside it
      if (Behind >= 0) { R = Dots[Behind]; G = Dots[Behind + 1]; B = Dots[Behind + 2]; Dots[i] = R; Dots[i + 1] = G; Dots[i + 2] = B; continue; }
      if (IsSky)
      {
        // The sky goes a little grey, and the clouds drift across it in two flat tones
        const Light = (R + G + B) / 3;
        R += (Light - R) * Grey; G += (Light - G) * Grey; B += (Light * 1.04 - B) * Grey;
        if (Puffs[i] > 0)
        {
          const Tone = Puffs[i] > 230 ? "Top" : Puffs[i] > 150 ? "Lit" : "Shade";
          const Tint = CloudColours[(Night ? "night" : "day") + Tone];
          R = Tint[0]; G = Tint[1]; B = Tint[2];
        }
        if (Flash) { R += (245 - R) * 0.7; G += (245 - G) * 0.7; B += (255 - B) * 0.7; }
      }
      else if (Flash && Outside)
      {
        R *= 1.35; G *= 1.35; B *= 1.45;
      }
      // Rain streaks fall in slanted lines, over the whole scene outdoors and only past the windows indoors
      if (WeatherKind !== "cloudy" && (IsSky || Outside))
      {
        const Column = x + Math.floor(y / 4);
        const Drop = (y + Math.floor(Seconds * 40) + Math.floor(Hash(Column, 7) * 200)) % 31;
        if (Hash(Column, 3) < Heavy && Drop < 4)
        {
          R += (190 - R) * 0.35; G += (205 - G) * 0.35; B += (230 - B) * 0.35;
        }
      }
      Dots[i] = R; Dots[i + 1] = G; Dots[i + 2] = B;
    }
  }
  Pen.putImageData(Frame, 0, 0);
}

// Section: Choosing the city

// The SetWeatherPlace function changes the city on this device, or turns the weather off, and paints the background again once the new weather is in
async function SetWeatherPlace(Choice)
{
  WeatherPlace = Choice;
  Remember(WEATHER_KEY, Choice);
  WeatherKind = "clear";
  await FetchWeather();
  DrawFrame(MotionOn ? performance.now() / 1000 : 20);
}

// The Weather choice on the Background page of Settings, only on the library page
const WeatherChoice = document.getElementById("weatherChoice");
if (WeatherChoice)
{
  WeatherChoice.value = WeatherPlace;
  WeatherChoice.addEventListener("change", () => SetWeatherPlace(WeatherChoice.value));
}

// The weather is fetched when the page opens and again every half hour, a still background is painted again each time
FetchWeather().then(() => DrawFrame(MotionOn ? performance.now() / 1000 : 20));
setInterval(() => FetchWeather().then(() => { if (!MotionOn) DrawFrame(20); }), WEATHER_WAIT);
