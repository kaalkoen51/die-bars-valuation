# 🎵 Hitster — Web Edition

Play [Hitster](https://hitstergame.com/) without the board game. A song plays
from Spotify *without revealing what it is*; you guess where it fits on your
timeline of release years. Place it correctly and you keep the card. First
player to reach the target number of cards wins.

It's a **pure front-end app** — just three static files, no backend and no
server-side secrets. Authentication uses Spotify's **Authorization Code + PKCE**
flow, and playback uses the **Web Playback SDK**.

## Requirements

- A **Spotify Premium** account (Spotify only allows app-controlled playback for
  Premium users).
- A free Spotify **Client ID** (see below).
- Somewhere to play the audio:
  - **Desktop:** plays in the browser tab via the Web Playback SDK, or
  - **Phone / anywhere:** the app drives the **Spotify app** on your device via
    Spotify Connect (works on iPhone & Android — the in-browser player does
    *not* work on mobile browsers, so this is how phones play).

## Playing on your phone

The app picks a **playback device** after you connect. On a phone:

1. Host the app over HTTPS (see *Deploy to GitHub Pages* below) and open that URL
   in your phone's browser.
2. Connect Spotify as usual.
3. Open the **Spotify app** on the same phone and play any track for a second,
   then pause — this makes the app an active Spotify Connect device.
4. Back in the game, tap **Refresh devices** and select your phone from the
   *"Play audio through"* dropdown.
5. Play. Audio comes out of the Spotify app (it keeps playing in the
   background); you guess in the browser. First reveal may take a moment to spin
   the Spotify app up.

## One-time Spotify setup

1. Open the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
   and log in.
2. Click **Create app**. Name/description can be anything.
3. Set the **Redirect URI** to exactly the URL where you'll open the app, e.g.
   - Local: `http://127.0.0.1:5173/` (whatever your local server uses)
   - GitHub Pages: `https://<user>.github.io/<repo>/hitster/`
   The app shows the exact value to paste — click *"How do I get a Client ID?"*.
4. Under **APIs used**, tick **Web Playback SDK**, then **Save**.
5. Copy the **Client ID** from the app's *Settings* and paste it into the app.

> Spotify requires `https://` redirect URIs, except for the loopback address
> `http://127.0.0.1` (use `127.0.0.1`, not `localhost`).

## Run locally

Serve the folder over HTTP (not `file://`, which breaks OAuth):

```bash
cd hitster
python3 -m http.server 5173 --bind 127.0.0.1
```

Then open `http://127.0.0.1:5173/` and register that URL as your redirect URI.

## Deploy to GitHub Pages (recommended for phone use)

Spotify needs an `https://` redirect URI for phones, and GitHub Pages gives you
one for free.

1. **Push the code** (this repo) to GitHub on the default branch.
2. In the repo, go to **Settings → Pages**. Under *Build and deployment*, set
   *Source* to **Deploy from a branch**, pick your branch and the **/ (root)**
   folder, then **Save**.
3. Wait ~1 minute. Your site goes live at:
   `https://<your-user>.github.io/<repo-name>/hitster/`
   (the `/hitster/` suffix because the app lives in that subfolder).
4. **Register that exact URL** as a Redirect URI in your Spotify app settings —
   include the trailing slash. The app also shows the precise value to copy.
5. Open the Pages URL on your phone and play.

> The whole app is static files, so GitHub Pages serves it directly — no build
> step. Your Client ID is not a secret (PKCE is designed for public clients), so
> it's fine to use on a public Pages site.

## How to play

1. **Connect Spotify** — paste your Client ID, click *Connect*.
2. **Choose the music** — paste any Spotify playlist link. Pick one that spans
   many decades for the most fun; its songs become the deck.
3. **Add players** and set how many cards it takes to win (default 10).
4. **Start.** On your turn: press **Play song**, listen, then tap the gap in
   your timeline where you think the song belongs by release year. The year is
   revealed — correct keeps the card, wrong discards it. Then it's the next
   player's turn.

## Tokens & stealing

Tokens add the bluff-and-steal layer from the real game. Set the **starting
tokens** and **max tokens** per player in setup.

- **Earn a token** — after a song is revealed, if the active player also said
  the **title and artist** out loud correctly, click *Award 🪙* (honor system,
  capped at the max).
- **Spend a token to steal** — once the active player commits their placement,
  a **steal phase** opens *before* the year is revealed. Any other player with a
  token may spend it to place the song on **their own** timeline. On reveal:
  - If the active player was **right**, they keep the card and challengers lose
    the token they wagered.
  - If the active player was **wrong**, the first challenger (in turn order) who
    placed it **correctly** steals the card onto their timeline.

## Files

| File | Purpose |
|------|---------|
| `index.html` | Markup & screens (setup / game / win) |
| `style.css`  | Styling |
| `app.js`     | PKCE auth, Spotify Web API + Playback SDK, game logic |

## Notes & limits

- The card year uses the Spotify **album** release date, which for compilations
  or re-releases can differ from the original single's year. Curated "Hitster"
  playlists give the most accurate years.
- Tokens last ~1 hour; if a session expires, reconnect.
- One Spotify account = one active playback device, so everyone plays from the
  same screen (pass-and-play), which matches how Hitster works anyway.
