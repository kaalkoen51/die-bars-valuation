/* ============================================================
   Hitster — Web Edition
   Pure front-end. Spotify Authorization Code + PKCE (no backend,
   no client secret) + Web Playback SDK (requires Premium).
   ============================================================ */

"use strict";

// Prefilled (but still editable) playlist. Paste a Spotify playlist link/URI
// here to set the game's default deck.
const DEFAULT_PLAYLIST = "https://open.spotify.com/playlist/4usB6m0N9NsfWzwdk9Jj0d";

// Built-in deck: well-known songs across the decades. Each is resolved to a
// playable Spotify track at game time via the Search API (no playlist needed).
const BUILTIN_DECK = [
  // 1950s–60s
  { title: "Rock Around the Clock", artist: "Bill Haley & His Comets", year: 1955 },
  { title: "Johnny B. Goode", artist: "Chuck Berry", year: 1958 },
  { title: "What'd I Say", artist: "Ray Charles", year: 1959 },
  { title: "I Want to Hold Your Hand", artist: "The Beatles", year: 1963 },
  { title: "My Girl", artist: "The Temptations", year: 1964 },
  { title: "(I Can't Get No) Satisfaction", artist: "The Rolling Stones", year: 1965 },
  { title: "Good Vibrations", artist: "The Beach Boys", year: 1966 },
  { title: "Respect", artist: "Aretha Franklin", year: 1967 },
  { title: "Light My Fire", artist: "The Doors", year: 1967 },
  { title: "Hey Jude", artist: "The Beatles", year: 1968 },
  { title: "Born to Be Wild", artist: "Steppenwolf", year: 1968 },
  { title: "I Heard It Through the Grapevine", artist: "Marvin Gaye", year: 1968 },
  { title: "Whole Lotta Love", artist: "Led Zeppelin", year: 1969 },
  // 1970s
  { title: "Let It Be", artist: "The Beatles", year: 1970 },
  { title: "Bridge Over Troubled Water", artist: "Simon & Garfunkel", year: 1970 },
  { title: "Imagine", artist: "John Lennon", year: 1971 },
  { title: "Stairway to Heaven", artist: "Led Zeppelin", year: 1971 },
  { title: "What's Going On", artist: "Marvin Gaye", year: 1971 },
  { title: "Superstition", artist: "Stevie Wonder", year: 1972 },
  { title: "Tiny Dancer", artist: "Elton John", year: 1972 },
  { title: "Killing Me Softly with His Song", artist: "Roberta Flack", year: 1973 },
  { title: "Dream On", artist: "Aerosmith", year: 1973 },
  { title: "Waterloo", artist: "ABBA", year: 1974 },
  { title: "Bohemian Rhapsody", artist: "Queen", year: 1975 },
  { title: "Dancing Queen", artist: "ABBA", year: 1976 },
  { title: "Hotel California", artist: "Eagles", year: 1976 },
  { title: "Go Your Own Way", artist: "Fleetwood Mac", year: 1977 },
  { title: "Stayin' Alive", artist: "Bee Gees", year: 1977 },
  { title: "I Will Survive", artist: "Gloria Gaynor", year: 1978 },
  { title: "September", artist: "Earth, Wind & Fire", year: 1978 },
  { title: "Le Freak", artist: "Chic", year: 1978 },
  { title: "Don't Stop Me Now", artist: "Queen", year: 1978 },
  // 1980s
  { title: "Another Brick in the Wall, Pt. 2", artist: "Pink Floyd", year: 1979 },
  { title: "Another One Bites the Dust", artist: "Queen", year: 1980 },
  { title: "Call Me", artist: "Blondie", year: 1980 },
  { title: "Don't Stop Believin'", artist: "Journey", year: 1981 },
  { title: "Tainted Love", artist: "Soft Cell", year: 1981 },
  { title: "Under Pressure", artist: "Queen", year: 1981 },
  { title: "Billie Jean", artist: "Michael Jackson", year: 1983 },
  { title: "Beat It", artist: "Michael Jackson", year: 1983 },
  { title: "Every Breath You Take", artist: "The Police", year: 1983 },
  { title: "Sweet Dreams (Are Made of This)", artist: "Eurythmics", year: 1983 },
  { title: "Like a Virgin", artist: "Madonna", year: 1984 },
  { title: "When Doves Cry", artist: "Prince", year: 1984 },
  { title: "Careless Whisper", artist: "George Michael", year: 1984 },
  { title: "Take On Me", artist: "a-ha", year: 1985 },
  { title: "Don't You (Forget About Me)", artist: "Simple Minds", year: 1985 },
  { title: "Running Up That Hill", artist: "Kate Bush", year: 1985 },
  { title: "Livin' on a Prayer", artist: "Bon Jovi", year: 1986 },
  { title: "Sweet Child O' Mine", artist: "Guns N' Roses", year: 1987 },
  { title: "With or Without You", artist: "U2", year: 1987 },
  { title: "Never Gonna Give You Up", artist: "Rick Astley", year: 1987 },
  { title: "Faith", artist: "George Michael", year: 1987 },
  { title: "Pour Some Sugar on Me", artist: "Def Leppard", year: 1987 },
  { title: "Like a Prayer", artist: "Madonna", year: 1989 },
  // 1990s
  { title: "Nothing Compares 2 U", artist: "Sinéad O'Connor", year: 1990 },
  { title: "Vogue", artist: "Madonna", year: 1990 },
  { title: "Smells Like Teen Spirit", artist: "Nirvana", year: 1991 },
  { title: "Black or White", artist: "Michael Jackson", year: 1991 },
  { title: "Losing My Religion", artist: "R.E.M.", year: 1991 },
  { title: "I Will Always Love You", artist: "Whitney Houston", year: 1992 },
  { title: "Creep", artist: "Radiohead", year: 1992 },
  { title: "Killing in the Name", artist: "Rage Against the Machine", year: 1992 },
  { title: "Zombie", artist: "The Cranberries", year: 1994 },
  { title: "Loser", artist: "Beck", year: 1994 },
  { title: "Wonderwall", artist: "Oasis", year: 1995 },
  { title: "Gangsta's Paradise", artist: "Coolio", year: 1995 },
  { title: "California Love", artist: "2Pac", year: 1995 },
  { title: "Wannabe", artist: "Spice Girls", year: 1996 },
  { title: "No Diggity", artist: "Blackstreet", year: 1996 },
  { title: "Bitter Sweet Symphony", artist: "The Verve", year: 1997 },
  { title: "MMMBop", artist: "Hanson", year: 1997 },
  { title: "...Baby One More Time", artist: "Britney Spears", year: 1998 },
  { title: "Believe", artist: "Cher", year: 1998 },
  { title: "Smooth", artist: "Santana", year: 1999 },
  { title: "Genie in a Bottle", artist: "Christina Aguilera", year: 1999 },
  // 2000s
  { title: "Bye Bye Bye", artist: "NSYNC", year: 2000 },
  { title: "Beautiful Day", artist: "U2", year: 2000 },
  { title: "Stan", artist: "Eminem", year: 2000 },
  { title: "Drops of Jupiter", artist: "Train", year: 2001 },
  { title: "Lose Yourself", artist: "Eminem", year: 2002 },
  { title: "Hey Ya!", artist: "OutKast", year: 2003 },
  { title: "Crazy in Love", artist: "Beyoncé", year: 2003 },
  { title: "Seven Nation Army", artist: "The White Stripes", year: 2003 },
  { title: "In da Club", artist: "50 Cent", year: 2003 },
  { title: "Toxic", artist: "Britney Spears", year: 2003 },
  { title: "Mr. Brightside", artist: "The Killers", year: 2004 },
  { title: "Feel Good Inc.", artist: "Gorillaz", year: 2005 },
  { title: "Gold Digger", artist: "Kanye West", year: 2005 },
  { title: "Hips Don't Lie", artist: "Shakira", year: 2006 },
  { title: "Crazy", artist: "Gnarls Barkley", year: 2006 },
  { title: "Chasing Cars", artist: "Snow Patrol", year: 2006 },
  { title: "Rehab", artist: "Amy Winehouse", year: 2006 },
  { title: "Umbrella", artist: "Rihanna", year: 2007 },
  { title: "Viva la Vida", artist: "Coldplay", year: 2008 },
  { title: "Poker Face", artist: "Lady Gaga", year: 2008 },
  { title: "Single Ladies (Put a Ring on It)", artist: "Beyoncé", year: 2008 },
  { title: "Use Somebody", artist: "Kings of Leon", year: 2008 },
  { title: "I Gotta Feeling", artist: "The Black Eyed Peas", year: 2009 },
  { title: "Bad Romance", artist: "Lady Gaga", year: 2009 },
  { title: "Empire State of Mind", artist: "Jay-Z", year: 2009 },
  // 2010s
  { title: "Rolling in the Deep", artist: "Adele", year: 2010 },
  { title: "Dynamite", artist: "Taio Cruz", year: 2010 },
  { title: "Someone Like You", artist: "Adele", year: 2011 },
  { title: "Moves like Jagger", artist: "Maroon 5", year: 2011 },
  { title: "Somebody That I Used to Know", artist: "Gotye", year: 2011 },
  { title: "Call Me Maybe", artist: "Carly Rae Jepsen", year: 2012 },
  { title: "We Are Young", artist: "fun.", year: 2012 },
  { title: "Get Lucky", artist: "Daft Punk", year: 2013 },
  { title: "Happy", artist: "Pharrell Williams", year: 2013 },
  { title: "Blurred Lines", artist: "Robin Thicke", year: 2013 },
  { title: "Royals", artist: "Lorde", year: 2013 },
  { title: "Wake Me Up", artist: "Avicii", year: 2013 },
  { title: "Uptown Funk", artist: "Mark Ronson", year: 2014 },
  { title: "Shake It Off", artist: "Taylor Swift", year: 2014 },
  { title: "Thinking Out Loud", artist: "Ed Sheeran", year: 2014 },
  { title: "All About That Bass", artist: "Meghan Trainor", year: 2014 },
  { title: "Hello", artist: "Adele", year: 2015 },
  { title: "Can't Feel My Face", artist: "The Weeknd", year: 2015 },
  { title: "Hotline Bling", artist: "Drake", year: 2015 },
  { title: "Cheap Thrills", artist: "Sia", year: 2016 },
  { title: "Can't Stop the Feeling!", artist: "Justin Timberlake", year: 2016 },
  { title: "Closer", artist: "The Chainsmokers", year: 2016 },
  { title: "Shape of You", artist: "Ed Sheeran", year: 2017 },
  { title: "Despacito", artist: "Luis Fonsi", year: 2017 },
  { title: "HUMBLE.", artist: "Kendrick Lamar", year: 2017 },
  { title: "Believer", artist: "Imagine Dragons", year: 2017 },
  { title: "God's Plan", artist: "Drake", year: 2018 },
  { title: "Sunflower", artist: "Post Malone", year: 2018 },
  { title: "Shallow", artist: "Lady Gaga, Bradley Cooper", year: 2018 },
  { title: "thank u, next", artist: "Ariana Grande", year: 2018 },
  { title: "Old Town Road", artist: "Lil Nas X", year: 2019 },
  { title: "Bad Guy", artist: "Billie Eilish", year: 2019 },
  { title: "Señorita", artist: "Shawn Mendes, Camila Cabello", year: 2019 },
  { title: "Dance Monkey", artist: "Tones and I", year: 2019 },
  { title: "Don't Start Now", artist: "Dua Lipa", year: 2019 },
  // 2020s
  { title: "Blinding Lights", artist: "The Weeknd", year: 2020 },
  { title: "Watermelon Sugar", artist: "Harry Styles", year: 2020 },
  { title: "Levitating", artist: "Dua Lipa", year: 2020 },
  { title: "drivers license", artist: "Olivia Rodrigo", year: 2021 },
  { title: "good 4 u", artist: "Olivia Rodrigo", year: 2021 },
  { title: "STAY", artist: "The Kid LAROI", year: 2021 },
  { title: "Industry Baby", artist: "Lil Nas X", year: 2021 },
  { title: "As It Was", artist: "Harry Styles", year: 2022 },
  { title: "Anti-Hero", artist: "Taylor Swift", year: 2022 },
  { title: "About Damn Time", artist: "Lizzo", year: 2022 },
  { title: "Unholy", artist: "Sam Smith", year: 2022 },
  { title: "Kill Bill", artist: "SZA", year: 2022 },
  { title: "Flowers", artist: "Miley Cyrus", year: 2023 },
  { title: "Paint The Town Red", artist: "Doja Cat", year: 2023 },
  { title: "vampire", artist: "Olivia Rodrigo", year: 2023 },
  { title: "Texas Hold 'Em", artist: "Beyoncé", year: 2024 },
  { title: "Espresso", artist: "Sabrina Carpenter", year: 2024 },
];

const SCOPES = [
  "streaming",
  "user-read-email",
  "user-read-private",
  "user-modify-playback-state",
  "user-read-playback-state",
  "playlist-read-private",
  "playlist-read-collaborative",
].join(" ");

// Bump when SCOPES change so cached tokens with old scopes are discarded
// and the user is forced to re-authorize.
const SCOPE_VERSION = "2";

// Redirect back to this exact page (no query/hash) — must match the
// Redirect URI registered in the Spotify dashboard.
const REDIRECT_URI = window.location.origin + window.location.pathname;

const LS = {
  clientId: "hitster_client_id",
  playlist: "hitster_playlist",
  verifier: "hitster_pkce_verifier",
  token: "hitster_token",
  scopeV: "hitster_scope_v",
};

/* ---------------------------- state ---------------------------- */
const state = {
  token: null,
  tokenExpiry: 0,
  player: null,        // Web Playback SDK player (desktop in-browser device)
  sdkDeviceId: null,   // device id of the in-browser SDK player
  deviceId: null,      // currently selected playback target (any device)
  useBuiltin: false,   // play from the built-in deck instead of a playlist
  deck: [],            // remaining track pool
  current: null,       // track being guessed this turn
  players: [],         // {name, timeline:[track], tokens}
  turn: 0,
  targetCards: 10,
  startTokens: 2,
  maxTokens: 3,
  awaitingNext: false,
  activePlacement: null, // slot the active player chose this turn
  steals: [],            // [{playerIndex, slotIndex}] challenges this turn
  stealing: null,        // player index currently placing a steal
  namingClaimed: false,
};

/* ---------------------------- helpers ---------------------------- */
const $ = (id) => document.getElementById(id);

function toast(msg, ms = 2600) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.remove("hidden");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.add("hidden"), ms);
}

function setStatus(text, cls) {
  const el = $("connection-status");
  el.textContent = text;
  el.className = "status " + cls;
}

function showScreen(id) {
  ["setup-screen", "game-screen", "win-screen"].forEach((s) =>
    $(s).classList.toggle("hidden", s !== id)
  );
}

/* ====================================================================
   PKCE OAUTH
   ==================================================================== */
function randomString(len) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  const arr = crypto.getRandomValues(new Uint8Array(len));
  return Array.from(arr, (b) => chars[b % chars.length]).join("");
}

async function sha256base64url(input) {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function beginLogin() {
  const clientId = $("client-id").value.trim();
  if (!clientId) return toast("Enter your Spotify Client ID first.");
  localStorage.setItem(LS.clientId, clientId);
  localStorage.setItem(LS.playlist, $("playlist-input").value.trim());

  const verifier = randomString(96);
  localStorage.setItem(LS.verifier, verifier);
  const challenge = await sha256base64url(verifier);

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    scope: SCOPES,
    code_challenge_method: "S256",
    code_challenge: challenge,
    redirect_uri: REDIRECT_URI,
  });
  window.location = "https://accounts.spotify.com/authorize?" + params;
}

async function exchangeToken(code) {
  const clientId = localStorage.getItem(LS.clientId);
  const verifier = localStorage.getItem(LS.verifier);
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: REDIRECT_URI,
    client_id: clientId,
    code_verifier: verifier,
  });
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error("Token exchange failed: " + (await res.text()));
  return res.json();
}

function storeToken(data) {
  state.token = data.access_token;
  state.tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  localStorage.setItem(
    LS.token,
    JSON.stringify({ access_token: state.token, expiry: state.tokenExpiry })
  );
  localStorage.setItem(LS.scopeV, SCOPE_VERSION);
}

function loadStoredToken() {
  try {
    if (localStorage.getItem(LS.scopeV) !== SCOPE_VERSION) return false;
    const raw = JSON.parse(localStorage.getItem(LS.token));
    if (raw && raw.expiry > Date.now()) {
      state.token = raw.access_token;
      state.tokenExpiry = raw.expiry;
      return true;
    }
  } catch (_) {}
  return false;
}

/* ====================================================================
   SPOTIFY WEB API
   ==================================================================== */
async function api(path, options = {}) {
  const res = await fetch("https://api.spotify.com/v1" + path, {
    ...options,
    headers: {
      Authorization: "Bearer " + state.token,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  if (res.status === 401) throw new Error("Spotify session expired — reconnect.");
  if (!res.ok && res.status !== 204) {
    const endpoint = path.split("?")[0];
    let msg = `Spotify API error ${res.status} on ${endpoint}`;
    if (res.status === 403) {
      msg += " (Forbidden — usually a private playlist needing reconnection, " +
             "or an account that isn't Premium)";
    }
    const body = await res.text();
    throw new Error(msg + (body ? ": " + body : ""));
  }
  return res.status === 204 ? null : res.json();
}

function parsePlaylistId(input) {
  input = input.trim();
  // spotify:playlist:ID  |  https://open.spotify.com/playlist/ID?...  |  raw ID
  let m = input.match(/playlist[:/]([a-zA-Z0-9]+)/);
  if (m) return m[1];
  if (/^[a-zA-Z0-9]+$/.test(input)) return input;
  return null;
}

async function loadDeck(playlistInput) {
  const id = parsePlaylistId(playlistInput);
  if (!id) throw new Error("Couldn't read a playlist ID from that link.");

  const tracks = [];
  let url =
    `/playlists/${id}/tracks?limit=100&fields=` +
    encodeURIComponent(
      "next,items(track(uri,name,artists(name),album(release_date,release_date_precision)))"
    );

  while (url) {
    let page;
    try {
      page = await api(url);
    } catch (e) {
      if (/error 40[34]/.test(e.message)) {
        throw new Error(
          "Can't read that playlist. Spotify blocks its own personalized/editorial " +
          "playlists (Daily Mix, Discover Weekly, Blends, 'Your Top Songs', etc.). " +
          "Use a normal playlist that a person created and set to Public — e.g. make " +
          "your own playlist, add songs, set it Public, and paste that link."
        );
      }
      throw e;
    }
    for (const item of page.items || []) {
      const t = item.track;
      if (!t || !t.uri || !t.album || !t.album.release_date) continue;
      const year = parseInt(t.album.release_date.slice(0, 4), 10);
      if (!year) continue;
      tracks.push({
        uri: t.uri,
        name: t.name,
        artist: (t.artists || []).map((a) => a.name).join(", "),
        year,
      });
    }
    url = page.next ? page.next.replace("https://api.spotify.com/v1", "") : null;
  }

  if (tracks.length < 5) {
    throw new Error("Need at least 5 playable songs in the playlist — found " + tracks.length + ".");
  }
  return shuffle(tracks);
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/* Build a deck from the built-in song list (URIs resolved lazily at play). */
function builtinDeck() {
  return shuffle(
    BUILTIN_DECK.map((s) => ({ uri: null, name: s.title, artist: s.artist, year: s.year }))
  );
}

/* Resolve a built-in card to a real Spotify track via the Search API. */
async function resolveUri(card) {
  const q = `track:${card.name} artist:${card.artist}`;
  const data = await api(`/search?type=track&limit=1&market=from_token&q=${encodeURIComponent(q)}`);
  const item = data && data.tracks && data.tracks.items && data.tracks.items[0];
  if (!item || !item.uri) throw new Error("not found");
  card.uri = item.uri;
}

async function playTrack(uri) {
  if (!state.deviceId) throw new Error("No playback device selected.");
  await api(`/me/player/play?device_id=${state.deviceId}`, {
    method: "PUT",
    body: JSON.stringify({ uris: [uri] }),
  });
}

async function pausePlayback() {
  // Works for any active device (in-browser SDK or a phone's Spotify app).
  try {
    await api("/me/player/pause", { method: "PUT" });
  } catch (_) {
    /* nothing playing — ignore */
  }
}

async function listDevices() {
  const data = await api("/me/player/devices");
  return (data && data.devices) || [];
}

/* ====================================================================
   WEB PLAYBACK SDK
   ==================================================================== */
function initPlayer() {
  return new Promise((resolve, reject) => {
    const ready = () => {
      const player = new Spotify.Player({
        name: "Hitster Web Edition",
        getOAuthToken: (cb) => cb(state.token),
        volume: 0.8,
      });

      player.addListener("ready", ({ device_id }) => {
        state.sdkDeviceId = device_id;
        state.player = player;
        resolve(player);
      });
      player.addListener("not_ready", () => {});
      player.addListener("initialization_error", ({ message }) => reject(new Error(message)));
      player.addListener("authentication_error", ({ message }) => reject(new Error(message)));
      player.addListener("account_error", () =>
        reject(new Error("This requires a Spotify Premium account."))
      );
      player.connect();
    };

    if (window.Spotify) ready();
    else window.onSpotifyWebPlaybackSDKReady = ready;
  });
}

/* ====================================================================
   GAME LOGIC
   ==================================================================== */
function drawCard() {
  return state.deck.pop();
}

function currentPlayer() {
  return state.players[state.turn];
}

/** Is year Y correctly placed at slotIndex of the given (sorted) timeline? */
function isCorrectPlacement(timeline, slotIndex, year) {
  const left = slotIndex > 0 ? timeline[slotIndex - 1].year : -Infinity;
  const right = slotIndex < timeline.length ? timeline[slotIndex].year : Infinity;
  return left <= year && year <= right;
}

function insertSorted(timeline, card) {
  timeline.push(card);
  timeline.sort((a, b) => a.year - b.year);
}

function startGame() {
  // Each player starts with one revealed card on their timeline + tokens.
  for (const p of state.players) {
    p.timeline = [];
    p.tokens = state.startTokens;
    insertSorted(p.timeline, drawCard());
  }
  state.turn = 0;
  state.current = null;
  state.awaitingNext = false;
  showScreen("game-screen");
  renderGame();
}

function renderScoreboard(containerId) {
  const c = $(containerId);
  c.innerHTML = "";
  state.players.forEach((p, i) => {
    const chip = document.createElement("div");
    chip.className = "score-chip" + (i === state.turn ? " active" : "");
    chip.innerHTML =
      `${escapeHtml(p.name)}<span class="pts">${p.timeline.length}/${state.targetCards}</span>` +
      `<span class="tokens">${"🪙".repeat(p.tokens) || "—"}</span>`;
    c.appendChild(chip);
  });
}

function renderGame() {
  // clear per-turn challenge state
  state.activePlacement = null;
  state.steals = [];
  state.stealing = null;

  renderScoreboard("scoreboard");
  $("turn-player").textContent = currentPlayer().name;
  $("timeline-owner").textContent = "Your timeline";
  $("timeline-help").textContent =
    "Tap the gap where the mystery song fits by release year (oldest → newest).";

  // reset per-turn UI
  $("now-playing").classList.add("hidden");
  $("reveal").classList.add("hidden");
  $("turn-actions").classList.add("hidden");
  $("challenge-panel").classList.add("hidden");
  $("naming-bonus").classList.add("hidden");
  $("play-btn").disabled = false;
  $("pause-btn").disabled = true;
  $("replay-btn").disabled = true;

  renderTimeline(currentPlayer(), false);
}

/** Render the given player's timeline. If active, slots are clickable. */
function renderTimeline(player, active, onSlotClick) {
  const tl = player.timeline;
  const container = $("timeline");
  container.innerHTML = "";

  if (tl.length === 0) {
    container.innerHTML = '<div class="tl-empty">No cards yet.</div>';
    return;
  }

  for (let i = 0; i <= tl.length; i++) {
    const slot = document.createElement("div");
    slot.className = "tl-slot" + (active ? " active" : "");
    slot.textContent = active ? "+" : "·";
    if (active && onSlotClick) slot.onclick = () => onSlotClick(i);
    container.appendChild(slot);

    if (i < tl.length) {
      const card = document.createElement("div");
      card.className = "tl-card";
      const col = yearColor(tl[i].year);
      card.style.borderTop = `5px solid ${col}`;
      card.innerHTML = `
        <div class="tl-year" style="color:${col}">${tl[i].year}</div>
        <div class="tl-title">${escapeHtml(tl[i].name)}</div>
        <div class="tl-artist">${escapeHtml(tl[i].artist)}</div>`;
      container.appendChild(card);
    }
  }
}

/* Map a release year to a colour along a decade gradient (red→violet). */
function yearColor(year) {
  const min = 1950, max = 2030;
  const t = Math.max(0, Math.min(1, (year - min) / (max - min)));
  const hue = 12 + t * 280; // warm (older) → cool (newer)
  return `hsl(${Math.round(hue)}, 70%, 58%)`;
}

function escapeHtml(s) {
  return (s || "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

async function onPlay() {
  if (!state.current) {
    if (state.deck.length === 0) {
      toast("Deck is empty — no more songs!");
      return;
    }
    state.current = drawCard();
  }
  try {
    $("play-btn").disabled = true;
    // built-in cards have no URI yet — find a playable track (skip any misses)
    let tries = 0;
    while (state.current && !state.current.uri && tries < 6) {
      $("now-playing").classList.remove("hidden");
      $("mystery-label").textContent = "Finding song…";
      try {
        await resolveUri(state.current);
      } catch (_) {
        state.current = state.deck.length ? drawCard() : null;
        tries++;
      }
    }
    if (!state.current || !state.current.uri) {
      throw new Error("Couldn't find a playable track on Spotify.");
    }
    $("mystery-label").textContent = "Mystery song playing…";
    await playTrack(state.current.uri);
    $("now-playing").classList.remove("hidden");
    $("pause-btn").disabled = false;
    $("replay-btn").disabled = false;
    renderTimeline(currentPlayer(), true, makeGuess); // enable guess slots
  } catch (e) {
    $("play-btn").disabled = false;
    toast(e.message);
  }
}

/* ── active player commits a placement → enter steal phase ─────────── */
async function makeGuess(slotIndex) {
  if (!state.current || state.awaitingNext) return;
  await pausePlayback();

  state.activePlacement = slotIndex;
  $("pause-btn").disabled = true;
  $("replay-btn").disabled = true;

  // lock the active player's timeline view
  $("timeline-owner").textContent = `${currentPlayer().name}'s placement (locked)`;
  $("timeline-help").textContent = "";
  renderTimeline(currentPlayer(), false);

  const eligible = state.players.some((p, i) => i !== state.turn && p.tokens > 0);
  if (!eligible) {
    resolveTurn(); // no one can steal — straight to reveal
    return;
  }
  renderChallengePhase();
}

function alreadyStole(playerIndex) {
  return state.steals.some((s) => s.playerIndex === playerIndex);
}

function renderChallengePhase() {
  $("challenge-panel").classList.remove("hidden");
  $("challenge-text").textContent =
    "Other players may spend a 🪙 to place the song on their own timeline. " +
    "If the active player is wrong and you're right, you steal the card.";

  const wrap = $("challenge-buttons");
  wrap.innerHTML = "";
  state.players.forEach((p, i) => {
    if (i === state.turn) return;
    const btn = document.createElement("button");
    const can = p.tokens > 0 && !alreadyStole(i);
    btn.disabled = !can;
    btn.textContent = alreadyStole(i)
      ? `${p.name} — placed ✓`
      : `${p.name} steal (🪙 ${p.tokens})`;
    btn.onclick = () => startSteal(i);
    wrap.appendChild(btn);
  });
}

function startSteal(playerIndex) {
  const p = state.players[playerIndex];
  if (p.tokens <= 0 || alreadyStole(playerIndex)) return;
  p.tokens -= 1; // token is spent the moment you challenge
  renderScoreboard("scoreboard");

  state.stealing = playerIndex;
  $("challenge-panel").classList.add("hidden");
  $("timeline-owner").textContent = `${p.name}: place the song to STEAL it`;
  $("timeline-help").textContent = "Tap the gap on your own timeline.";
  renderTimeline(p, true, (slot) => {
    state.steals.push({ playerIndex, slotIndex: slot });
    state.stealing = null;
    $("timeline-owner").textContent = `${currentPlayer().name}'s placement (locked)`;
    $("timeline-help").textContent = "";
    renderTimeline(currentPlayer(), false);
    renderChallengePhase();
  });
}

/* ── reveal the year and resolve the active guess + any steals ─────── */
function resolveTurn() {
  $("challenge-panel").classList.add("hidden");
  const card = state.current;
  const year = card.year;
  const active = currentPlayer();

  const activeCorrect = isCorrectPlacement(active.timeline, state.activePlacement, year);

  let winner = null;
  let outcome = "";
  if (activeCorrect) {
    insertSorted(active.timeline, card);
    winner = active;
    outcome = "✅ Correct — card kept!";
  } else {
    // first challenger (in challenge order) with a correct placement steals it
    const good = state.steals.find((s) =>
      isCorrectPlacement(state.players[s.playerIndex].timeline, s.slotIndex, year)
    );
    if (good) {
      const thief = state.players[good.playerIndex];
      insertSorted(thief.timeline, card);
      winner = thief;
      outcome = `❌ ${active.name} was wrong — 🪙 ${thief.name} stole the card!`;
    } else {
      outcome =
        state.steals.length > 0
          ? "❌ Wrong, and no steal landed — card discarded."
          : "❌ Wrong — card discarded.";
    }
  }

  const r = $("reveal");
  r.className = "reveal " + (winner === active ? "correct" : "wrong");
  r.innerHTML = `
    <div class="year">${year}</div>
    <div class="song-title">${escapeHtml(card.name)}</div>
    <div class="song-artist">${escapeHtml(card.artist)}</div>
    <div class="verdict">${escapeHtml(outcome)}</div>`;
  r.classList.remove("hidden");

  renderTimeline(active, false);
  renderScoreboard("scoreboard");

  state.awaitingNext = true;
  state.current = null;

  // naming bonus: the active player may earn a token for naming title & artist
  state.namingClaimed = false;
  const nb = $("naming-bonus");
  if (active.tokens < state.maxTokens) {
    $("naming-text").textContent = `Did ${active.name} also name the title & artist?`;
    $("award-token-btn").disabled = false;
    nb.classList.remove("hidden");
  } else {
    nb.classList.add("hidden");
  }

  if (winner && winner.timeline.length >= state.targetCards) {
    setTimeout(() => endGame(winner), 1400);
  } else {
    $("turn-actions").classList.remove("hidden");
  }
}

function awardNamingToken() {
  if (state.namingClaimed) return;
  const active = currentPlayer();
  active.tokens = Math.min(state.maxTokens, active.tokens + 1);
  state.namingClaimed = true;
  $("award-token-btn").disabled = true;
  renderScoreboard("scoreboard");
  toast(`${active.name} earned a 🪙 for naming the tune!`);
}

function nextTurn() {
  state.awaitingNext = false;
  state.turn = (state.turn + 1) % state.players.length;
  if (state.deck.length === 0) {
    toast("Out of songs — highest card count wins!");
    endGame([...state.players].sort((a, b) => b.timeline.length - a.timeline.length)[0]);
    return;
  }
  renderGame();
}

function endGame(winner) {
  $("winner-name").textContent = winner.name;
  const sb = $("final-scoreboard");
  sb.innerHTML = "";
  [...state.players]
    .sort((a, b) => b.timeline.length - a.timeline.length)
    .forEach((p) => {
      const chip = document.createElement("div");
      chip.className = "score-chip" + (p === winner ? " active" : "");
      chip.innerHTML = `${p.name}<span class="pts">${p.timeline.length}</span>`;
      sb.appendChild(chip);
    });
  pausePlayback();
  showScreen("win-screen");
}

function exitGame() {
  if (!confirm("Exit the current game and return to setup?")) return;
  pausePlayback();
  state.current = null;
  state.awaitingNext = false;
  state.deck = [];
  state.players = [];
  showScreen("setup-screen");
  refreshStartButton();
}

/* ====================================================================
   SETUP UI
   ==================================================================== */
function addPlayerRow(name = "") {
  const list = $("player-list");
  const row = document.createElement("div");
  row.className = "player-row";
  row.innerHTML = `
    <input type="text" placeholder="Player name" value="${escapeHtml(name)}" />
    <button class="remove" type="button">✕</button>`;
  row.querySelector(".remove").onclick = () => {
    row.remove();
    refreshStartButton();
  };
  row.querySelector("input").oninput = refreshStartButton;
  list.appendChild(row);
  refreshStartButton();
}

function getPlayerNames() {
  return Array.from($("player-list").querySelectorAll("input"))
    .map((i) => i.value.trim())
    .filter(Boolean);
}

function setBuiltin(on) {
  state.useBuiltin = on;
  $("builtin-btn").textContent = on
    ? "✓ Built-in deck selected — tap to use a playlist instead"
    : "🎵 Use built-in deck (no playlist needed)";
  $("builtin-btn").classList.toggle("primary", on);
  $("builtin-btn").classList.toggle("ghost", !on);
  $("playlist-input").disabled = on;
  if (on) $("playlist-input").value = "";
  refreshStartButton();
}

function refreshStartButton() {
  const names = getPlayerNames();
  const connected = !!state.token;
  const device = !!state.deviceId;
  const haveMusic = state.useBuiltin || $("playlist-input").value.trim().length > 0;
  const ok = connected && device && names.length >= 1 && haveMusic;
  $("start-btn").disabled = !ok;

  const hint = [];
  if (!connected) hint.push("connect Spotify");
  else if (!device) hint.push("choose a playback device");
  if (!haveMusic) hint.push("add a playlist or pick the built-in deck");
  if (names.length < 1) hint.push("add at least one player");
  $("setup-hint").textContent = hint.length ? "Still need to: " + hint.join(", ") + "." : "";
}

/* Populate the playback-device dropdown (in-browser SDK + Spotify Connect). */
async function refreshDevices() {
  const select = $("device-select");
  try {
    const devices = await listDevices();
    const opts = [];
    if (state.sdkDeviceId) {
      opts.push({ id: state.sdkDeviceId, label: "This browser (Hitster) — desktop only" });
    }
    for (const d of devices) {
      if (d.id === state.sdkDeviceId) continue; // avoid duplicate
      opts.push({ id: d.id, label: `${d.name} (${d.type})${d.is_active ? " • active" : ""}` });
    }

    const previous = state.deviceId;
    select.innerHTML = "";
    if (opts.length === 0) {
      select.innerHTML = '<option value="">No devices found — open Spotify, play a song, then Refresh</option>';
      state.deviceId = null;
    } else {
      for (const o of opts) {
        const el = document.createElement("option");
        el.value = o.id;
        el.textContent = o.label;
        select.appendChild(el);
      }
      // keep previous choice, else prefer an active Connect device, else SDK/first
      const active = devices.find((d) => d.is_active);
      state.deviceId =
        (previous && opts.some((o) => o.id === previous) && previous) ||
        (active && active.id) ||
        opts[0].id;
      select.value = state.deviceId;
    }
  } catch (e) {
    toast("Couldn't list devices: " + e.message);
  }
  refreshStartButton();
}

async function onStart() {
  const names = getPlayerNames();
  state.players = names.map((n) => ({ name: n, timeline: [], tokens: 0 }));
  state.targetCards = Math.max(3, parseInt($("target-cards").value, 10) || 10);
  state.startTokens = Math.max(0, parseInt($("start-tokens").value, 10) || 0);
  state.maxTokens = Math.max(1, parseInt($("max-tokens").value, 10) || 1);
  state.startTokens = Math.min(state.startTokens, state.maxTokens);

  $("start-btn").disabled = true;
  $("start-btn").textContent = "Loading songs…";
  try {
    if (state.useBuiltin) {
      state.deck = builtinDeck();
    } else {
      state.deck = await loadDeck($("playlist-input").value);
      localStorage.setItem(LS.playlist, $("playlist-input").value.trim());
    }
    if (state.deck.length < state.players.length + 2) {
      throw new Error("Not enough songs for that many players.");
    }
    startGame();
  } catch (e) {
    toast(e.message, 4000);
  } finally {
    $("start-btn").textContent = "Start game";
    refreshStartButton();
  }
}

/* ====================================================================
   CONNECT FLOW
   ==================================================================== */
async function finishConnect() {
  setStatus("Connecting…", "connecting");
  try {
    const me = await api("/me");
    if (me.product !== "premium") {
      setStatus("Premium required", "disconnected");
      toast("This account isn't Premium. Spotify only allows app-controlled playback for Premium users.", 6000);
      return;
    }
  } catch (e) {
    setStatus("Connection failed", "disconnected");
    toast(e.message, 5000);
    return;
  }

  setStatus("Connected ✓", "connected");
  $("connect-btn").textContent = "Connected ✓";
  $("connect-btn").disabled = true;
  $("connect-btn").classList.add("hidden");
  $("disconnect-btn").classList.remove("hidden");
  $("device-section").classList.remove("hidden");

  // The in-browser SDK player only works on desktop browsers. Try it, but
  // don't block — phones use Spotify Connect (their own Spotify app) instead.
  initPlayer()
    .then(() => refreshDevices())
    .catch(() => refreshDevices());

  // also list Connect devices straight away (phones, other computers, etc.)
  refreshDevices();
}

function disconnectSpotify() {
  if (!confirm("Disconnect from Spotify?")) return;
  pausePlayback();
  if (state.player) {
    try { state.player.disconnect(); } catch (_) {}
  }
  state.token = null;
  state.tokenExpiry = 0;
  state.player = null;
  state.sdkDeviceId = null;
  state.deviceId = null;
  localStorage.removeItem(LS.token);
  localStorage.removeItem(LS.scopeV);

  setStatus("Not connected", "disconnected");
  $("connect-btn").textContent = "Connect to Spotify";
  $("connect-btn").disabled = false;
  $("connect-btn").classList.remove("hidden");
  $("disconnect-btn").classList.add("hidden");
  $("device-section").classList.add("hidden");
  $("device-select").innerHTML = "";
  refreshStartButton();
}

async function handleRedirect() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const error = params.get("error");
  if (error) {
    toast("Spotify authorization was cancelled.");
    history.replaceState({}, document.title, REDIRECT_URI);
    return;
  }
  if (code) {
    try {
      const data = await exchangeToken(code);
      storeToken(data);
    } catch (e) {
      toast(e.message, 5000);
    }
    history.replaceState({}, document.title, REDIRECT_URI);
  }
}

/* ====================================================================
   BOOT
   ==================================================================== */
async function boot() {
  $("redirect-uri-display").textContent = REDIRECT_URI;

  // restore saved fields
  $("client-id").value = localStorage.getItem(LS.clientId) || "";
  $("playlist-input").value = localStorage.getItem(LS.playlist) || DEFAULT_PLAYLIST;

  // wire setup events
  $("help-toggle").onclick = (e) => {
    e.preventDefault();
    $("help-box").classList.toggle("hidden");
  };
  $("copy-redirect").onclick = () => {
    navigator.clipboard.writeText(REDIRECT_URI);
    toast("Redirect URI copied.");
  };
  $("connect-btn").onclick = beginLogin;
  $("disconnect-btn").onclick = disconnectSpotify;
  $("exit-game-btn").onclick = exitGame;
  $("refresh-devices").onclick = refreshDevices;
  $("device-select").onchange = (e) => {
    state.deviceId = e.target.value || null;
    refreshStartButton();
  };
  $("add-player").onclick = () => addPlayerRow();
  $("playlist-input").oninput = () => {
    if ($("playlist-input").value.trim()) setBuiltin(false);
    refreshStartButton();
  };
  $("builtin-btn").onclick = () => setBuiltin(!state.useBuiltin);
  $("start-btn").onclick = onStart;

  // game events
  $("play-btn").onclick = onPlay;
  $("pause-btn").onclick = async () => {
    await pausePlayback();
    $("play-btn").disabled = false;
    $("pause-btn").disabled = true;
  };
  $("replay-btn").onclick = async () => {
    if (state.current) await playTrack(state.current.uri);
  };
  $("reveal-btn").onclick = resolveTurn;
  $("award-token-btn").onclick = awardNamingToken;
  $("next-turn-btn").onclick = nextTurn;
  $("play-again-btn").onclick = () => window.location.reload();

  // default two players
  addPlayerRow("Player 1");
  addPlayerRow("Player 2");

  // OAuth: handle the redirect code, else restore a saved token
  await handleRedirect();
  if (!state.token) loadStoredToken();

  if (state.token) {
    await finishConnect();
  } else {
    setStatus("Not connected", "disconnected");
  }
}

boot();
