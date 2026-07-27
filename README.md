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

There is no server. Each completed reading is saved to `localStorage` (key `bridge_records_v1`) in the visitor's own browser. The admin dashboard shows readings **from the same browser only** — so as the site owner, you see readings played on your device, and each visitor's data stays private on theirs. To collect readings from someone else, have them press **Export JSON** in `admin.html` on their device and send you the file; import it on yours.

## Publish on GitHub Pages

1. Create a new repository on GitHub (e.g. `impulse`), public.
2. Upload everything in this folder (drag-and-drop works on github.com → "uploading an existing file"). Include `.nojekyll`.
3. Repository → **Settings → Pages** → Source: *Deploy from a branch* → Branch: `main`, folder `/ (root)` → Save.
4. Wait a minute. Your site is live at `https://<your-username>.github.io/impulse/`.

## Credits

Built from scratch — engine, scenarios, and design. No frameworks, no dependencies except Google Fonts.
