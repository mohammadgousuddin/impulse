# Impulse · The Bridge

*"If you have lost your path in love, Impulse shows you the direction — not the path."*

An emotional-analysis game for the love-marriage / arranged-marriage question. It never asks which is better — it measures which failure you can survive, across eight psychological threads, and reads you one of three doors: **The Chosen** (love), **The Given** (arranged), or **The Bridge** (assisted / hybrid).

## Live site

Once GitHub Pages is enabled (see below):

| Page | URL |
|---|---|
| The game | `https://<your-username>.github.io/impulse/` |
| Admin dashboard | `https://<your-username>.github.io/impulse/admin.html` |

## Files

| File | What |
|---|---|
| `index.html` | The game. Fully self-contained — cinematic living background, 26 scenarios, the Mirror mechanic, verdict + report. Archives every completed reading to the browser's local storage. |
| `admin.html` | Admin dashboard. Reads the same archive: KPIs, charts, per-user drill-down, and a term-by-term breakdown of how the engine scored every user. Export / Import JSON, demo seed. |
| `design.md` | The full design document — the eight threads, the three-door scoring model, the Mirror gender-pressure mechanic, failure modes, and storage schema. |

## How the data works

Two layers:

1. **Local** — every completed reading is saved to `localStorage` in the visitor's own browser (works even offline).
2. **Cloud (central database)** — when Firebase is configured, every reading is also sent to a Firestore database, so the admin dashboard shows readings from **all** visitors, from any device.

### Connect the database (one-time, ~5 minutes)

1. Go to [console.firebase.google.com](https://console.firebase.google.com) → **Create project** (name it `impulse`, Analytics off).
2. In the project: **Build → Firestore Database → Create database** → Start in **test mode** → region nearest you → Enable.
3. **Project settings (gear) → General** → copy the **Project ID** and **Web API Key**.
4. In both `index.html` and `admin.html`, find the line near the top of the script:
   `const CLOUD={projectId:'',apiKey:''};`
   and paste your two values in. Commit the change.

Done — new readings flow into the cloud, and `admin.html` merges cloud + local records automatically (Refresh button re-pulls).

> Note: test-mode rules allow public read/write and expire after 30 days. For a class project that's fine; for longer use, set Firestore rules to allow `create` and `read` on `readings/**`.

## Publish on GitHub Pages

1. Create a new repository on GitHub (e.g. `impulse`), public.
2. Upload everything in this folder (drag-and-drop works on github.com → "uploading an existing file"). Include `.nojekyll`.
3. Repository → **Settings → Pages** → Source: *Deploy from a branch* → Branch: `main`, folder `/ (root)` → Save.
4. Wait a minute. Your site is live at `https://<your-username>.github.io/impulse/`.

## Credits

Built from scratch — engine, scenarios, and design. No frameworks, no dependencies except Google Fonts.
