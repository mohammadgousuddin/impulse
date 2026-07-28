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

1. **Local** — every completed reading is saved to `localStorage` in the visitor's own browser, so the game works offline and a reading is never lost to a flaky connection.
2. **Cloud** — every reading is also written to a **Cloud Firestore** database (project `impulse-e6a58`), so the admin dashboard sees readings from every visitor, on any device.

`admin.html` merges both sources, de-duplicates by record id, and drops malformed records. The **Refresh** button re-pulls from the cloud; **Export / Import JSON** moves an archive between machines.

### Security model

| Who | Can do |
|---|---|
| Any visitor | Submit a reading (`create`) |
| Signed-in admin only | Read the archive |
| Nobody | Edit or delete a reading |

Enforced by Firestore rules on the server — not by the page. Reading the archive requires a Firebase Authentication sign-in, so the data is not exposed even to someone who reads the page source or calls the database directly.

The admin login lives at `admin.html`. The session lasts until the tab is closed.

> The Firebase Web API key is visible in the page source. That is normal and expected for Firebase web apps — it identifies the project, it does not grant access. The security rules are what protect the data.

### Re-pointing this at your own Firebase project

1. [console.firebase.google.com](https://console.firebase.google.com) → create a project → **Firestore Database → Create database**.
2. **Authentication → Sign-in method → Email/Password → Enable**, then **Users → Add user** for your admin account.
3. **Project settings → General → Your apps → Web** to get the Project ID and Web API key.
4. In `index.html` and `admin.html`, set `CLOUD={projectId:'…',apiKey:'…'}`; in `admin.html` also set `ADMIN_UID` to the UID shown in the Users tab.
5. Publish these rules under **Firestore → Rules**:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /readings/{docId} {
      allow create: if true;
      allow read: if request.auth != null && request.auth.uid == 'YOUR_ADMIN_UID';
      allow update, delete: if false;
    }
  }
}
```

## Publish on GitHub Pages

1. Create a new repository on GitHub (e.g. `impulse`), public.
2. Upload everything in this folder (drag-and-drop works on github.com → "uploading an existing file"). Include `.nojekyll`.
3. Repository → **Settings → Pages** → Source: *Deploy from a branch* → Branch: `main`, folder `/ (root)` → Save.
4. Wait a minute. Your site is live at `https://<your-username>.github.io/impulse/`.

## Credits

Built from scratch — engine, scenarios, and design. No frameworks, no dependencies except Google Fonts.
