/* ============================================================
   Hitster — Web Edition
   Pure front-end. Spotify Authorization Code + PKCE (no backend,
   no client secret) + Web Playback SDK (requires Premium).
   ============================================================ */

"use strict";

// Prefilled (but still editable) playlist. Paste a Spotify playlist link/URI
// here to set the game's default deck.
const DEFAULT_PLAYLIST = "https://open.spotify.com/playlist/1lB1E2FhgroJ52ptzxQoQF";

const SCOPES = [
  "streaming",
  "user-read-email",
  "user-read-private",
  "user-modify-playback-state",
  "user-read-playback-state",
].join(" ");

// Redirect back to this exact page (no query/hash) — must match the
// Redirect URI registered in the Spotify dashboard.
const REDIRECT_URI = window.location.origin + window.location.pathname;

const LS = {
  clientId: "hitster_client_id",
  playlist: "hitster_playlist",
  verifier: "hitster_pkce_verifier",
  token: "hitster_token",
};

/* ---------------------------- state ---------------------------- */
const state = {
  token: null,
  tokenExpiry: 0,
  player: null,        // Web Playback SDK player (desktop in-browser device)
  sdkDeviceId: null,   // device id of the in-browser SDK player
  deviceId: null,      // currently selected playback target (any device)
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
}

function loadStoredToken() {
  try {
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
    throw new Error("Spotify API error " + res.status + ": " + (await res.text()));
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
    const page = await api(url);
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
  // shuffle
  for (let i = tracks.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tracks[i], tracks[j]] = [tracks[j], tracks[i]];
  }
  return tracks;
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
      card.innerHTML = `
        <div class="tl-year">${tl[i].year}</div>
        <div class="tl-title">${escapeHtml(tl[i].name)}</div>
        <div class="tl-artist">${escapeHtml(tl[i].artist)}</div>`;
      container.appendChild(card);
    }
  }
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

function refreshStartButton() {
  const names = getPlayerNames();
  const connected = !!state.token;
  const device = !!state.deviceId;
  const playlist = $("playlist-input").value.trim();
  const ok = connected && device && names.length >= 1 && playlist.length > 0;
  $("start-btn").disabled = !ok;

  const hint = [];
  if (!connected) hint.push("connect Spotify");
  else if (!device) hint.push("choose a playback device");
  if (!playlist) hint.push("add a playlist");
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
    state.deck = await loadDeck($("playlist-input").value);
    localStorage.setItem(LS.playlist, $("playlist-input").value.trim());
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
  $("device-section").classList.remove("hidden");

  // The in-browser SDK player only works on desktop browsers. Try it, but
  // don't block — phones use Spotify Connect (their own Spotify app) instead.
  initPlayer()
    .then(() => refreshDevices())
    .catch(() => refreshDevices());

  // also list Connect devices straight away (phones, other computers, etc.)
  refreshDevices();
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
  $("refresh-devices").onclick = refreshDevices;
  $("device-select").onchange = (e) => {
    state.deviceId = e.target.value || null;
    refreshStartButton();
  };
  $("add-player").onclick = () => addPlayerRow();
  $("playlist-input").oninput = refreshStartButton;
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
