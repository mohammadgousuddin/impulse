# IMPULSE · THE BRIDGE
## Complete Source Code

**Author** Mohammad Gousuddin
**Project** Impulse — an emotional-analysis engine for the love / arranged marriage question
**Slogan** *"If you have lost your path in love, Impulse shows you the direction — not the path."*
**Live** https://mohammadgousuddin.github.io/impulse/
**Repository** https://github.com/mohammadgousuddin/impulse
**Generated** 2026-08-07
**Licence** MIT

---

## 1. Overview

Impulse is a browser-based psychological assessment that reads a person across eight
measured traits and tells them which of three marriage paths their temperament is built
to survive — and, more usefully, **how they are most likely to fail inside it**.

It is written entirely in vanilla HTML, CSS and JavaScript with no framework, no build
step and no bundler. Two self-contained pages are backed by a Cloud Firestore database
and Firebase Authentication. Everything runs from static hosting.

### Design constraints held throughout

- The system never claims one marriage path is better than another.
- No trait is ever assigned by gender; the player supplies their own expectation and the
  engine measures only the *gap*.
- Every result carries a cost ("the invoice"), because a reading that lists only benefits
  is flattery.
- Readiness is scored separately from path, and overrides it.

---

## 2. Technology stack

| Layer | Choice | Why |
|---|---|---|
| Markup / styling | HTML5, hand-written CSS | No build step; the whole project opens by double-clicking a file |
| Logic | Vanilla ES2017+ JavaScript | Zero dependencies, no supply chain, no bundler |
| Graphics | HTML5 Canvas 2D + inline SVG | Animated background threads; radar chart drawn from raw coordinates |
| Typography | Cormorant Garamond + Inter (Google Fonts) | Serif for emotional copy, sans for data; degrades to system fonts offline |
| Database | Cloud Firestore (REST API) | Serverless, free tier, works from static hosting without an SDK |
| Authentication | Firebase Authentication (Identity Toolkit REST) | Real server-side credential verification |
| Hosting | GitHub Pages | Free static hosting straight from the repository |

**No npm packages are used.** All network calls are plain `fetch()` against documented
Google REST endpoints.

---

## 3. Repository structure

```
impulse/
├── index.html        the game            (1,319 lines)
├── admin.html        the dashboard       (696 lines)
├── firestore.rules   database security rules
├── design.md         the design document — psychology, scoring model, constraints
├── README.md         setup and deployment guide
├── LICENSE           MIT
└── .nojekyll         tells GitHub Pages to serve files verbatim
```

**Total source: ~2,036 lines.**

| File | CSS | JavaScript | Total |
|---|---|---|---|
| `index.html` | 225 | 1,071 | 1,319 |
| `admin.html` | 156 | 482 | 696 |

---

## 4. Architecture

```
        ┌──────────────────────────────────────────────┐
        │              index.html (game)               │
        │                                              │
        │  Canvas background ── two braiding threads    │
        │  Chapter engine   ── 26 scenarios, 5 chapters │
        │  Mirror mechanic  ── dual-slider gap capture  │
        │        ↓                                      │
        │  Scoring engine   ── 8 threads → 3 doors      │
        │        ↓                                      │
        │  Agent council    ── 5 agents + router        │
        │                      + synthesiser            │
        │        ↓                                      │
        │  Report render    ── verdict, failure mode,   │
        │                      ask, invoice, readiness  │
        └───────────────┬──────────────────────────────┘
                        │  writes (anonymous, create-only)
                        ▼
        ┌──────────────────────────────────────────────┐
        │       Cloud Firestore · /readings            │
        │       guarded by firestore.rules             │
        └───────────────┬──────────────────────────────┘
                        │  reads (requires admin ID token)
                        ▼
        ┌──────────────────────────────────────────────┐
        │             admin.html (dashboard)           │
        │                                              │
        │  Login gate  ── Firebase Auth sign-in         │
        │  KPIs, donut, thread averages, histogram      │
        │  User table  ── sortable, filterable          │
        │  Drill-down  ── threads, doors, mirror gaps,  │
        │                 council breakdown, answers,   │
        │                 term-by-term score arithmetic │
        └──────────────────────────────────────────────┘
```

### Data flow, end to end

1. Player answers 20 multiple-choice scenarios; each option carries a weight vector that
   mutates eight running trait scores.
2. Six Mirror scenarios capture two slider values each — *what I want* and *what is
   expected of me*. The mean absolute gap becomes the Inherited Pressure score.
3. The scoring engine converts eight traits into three normalised door percentages.
4. The council runs independently: five specialist agents each read their own domain,
   a router seats only the relevant ones, and a synthesiser resolves the outcome.
5. The complete record — traits, doors, council, mirror gaps and every answer — is written
   to `localStorage` and POSTed to Firestore.
6. The dashboard signs in, pulls the collection with an ID token, merges cloud and local
   records, de-duplicates by id, and renders.

---

## 5. Core algorithms

### 5.1 The eight threads

| Key | Name | Meaning |
|---|---|---|
| `AUT` | Self-Authorship | How much the meaning depends on having chosen it yourself |
| `KIN` | Kinship Pull | Embeddedness in the family system |
| `ANX` | Anxious Wiring | Fear of abandonment; reads silence as information |
| `AVO` | Avoidant Wiring | Deactivation under closeness |
| `AMB` | Ambiguity Tolerance | Capacity to hold an unresolved question |
| `REG` | Regret of Inaction | Whether action or inaction is regretted more |
| `PRS` | Inherited Pressure | Measured want-vs-expectation gap (from the Mirror) |
| `RDY` | Readiness | Emotional availability; orthogonal to path, holds the veto |

All are initialised at 50 (40 for ANX/AVO) and clamped to 0–100.

### 5.2 Door scoring

```
SEC   = clamp(100 − max(ANX, AVO) + 8)
SEC_L = clamp(100 − (0.65·AVO + 0.45·ANX))

love     = 0.30·AUT + 0.20·AMB + 0.20·REG + 0.15·(100−KIN) + 0.15·SEC_L − 0.14·PRS
arranged = 0.30·KIN + 0.20·(100−AMB) + 0.20·(100−REG) + 0.15·(100−AUT) + 0.15·SEC
bridge   = 0.45·min(AUT,KIN) + 0.25·(100−|AUT−KIN|) + 0.15·AMB + 0.15·SEC − 0.05·PRS
```

Normalised to percentages summing to 100. Confidence from the gap to the runner-up:
`>14` Clear, `6–14` Leaning, `<6` Split.

Two deliberate asymmetries:

- **Insecurity is priced per door.** Avoidance weighs heavier against the love path,
  anxiety heavier against the arranged path. A single flat security term would have
  pushed every insecure person toward love, which is wrong.
- **Inherited pressure taxes only the doors that require standing against the room.**
  The arranged path pays nothing, because it is the door the room already approves of.

### 5.3 The Mirror mechanic

Each of six scenarios is answered twice on two sliders — what the player wants, and what
they believe is expected of someone of their gender. Only the delta is scored:

```
PRS = mean(|A − B|) × 1.55,  clamped to 0–100
```

Nothing is gendered by the engine. The player supplies their own inherited script, and
the system measures the distance between it and their desire. A player whose two sliders
agree scores near zero and is told plainly that alignment is a strength.

### 5.4 The agent council

Five agents each return a relevance, a lean, a confidence, a finding and a concern. The
router seats agents scoring ≥45 relevance (Readiness is always seated); the rest are shown
as *consulted, not seated* with the reason stated. Seated agents vote with
`weight = relevance × confidence`. The synthesiser then resolves one of four outcomes,
in priority order: **veto** (readiness below gate), **dissent** (council disagrees with the
arithmetic), **split** (same door, different reasoning), or **no quorum** (nothing loud
enough to argue about).

The council never overrules the arithmetic. It is a second opinion permitted to be
uncomfortable.

---

## 6. Security model

| Actor | Create a reading | Read the archive | Edit / delete |
|---|---|---|---|
| Any visitor | ✅ | ❌ | ❌ |
| Signed-in admin | ✅ | ✅ | ❌ |

Enforcement is **server-side** in Firestore rules, not in page JavaScript. Reading the
archive requires a valid Firebase Auth ID token belonging to one specific admin UID.
Editing the page source, forging a token, or calling the database directly all fail.

Verified against the live deployment:

| Test | Result |
|---|---|
| Anonymous read of `/readings` | `403 PERMISSION_DENIED` — 0 records returned |
| Read with forged bearer token | `401 UNAUTHENTICATED` — 0 records returned |
| Sign-in with wrong password | `400 INVALID_LOGIN_CREDENTIALS` — no token issued |
| Anonymous reading submission | `200 OK` — accepted, as intended |

The Firebase Web API key appears in the page source. This is normal and expected for
Firebase web applications: the key identifies the project, it does not grant access.
The security rules are what protect the data.

---

## 7. Testing

Logic was verified by extracting the `<script>` block from each page and executing it in
Node.js against a stubbed DOM, Canvas and `localStorage`:

- **Scoring engine** — seven simulated archetypes confirmed all three doors are reachable,
  confidence bands spread correctly, and no door is unreachable.
- **Council** — confirmed routing genuinely varies by player (one to five agents seated),
  all three leans reachable, and veto / dissent / split / no-quorum each fire.
- **Storage** — verified the record round-trips and that the dashboard's independent
  re-implementation of the scoring arithmetic reproduces the game's recorded percentages
  exactly.
- **Authentication** — verified correct credentials accepted, wrong user ID and wrong
  password both rejected, and no plaintext password present in the source.
- **Robustness** — malformed records are filtered rather than crashing the dashboard;
  records saved before the council existed degrade gracefully.

---

## 8. Source listings

The complete source follows. Line numbers are for reference in discussion and are not
part of the files.


---

### 8.1 · `firestore.rules` — database security rules

Deployed server-side. This is the file that actually protects the archive.

```js
 1  rules_version = '2';
 2  
 3  // Impulse · The Bridge — Cloud Firestore security rules
 4  //
 5  // Any visitor may submit a reading. Only the signed-in admin may read
 6  // the archive. Nobody may edit or delete a reading, including the admin
 7  // from the web client — corrections are done in the Firebase console.
 8  //
 9  // Deployed to project: impulse-e6a58
10  
11  service cloud.firestore {
12    match /databases/{database}/documents {
13      match /readings/{docId} {
14        allow create: if true;
15        allow read:   if request.auth != null
16                      && request.auth.uid == 'WyFgaQf3XKe7nmTTs4K2IIuLTm12';
17        allow update, delete: if false;
18      }
19    }
20  }
21  
```

---

### 8.2 · `index.html` — stylesheet

Dark romantic palette, the living-background layers, chapter interstitials, the Mirror gap visual, and the council agent cards.

```css
  1  
  2  :root{
  3    --bg:#08040e; --ink:#f4ece6; --mut:#9c8794; --dim:#6d5b68;
  4    --gold:#d9a860; --rose:#e0577a; --wine:#7a2338; --ind:#6a56a8; --teal:#4f9c96;
  5    --line:rgba(217,168,96,.18);
  6    --panel:rgba(255,255,255,.035);
  7    --serif:'Cormorant Garamond',Georgia,'Times New Roman',serif;
  8    --sans:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
  9  }
 10  *{box-sizing:border-box;margin:0;padding:0}
 11  html,body{height:100%}
 12  body{
 13    background:var(--bg); color:var(--ink); font-family:var(--sans); font-weight:300;
 14    min-height:100%; overflow-x:hidden; -webkit-font-smoothing:antialiased;
 15  }
 16  
 17  /* ── the living background ─────────────────────── */
 18  #bg{position:fixed;inset:0;z-index:0;display:block}
 19  #tint{position:fixed;inset:0;z-index:1;pointer-events:none;transition:background 2.4s ease;
 20    background:radial-gradient(1200px 800px at 20% -10%, rgba(122,35,56,.22), transparent 60%),
 21               radial-gradient(900px 700px at 90% 110%, rgba(106,86,168,.2), transparent 60%)}
 22  #vig{position:fixed;inset:0;z-index:2;pointer-events:none;
 23    background:radial-gradient(120% 90% at 50% 45%, transparent 55%, rgba(4,2,8,.75) 100%);
 24    animation:breathe 7s ease-in-out infinite}
 25  @keyframes breathe{0%,100%{opacity:.9}50%{opacity:1}}
 26  body::after{ /* film grain */
 27    content:''; position:fixed; inset:0; pointer-events:none; opacity:.045; z-index:98;
 28    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)'/%3E%3C/svg%3E");
 29  }
 30  
 31  /* ── thread rail ───────────────────────────────── */
 32  #rail{position:fixed;left:0;top:0;bottom:0;width:56px;display:flex;align-items:center;
 33    justify-content:center;gap:7px;z-index:20;opacity:0;transition:opacity 1.2s}
 34  #rail.on{opacity:1}
 35  .thread{width:2px;height:38vh;background:rgba(255,255,255,.05);border-radius:2px;position:relative;overflow:hidden}
 36  .thread i{position:absolute;left:0;right:0;bottom:0;height:50%;border-radius:2px;
 37    transition:height 1.1s cubic-bezier(.2,.7,.2,1), background .8s;
 38    box-shadow:0 0 8px currentColor}
 39  @media(max-width:820px){#rail{display:none}}
 40  
 41  /* ── stage ─────────────────────────────────────── */
 42  #stage{max-width:760px;margin:0 auto;padding:7vh 26px 140px;position:relative;z-index:5}
 43  .fade{animation:fade .85s cubic-bezier(.2,.7,.2,1) both}
 44  @keyframes fade{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
 45  .slow{animation:fade 1.4s cubic-bezier(.2,.7,.2,1) both}
 46  .rv{opacity:0;animation:fade 1s cubic-bezier(.2,.7,.2,1) forwards}
 47  
 48  h1{font-family:var(--serif);font-weight:300;font-size:clamp(3.2rem,10vw,5.6rem);
 49    line-height:.95;letter-spacing:-.02em}
 50  h2{font-family:var(--serif);font-weight:300;font-size:clamp(1.9rem,5vw,2.9rem);line-height:1.15}
 51  h3{font-family:var(--serif);font-weight:400;font-size:1.5rem;letter-spacing:.01em}
 52  .kicker{font-family:var(--sans);font-size:.66rem;letter-spacing:.42em;text-transform:uppercase;
 53    color:var(--gold);opacity:.75;margin-bottom:22px}
 54  .lead{font-family:var(--serif);font-size:1.32rem;line-height:1.62;color:#e6dcd6;font-weight:300}
 55  .muted{color:var(--mut);font-size:.94rem;line-height:1.75}
 56  em{font-style:italic;color:var(--gold);opacity:.92}
 57  .rule{height:1px;background:linear-gradient(90deg,var(--line),transparent);margin:34px 0}
 58  .scene{font-family:var(--serif);font-style:italic;font-weight:300;font-size:1.06rem;
 59    color:var(--mut);line-height:1.6;margin-bottom:20px;padding-left:16px;
 60    border-left:1px solid rgba(217,168,96,.3)}
 61  
 62  /* ── chapter interstitial ──────────────────────── */
 63  .chnum{font-family:var(--serif);font-weight:300;font-size:clamp(7rem,22vw,13rem);line-height:.8;
 64    color:transparent;-webkit-text-stroke:1px rgba(217,168,96,.28);
 65    user-select:none;margin-bottom:-18px;animation:chglow 5s ease-in-out infinite}
 66  @keyframes chglow{0%,100%{-webkit-text-stroke-color:rgba(217,168,96,.22)}50%{-webkit-text-stroke-color:rgba(217,168,96,.45)}}
 67  
 68  /* ── buttons ───────────────────────────────────── */
 69  .btn{display:inline-block;font-family:var(--sans);font-size:.74rem;letter-spacing:.28em;
 70    text-transform:uppercase;color:var(--gold);background:transparent;
 71    border:1px solid rgba(217,168,96,.4);padding:16px 34px;cursor:pointer;
 72    transition:.45s;border-radius:1px;position:relative;overflow:hidden}
 73  .btn:hover{background:rgba(217,168,96,.1);border-color:var(--gold);letter-spacing:.34em;
 74    box-shadow:0 0 30px rgba(217,168,96,.15)}
 75  .btn.ghost{color:var(--mut);border-color:rgba(255,255,255,.12)}
 76  .btn.ghost:hover{color:var(--ink);background:rgba(255,255,255,.04)}
 77  .btn[disabled]{opacity:.25;cursor:not-allowed}
 78  
 79  /* ── options ───────────────────────────────────── */
 80  .opts{display:flex;flex-direction:column;gap:11px;margin-top:34px}
 81  .opt{position:relative;text-align:left;background:var(--panel);border:1px solid rgba(255,255,255,.07);
 82    border-left:2px solid rgba(217,168,96,.22);color:#e9e0da;font-family:var(--serif);
 83    font-size:1.16rem;line-height:1.5;font-weight:300;padding:19px 22px 19px 26px;cursor:pointer;
 84    transition:.32s cubic-bezier(.2,.7,.2,1);border-radius:2px;backdrop-filter:blur(2px)}
 85  .opt:hover{background:rgba(217,168,96,.09);border-left-color:var(--gold);
 86    transform:translateX(7px);color:#fff;box-shadow:0 0 34px rgba(217,168,96,.07)}
 87  .opt.sel{background:rgba(217,168,96,.16);border-left-color:var(--gold);transform:translateX(7px);
 88    box-shadow:0 0 40px rgba(217,168,96,.14)}
 89  
 90  /* ── mirror ────────────────────────────────────── */
 91  .mirror{margin-top:28px;background:var(--panel);border:1px solid rgba(255,255,255,.07);
 92    padding:26px 24px;border-radius:3px;backdrop-filter:blur(3px)}
 93  .mrow{margin-bottom:24px}
 94  .mrow:last-of-type{margin-bottom:0}
 95  .mlab{font-size:.64rem;letter-spacing:.3em;text-transform:uppercase;margin-bottom:14px;display:flex;
 96    justify-content:space-between;align-items:baseline;gap:12px}
 97  .mlab .who{color:var(--gold)}
 98  .mrow.b .mlab .who{color:#9d86e8}
 99  .mlab .val{font-family:var(--serif);font-size:1.05rem;letter-spacing:0;text-transform:none;color:var(--mut)}
100  input[type=range]{-webkit-appearance:none;appearance:none;width:100%;height:2px;
101    background:rgba(255,255,255,.13);outline:none;border-radius:2px;cursor:pointer}
102  input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:17px;height:17px;
103    border-radius:50%;background:var(--gold);cursor:pointer;box-shadow:0 0 14px rgba(217,168,96,.7);transition:.2s}
104  input[type=range]::-webkit-slider-thumb:hover{transform:scale(1.22)}
105  input[type=range]::-moz-range-thumb{width:17px;height:17px;border:none;border-radius:50%;
106    background:var(--gold);cursor:pointer;box-shadow:0 0 14px rgba(217,168,96,.7)}
107  .mrow.b input[type=range]::-webkit-slider-thumb{background:#9d86e8;box-shadow:0 0 14px rgba(157,134,232,.7)}
108  .mrow.b input[type=range]::-moz-range-thumb{background:#9d86e8;box-shadow:0 0 14px rgba(157,134,232,.7)}
109  .ends{display:flex;justify-content:space-between;margin-top:9px;font-size:.72rem;color:var(--dim)}
110  
111  /* the gap visual — two souls on one line */
112  .gapviz{position:relative;height:46px;margin:26px 6px 6px}
113  .gapviz .base{position:absolute;top:22px;left:0;right:0;height:1px;background:rgba(255,255,255,.1)}
114  .gapviz .span{position:absolute;top:20px;height:5px;border-radius:4px;
115    background:linear-gradient(90deg,rgba(217,168,96,.85),rgba(157,134,232,.85));
116    box-shadow:0 0 18px rgba(217,168,96,.35);transition:left .25s,width .25s}
117  .gapviz .dot{position:absolute;top:15px;width:15px;height:15px;border-radius:50%;transition:left .25s}
118  .gapviz .da{background:var(--gold);box-shadow:0 0 16px rgba(217,168,96,.9)}
119  .gapviz .db{background:#9d86e8;box-shadow:0 0 16px rgba(157,134,232,.9)}
120  .delta{margin-top:16px;padding-top:16px;border-top:1px solid rgba(255,255,255,.06);
121    font-size:.8rem;color:var(--mut);display:flex;justify-content:space-between;align-items:center;gap:16px}
122  .delta b{font-family:var(--serif);font-size:1.35rem;font-weight:400;color:var(--gold);flex:0 0 auto}
123  
124  /* ── progress / chapter mark ───────────────────── */
125  #prog{position:fixed;left:0;bottom:0;width:100%;height:1px;background:rgba(255,255,255,.06);z-index:30}
126  #prog i{display:block;height:100%;width:0;background:linear-gradient(90deg,var(--wine),var(--gold));
127    transition:width .8s cubic-bezier(.2,.7,.2,1);box-shadow:0 0 10px rgba(217,168,96,.6)}
128  #chapmark{position:fixed;right:24px;bottom:20px;font-size:.6rem;letter-spacing:.32em;
129    text-transform:uppercase;color:var(--dim);z-index:30}
130  
131  /* ── inputs ────────────────────────────────────── */
132  .field{margin-bottom:28px}
133  .field label{display:block;font-size:.64rem;letter-spacing:.3em;text-transform:uppercase;
134    color:var(--gold);opacity:.7;margin-bottom:12px}
135  .field input[type=text]{width:100%;background:transparent;border:none;
136    border-bottom:1px solid rgba(255,255,255,.15);color:var(--ink);font-family:var(--serif);
137    font-size:1.5rem;font-weight:300;padding:8px 0;outline:none;transition:.3s}
138  .field input[type=text]:focus{border-bottom-color:var(--gold);box-shadow:0 12px 24px -18px rgba(217,168,96,.5)}
139  .chips{display:flex;flex-wrap:wrap;gap:9px}
140  .chip{background:var(--panel);border:1px solid rgba(255,255,255,.09);color:var(--mut);
141    font-family:var(--sans);font-size:.82rem;padding:10px 20px;cursor:pointer;
142    transition:.3s;border-radius:40px}
143  .chip:hover{border-color:rgba(217,168,96,.5);color:var(--ink)}
144  .chip.sel{background:rgba(217,168,96,.15);border-color:var(--gold);color:var(--gold);
145    box-shadow:0 0 20px rgba(217,168,96,.15)}
146  
147  /* ── report ────────────────────────────────────── */
148  .card{background:rgba(10,6,17,.55);border:1px solid rgba(255,255,255,.07);
149    padding:30px 28px;border-radius:3px;margin-bottom:16px;backdrop-filter:blur(6px)}
150  .card .tag{font-size:.62rem;letter-spacing:.34em;text-transform:uppercase;color:var(--gold);
151    opacity:.72;margin-bottom:16px}
152  .card p{font-family:var(--serif);font-size:1.15rem;line-height:1.66;color:#e2d8d2;margin-bottom:14px}
153  .card p:last-child{margin-bottom:0}
154  .card.warn{border-color:rgba(224,87,122,.3);background:rgba(52,14,26,.5)}
155  .card.warn .tag{color:var(--rose)}
156  .card.good{border-color:rgba(79,156,150,.3);background:rgba(12,36,34,.45)}
157  .card.good .tag{color:var(--teal)}
158  
159  .seal{width:120px;height:120px;margin:10px auto 26px;position:relative}
160  .seal svg{width:100%;height:100%;overflow:visible}
161  .seal .ring{fill:none;stroke:var(--gold);stroke-width:1;opacity:.7;
162    stroke-dasharray:360;stroke-dashoffset:360;animation:ring 2.6s ease forwards .4s}
163  @keyframes ring{to{stroke-dashoffset:0}}
164  .seal .ring2{fill:none;stroke:rgba(217,168,96,.25);stroke-width:.6}
165  .seal text{font-family:var(--serif);font-size:44px;fill:var(--gold)}
166  
167  .doors{margin:34px 0 10px}
168  .door{margin-bottom:22px}
169  .dhead{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:9px}
170  .dname{font-family:var(--serif);font-size:1.3rem}
171  .dpct{font-family:var(--serif);font-size:1.5rem;color:var(--gold)}
172  .dbar{height:3px;background:rgba(255,255,255,.07);border-radius:3px;overflow:hidden}
173  .dbar i{display:block;height:100%;width:0;transition:width 1.5s cubic-bezier(.2,.7,.2,1)}
174  .door.win .dname{color:var(--gold)}
175  .dsub{font-size:.8rem;color:var(--dim);margin-top:7px}
176  
177  .tlist{margin-top:6px}
178  .trow{display:flex;align-items:center;gap:14px;padding:9px 0;border-bottom:1px solid rgba(255,255,255,.045)}
179  .trow:last-child{border:none}
180  .tname{flex:0 0 148px;font-size:.8rem;color:var(--mut)}
181  .tbar{flex:1;height:2px;background:rgba(255,255,255,.07);border-radius:2px;overflow:hidden}
182  .tbar i{display:block;height:100%;width:0;background:var(--gold);transition:width 1.3s cubic-bezier(.2,.7,.2,1)}
183  .tval{flex:0 0 34px;text-align:right;font-family:var(--serif);font-size:1rem;color:var(--ink)}
184  .tnote{font-size:.72rem;color:var(--dim);margin-top:3px}
185  
186  svg.radar{width:100%;max-width:420px;display:block;margin:8px auto 22px}
187  svg.radar .shape{stroke-dasharray:1400;stroke-dashoffset:1400;animation:draw 2.4s ease forwards .6s}
188  @keyframes draw{to{stroke-dashoffset:0}}
189  
190  .foot{margin-top:46px;text-align:center;color:var(--dim);font-size:.78rem;line-height:1.9}
191  .acts{display:flex;gap:12px;flex-wrap:wrap;justify-content:center;margin-top:32px}
192  
193  /* ── the council ───────────────────────────────── */
194  .council{margin:10px 0 6px}
195  .agent{background:rgba(10,6,17,.5);border:1px solid rgba(255,255,255,.07);
196    border-left:2px solid var(--gold);border-radius:3px;padding:20px 22px;margin-bottom:12px;
197    backdrop-filter:blur(4px);transition:.3s}
198  .agent.benched{opacity:.5;border-left-color:rgba(255,255,255,.15)}
199  .agent .ahead{display:flex;justify-content:space-between;align-items:baseline;gap:12px;flex-wrap:wrap;margin-bottom:4px}
200  .agent .aname{font-family:var(--serif);font-size:1.22rem}
201  .agent .adom{font-size:.66rem;color:var(--dim);letter-spacing:.06em;margin-bottom:14px}
202  .agent p{font-family:var(--serif);font-size:1.06rem;line-height:1.62;color:#e2d8d2;margin-bottom:10px}
203  .agent .aconcern{font-size:.86rem;color:var(--mut);font-family:var(--sans);line-height:1.65;
204    padding-top:10px;border-top:1px solid rgba(255,255,255,.055)}
205  .aconcern b{color:var(--rose);font-weight:400;letter-spacing:.14em;font-size:.6rem;
206    text-transform:uppercase;display:block;margin-bottom:5px}
207  .lean{font-size:.62rem;letter-spacing:.12em;padding:4px 11px;border-radius:20px;white-space:nowrap}
208  .lean-love{background:rgba(224,87,122,.14);color:#f0899f;border:1px solid rgba(224,87,122,.3)}
209  .lean-arranged{background:rgba(157,134,232,.13);color:#b6a5ef;border:1px solid rgba(157,134,232,.3)}
210  .lean-bridge{background:rgba(217,168,96,.13);color:#e5bf7f;border:1px solid rgba(217,168,96,.3)}
211  .lean-none{background:rgba(255,255,255,.05);color:var(--mut);border:1px solid rgba(255,255,255,.1)}
212  .lean-veto{background:rgba(224,87,122,.2);color:#ff9db0;border:1px solid rgba(224,87,122,.45)}
213  .wbar{height:2px;background:rgba(255,255,255,.07);border-radius:2px;overflow:hidden;margin:12px 0 14px}
214  .wbar i{display:block;height:100%;width:0;transition:width 1.3s cubic-bezier(.2,.7,.2,1)}
215  .wmeta{display:flex;justify-content:space-between;font-size:.64rem;color:var(--dim);margin-top:-8px;margin-bottom:12px}
216  .split{background:rgba(52,14,26,.4);border:1px solid rgba(224,87,122,.25);border-radius:3px;
217    padding:16px 18px;margin-bottom:10px}
218  .split .vs{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:8px;
219    font-family:var(--serif);font-size:1.05rem}
220  .split .vs span{color:var(--dim);font-size:.72rem;font-family:var(--sans);letter-spacing:.2em}
221  @media print{body{background:#fff;color:#000}#rail,#prog,.acts,#chapmark,#bg,#tint,#vig{display:none}}
222  @media (prefers-reduced-motion:reduce){
223    .chnum,#vig{animation:none}
224  }
225  
```

---

### 8.3 · `index.html` — application logic

Canvas background engine, the eight threads, 26 scenarios with weight vectors, the Mirror mechanic, the three-door scoring engine, the agent council, the report renderer, and cloud persistence.

```js
   1  
   2  /* ═══════════════════════════════════════════════════════════════
   3     THE BRIDGE — Impulse · v2 "the living cut"
   4     Two threads of light cross the screen for the whole game:
   5     the rose thread (the chosen) and the violet thread (the given).
   6     They begin far apart. As you answer, they braid closer.
   7     At the verdict they meet — or you see exactly why they can't.
   8     ═══════════════════════════════════════════════════════════════ */
   9  
  10  /* ── 0. THE LIVING BACKGROUND ────────────────────────────────── */
  11  const bg = document.getElementById('bg'), bx = bg.getContext('2d');
  12  let W=0,H=0,DPR=1;
  13  function sizeBG(){
  14    DPR=Math.min(2,window.devicePixelRatio||1);
  15    W=innerWidth;H=innerHeight;
  16    bg.width=W*DPR;bg.height=H*DPR;
  17    bg.style.width=W+'px';bg.style.height=H+'px';
  18    bx.setTransform(DPR,0,0,DPR,0,0);
  19  }
  20  sizeBG(); addEventListener('resize',sizeBG);
  21  
  22  /* moods — each chapter is a different room of the same night */
  23  const MOODS={
  24    intro:   {a:[224,87,122], b:[157,134,232], glow:[217,168,96], n:60, tint:'radial-gradient(1200px 800px at 20% -10%, rgba(122,35,56,.24), transparent 60%),radial-gradient(900px 700px at 90% 110%, rgba(106,86,168,.2), transparent 60%)'},
  25    house:   {a:[224,140,90],  b:[217,168,96],  glow:[224,140,90], n:55, tint:'radial-gradient(1100px 760px at 30% -10%, rgba(150,84,32,.22), transparent 60%),radial-gradient(800px 600px at 85% 110%, rgba(122,35,56,.18), transparent 60%)'},
  26    dark:    {a:[95,127,184],  b:[106,86,168],  glow:[120,140,220],n:32, tint:'radial-gradient(1100px 760px at 50% -20%, rgba(30,42,90,.3), transparent 60%),radial-gradient(800px 600px at 50% 120%, rgba(16,10,40,.45), transparent 60%)'},
  27    fork:    {a:[224,87,122],  b:[79,156,150],  glow:[217,168,96], n:55, tint:'radial-gradient(1000px 760px at 8% 50%, rgba(122,35,56,.26), transparent 55%),radial-gradient(1000px 760px at 92% 50%, rgba(28,84,80,.26), transparent 55%)'},
  28    mirror:  {a:[200,200,225], b:[157,134,232], glow:[190,180,230],n:45, tint:'radial-gradient(1100px 760px at 50% -10%, rgba(120,110,180,.2), transparent 60%),radial-gradient(800px 600px at 50% 115%, rgba(60,50,110,.28), transparent 60%)'},
  29    dawn:    {a:[240,180,130], b:[224,120,130], glow:[240,190,140],n:60, tint:'radial-gradient(1200px 800px at 50% 115%, rgba(180,110,60,.24), transparent 60%),radial-gradient(900px 700px at 50% -10%, rgba(122,35,56,.16), transparent 60%)'},
  30    verdict: {a:[217,168,96],  b:[224,87,122],  glow:[217,168,96], n:80, tint:'radial-gradient(1200px 900px at 50% 30%, rgba(150,105,40,.22), transparent 65%),radial-gradient(900px 700px at 50% 110%, rgba(122,35,56,.2), transparent 60%)'}
  31  };
  32  let mood = {...MOODS.intro}, target = MOODS.intro;
  33  function setMood(name){
  34    target = MOODS[name];
  35    document.getElementById('tint').style.background = target.tint;
  36  }
  37  const lerp=(a,b,t)=>a+(b-a)*t;
  38  const lerpC=(a,b,t)=>[lerp(a[0],b[0],t),lerp(a[1],b[1],t),lerp(a[2],b[2],t)];
  39  
  40  /* petals of light */
  41  const P=[];
  42  function spawn(i){
  43    return { x:Math.random()*W, y:Math.random()*H,
  44      r:1+Math.random()*2.6, s:.12+Math.random()*.5,
  45      ph:Math.random()*Math.PI*2, sw:.3+Math.random()*.9,
  46      which:Math.random()<.5?0:1, tw:Math.random()*Math.PI*2 };
  47  }
  48  for(let i=0;i<90;i++) P.push(spawn(i));
  49  
  50  let braid = 0;           // 0 = threads apart, 1 = woven (set by progress)
  51  let braidT = 0;          // eased
  52  let heart = 0;           // verdict flourish 0→1
  53  let t0 = performance.now();
  54  
  55  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  56  
  57  function threadY(base, x, t, phase, amp){
  58    return base
  59      + Math.sin(x*0.006 + t*0.00042 + phase)*amp
  60      + Math.sin(x*0.0021 - t*0.00027 + phase*1.7)*amp*0.6;
  61  }
  62  function drawThread(col, base, phase, t, alpha){
  63    bx.beginPath();
  64    const amp = lerp(H*0.16, H*0.05, braidT);
  65    for(let x=-20;x<=W+20;x+=14){
  66      const y=threadY(base,x,t,phase,amp);
  67      x===-20?bx.moveTo(x,y):bx.lineTo(x,y);
  68    }
  69    bx.strokeStyle=`rgba(${col[0]|0},${col[1]|0},${col[2]|0},${alpha})`;
  70    bx.lineWidth=1.1; bx.stroke();
  71  }
  72  
  73  function frame(now){
  74    const t=now-t0;
  75    // ease colors + braid
  76    ['a','b','glow'].forEach(k=>{ mood[k]=lerpC(mood[k],target[k],.02); });
  77    mood.n = lerp(mood.n||60, target.n, .02);
  78    braidT = lerp(braidT, braid, .012);
  79    bx.clearRect(0,0,W,H);
  80    bx.globalCompositeOperation='lighter';
  81  
  82    // the two threads — far apart at first, braiding toward centre
  83    const mid=H*0.52;
  84    const sep = lerp(H*0.26, 0, braidT);
  85    const ph2 = lerp(Math.PI, Math.PI*2, braidT);   // phase difference closes → they weave
  86    for(let pass=0;pass<3;pass++){
  87      const a=(.05-pass*.013)*(1+heart*.8);
  88      bx.save(); bx.filter=`blur(${pass*2}px)`;
  89      drawThread(mood.a, mid-sep, 0,   t, a);
  90      drawThread(mood.b, mid+sep, ph2, t, a);
  91      bx.restore();
  92    }
  93  
  94    // petals
  95    const count=Math.round(mood.n);
  96    for(let i=0;i<count;i++){
  97      const p=P[i];
  98      p.ph+=0.006*p.sw; p.tw+=0.03;
  99      p.y-=p.s*(reduceMotion?.4:1);
 100      p.x+=Math.sin(p.ph)*.35;
 101      if(p.y<-10){Object.assign(p,spawn(i));p.y=H+8;}
 102      const c=p.which? mood.a: mood.b;
 103      const twinkle=.35+.3*Math.sin(p.tw);
 104      const g=bx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r*4);
 105      g.addColorStop(0,`rgba(${c[0]|0},${c[1]|0},${c[2]|0},${twinkle})`);
 106      g.addColorStop(1,'rgba(0,0,0,0)');
 107      bx.fillStyle=g;
 108      bx.beginPath();bx.arc(p.x,p.y,p.r*4,0,7);bx.fill();
 109    }
 110  
 111    // verdict heart of light where the threads meet
 112    if(heart>0.01){
 113      const g=bx.createRadialGradient(W/2,mid,0,W/2,mid,220);
 114      const gl=mood.glow;
 115      g.addColorStop(0,`rgba(${gl[0]|0},${gl[1]|0},${gl[2]|0},${.14*heart})`);
 116      g.addColorStop(1,'rgba(0,0,0,0)');
 117      bx.fillStyle=g;bx.beginPath();bx.arc(W/2,mid,220,0,7);bx.fill();
 118    }
 119  
 120    bx.globalCompositeOperation='source-over';
 121    requestAnimationFrame(frame);
 122  }
 123  requestAnimationFrame(frame);
 124  
 125  /* ── 1. THE THREADS (the eight measures) ─────────────────────── */
 126  const THREADS = [
 127    {k:'AUT', name:'Self-Authorship',    c:'#d9a860'},
 128    {k:'KIN', name:'Kinship Pull',       c:'#e0577a'},
 129    {k:'ANX', name:'Anxious Wiring',     c:'#c96f4a'},
 130    {k:'AVO', name:'Avoidant Wiring',    c:'#5f7fb8'},
 131    {k:'AMB', name:'Ambiguity Tolerance',c:'#4f9c96'},
 132    {k:'REG', name:'Regret of Inaction', c:'#9d86e8'},
 133    {k:'PRS', name:'Inherited Pressure', c:'#b8556e'},
 134    {k:'RDY', name:'Readiness',          c:'#cbb27a'}
 135  ];
 136  
 137  const S = {
 138    name:'', gender:'', age:'', familyVolume:50,
 139    T:{AUT:50,KIN:50,ANX:40,AVO:40,AMB:50,REG:50,PRS:0,RDY:50},
 140    coh:100, mirrors:[], answers:[], external:false
 141  };
 142  
 143  /* ── 2. THE SCENARIOS ────────────────────────────────────────── */
 144  const CHAPTERS = [
 145    {n:'I', mood:'house', t:'The House You Grew Up In',
 146     b:'Before anyone asks who you will marry, someone already taught you what a marriage is. Usually without saying a word. Walk back through that house. The lights are still on.'},
 147    {n:'II', mood:'dark', t:'The Room With No Lights',
 148     b:'This chapter is not about romance. It is about what you do when the person you love goes quiet, and you cannot see their face, and the only voice left in the room is yours.'},
 149    {n:'III', mood:'fork', t:'The Fork',
 150     b:'Two doors. One you open. One is opened for you. The difference is not comfort — it is who holds the story afterwards, and who you get to blame when the story turns.'},
 151    {n:'IV', mood:'mirror', t:'The Mirror',
 152     b:'Here you answer everything twice. Once as yourself. Once as the person the world expects you to be. The distance between those two answers is the most honest number in this whole reading — and no one has ever measured yours.'},
 153    {n:'V', mood:'dawn', t:'Ten Years From Now',
 154     b:'You are older now. The choice is long made; the wedding photographs have started to look like photographs of other people. These are not questions about the future. They are questions about what you can forgive yourself for.'}
 155  ];
 156  
 157  const Q = [
 158  /* ── CHAPTER I · KINSHIP ─────────────────────────────────────── */
 159  {ch:0, s:"Dinner. The good plates, which means something is being discussed. Your chair is the one you have sat in since you were seven.",
 160   t:"You are nineteen. You've made a decision your parents disagree with — nothing dramatic. A course. A city. Nobody shouts. Your mother just goes quiet.",
 161   o:[
 162    {t:"The silence works. I fold before dessert.",                  w:{KIN:14,AUT:-10,RDY:-3}},
 163    {t:"I hold. But I carry that silence around for weeks.",         w:{KIN:8,AUT:4,ANX:6}},
 164    {t:"I hold, and I let her carry it.",                            w:{KIN:-8,AUT:12}},
 165    {t:"I never made the decision. I checked first.",                w:{KIN:16,AUT:-14,RDY:-4}}]},
 166  
 167  {ch:0, s:"Every house has a weather. Some houses you could cry in. Some houses you learned to close the door first.",
 168   t:"Be honest about that house. When something went wrong for you, what did it become?",
 169   o:[
 170    {t:"A place that closed around me. Warm.",                       w:{KIN:14,RDY:7,AVO:-6}},
 171    {t:"A place that had strong opinions about it.",                 w:{KIN:8,ANX:6}},
 172    {t:"A place I didn't tell.",                                     w:{KIN:-12,AVO:10,RDY:-4}},
 173    {t:"A place that needed me to be fine.",                         w:{KIN:4,AVO:8,RDY:-6,ANX:4}}]},
 174  
 175  {ch:0, s:"A living room full of relatives. Sweets on a tray. Two families performing ease at each other, and in the middle of it, your cousin — smiling the smile you know is their public one.",
 176   t:"The match is good on paper. Everyone is pleased. Watching it happen — what actually moves in your chest?",
 177   o:[
 178    {t:"Relief. Somebody is holding the map.",                       w:{KIN:12,AMB:-10,AUT:-8}},
 179    {t:"Curiosity. It could work. It often does.",                   w:{KIN:6,AMB:4,RDY:3}},
 180    {t:"A small cold thing. It looks like a transaction.",           w:{KIN:-10,AUT:12}},
 181    {t:"Nothing about them. I'm calculating when it's my turn.",     w:{ANX:8,RDY:-5}}]},
 182  
 183  {ch:0, s:"Imagine the wedding happened anyway. Your side of the hall, half empty. The photographs are beautiful and everyone in them is doing arithmetic.",
 184   t:"You married someone your family never accepted. Never cruel — just never warm. How long before that costs you something real?",
 185   o:[
 186    {t:"Day one. It would cost me on day one.",                      w:{KIN:16,AUT:-6}},
 187    {t:"Three or four years. Around the first child.",               w:{KIN:10,AMB:4}},
 188    {t:"It would cost them. Not me.",                                w:{KIN:-14,AUT:10,AVO:6}},
 189    {t:"I don't know. And that not-knowing is the frightening part.",w:{AMB:-8,KIN:4,RDY:-3}}]},
 190  
 191  {ch:0, s:"You have the receipts, the dates, the screenshot. You are, for once, unambiguously right. The proof is warm in your pocket all through dinner.",
 192   t:"Your parents are wrong about something that matters, and you can prove it. What do you do with the proof?",
 193   o:[
 194    {t:"Keep it. Being right isn't worth the room.",                 w:{KIN:12,AUT:-10,AVO:5}},
 195    {t:"Show it gently, and let them keep their face.",              w:{KIN:8,AUT:6,RDY:9}},
 196    {t:"Put it on the table.",                                       w:{AUT:14,KIN:-8}},
 197    {t:"Show it to everyone except them.",                           w:{KIN:-6,AVO:8,RDY:-7,c:-8}}]},
 198  
 199  /* ── CHAPTER II · ATTACHMENT ─────────────────────────────────── */
 200  {ch:1, s:"The phone is face-down. You turned it face-down on purpose, which is how you know it has already won.",
 201   t:"Someone you love hasn't replied in nine hours. Nothing is wrong. Nine hours.",
 202   o:[
 203    {t:"I haven't checked. Genuinely.",                              w:{ANX:-12,AVO:6}},
 204    {t:"I've checked. I'm fine. I've checked again.",                w:{ANX:14}},
 205    {t:"I've built three explanations and two of them end with me alone.", w:{ANX:18,RDY:-5}},
 206    {t:"I noticed. And I let it be nine hours.",                     w:{ANX:-14,RDY:9}}]},
 207  
 208  {ch:1, s:"The kind of fight where afterwards you both stand very still, surprised at the size of what came out. And then — they move first.",
 209   t:"A real fight. Voices. Then they stop, and step toward you.",
 210   o:[
 211    {t:"I step toward them.",                                        w:{ANX:-6,AVO:-12,RDY:9}},
 212    {t:"I need the room first. Then I can.",                         w:{AVO:8,RDY:3}},
 213    {t:"I hold on, so they can't leave the room.",                   w:{ANX:16}},
 214    {t:"I go very calm and very far away — still standing there.",   w:{AVO:16}}]},
 215  
 216  {ch:1, s:"They call you before they call anyone else. For everything. The good news, the flat tire, the 2am spiral. You are the first number.",
 217   t:"What does it feel like when someone needs you a great deal?",
 218   o:[
 219    {t:"Like being chosen.",                                         w:{ANX:8,AVO:-8}},
 220    {t:"Like being useful — which I confuse with being loved.",      w:{ANX:12,RDY:-6}},
 221    {t:"Like a weight I agreed to carry.",                           w:{AVO:12}},
 222    {t:"Like an ordinary Tuesday.",                                  w:{AVO:-6,ANX:-6,RDY:10}}]},
 223  
 224  {ch:1, s:"Sunday morning. Tea going cold. They are reading in the next room and you can hear the pages turn. Nothing is happening. Nothing has happened for months.",
 225   t:"The relationship is calm. Six months of calm. No drama, no crisis, no proving.",
 226   o:[
 227    {t:"That is the entire point.",                                  w:{ANX:-14,RDY:11}},
 228    {t:"I keep waiting for the part where it turns.",                w:{ANX:14,AMB:-6}},
 229    {t:"I get restless. I miss the electricity.",                    w:{ANX:10,AMB:6,RDY:-4}},
 230    {t:"I start pulling back without deciding to.",                  w:{AVO:14,RDY:-6}}]},
 231  
 232  {ch:1, s:"There is a door in you that certain conversations walk past. Everyone who loves you has stood outside it at some point, not knowing it was there.",
 233   t:"You have been hurt in a way you have never told anyone. Where does it live now?",
 234   o:[
 235    {t:"I told someone. It's smaller now.",                          w:{RDY:13,ANX:-5,AVO:-5}},
 236    {t:"It lives in how quickly I leave.",                           w:{AVO:14,RDY:-8}},
 237    {t:"It lives in how hard I hold.",                               w:{ANX:14,RDY:-8}},
 238    {t:"Still sealed. I'd rather not open it.",                      w:{AVO:10,RDY:-11}}]},
 239  
 240  /* ── CHAPTER III · AUTONOMY & AMBIGUITY ──────────────────────── */
 241  {ch:2, s:"A thought experiment with teeth. Two whole lives, laid out side by side like coats. You may put on exactly one.",
 242   t:"In one life, you chose — and it is harder. In the other, it was chosen for you — and it is easier. Both end well. Both.",
 243   o:[
 244    {t:"The one I chose. Obviously.",                                w:{AUT:16}},
 245    {t:"The one I chose — and I'd need to say that out loud sometimes.", w:{AUT:12,ANX:5}},
 246    {t:"The easier one. I'm not performing anything for anyone.",    w:{AUT:-14,KIN:6,RDY:4}},
 247    {t:"I want to have chosen the easier one.",                      w:{AUT:6,AMB:-8,RDY:-4,c:-10}}]},
 248  
 249  {ch:2, s:"You know their coffee order and their mother's name and the exact sound of their key in the door. And still — the question sits with you at breakfast.",
 250   t:"Six months in, and you still do not know if this is it.",
 251   o:[
 252    {t:"Six months is nothing. Keep going.",                         w:{AMB:16}},
 253    {t:"Six months means something is already wrong.",               w:{AMB:-14}},
 254    {t:"I'd ask them where we are.",                                 w:{AMB:-4,RDY:11}},
 255    {t:"I'd stay, and quietly start locating the exit.",             w:{AMB:-8,AVO:10,RDY:-7,c:-8}}]},
 256  
 257  {ch:2, s:"An aunt did the work. Photographs, professions, families known for two generations. It arrives folded, like a menu, like a blessing, like a trap — you can't decide which.",
 258   t:"Someone hands you a shortlist. Three people. All genuinely good, all vetted, all willing.",
 259   o:[
 260    {t:"Thank god. Let's start.",                                    w:{AUT:-14,KIN:10,AMB:-8}},
 261    {t:"I'll meet them. My terms, my pace, my no.",                  w:{AUT:8,KIN:8,RDY:7}},
 262    {t:"A list of people is not a list of people.",                  w:{AUT:14,KIN:-8}},
 263    {t:"I'd meet all three, choose none, and do it again next year.",w:{AMB:8,AUT:6,RDY:-7,c:-6}}]},
 264  
 265  {ch:2, s:"Years from now, someone young will ask you — half joking, entirely serious — how you knew. You will give them one sentence. This one.",
 266   t:"What actually makes a marriage <em>yours</em>?",
 267   o:[
 268    {t:"That I picked it.",                                          w:{AUT:16}},
 269    {t:"That I stayed in it.",                                       w:{AUT:-6,KIN:6,RDY:9}},
 270    {t:"That both families are in the photograph.",                  w:{KIN:14,AUT:-4}},
 271    {t:"That I could have left, and didn't.",                        w:{AUT:12,KIN:8,RDY:6}}]},
 272  
 273  {ch:2, s:"A sealed envelope on the left. An open horizon on the right. Whichever you touch, the other one turns to smoke — and you will remember the smoke.",
 274   t:"Certainty now, or the possibility of something better later. No take-backs either way.",
 275   o:[
 276    {t:"Certainty. I know what uncertainty does to me.",             w:{AMB:-16,KIN:6}},
 277    {t:"Possibility. I'd rather ache than settle.",                  w:{AMB:16,REG:8}},
 278    {t:"Certainty — and I'd wonder about it for years.",             w:{AMB:-8,REG:10,RDY:-4,c:-6}},
 279    {t:"Depends entirely on the day you ask me.",                    w:{AMB:4,RDY:-7,c:-12}}]},
 280  
 281  /* ── CHAPTER V · REGRET ──────────────────────────────────────── */
 282  {ch:4, s:"Rain on the windscreen. The groceries going warm in the back seat. You could go inside. You don't, not yet. This is the only room in your life that is entirely yours.",
 283   t:"Ten years from now. You are alone in a parked car, engine off. Which sentence arrives?",
 284   o:[
 285    {t:"“I should have tried.”",                            w:{REG:18}},
 286    {t:"“I shouldn't have blown up my life for that.”",     w:{REG:-16}},
 287    {t:"“I did it right, and I still don't know if it was mine.”", w:{REG:10,AUT:8}},
 288    {t:"No sentence arrives. I'm alright.",                          w:{REG:-6,RDY:9}}]},
 289  
 290  {ch:4, s:"They are sixteen and furious and standing in your kitchen, asking how you could possibly understand. And you realise you are about to hand them the sentence you built your life on.",
 291   t:"Which regret would you rather one day explain to a child of your own?",
 292   o:[
 293    {t:"“I chose someone, and it was hard.”",               w:{REG:14,AUT:8}},
 294    {t:"“I listened to people who loved me.”",              w:{REG:-14,KIN:10}},
 295    {t:"“I waited too long to be sure.”",                   w:{REG:8,AMB:-6,RDY:-4}},
 296    {t:"Neither. I want a third answer.",                            w:{AUT:6,KIN:6,AMB:5}}]},
 297  
 298  {ch:4, s:"An anniversary dinner, the twentieth. The waiter assumes you're happy, and he is not wrong, exactly. Across the table: the most familiar face in the world.",
 299   t:"Twenty years in. The marriage is good. Not thrilling — steady, kind, unsurprising.",
 300   o:[
 301    {t:"That is the definition of success.",                         w:{REG:-12,AMB:-6,RDY:11}},
 302    {t:"That's a slow death, and I'd feel it by year five.",         w:{REG:14,AMB:8}},
 303    {t:"Good. And I'd need one thing that is only mine.",            w:{REG:6,AUT:10,RDY:9}},
 304    {t:"I'd stay, and quietly stop being there.",                    w:{AVO:14,RDY:-11}}]},
 305  
 306  {ch:4, s:"Not the list you'd post. Not the list your friends would clap for. The real one — the one you'd only say with the lights off.",
 307   t:"Right now, honestly — could you name what you <em>need</em> from a partner? Not what you like. Need.",
 308   o:[
 309    {t:"Yes. Three things. I could say them out loud right now.",    w:{RDY:18}},
 310    {t:"Roughly. I'd fumble it.",                                    w:{RDY:4}},
 311    {t:"No. I'd describe a person instead of a need.",               w:{RDY:-9}},
 312    {t:"Nobody has ever asked me that.",                             w:{RDY:-5}}]},
 313  
 314  {ch:4, s:"Last one. Close your eyes if you need to. Empty hall. No audience, no aunties, no group chat, no God watching through anyone else's eyes. Just you and the choice.",
 315   t:"If no one — not one single person — would ever know or judge your choice, does the choice change?",
 316   o:[
 317    {t:"No. Same answer.",                                           w:{RDY:14,c:12}},
 318    {t:"Yes. Completely.",                                           w:{RDY:-9,c:-20,ext:1}},
 319    {t:"It gets easier. Not different.",                             w:{RDY:9,AUT:6,c:6}},
 320    {t:"I don't know who I'd be without the judging.",               w:{RDY:-13,c:-16,ext:1}}]}
 321  ];
 322  
 323  /* ── 3. THE MIRROR ───────────────────────────────────────────── */
 324  const MIRROR = [
 325   {s:"Two people at the edge of becoming something. One of them has to say it first, and saying it first is a kind of falling.",
 326    t:"Who moves first? Who says the thing that cannot be taken back?",
 327    L:"They should", R:"I should", w:{AUT:6}},
 328   {s:"Two careers, one city between them. The boxes are flat-packed in the hallway, waiting to find out whose books go in them.",
 329    t:"One of you gives up a city for the other's work. Who packs?",
 330    L:"I do", R:"They do", w:{}},
 331   {s:"The bill arrives. One of you reaches faster, and both of you notice, and neither of you says anything about what it means.",
 332    t:"One of you earns significantly more. How much does that reshape the marriage?",
 333    L:"Not at all", R:"It defines it", w:{}},
 334   {s:"Mid-argument. Something true and hot is rising in your throat, and somewhere behind your eyes a voice says: careful — remember what you're supposed to be.",
 335    t:"In a fight, how much feeling is allowed to show on your face?",
 336    L:"None. Stay level.", R:"All of it.", w:{AVO:6}},
 337   {s:"Another birthday. The candles get counted twice — once by you, once by everyone who loves you and has opinions about your timeline.",
 338    t:"The clock. How much does age press on the decision?",
 339    L:"It doesn't", R:"It runs everything", w:{AMB:-5,RDY:-4}},
 340   {s:"A phone call in the night, a parent's voice suddenly older than you remembered. Someone will rearrange their whole life now. The question is whose life bends.",
 341    t:"After the wedding — whose parents get cared for, and by whom?",
 342    L:"Each side carries its own", R:"It lands on me", w:{}}
 343  ];
 344  
 345  /* ── 4. ENGINE ───────────────────────────────────────────────── */
 346  const clamp=(v,a=0,b=100)=>Math.max(a,Math.min(b,v));
 347  const el=id=>document.getElementById(id);
 348  const stage=el('stage');
 349  
 350  function apply(w){
 351    for(const k in w){
 352      if(k==='c'){ S.coh=clamp(S.coh+w.c); continue; }
 353      if(k==='ext'){ S.external=true; continue; }
 354      S.T[k]=clamp(S.T[k]+w[k]);
 355    }
 356    paintRail();
 357  }
 358  function buildRail(){
 359    el('rail').innerHTML = THREADS.map(t=>
 360      `<div class="thread"><i id="r_${t.k}" style="background:${t.c};color:${t.c};height:${S.T[t.k]}%"></i></div>`).join('');
 361  }
 362  function paintRail(){
 363    THREADS.forEach(t=>{ const n=el('r_'+t.k); if(n) n.style.height=S.T[t.k]+'%'; });
 364  }
 365  
 366  const TOTAL = Q.length + MIRROR.length;
 367  let answered = 0;
 368  function progress(){
 369    el('prog').firstElementChild.style.width = (answered/TOTAL*100)+'%';
 370    braid = answered/TOTAL;          // the threads weave as you answer
 371  }
 372  
 373  function score(){
 374    const T=S.T, SEC = clamp(100 - Math.max(T.ANX,T.AVO) + 8);
 375    // insecurity costs every door, just in different currencies — avoidance weighs
 376    // heavier on the chosen path, anxiety heavier on the given one
 377    const SECL = clamp(100 - (0.65*T.AVO + 0.45*T.ANX));
 378    let love = .30*T.AUT + .20*T.AMB + .20*T.REG + .15*(100-T.KIN) + .15*SECL;
 379    let arr  = .30*T.KIN + .20*(100-T.AMB) + .20*(100-T.REG) + .15*(100-T.AUT) + .15*SEC;
 380    let bri  = .45*Math.min(T.AUT,T.KIN) + .25*(100-Math.abs(T.AUT-T.KIN)) + .15*T.AMB + .15*SEC;
 381  
 382    // inherited pressure taxes the doors that require standing against the room
 383    love -= T.PRS*0.14;
 384    bri  -= T.PRS*0.05;
 385  
 386    const sum=love+arr+bri;
 387    const pct={love:love/sum*100, arranged:arr/sum*100, bridge:bri/sum*100};
 388    const rank=Object.keys(pct).sort((a,b)=>pct[b]-pct[a]);
 389    const gap=pct[rank[0]]-pct[rank[1]];
 390    const conf = gap>14?'Clear' : gap>6?'Leaning' : 'Split';
 391    return {pct,rank,gap,conf,SEC};
 392  }
 393  
 394  const DOOR={
 395    love:{n:'The Chosen', s:'Love marriage', c:'linear-gradient(90deg,#7a2338,#e0577a)', g:'♥',
 396      line:'You need the decision to be yours. Not because you are stubborn — because a life handed to you would never quite feel like it happened to you.'},
 397    arranged:{n:'The Given', s:'Arranged marriage', c:'linear-gradient(90deg,#3b2f6b,#9d86e8)', g:'◈',
 398      line:'You draw strength from structure and from being held by something larger than yourself. Certainty first. Intimacy earned afterwards, slowly, on purpose.'},
 399    bridge:{n:'The Bridge', s:'Assisted — family opens the door, you walk through it', g:'⌒',
 400      c:'linear-gradient(90deg,#6b5220,#d9a860)',
 401      line:'You hold two needs at once: to belong, and to have chosen. You are not fence-sitting. You are asking for both, and both is a real architecture — with its own real cost.'}
 402  };
 403  
 404  function failure(top){
 405    const T=S.T;
 406    if(T.RDY<45) return {n:'Neither door yet',
 407      p:["Not a verdict against you — a verdict about timing. Your readiness reads at "+Math.round(T.RDY)+", and readiness is not the same thing as wanting it. Everything above this line describes the shape you'll have when you get there.",
 408         "Right now the honest instruction is: don't pick a door. Pick a year."]};
 409    if(S.coh<50) return {n:'The unnamed fight',
 410      p:["Your answers contradict each other in a specific, patterned way — that isn't carelessness, it's a person arguing with somebody who isn't in the room.",
 411         "You will bring that argument into a marriage and your partner will think it is about them. Name the other voice before you marry anyone. Say the name out loud."]};
 412    if(top==='love' && T.ANX>60) return {n:'Disillusionment through intensity',
 413      p:["You are wired to read intensity as proof. The chase feels like aliveness; the calm that comes after feels, quietly, like loss.",
 414         "The risk is not that you pick the wrong person. It's that you pick the right one and mistake peace for the end of love. Watch for the month it goes still. That month is the test, not the ending."]};
 415    if(top==='love' && T.PRS>35) return {n:'The price you did not read',
 416      p:["You'll win the fight. That part I'd bet on. The instalments are the part nobody warns you about — the ten years of small cold rooms and half-invitations afterwards.",
 417         "You can absolutely pay it. But price it out loud, with the actual person, before the wedding — not during the third year, in a kitchen, at midnight."]};
 418    if(top==='arranged' && T.AUT>60) return {n:'The quiet resignation',
 419      p:["Nothing will be wrong. That is precisely the problem. Your self-authorship reads at "+Math.round(T.AUT)+", which means a good life you didn't choose will eventually register as a life that happened near you.",
 420         "If you take this door, take it loudly. Insist on the veto. Insist on the meetings, the no, the second no. A door you walked through is survivable; a door you were carried through is not."]};
 421    if(top==='arranged' && T.AVO>60) return {n:'Two polite strangers',
 422      p:["This is the most deceptive failure in the whole system, because from the outside it looks like a successful marriage — for twenty years.",
 423         "Structure lets you be married without being known, and you are wired to accept that trade without noticing you made it. Build one deliberate ritual of disclosure. Something small and regular and non-negotiable."]};
 424    if(top==='bridge' && T.AMB<40) return {n:'Paralysis at the bridge',
 425      p:["Infinite optionality plus a permanent safety net means no choice ever has to become final — and you have a low tolerance for the unresolved, so this will grind you.",
 426         "Set a real limit. A number of meetings, a date on a calendar. The Bridge only works for people who are willing to eventually burn it."]};
 427    return {n:'The drift',
 428      p:["No single fault line dominates your profile, which is genuinely good news — but under stress, people don't stay at their strongest door. They drift to their second.",
 429         "Yours is "+DOOR[score().rank[1]].n+". Know that in advance, so that when you drift you can at least see yourself doing it."]};
 430  }
 431  
 432  function theAsk(top){
 433    const T=S.T, a=[];
 434    if(T.ANX>58) a.push("Someone whose reassurance is <em>boring</em> — steady, unprompted, unearned. You do not need a person who proves it. You need a person who doesn't make you ask.");
 435    if(T.AVO>58) a.push("Someone who can be near you without needing you to perform closeness on demand — and who will still, gently, refuse to let you disappear.");
 436    if(T.AUT>62) a.push("Someone who has their own life and does not require you to be the plot of theirs. Being needed too much will read to you as being spent.");
 437    if(T.KIN>62) a.push("Someone who is genuinely good with your family — not tolerant of them. Tolerance runs out around year four.");
 438    if(T.AMB<42) a.push("Someone who states things plainly. Ambiguity is not romance to you; it is a low-grade fever.");
 439    if(T.PRS>35) a.push("Someone who can hear the inherited script in your head and not take it personally when it speaks louder than you do.");
 440    if(T.REG>62) a.push("Someone worth the story. You will be telling yourself this story for fifty years — make sure it holds up in the retelling.");
 441    if(!a.length) a.push("Someone unremarkable in the best possible sense: consistent, curious about you after the novelty ends, and unbothered by silence.");
 442    return a.slice(0,4);
 443  }
 444  
 445  const INVOICE={
 446    love:"You will not be able to blame anyone. Every hard year is a year you signed for. That is the freedom and that is the bill — they are the same item.",
 447    arranged:"You are trading the peak for the floor. There will very likely never be a night you describe as the best of your life. In exchange, there will very likely never be a night you cannot get through.",
 448    bridge:"You are asking two systems to both approve of you — yourself and your family. When they disagree, and they will, no one can break the tie. You'll have to, and you'll have to do it alone."
 449  };
 450  
 451  /* ═══════════════════════════════════════════════════════════════
 452     THE COUNCIL — six specialists, a router, and a synthesiser.
 453     The arithmetic engine above produces a number. The council
 454     produces an argument. They are allowed to disagree, and when
 455     they do, the reader gets to watch.
 456     ═══════════════════════════════════════════════════════════════ */
 457  const dev=(v,mid)=>Math.abs(v-mid);
 458  
 459  const AGENTS=[
 460  { id:'attachment', name:'Attachment', domain:'Chapter II · the room with no lights', c:'#5f7fb8',
 461    run(T){
 462      const rel=clamp(28+Math.max(dev(T.ANX,40),dev(T.AVO,40))*1.5);
 463      if(T.ANX>58&&T.AVO>58) return {rel:100,lean:null,conf:35,
 464        finding:"You reach for closeness and brace against it in the same breath. From where you stand every door looks like a trap — not because the doors are bad, but because your wiring reads arrival itself as risk.",
 465        concern:"This is the profile most likely to leave a good marriage for reasons it cannot name afterwards."};
 466      if(T.ANX>58) return {rel,lean:'bridge',conf:66,
 467        finding:"You read silence as information; it usually isn't. A door your family opened <em>and</em> you walked through hands you two guarantees instead of one — and you are someone who needs two.",
 468        concern:"Watch the month it goes calm. You are built to read peace as withdrawal."};
 469      if(T.AVO>58) return {rel,lean:'arranged',conf:62,
 470        finding:"Structure genuinely suits you. It lets a marriage run without requiring you to perform closeness on a schedule you did not set.",
 471        concern:"That is also the trap. Structure will let you stay married twenty years without ever being known inside it."};
 472      return {rel:Math.min(rel,42),lean:null,conf:24,
 473        finding:"Attachment is not what decides this for you. You move toward people under stress, which is the most protective thing in this entire reading.",
 474        concern:"None worth naming. You will survive either door."};
 475    }},
 476  
 477  { id:'kinship', name:'Kinship', domain:'Chapter I · the house you grew up in', c:'#e0577a',
 478    run(T){
 479      const rel=clamp(34+dev(T.KIN,50)*1.5);
 480      if(T.KIN>=65&&T.AUT>=58) return {rel,lean:'bridge',conf:78,
 481        finding:"You need the blessing and you need the choice. Read that again — not one softened by the other. Both, at full strength, which is why one door alone has never sounded right to you.",
 482        concern:"When the two disagree, nobody can break the tie for you."};
 483      if(T.KIN>=65) return {rel,lean:'arranged',conf:72,
 484        finding:"You marry into a net rather than a void. That net has weight, and weight is not the same thing as a cage — the pull you feel is a resource, not a failure of nerve.",
 485        concern:"A partner your family merely tolerates will not survive year four."};
 486      if(T.KIN<=38) return {rel,lean:'love',conf:70,
 487        finding:"You are unusually free of the room's opinion. Freedom of this shape is often the residue of a net that failed you once, which is worth knowing before you call it strength.",
 488        concern:"You may underestimate how much you will want that net back at thirty-five."};
 489      return {rel:Math.min(rel,55),lean:'bridge',conf:38,
 490        finding:"Family registers at a normal, negotiable volume. It will shape this decision without deciding it.",
 491        concern:"Nothing structural. Keep it that way by asking early rather than assuming."};
 492    }},
 493  
 494  { id:'mirror', name:'Mirror', domain:'Chapter IV · want versus expectation', c:'#b8556e',
 495    run(T,ctx){
 496      const rel=clamp(12+T.PRS*1.2);
 497      const widest=(ctx.mirrors||[]).slice().sort((a,b)=>b.d-a.d)[0];
 498      const q=widest?`"${widest.t}"`:'the widest scenario';
 499      if(T.PRS<18) return {rel,lean:null,conf:20,
 500        finding:"Almost nothing to report, and that is the report. You want roughly what you were taught to want — genuinely low friction, and a strength rather than a lack of imagination.",
 501        concern:"None. This is the quietest result this agent can return."};
 502      if(T.PRS>=45&&T.AUT>58) return {rel,lean:'bridge',conf:74,
 503        finding:"You carry a loud inherited script and a strong will, and they do not agree. Your widest gap was "+q+". A door the room already sanctions costs you far less to walk through.",
 504        concern:"Love marriage is not wrong for you — it is <em>expensive</em> for you, and nobody prices it out loud beforehand."};
 505      if(T.PRS>=45) return {rel,lean:'arranged',conf:58,
 506        finding:"The gap between what you want and what is expected of you is wide, but your will is not pushing hard against it. Your widest gap was "+q+".",
 507        concern:"Compliance and agreement look identical from outside. Only one of them lasts."};
 508      return {rel,lean:'bridge',conf:40,
 509        finding:"A script exists and it is not running you. Your widest gap was "+q+" — the one place the room still speaks louder than you do.",
 510        concern:"Small gaps surface in small decisions, repeatedly, for years."};
 511    }},
 512  
 513  { id:'regret', name:'Regret', domain:'Chapter V · ten years from now', c:'#9d86e8',
 514    run(T){
 515      const rel=clamp(30+dev(T.REG,50)*1.7);
 516      if(T.REG>62) return {rel,lean:'love',conf:76,
 517        finding:"The unchosen door is what will haunt you — not the wrong one. You forgive your own mistakes far more readily than your own hesitation.",
 518        concern:"You may choose <em>something</em> just to have chosen. That is a different mistake wearing the same coat."};
 519      if(T.REG<38) return {rel,lean:'arranged',conf:72,
 520        finding:"You regret action more than inaction. A decision you made alone and got wrong would sit in you for years; a decision you were guided into would not.",
 521        concern:"This is real self-knowledge, not timidity. Do not let anyone talk you out of it in the name of romance."};
 522      return {rel:Math.min(rel,48),lean:null,conf:26,
 523        finding:"Balanced. You will forgive yourself either way, eventually — which means regret should not be the thing that decides this.",
 524        concern:"None. Let the other agents carry this one."};
 525    }},
 526  
 527  { id:'readiness', name:'Readiness', domain:'all chapters · holds the veto', c:'#cbb27a',
 528    run(T,ctx){
 529      if(T.RDY<45) return {rel:100,lean:null,conf:95,veto:true,
 530        finding:"Readiness reads "+Math.round(T.RDY)+", below the gate. Wanting a marriage and being ready for one are different questions, and almost every tool in this space confuses them.",
 531        concern:"I am overriding the door. Everything the others found still holds — it describes the shape you will have when you arrive, not the shape you are in now."};
 532      if(ctx.coh<50) return {rel:100,lean:null,conf:80,veto:false,flag:'coherence',
 533        finding:"Ready enough, at "+Math.round(T.RDY)+". But your answers contradict each other in a patterned way, which is the signature of someone arguing with a person who is not in the room.",
 534        concern:"You will carry that argument into a marriage and your partner will think it is about them."};
 535      if(T.RDY>65) return {rel:70,lean:null,conf:85,veto:false,
 536        finding:"Readiness reads "+Math.round(T.RDY)+". You can name what you need, not just what you like — rarer at this stage than anyone admits.",
 537        concern:"None. The door below is safe to walk through this year."};
 538      return {rel:85,lean:null,conf:55,veto:false,
 539        finding:"Readiness reads "+Math.round(T.RDY)+" — roughly ready, with a few things still sealed.",
 540        concern:"Not disqualifying. But open the sealed thing before you promise anyone the whole of you."};
 541    }}
 542  ];
 543  
 544  const SEAT_THRESHOLD=45;
 545  
 546  function convene(r){
 547    const T=S.T, ctx={mirrors:S.mirrors, coh:S.coh, external:S.external};
 548    const reports=AGENTS.map(a=>{
 549      const out=a.run(T,ctx);
 550      return {id:a.id,name:a.name,domain:a.domain,c:a.c,
 551        rel:Math.round(out.rel),lean:out.lean,conf:out.conf,
 552        finding:out.finding,concern:out.concern,veto:!!out.veto,flag:out.flag||null,
 553        seated: a.id==='readiness' ? true : out.rel>=SEAT_THRESHOLD};
 554    });
 555  
 556    /* ── router ─────────────────────────────────────────────── */
 557    const seated=reports.filter(x=>x.seated), benched=reports.filter(x=>!x.seated);
 558    const routerNote = benched.length
 559      ? "Seated "+seated.length+" of "+reports.length+". "+
 560        benched.map(b=>b.name+" was consulted but not seated — "+
 561          (b.id==='mirror' ? "your want and your expectation barely diverge, so there is little for it to weigh"
 562          : b.id==='attachment' ? "your attachment is steady enough that it does not tilt the decision"
 563          : b.id==='regret' ? "you regret action and inaction about equally, so it has no thumb to put on the scale"
 564          : "its domain reads close to neutral for you")).join(" ")
 565      : "All "+reports.length+" agents seated — every domain reads strongly enough to matter for you.";
 566  
 567    /* ── weighted vote ──────────────────────────────────────── */
 568    const tally={love:0,arranged:0,bridge:0};
 569    seated.forEach(x=>{ if(x.lean) tally[x.lean]+= (x.rel/100)*(x.conf/100)*100; });
 570    const voted=Object.keys(tally).sort((a,b)=>tally[b]-tally[a]);
 571    const totalW=tally.love+tally.arranged+tally.bridge;
 572    const councilTop = totalW>0 ? voted[0] : null;
 573    const councilShare = totalW>0 ? Math.round(tally[councilTop]/totalW*100) : 0;
 574  
 575    /* ── disagreement ───────────────────────────────────────── */
 576    const voters=seated.filter(x=>x.lean&&x.conf>=55);
 577    const splits=[];
 578    for(let i=0;i<voters.length;i++)
 579      for(let j=i+1;j<voters.length;j++)
 580        if(voters[i].lean!==voters[j].lean)
 581          splits.push({a:voters[i],b:voters[j]});
 582    splits.sort((x,y)=>(y.a.conf+y.b.conf)-(x.a.conf+x.b.conf));
 583  
 584    /* ── does the council dissent from the arithmetic? ──────── */
 585    const engineTop=r.rank[0];
 586    const dissent = !!councilTop && councilTop!==engineTop;
 587  
 588    /* ── synthesiser ────────────────────────────────────────── */
 589    const readiness=reports.find(x=>x.id==='readiness');
 590    let verdict, note;
 591    if(readiness.veto){
 592      verdict=engineTop;
 593      note="The council reached a door and the Readiness agent held it shut. That is not a contradiction — the door is still yours, the year is not. Read everything above as a description of who you will be standing there, not who is standing there now.";
 594    }else if(dissent){
 595      verdict=engineTop;
 596      note="The arithmetic and the council disagree, and I am not going to hide that. The numbers put you at <em>"+DOOR[engineTop].n+"</em>; the agents, weighting what they each know best, lean <em>"+DOOR[councilTop].n+"</em>. The gap is usually one loud thread pulling the sum around while the specialists see a different shape. Take the arithmetic as your door and the council as your warning.";
 597    }else if(!councilTop){
 598      verdict=engineTop;
 599      note="The council abstained. Not one seated agent found its domain loud enough in you to argue for a door \u2014 no dominant attachment pattern, no strong family pull, no wide inherited script, no lopsided regret. That is a real result and a fairly enviable one: it means nothing in your wiring is fighting you. The arithmetic still points to <em>"+DOOR[engineTop].n+"</em>, but it does so by a narrow margin over an ordinary person, not by pulling you away from a fault line. Choose with less fear than most people get to.";
 600    }else if(splits.length){
 601      verdict=engineTop;
 602      note="The council reached <em>"+DOOR[engineTop].n+"</em>, but not quietly. "+splits[0].a.name+" and "+splits[0].b.name+" want different things for you, and neither is wrong — they are simply protecting different parts of you. That tension does not resolve when you pick a door. It comes with you.";
 603    }else{
 604      verdict=engineTop;
 605      note="Rare: every seated agent points the same way. The arithmetic and the council agree on <em>"+DOOR[engineTop].n+"</em>. When a reading is this consistent, the risk stops being <em>which door</em> and becomes <em>whether you'll actually walk through it</em>.";
 606    }
 607  
 608    return {reports,seated,benched,routerNote,tally,councilTop,councilShare,
 609            dissent,engineTop,splits:splits.slice(0,2),verdict,note,
 610            vetoed:readiness.veto};
 611  }
 612  
 613  /* ── 5. RENDER ───────────────────────────────────────────────── */
 614  function go(fn){ stage.innerHTML=''; fn(); window.scrollTo({top:0,behavior:'instant'}); }
 615  function reveal(){ // stagger every .rv child
 616    stage.querySelectorAll('.rv').forEach((n,i)=>{ n.style.animationDelay=(i*0.14)+'s'; });
 617  }
 618  
 619  function scrIntro(){
 620    setMood('intro');
 621    stage.innerHTML=`
 622    <div style="padding-top:8vh">
 623      <div class="kicker rv">Impulse</div>
 624      <h1 class="rv">The<br><span style="color:var(--gold)">Bridge</span></h1>
 625      <p class="rv" style="font-family:var(--serif);font-style:italic;font-weight:300;font-size:1.08rem;color:var(--mut);margin-top:18px;letter-spacing:.02em">If you have lost your path in love, Impulse shows you the direction — not the path.</p>
 626      <div class="rule rv"></div>
 627      <p class="lead rv">Both doors lead to a room where something breaks.<br>
 628      This asks which breakage you can live inside.</p>
 629      <div style="height:28px"></div>
 630      <p class="muted rv">Love marriage fails through <em>disillusionment</em> — you chose from a peak, and peaks flatten. Arranged marriage fails through <em>resignation</em> — you never had the peak, so nothing flattens, and a slow question builds instead.</p>
 631      <div style="height:16px"></div>
 632      <p class="muted rv">Neither failure is worse. They are different shapes of pain, and people are not equally built for both. Twenty-six questions. Ten minutes. There are no right answers — the engine scores the distance between your answers, not the answers themselves, so it cannot be flattered and it cannot be gamed.</p>
 633      <div style="height:16px"></div>
 634      <p class="muted rv" style="font-size:.82rem;opacity:.7">The two threads of light behind this page are the two doors. They begin apart. Watch what they do as you answer.</p>
 635      <div style="height:40px"></div>
 636      <button class="btn rv" onclick="go(scrThreshold)">Cross</button>
 637    </div>`;
 638    reveal();
 639  }
 640  
 641  function scrThreshold(){
 642    stage.innerHTML=`
 643    <div class="fade">
 644      <div class="kicker">Chapter Zero — The Threshold</div>
 645      <h2>Before anything else.</h2>
 646      <div class="rule"></div>
 647      <div class="field">
 648        <label>What should this reading call you</label>
 649        <input type="text" id="nm" placeholder="a name, or anything" autocomplete="off">
 650      </div>
 651      <div class="field">
 652        <label>You are</label>
 653        <div class="chips" id="gd">
 654          ${['A man','A woman','Neither / other'].map(g=>`<div class="chip" data-v="${g}">${g}</div>`).join('')}
 655        </div>
 656        <p class="tnote" style="margin-top:10px">Nothing in this engine is scored by gender. This only decides whose expectation you are reading against in Chapter IV.</p>
 657      </div>
 658      <div class="field">
 659        <label>Roughly</label>
 660        <div class="chips" id="ag">
 661          ${['Under 22','22–26','27–31','32–37','38+'].map(g=>`<div class="chip" data-v="${g}">${g}</div>`).join('')}
 662        </div>
 663      </div>
 664      <div class="field">
 665        <label>How loudly does your family's opinion live in your head</label>
 666        <input type="range" id="fv" min="0" max="100" value="50">
 667        <div class="ends"><span>a distant radio</span><span>a voice in the room</span></div>
 668      </div>
 669      <div style="height:26px"></div>
 670      <button class="btn" id="goB" disabled onclick="startPlay()">Begin</button>
 671    </div>`;
 672    const check=()=>{ el('goB').disabled = !(S.name && S.gender && S.age); };
 673    el('nm').oninput = e=>{ S.name=e.target.value.trim(); check(); };
 674    ['gd','ag'].forEach(id=>{
 675      el(id).querySelectorAll('.chip').forEach(c=>c.onclick=()=>{
 676        el(id).querySelectorAll('.chip').forEach(x=>x.classList.remove('sel'));
 677        c.classList.add('sel');
 678        if(id==='gd') S.gender=c.dataset.v; else S.age=c.dataset.v;
 679        check();
 680      });
 681    });
 682    el('fv').oninput = e=>{ S.familyVolume=+e.target.value; };
 683  }
 684  
 685  function startPlay(){
 686    S.T.KIN = clamp(S.T.KIN + (S.familyVolume-50)*0.30);
 687    buildRail(); el('rail').classList.add('on');
 688    chapterCard(0);
 689  }
 690  
 691  function chapterCard(ci){
 692    const c=CHAPTERS[ci];
 693    setMood(c.mood);
 694    el('chapmark').textContent='Chapter '+c.n;
 695    stage.innerHTML=`
 696    <div style="padding-top:10vh">
 697      <div class="chnum rv">${c.n}</div>
 698      <div class="kicker rv">Chapter ${c.n}</div>
 699      <h2 class="rv">${c.t}</h2>
 700      <div class="rule rv"></div>
 701      <p class="lead rv">${c.b}</p>
 702      <div style="height:40px"></div>
 703      <button class="btn rv" onclick="enterChapter(${ci})">Continue</button>
 704    </div>`;
 705    reveal();
 706  }
 707  
 708  let queue=[], qi=0, curChapter=0;
 709  function enterChapter(ci){
 710    curChapter=ci;
 711    if(ci===3){ mi=0; return go(mirrorScreen); }
 712    queue = Q.filter(q=>q.ch===ci); qi=0;
 713    go(qScreen);
 714  }
 715  
 716  function qScreen(){
 717    const q=queue[qi];
 718    stage.innerHTML=`
 719    <div style="padding-top:8vh">
 720      <div class="kicker rv">Chapter ${CHAPTERS[curChapter].n} · ${qi+1} of ${queue.length}</div>
 721      <p class="scene rv">${q.s}</p>
 722      <h3 class="rv" style="font-size:1.7rem;line-height:1.35;font-weight:300">${q.t}</h3>
 723      <div class="opts">
 724        ${q.o.map((o,i)=>`<button class="opt rv" onclick="pick(${i})">${o.t}</button>`).join('')}
 725      </div>
 726    </div>`;
 727    reveal();
 728  }
 729  
 730  function pick(i){
 731    const q=queue[qi];
 732    document.querySelectorAll('.opt')[i].classList.add('sel');
 733    apply(q.o[i].w);
 734    S.answers.push({q:q.t, a:q.o[i].t});
 735    answered++; progress();
 736    setTimeout(()=>{
 737      qi++;
 738      if(qi<queue.length) go(qScreen);
 739      else nextChapter();
 740    },360);
 741  }
 742  
 743  function nextChapter(){
 744    const order=[0,1,2,3,4];
 745    const pos=order.indexOf(curChapter);
 746    if(pos<order.length-1) chapterCard(order[pos+1]);
 747    else finish();
 748  }
 749  
 750  /* ── the mirror screen ───────────────────────────────────────── */
 751  let mi=0;
 752  function mirrorScreen(){
 753    const m=MIRROR[mi];
 754    el('chapmark').textContent='Chapter IV';
 755    stage.innerHTML=`
 756    <div style="padding-top:6vh">
 757      <div class="kicker rv">Chapter IV · The Mirror · ${mi+1} of ${MIRROR.length}</div>
 758      <p class="scene rv">${m.s}</p>
 759      <h3 class="rv" style="font-size:1.6rem;line-height:1.35;font-weight:300">${m.t}</h3>
 760      <div class="mirror rv">
 761        <div class="mrow a">
 762          <div class="mlab"><span class="who">What I actually want</span><span class="val" id="va"></span></div>
 763          <input type="range" id="sa" min="0" max="100" value="50">
 764          <div class="ends"><span>${m.L}</span><span>${m.R}</span></div>
 765        </div>
 766        <div class="mrow b">
 767          <div class="mlab"><span class="who">What's expected of ${expectedOf()}</span><span class="val" id="vb"></span></div>
 768          <input type="range" id="sb" min="0" max="100" value="50">
 769          <div class="ends"><span>${m.L}</span><span>${m.R}</span></div>
 770        </div>
 771        <div class="gapviz">
 772          <div class="base"></div>
 773          <div class="span" id="gspan"></div>
 774          <div class="dot da" id="gda"></div>
 775          <div class="dot db" id="gdb"></div>
 776        </div>
 777        <div class="delta"><span id="dtxt">Move both. The gap between the two lights is the measurement.</span><b id="dval">—</b></div>
 778      </div>
 779      <div style="height:28px"></div>
 780      <button class="btn rv" onclick="mirrorNext()">Set</button>
 781    </div>`;
 782    reveal();
 783  
 784    const upd=()=>{
 785      const a=+el('sa').value, b=+el('sb').value, d=Math.abs(a-b);
 786      el('va').textContent=word(a); el('vb').textContent=word(b);
 787      el('dval').textContent=d;
 788      const lo=Math.min(a,b), hi=Math.max(a,b);
 789      el('gda').style.left=`calc(${a}% - 7px)`;
 790      el('gdb').style.left=`calc(${b}% - 7px)`;
 791      el('gspan').style.left=lo+'%';
 792      el('gspan').style.width=(hi-lo)+'%';
 793      el('gspan').style.opacity = d<6? .15 : 1;
 794      el('dtxt').textContent = d<8 ? 'Aligned. You want what you were taught to want — that is low friction, and it is a strength.'
 795        : d<25 ? 'A small gap. Manageable, but it will show up in the small decisions.'
 796        : d<45 ? 'A real gap. You are carrying a script that is not yours.'
 797        : 'A wide gap. Every decision here will be a negotiation with a room that is not present.';
 798    };
 799    el('sa').oninput=upd; el('sb').oninput=upd; upd();
 800  }
 801  const word=v=> v<15?'strongly left':v<38?'leaning left':v<62?'in the middle':v<85?'leaning right':'strongly right';
 802  function expectedOf(){
 803    return S.gender==='A man'?'a man':S.gender==='A woman'?'a woman':'someone like you';
 804  }
 805  function mirrorNext(){
 806    const m=MIRROR[mi], a=+el('sa').value, b=+el('sb').value;
 807    S.mirrors.push({t:m.t,a,b,d:Math.abs(a-b)});
 808    for(const k in m.w) S.T[k]=clamp(S.T[k] + m.w[k]*((a-50)/50));
 809    answered++; progress();
 810    mi++;
 811    if(mi<MIRROR.length) go(mirrorScreen);
 812    else{
 813      const avg = S.mirrors.reduce((s,x)=>s+x.d,0)/S.mirrors.length;
 814      S.T.PRS = clamp(avg*1.55);
 815      S.coh = clamp(S.coh - S.T.PRS*0.28);
 816      paintRail();
 817      nextChapter();
 818    }
 819  }
 820  
 821  /* ── 6. THE VERDICT ──────────────────────────────────────────── */
 822  function radar(){
 823    const cx=210,cy=190,R=140,n=THREADS.length;
 824    const pt=(i,r)=>{const a=-Math.PI/2+i*2*Math.PI/n;return[cx+Math.cos(a)*r,cy+Math.sin(a)*r];};
 825    let g='';
 826    [.25,.5,.75,1].forEach(f=>{
 827      g+=`<polygon points="${THREADS.map((_,i)=>pt(i,R*f).join(',')).join(' ')}" fill="none" stroke="rgba(255,255,255,.07)"/>`;
 828    });
 829    THREADS.forEach((t,i)=>{
 830      const[x,y]=pt(i,R);
 831      g+=`<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="rgba(255,255,255,.06)"/>`;
 832      const[lx,ly]=pt(i,R+26);
 833      g+=`<text x="${lx}" y="${ly}" fill="${t.c}" font-size="9.5" font-family="Inter,sans-serif"
 834          text-anchor="${lx>cx+6?'start':lx<cx-6?'end':'middle'}" opacity=".85">${t.name.split(' ')[0]}</text>`;
 835    });
 836    const poly=THREADS.map((t,i)=>pt(i,R*S.T[t.k]/100).join(',')).join(' ');
 837    g+=`<polygon class="shape" points="${poly}" fill="rgba(217,168,96,.16)" stroke="var(--gold)" stroke-width="1.3"/>`;
 838    THREADS.forEach((t,i)=>{const[x,y]=pt(i,R*S.T[t.k]/100);
 839      g+=`<circle cx="${x}" cy="${y}" r="3" fill="${t.c}"/>`;});
 840    return `<svg class="radar" viewBox="0 0 420 380">${g}</svg>`;
 841  }
 842  
 843  const NOTE={
 844    AUT:v=>v>65?'A life handed to you would never feel like it happened to you.':v<38?'You are not diminished by guidance — you are steadied by it.':'You want a say. You do not need the whole vote.',
 845    KIN:v=>v>65?'You marry into a net, not a void. That net has weight, and weight is not the same as a cage.':v<38?'You are unusually free, and freedom of this kind is often the residue of a net that failed.':'Family matters to you at a normal, negotiable volume.',
 846    ANX:v=>v>60?'You read silence as information. It usually is not.':v<35?'Silence does not frighten you. This is rarer than you think.':'Ordinary vigilance. Nothing to manage.',
 847    AVO:v=>v>60?'Closeness registers as demand. You will need to consciously choose to stay in rooms.':v<35?'You move toward people under stress. This is the single most protective trait in this whole reading.':'You need some distance. Most people do.',
 848    AMB:v=>v>65?'You can hold an open question without needing to close it. This is a real advantage in the long middle.':v<38?'The unresolved costs you something physical. Do not choose a path with a long undefined phase.':'You can sit with not-knowing, up to a point.',
 849    REG:v=>v>62?'The unchosen door will haunt you. You have to choose.':v<38?'The wrong choice will haunt you more than the unmade one. You should be guided.':'Balanced. You will forgive yourself either way, eventually.',
 850    PRS:v=>v>45?'You are carrying a loud inherited script. This is the cost line on your invoice.':v<18?'You want what you were taught to want, or you were taught very little. Low friction either way.':'A script exists. It is not running you.',
 851    RDY:v=>v>65?'You are actually ready. Most people at this stage are not.':v<45?'Readiness is not desire. This number overrides everything above it.':'Roughly ready. A few things unsealed.'
 852  };
 853  
 854  /* ── storage: every completed reading is archived ────────────── */
 855  const STORE_KEY='bridge_records_v1';
 856  
 857  /* ── cloud database (Firebase Firestore, REST — no SDK needed) ──
 858     Fill in projectId + apiKey from your Firebase project to enable
 859     central storage. Leave empty and the game still works, local-only. */
 860  const CLOUD={projectId:'impulse-e6a58',apiKey:'AIzaSyDAc0qT3UBcOvzQbSNbyg79wpRiTTTfldU'};
 861  const cloudOn=()=>!!(CLOUD.projectId&&CLOUD.apiKey);
 862  function sendToCloud(rec){
 863    if(!cloudOn())return;
 864    fetch('https://firestore.googleapis.com/v1/projects/'+CLOUD.projectId+
 865          '/databases/(default)/documents/readings?documentId='+rec.id+'&key='+CLOUD.apiKey,{
 866      method:'POST',headers:{'Content-Type':'application/json'},
 867      body:JSON.stringify({fields:{json:{stringValue:JSON.stringify(rec)},ts:{stringValue:rec.ts}}})
 868    }).catch(function(){});
 869  }
 870  function saveRecord(r,f,C){
 871    try{
 872      const rec={
 873        id:'r'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),
 874        ts:new Date().toISOString(),
 875        name:S.name, gender:S.gender, age:S.age, familyVolume:S.familyVolume,
 876        T:{...S.T}, coh:Math.round(S.coh), external:S.external,
 877        pct:{love:+r.pct.love.toFixed(2),arranged:+r.pct.arranged.toFixed(2),bridge:+r.pct.bridge.toFixed(2)},
 878        rank:r.rank, gap:+r.gap.toFixed(2), conf:r.conf, fail:f.n,
 879        mirrors:S.mirrors.map(m=>({t:m.t,a:m.a,b:m.b,d:m.d})),
 880        answers:S.answers,
 881        council: C?{
 882          routerNote:C.routerNote,
 883          councilTop:C.councilTop, councilShare:C.councilShare,
 884          dissent:C.dissent, vetoed:C.vetoed, note:C.note,
 885          agents:C.reports.map(a=>({id:a.id,name:a.name,seated:a.seated,rel:a.rel,
 886                                    lean:a.lean,conf:a.conf,veto:a.veto,
 887                                    finding:a.finding,concern:a.concern})),
 888          splits:C.splits.map(sp=>({a:sp.a.name,aLean:sp.a.lean,b:sp.b.name,bLean:sp.b.lean}))
 889        }:null
 890      };
 891      const all=JSON.parse(localStorage.getItem(STORE_KEY)||'[]');
 892      all.push(rec);
 893      localStorage.setItem(STORE_KEY,JSON.stringify(all));
 894      sendToCloud(rec);
 895      return true;
 896    }catch(e){ return false; }
 897  }
 898  
 899  
 900  function councilPanel(C){
 901    const chip=a=>a.veto?'<span class="lean lean-veto">VETO</span>'
 902      :a.lean?`<span class="lean lean-${a.lean}">leans ${DOOR[a.lean].n}</span>`
 903      :'<span class="lean lean-none">abstains</span>';
 904    const card=a=>`
 905      <div class="agent ${a.seated?'':'benched'}" style="border-left-color:${a.seated?a.c:'rgba(255,255,255,.15)'}">
 906        <div class="ahead"><span class="aname" style="color:${a.c}">${a.name} agent</span>${chip(a)}</div>
 907        <div class="adom">${a.domain}${a.seated?'':' · consulted, not seated'}</div>
 908        <div class="wbar"><i data-w="${a.rel}" style="background:${a.c}"></i></div>
 909        <div class="wmeta"><span>relevance to you ${a.rel}</span><span>confidence ${a.conf}</span></div>
 910        <p>${a.finding}</p>
 911        <div class="aconcern"><b>What it is watching for</b>${a.concern}</div>
 912      </div>`;
 913    return `
 914    <div class="card">
 915      <div class="tag">The council · how the reading was decided</div>
 916      <p class="muted" style="font-family:var(--sans);font-size:.9rem;line-height:1.7;margin-bottom:20px">
 917        Five specialists read you separately, then a router and a synthesiser decide what to do with them. Each one only knows its own domain, so each is allowed to
 918        reach a different conclusion — and the router decides which of them your particular answers
 919        actually give something to weigh.</p>
 920      <div class="aconcern" style="border-top:none;padding-top:0;margin-bottom:22px">
 921        <b>Router</b>${C.routerNote}</div>
 922      <div class="council">${C.reports.map(card).join('')}</div>
 923    </div>
 924  
 925    ${C.splits.length?`<div class="card warn">
 926      <div class="tag">Where they disagreed</div>
 927      ${C.splits.map(sp=>`<div class="split">
 928        <div class="vs">${sp.a.name}
 929          <span>WANTS</span> <em>${sp.a.lean?DOOR[sp.a.lean].n:'—'}</em>
 930          <span>·</span> ${sp.b.name}
 931          <span>WANTS</span> <em>${sp.b.lean?DOOR[sp.b.lean].n:'—'}</em></div>
 932        <p class="muted" style="font-size:.88rem;line-height:1.7">Neither is wrong. They are protecting
 933        different parts of you — ${sp.a.name.toLowerCase()} guards ${sp.a.id==='kinship'?'your place in the room':sp.a.id==='attachment'?'how safe you feel up close':sp.a.id==='mirror'?'the cost of the script you carry':sp.a.id==='regret'?'the sentence you will say at fifty':'your footing'}, ${sp.b.name.toLowerCase()} guards ${sp.b.id==='kinship'?'your place in the room':sp.b.id==='attachment'?'how safe you feel up close':sp.b.id==='mirror'?'the cost of the script you carry':sp.b.id==='regret'?'the sentence you will say at fifty':'your footing'}.</p>
 934      </div>`).join('')}
 935    </div>`:''}
 936  
 937    <div class="card ${C.dissent||C.vetoed?'warn':'good'}">
 938      <div class="tag">The synthesiser</div>
 939      ${C.councilTop?`<p class="muted" style="font-family:var(--sans);font-size:.86rem;margin-bottom:14px">
 940        Weighted vote of the seated agents: <em>${DOOR[C.councilTop].n} ${C.councilShare}%</em>
 941        &nbsp;·&nbsp; arithmetic engine: <em>${DOOR[C.engineTop].n}</em>
 942        &nbsp;·&nbsp; ${C.dissent?'<span style="color:var(--rose)">they disagree</span>':'they agree'}</p>`:''}
 943      <p>${C.note}</p>
 944    </div>`;
 945  }
 946  
 947  function finish(){
 948    el('chapmark').textContent='';
 949    el('prog').firstElementChild.style.width='100%';
 950    setMood('verdict'); braid=1; heart=1;
 951    const r=score(), top=r.rank[0], second=r.rank[1], f=failure(top), ask=theAsk(top);
 952    const T=S.T;
 953    const C=convene(r);
 954    const archived=saveRecord(r,f,C);
 955  
 956    const drivers=THREADS.filter(t=>['AUT','KIN','AMB','REG','PRS'].includes(t.k))
 957      .map(t=>({...t,v:T[t.k],dev:Math.abs(T[t.k]-50)}))
 958      .sort((a,b)=>b.dev-a.dev).slice(0,3);
 959  
 960    stage.innerHTML=`
 961    <div class="slow" style="padding-top:5vh">
 962      <div class="kicker" style="text-align:center">The Reading · ${S.name}</div>
 963      <div class="seal">
 964        <svg viewBox="0 0 120 120">
 965          <circle class="ring2" cx="60" cy="60" r="52"/>
 966          <circle class="ring" cx="60" cy="60" r="57"/>
 967          <text x="60" y="76" text-anchor="middle">${DOOR[top].g}</text>
 968        </svg>
 969      </div>
 970      <h2 style="text-align:center">Your door is<br><span style="color:var(--gold)">${DOOR[top].n}</span></h2>
 971      <p class="muted" style="margin-top:12px;text-align:center">${DOOR[top].s} &nbsp;·&nbsp; confidence: <em>${r.conf}</em></p>
 972      <div class="rule"></div>
 973      <p class="lead">${DOOR[top].line}</p>
 974  
 975      <div class="doors">
 976        ${r.rank.map(k=>`
 977          <div class="door ${k===top?'win':''}">
 978            <div class="dhead"><span class="dname">${DOOR[k].n}</span><span class="dpct">${Math.round(r.pct[k])}%</span></div>
 979            <div class="dbar"><i data-w="${r.pct[k]*1.9}" style="background:${DOOR[k].c}"></i></div>
 980            <div class="dsub">${DOOR[k].s}</div>
 981          </div>`).join('')}
 982      </div>
 983      ${r.conf==='Split'?`<div class="card warn"><div class="tag">Split result</div>
 984        <p>Your top two doors are within ${r.gap.toFixed(1)} points. That is not a measurement failure — it is the finding. You are genuinely two people on this question, and whichever door you take, the other one stays in the house with you. Read the failure mode below twice.</p></div>`:''}
 985  
 986      ${radar()}
 987  
 988      <div class="card">
 989        <div class="tag">The eight threads</div>
 990        <div class="tlist">
 991          ${THREADS.map(t=>`
 992            <div>
 993              <div class="trow">
 994                <span class="tname">${t.name}</span>
 995                <span class="tbar"><i data-w="${T[t.k]}" style="background:${t.c}"></i></span>
 996                <span class="tval">${Math.round(T[t.k])}</span>
 997              </div>
 998              <div class="tnote" style="margin:-4px 0 8px">${NOTE[t.k](T[t.k])}</div>
 999            </div>`).join('')}
1000        </div>
1001      </div>
1002  
1003      <div class="card">
1004        <div class="tag">Why</div>
1005        <p>Three threads decided this, in this order:</p>
1006        ${drivers.map(d=>`<p><em>${d.name} — ${Math.round(d.v)}.</em> ${NOTE[d.k](d.v)}</p>`).join('')}
1007        <p>Your runner-up is <em>${DOOR[second].n}</em>. That matters: under stress, people do not stay at their strongest door. They drift to their second.</p>
1008      </div>
1009  
1010      ${councilPanel(C)}
1011  
1012      <div class="card warn">
1013        <div class="tag">Your failure mode</div>
1014        <h3 style="margin-bottom:14px;color:var(--rose)">${f.n}</h3>
1015        ${f.p.map(p=>`<p>${p}</p>`).join('')}
1016      </div>
1017  
1018      <div class="card good">
1019        <div class="tag">Your ask — what to actually look for</div>
1020        ${ask.map(a=>`<p>${a}</p>`).join('')}
1021      </div>
1022  
1023      <div class="card">
1024        <div class="tag">The invoice</div>
1025        <p>Every door has a price. Yours:</p>
1026        <p><em>${INVOICE[top]}</em></p>
1027        <p class="muted" style="font-family:var(--sans);font-size:.88rem">A reading that only lists benefits is flattery. This one isn't.</p>
1028      </div>
1029  
1030      <div class="card ${T.RDY<45?'warn':'good'}">
1031        <div class="tag">Readiness — asked separately, on purpose</div>
1032        <p><em>${Math.round(T.RDY)} / 100.</em> ${NOTE.RDY(T.RDY)}</p>
1033        ${T.RDY<45?`<p>Readiness and path are different questions, and almost every tool in this space confuses them. You can be a textbook ${DOOR[top].n} temperament and be completely unready to marry anyone. That is where you are. It is not a flaw. It is a date on a calendar you have not reached.</p>`
1034        :`<p>Path tells you which door. Readiness tells you whether to walk through it this year. Yours says you can.</p>`}
1035      </div>
1036  
1037      ${T.PRS>40?`<div class="card">
1038        <div class="tag">The mirror — what it caught</div>
1039        <p>Across six scenarios, the average distance between <em>what you want</em> and <em>what you believe is expected of ${expectedOf()}</em> was <em>${Math.round(T.PRS/1.55)} points</em>.</p>
1040        <p>That gap is not an opinion about gender. It is a measurement of how much of your marriage decision is being made by someone who will not be at the wedding.</p>
1041        <p>The widest gap you carried: <em>"${S.mirrors.slice().sort((a,b)=>b.d-a.d)[0].t}"</em></p>
1042      </div>`:''}
1043  
1044      ${S.external?`<div class="card warn"><div class="tag">One more thing</div>
1045        <p>You said the choice would change if nobody were watching. Everything in this reading still holds — but read it knowing that the person who answered these questions was not entirely alone in the room.</p></div>`:''}
1046  
1047      <div class="foot">
1048        The two threads behind this page met tonight because you finished.<br>
1049        This is not a prediction. It is a structured mirror — it told you what you already told it,<br>
1050        arranged so you could finally see the shape.<br><br>
1051        ${archived?'<span style="opacity:.55">This reading was archived '+(cloudOn()?'to the central database':'on this device')+'. It appears in the admin dashboard.</span><br>':''}
1052        <span style="opacity:.6">Impulse · The Bridge · ${new Date().getFullYear()}</span>
1053      </div>
1054  
1055      <div class="acts">
1056        <button class="btn" onclick="window.print()">Save this reading</button>
1057        <button class="btn ghost" onclick="location.reload()">Begin again</button>
1058      </div>
1059      <div style="height:60px"></div>
1060    </div>`;
1061  
1062    setTimeout(()=>{
1063      document.querySelectorAll('.dbar i, .tbar i, .wbar i').forEach(n=>{
1064        n.style.width=Math.min(100,+n.dataset.w)+'%';
1065      });
1066    },260);
1067  }
1068  
1069  /* ── boot ────────────────────────────────────────────────────── */
1070  go(scrIntro);
1071  
```

---

### 8.4 · `admin.html` — stylesheet

Dashboard layout, KPI cards, charts, the sortable table, the drill-down drawer, and the login gate.

```css
  1  
  2  :root{
  3    --bg:#0a0611; --panel:#140c1d; --panel2:#1b1127;
  4    --ink:#f4ece6; --mut:#9c8794; --dim:#6d5b68;
  5    --gold:#d9a860; --rose:#e0577a; --ind:#9d86e8; --teal:#4f9c96; --wine:#7a2338;
  6    --line:rgba(255,255,255,.07);
  7    --serif:'Cormorant Garamond',Georgia,serif;
  8    --sans:'Inter',-apple-system,sans-serif;
  9  }
 10  *{box-sizing:border-box;margin:0;padding:0}
 11  body{background:
 12    radial-gradient(1000px 600px at 10% -10%, rgba(122,35,56,.18), transparent 60%),
 13    radial-gradient(800px 600px at 95% 105%, rgba(106,86,168,.16), transparent 60%),
 14    var(--bg);
 15    background-attachment:fixed;color:var(--ink);font-family:var(--sans);font-weight:300;
 16    min-height:100vh;-webkit-font-smoothing:antialiased}
 17  .wrap{max-width:1180px;margin:0 auto;padding:34px 24px 90px}
 18  
 19  header{display:flex;justify-content:space-between;align-items:flex-end;flex-wrap:wrap;gap:18px;margin-bottom:30px}
 20  h1{font-family:var(--serif);font-weight:300;font-size:2.4rem;line-height:1}
 21  h1 span{color:var(--gold)}
 22  .kicker{font-size:.62rem;letter-spacing:.4em;text-transform:uppercase;color:var(--gold);opacity:.7;margin-bottom:10px}
 23  .sub{color:var(--mut);font-size:.85rem;margin-top:8px}
 24  
 25  .tools{display:flex;gap:8px;flex-wrap:wrap}
 26  .btn{font-family:var(--sans);font-size:.68rem;letter-spacing:.16em;text-transform:uppercase;
 27    color:var(--gold);background:transparent;border:1px solid rgba(217,168,96,.35);
 28    padding:10px 16px;cursor:pointer;transition:.3s;border-radius:2px}
 29  .btn:hover{background:rgba(217,168,96,.1);border-color:var(--gold)}
 30  .btn.danger{color:var(--rose);border-color:rgba(224,87,122,.35)}
 31  .btn.danger:hover{background:rgba(224,87,122,.1);border-color:var(--rose)}
 32  .btn.ghost{color:var(--mut);border-color:var(--line)}
 33  
 34  .grid{display:grid;gap:14px}
 35  .kpis{grid-template-columns:repeat(auto-fit,minmax(160px,1fr));margin-bottom:14px}
 36  .kpi{background:var(--panel);border:1px solid var(--line);border-radius:4px;padding:18px 18px 16px}
 37  .kpi .l{font-size:.6rem;letter-spacing:.24em;text-transform:uppercase;color:var(--mut);margin-bottom:10px}
 38  .kpi .v{font-family:var(--serif);font-size:2.1rem;font-weight:300;line-height:1}
 39  .kpi .s{font-size:.7rem;color:var(--dim);margin-top:8px}
 40  .kpi.gold .v{color:var(--gold)} .kpi.rose .v{color:var(--rose)} .kpi.ind .v{color:var(--ind)} .kpi.teal .v{color:var(--teal)}
 41  
 42  .row2{grid-template-columns:1fr 1fr;margin-bottom:14px}
 43  .row3{grid-template-columns:1.2fr 1fr 1fr;margin-bottom:14px}
 44  @media(max-width:900px){.row2,.row3{grid-template-columns:1fr}}
 45  .card{background:var(--panel);border:1px solid var(--line);border-radius:4px;padding:22px}
 46  .card h3{font-family:var(--serif);font-weight:400;font-size:1.15rem;margin-bottom:4px}
 47  .card .hint{font-size:.7rem;color:var(--dim);margin-bottom:18px}
 48  
 49  /* charts */
 50  .hbar{margin-bottom:12px}
 51  .hbar .t{display:flex;justify-content:space-between;font-size:.74rem;color:var(--mut);margin-bottom:6px}
 52  .hbar .t b{color:var(--ink);font-weight:400}
 53  .hbar .bar{height:6px;background:rgba(255,255,255,.06);border-radius:4px;overflow:hidden}
 54  .hbar .bar i{display:block;height:100%;border-radius:4px;transition:width .9s cubic-bezier(.2,.7,.2,1)}
 55  .legend{display:flex;gap:16px;flex-wrap:wrap;margin-top:14px;font-size:.7rem;color:var(--mut)}
 56  .legend i{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:6px;vertical-align:-1px}
 57  
 58  /* table */
 59  .tablecard{padding:0;overflow:hidden}
 60  .tablehead{display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap;padding:20px 22px 14px}
 61  input.search{background:var(--panel2);border:1px solid var(--line);color:var(--ink);
 62    font-family:var(--sans);font-size:.82rem;padding:9px 14px;border-radius:3px;outline:none;width:220px}
 63  input.search:focus{border-color:rgba(217,168,96,.5)}
 64  select{background:var(--panel2);border:1px solid var(--line);color:var(--mut);font-size:.78rem;
 65    padding:9px 10px;border-radius:3px;outline:none}
 66  table{width:100%;border-collapse:collapse;font-size:.82rem}
 67  th{font-size:.6rem;letter-spacing:.2em;text-transform:uppercase;color:var(--dim);font-weight:500;
 68    text-align:left;padding:12px 14px;border-top:1px solid var(--line);border-bottom:1px solid var(--line);
 69    cursor:pointer;user-select:none;white-space:nowrap}
 70  th:hover{color:var(--gold)}
 71  td{padding:12px 14px;border-bottom:1px solid rgba(255,255,255,.04);vertical-align:middle}
 72  tr.datarow{cursor:pointer;transition:.2s}
 73  tr.datarow:hover{background:rgba(217,168,96,.05)}
 74  .pill{display:inline-block;font-size:.66rem;letter-spacing:.06em;padding:4px 11px;border-radius:20px;white-space:nowrap}
 75  .p-love{background:rgba(224,87,122,.14);color:#f0899f;border:1px solid rgba(224,87,122,.3)}
 76  .p-arranged{background:rgba(157,134,232,.13);color:#b6a5ef;border:1px solid rgba(157,134,232,.3)}
 77  .p-bridge{background:rgba(217,168,96,.13);color:#e5bf7f;border:1px solid rgba(217,168,96,.3)}
 78  .p-conf{background:rgba(255,255,255,.05);color:var(--mut);border:1px solid var(--line)}
 79  .p-warn{background:rgba(224,87,122,.1);color:#e58ba0;border:1px solid rgba(224,87,122,.25)}
 80  .mini{display:inline-flex;gap:2px;align-items:flex-end;height:20px}
 81  .mini i{width:4px;border-radius:1px;display:block}
 82  .num{font-family:var(--serif);font-size:1.05rem}
 83  
 84  /* detail drawer */
 85  .drawer{background:var(--panel2);border-top:1px solid rgba(217,168,96,.2);padding:26px 24px}
 86  .drawer h4{font-family:var(--serif);font-weight:400;font-size:1.3rem;margin-bottom:4px}
 87  .drawer .meta{font-size:.72rem;color:var(--dim);margin-bottom:20px}
 88  .dgrid{display:grid;grid-template-columns:1fr 1fr;gap:20px}
 89  @media(max-width:900px){.dgrid{grid-template-columns:1fr}}
 90  .dsec{background:rgba(0,0,0,.25);border:1px solid var(--line);border-radius:4px;padding:18px}
 91  .dsec .tg{font-size:.6rem;letter-spacing:.26em;text-transform:uppercase;color:var(--gold);opacity:.75;margin-bottom:14px}
 92  .explain{width:100%;border-collapse:collapse;font-size:.76rem}
 93  .explain th{font-size:.58rem;padding:7px 8px;cursor:default;border-top:none}
 94  .explain th:hover{color:var(--dim)}
 95  .explain td{padding:7px 8px;border-bottom:1px solid rgba(255,255,255,.04)}
 96  .explain .tot td{border-top:1px solid rgba(217,168,96,.3);color:var(--gold);font-weight:400}
 97  .explain .neg{color:var(--rose)}
 98  .ansrow{padding:8px 0;border-bottom:1px solid rgba(255,255,255,.04);font-size:.78rem;line-height:1.5}
 99  .ansrow .q{color:var(--dim)}
100  .ansrow .a{color:var(--ink)}
101  .mrow{display:flex;justify-content:space-between;gap:10px;padding:7px 0;font-size:.76rem;
102    border-bottom:1px solid rgba(255,255,255,.04);color:var(--mut)}
103  .mrow b{font-family:var(--serif);font-size:.95rem;color:var(--gold);font-weight:400;flex:0 0 auto}
104  
105  .empty{padding:70px 30px;text-align:center;color:var(--dim)}
106  .empty h3{font-family:var(--serif);font-weight:300;font-size:1.6rem;color:var(--mut);margin-bottom:12px}
107  .footer{margin-top:40px;text-align:center;color:var(--dim);font-size:.7rem;line-height:1.9}
108  .donutwrap{display:flex;align-items:center;gap:24px;flex-wrap:wrap}
109  
110  
111  /* ── council panel ─────────────────────────────── */
112  .ag{padding:11px 0;border-bottom:1px solid rgba(255,255,255,.045)}
113  .ag:last-child{border:none}
114  .ag .agh{display:flex;justify-content:space-between;align-items:baseline;gap:10px;flex-wrap:wrap}
115  .ag .agn{font-size:.82rem;color:var(--ink)}
116  .ag.off .agn{color:var(--dim)}
117  .ag .agf{font-size:.72rem;color:var(--mut);line-height:1.6;margin-top:6px}
118  .ag .agbar{height:2px;background:rgba(255,255,255,.07);border-radius:2px;overflow:hidden;margin-top:7px}
119  .ag .agbar i{display:block;height:100%;border-radius:2px}
120  .lean{display:inline-block;font-size:.6rem;letter-spacing:.08em;padding:3px 9px;border-radius:20px;white-space:nowrap}
121  .lean-love{background:rgba(224,87,122,.14);color:#f0899f;border:1px solid rgba(224,87,122,.3)}
122  .lean-arranged{background:rgba(157,134,232,.13);color:#b6a5ef;border:1px solid rgba(157,134,232,.3)}
123  .lean-bridge{background:rgba(217,168,96,.13);color:#e5bf7f;border:1px solid rgba(217,168,96,.3)}
124  .lean-none{background:rgba(255,255,255,.05);color:var(--dim);border:1px solid rgba(255,255,255,.1)}
125  .lean-veto{background:rgba(224,87,122,.2);color:#ff9db0;border:1px solid rgba(224,87,122,.45)}
126  .cnote{font-size:.74rem;color:var(--mut);line-height:1.7;margin-top:12px;padding-top:12px;
127    border-top:1px solid rgba(255,255,255,.055)}
128  .dissent{color:var(--rose)}
129  
130  /* ── login gate ────────────────────────────────── */
131  #gate{position:fixed;inset:0;z-index:200;display:flex;align-items:center;justify-content:center;
132    padding:24px;background:
133     radial-gradient(900px 600px at 20% -10%, rgba(122,35,56,.28), transparent 60%),
134     radial-gradient(800px 600px at 90% 110%, rgba(106,86,168,.24), transparent 60%),
135     var(--bg)}
136  #gate .box{width:100%;max-width:390px;background:rgba(20,12,29,.72);border:1px solid var(--line);
137    border-radius:5px;padding:38px 34px;backdrop-filter:blur(8px);
138    box-shadow:0 40px 90px -50px rgba(0,0,0,.9);animation:gateIn .8s cubic-bezier(.2,.7,.2,1) both}
139  @keyframes gateIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
140  #gate .k{font-size:.6rem;letter-spacing:.4em;text-transform:uppercase;color:var(--gold);opacity:.72;margin-bottom:14px}
141  #gate h2{font-family:var(--serif);font-weight:300;font-size:1.95rem;line-height:1.1;margin-bottom:8px}
142  #gate h2 span{color:var(--gold)}
143  #gate .sub2{font-size:.78rem;color:var(--mut);line-height:1.6;margin-bottom:26px}
144  #gate label{display:block;font-size:.58rem;letter-spacing:.28em;text-transform:uppercase;
145    color:var(--gold);opacity:.7;margin-bottom:9px}
146  #gate input{width:100%;background:transparent;border:none;border-bottom:1px solid rgba(255,255,255,.16);
147    color:var(--ink);font-family:var(--serif);font-size:1.2rem;font-weight:300;padding:8px 0;
148    outline:none;transition:.3s;margin-bottom:24px}
149  #gate input:focus{border-bottom-color:var(--gold)}
150  #gate .btn{width:100%;padding:15px;margin-top:4px}
151  #gate .err{color:var(--rose);font-size:.78rem;margin-top:16px;min-height:18px;line-height:1.5}
152  #gate .note{margin-top:24px;padding-top:18px;border-top:1px solid rgba(255,255,255,.06);
153    font-size:.66rem;color:var(--dim);line-height:1.7}
154  .wrap{display:none}
155  .wrap.on{display:block}
156  
```

---

### 8.5 · `admin.html` — application logic

Firebase Auth sign-in, token-authenticated Firestore reads, cloud/local merge and de-duplication, the independent re-implementation of the scoring arithmetic used for the per-user explanation, and all rendering.

```js
  1  
  2  /* ═════════════════════════════════════════════════════════════
  3     THE BRIDGE — ADMIN
  4     Reads the archive the game writes, and explains — term by
  5     term — how the engine produced every user's scores.
  6     ═════════════════════════════════════════════════════════════ */
  7  const STORE_KEY='bridge_records_v1';
  8  
  9  /* ── cloud database (Firestore REST) — same project as index.html ──
 10     Reads require a Firebase Auth ID token; the security rules only
 11     accept the admin UID, so the archive cannot be read by anyone else. */
 12  const CLOUD={projectId:'impulse-e6a58',apiKey:'AIzaSyDAc0qT3UBcOvzQbSNbyg79wpRiTTTfldU'};
 13  const cloudOn=()=>!!(CLOUD.projectId&&CLOUD.apiKey);
 14  let cloudRecs=[], cloudStatus=null, idToken=null;
 15  
 16  async function fetchCloud(){
 17    if(!cloudOn()){cloudStatus='not configured';return;}
 18    if(!idToken){cloudStatus='not signed in';return;}
 19    cloudStatus='connecting\u2026';
 20    try{
 21      let out=[],token='';
 22      do{
 23        const u='https://firestore.googleapis.com/v1/projects/'+CLOUD.projectId+
 24          '/databases/(default)/documents/readings?pageSize=300'+(token?'&pageToken='+token:'');
 25        const r=await fetch(u,{headers:{'Authorization':'Bearer '+idToken}});
 26        const j=await r.json();
 27        if(j.error) throw j.error;
 28        (j.documents||[]).forEach(d=>{try{out.push(JSON.parse(d.fields.json.stringValue))}catch(e){}});
 29        token=j.nextPageToken||'';
 30      }while(token);
 31      cloudRecs=out; cloudStatus='connected \u00b7 '+out.length+' cloud record'+(out.length===1?'':'s');
 32    }catch(e){
 33      cloudStatus=(e&&e.status==='PERMISSION_DENIED')?'access denied by database rules':'error \u2014 could not reach the database';
 34    }
 35  }
 36  const validRec=r=>r&&r.id&&r.T&&r.pct&&Array.isArray(r.rank)&&r.rank.length===3;
 37  function allRecords(){
 38    const m=new Map();
 39    cloudRecs.concat(load()).forEach(r=>{if(validRec(r)&&!m.has(r.id))m.set(r.id,r);});
 40    return [...m.values()].sort((a,b)=>a.ts<b.ts?-1:1);
 41  }
 42  function refreshCloud(){fetchCloud().then(render);}
 43  const clamp=(v,a=0,b=100)=>Math.max(a,Math.min(b,v));
 44  
 45  const THREADS=[
 46    {k:'AUT',name:'Self-Authorship',c:'#d9a860'},
 47    {k:'KIN',name:'Kinship Pull',c:'#e0577a'},
 48    {k:'ANX',name:'Anxious Wiring',c:'#c96f4a'},
 49    {k:'AVO',name:'Avoidant Wiring',c:'#5f7fb8'},
 50    {k:'AMB',name:'Ambiguity Tolerance',c:'#4f9c96'},
 51    {k:'REG',name:'Regret of Inaction',c:'#9d86e8'},
 52    {k:'PRS',name:'Inherited Pressure',c:'#b8556e'},
 53    {k:'RDY',name:'Readiness',c:'#cbb27a'}
 54  ];
 55  const DOORC={love:'#e0577a',arranged:'#9d86e8',bridge:'#d9a860'};
 56  const DOORN={love:'The Chosen',arranged:'The Given',bridge:'The Bridge'};
 57  const DOORS={love:'Love marriage',arranged:'Arranged marriage',bridge:'Assisted / hybrid'};
 58  
 59  /* ── the exact engine, mirrored, decomposed for explanation ── */
 60  function explain(T){
 61    const SEC  = clamp(100 - Math.max(T.ANX,T.AVO) + 8);
 62    const SECL = clamp(100 - (0.65*T.AVO + 0.45*T.ANX));
 63    const rows={
 64      love:[
 65        ['Self-Authorship ×.30',        .30*T.AUT],
 66        ['Ambiguity Tolerance ×.20',    .20*T.AMB],
 67        ['Regret of Inaction ×.20',     .20*T.REG],
 68        ['Freedom from Kin ×.15',       .15*(100-T.KIN)],
 69        ['Security (love-weighted) ×.15',.15*SECL],
 70        ['Inherited-pressure tax −.14', -(0.14*T.PRS)]
 71      ],
 72      arranged:[
 73        ['Kinship Pull ×.30',           .30*T.KIN],
 74        ['Comfort in Certainty ×.20',   .20*(100-T.AMB)],
 75        ['Action-regret leaning ×.20',  .20*(100-T.REG)],
 76        ['Ease with Guidance ×.15',     .15*(100-T.AUT)],
 77        ['Security ×.15',               .15*SEC]
 78      ],
 79      bridge:[
 80        ['Both needs held (min AUT,KIN) ×.45', .45*Math.min(T.AUT,T.KIN)],
 81        ['Balance of the two ×.25',     .25*(100-Math.abs(T.AUT-T.KIN))],
 82        ['Ambiguity Tolerance ×.15',    .15*T.AMB],
 83        ['Security ×.15',               .15*SEC],
 84        ['Inherited-pressure tax −.05', -(0.05*T.PRS)]
 85      ]
 86    };
 87    const raw={};
 88    for(const d in rows) raw[d]=rows[d].reduce((s,r)=>s+r[1],0);
 89    const sum=raw.love+raw.arranged+raw.bridge;
 90    const pct={love:raw.love/sum*100,arranged:raw.arranged/sum*100,bridge:raw.bridge/sum*100};
 91    return {rows,raw,pct,SEC,SECL};
 92  }
 93  
 94  /* ── storage ── */
 95  const load=()=>{try{return JSON.parse(localStorage.getItem(STORE_KEY)||'[]')}catch(e){return[]}};
 96  const save=d=>localStorage.setItem(STORE_KEY,JSON.stringify(d));
 97  
 98  function exportJSON(){
 99    const blob=new Blob([JSON.stringify(allRecords(),null,2)],{type:'application/json'});
100    const a=document.createElement('a');
101    a.href=URL.createObjectURL(blob);
102    a.download='bridge-archive-'+new Date().toISOString().slice(0,10)+'.json';
103    a.click();
104  }
105  function importJSON(ev){
106    const f=ev.target.files[0]; if(!f)return;
107    const r=new FileReader();
108    r.onload=()=>{try{
109      const inc=JSON.parse(r.result);
110      if(!Array.isArray(inc)) throw 0;
111      const cur=load(), ids=new Set(cur.map(x=>x.id));
112      inc.forEach(x=>{if(x&&x.id&&!ids.has(x.id))cur.push(x);});
113      save(cur); render();
114    }catch(e){alert('Not a valid archive file.')}};
115    r.readAsText(f);
116  }
117  function clearAll(){
118    if(confirm('Delete every locally archived reading on this device? (Cloud records are kept.) Export first if you need them.')){
119      localStorage.removeItem(STORE_KEY); render();
120    }
121  }
122  
123  /* ── demo seed (14 plausible profiles, scored by the real engine) ── */
124  function seedDemo(){
125    const names=[['Ayesha','A woman','22–26'],['Rohan','A man','27–31'],['Fatima','A woman','22–26'],
126     ['Daniyal','A man','22–26'],['Meera','A woman','27–31'],['Omar','A man','32–37'],
127     ['Zara','A woman','Under 22'],['Arjun','A man','27–31'],['Noor','Neither / other','22–26'],
128     ['Imran','A man','38+'],['Priya','A woman','27–31'],['Hassan','A man','22–26'],
129     ['Sana','A woman','32–37'],['Kabir','A man','Under 22']];
130    const R=(a,b)=>Math.round(a+Math.random()*(b-a));
131    const cur=load();
132    names.forEach((n,i)=>{
133      const archetype=i%4;
134      let T;
135      if(archetype===0)      T={AUT:R(68,92),KIN:R(15,40),ANX:R(45,80),AVO:R(30,60),AMB:R(55,80),REG:R(60,88),PRS:R(10,40),RDY:R(40,75)};
136      else if(archetype===1) T={AUT:R(20,45),KIN:R(65,95),ANX:R(15,45),AVO:R(15,45),AMB:R(15,45),REG:R(15,45),PRS:R(5,30),RDY:R(55,90)};
137      else if(archetype===2) T={AUT:R(55,75),KIN:R(55,80),ANX:R(30,60),AVO:R(25,55),AMB:R(45,70),REG:R(40,65),PRS:R(20,55),RDY:R(45,80)};
138      else                   T={AUT:R(40,70),KIN:R(40,75),ANX:R(40,80),AVO:R(55,90),AMB:R(25,55),REG:R(35,65),PRS:R(45,85),RDY:R(15,44)};
139      const ex=explain(T);
140      const rank=Object.keys(ex.pct).sort((a,b)=>ex.pct[b]-ex.pct[a]);
141      const gap=ex.pct[rank[0]]-ex.pct[rank[1]];
142      const conf=gap>14?'Clear':gap>6?'Leaning':'Split';
143      const coh=R(35,95);
144      let fail='The drift';
145      if(T.RDY<45)fail='Neither door yet';
146      else if(coh<50)fail='The unnamed fight';
147      else if(rank[0]==='love'&&T.ANX>60)fail='Disillusionment through intensity';
148      else if(rank[0]==='love'&&T.PRS>35)fail='The price you did not read';
149      else if(rank[0]==='arranged'&&T.AUT>60)fail='The quiet resignation';
150      else if(rank[0]==='arranged'&&T.AVO>60)fail='Two polite strangers';
151      else if(rank[0]==='bridge'&&T.AMB<40)fail='Paralysis at the bridge';
152      cur.push({
153        id:'demo'+Date.now().toString(36)+i, ts:new Date(Date.now()-R(0,45)*864e5).toISOString(),
154        name:n[0],gender:n[1],age:n[2],familyVolume:R(20,90),
155        T,coh,external:Math.random()<.2,
156        pct:{love:+ex.pct.love.toFixed(2),arranged:+ex.pct.arranged.toFixed(2),bridge:+ex.pct.bridge.toFixed(2)},
157        rank,gap:+gap.toFixed(2),conf,fail,
158        mirrors:[{t:'Who moves first?',a:R(10,90),b:R(10,90)},{t:'Who packs?',a:R(10,90),b:R(10,90)},
159                 {t:'Money asymmetry',a:R(10,90),b:R(10,90)},{t:'Feeling in a fight',a:R(10,90),b:R(10,90)},
160                 {t:'The clock',a:R(10,90),b:R(10,90)},{t:'Whose parents',a:R(10,90),b:R(10,90)}]
161          .map(m=>({...m,d:Math.abs(m.a-m.b)})),
162        answers:[{q:'(demo record — answers not captured)',a:'—'}]
163      });
164    });
165    save(cur); render();
166  }
167  
168  /* ── ui state ── */
169  let sortKey='ts', sortDir=-1, filterDoor='all', search='', openId=null;
170  
171  const fmtD=ts=>new Date(ts).toLocaleDateString(undefined,{day:'numeric',month:'short',year:'2-digit'});
172  const avg=(arr,f)=>arr.length? arr.reduce((s,x)=>s+f(x),0)/arr.length : 0;
173  
174  function kpis(recs){
175    const withCouncil=recs.filter(r=>r.council);
176    const withC=withCouncil.length;
177    const dissents=withCouncil.filter(r=>r.council.dissent||r.council.vetoed).length;
178    const doors={love:0,arranged:0,bridge:0};
179    recs.forEach(r=>doors[r.rank[0]]++);
180    const splitN=recs.filter(r=>r.conf==='Split').length;
181    const unready=recs.filter(r=>r.T.RDY<45).length;
182    return `
183    <div class="grid kpis">
184      <div class="kpi gold"><div class="l">Total readings</div><div class="v">${recs.length}</div>
185        <div class="s">${splitN} split verdicts</div></div>
186      <div class="kpi rose"><div class="l">The Chosen</div><div class="v">${doors.love}</div><div class="s">love marriage</div></div>
187      <div class="kpi ind"><div class="l">The Given</div><div class="v">${doors.arranged}</div><div class="s">arranged marriage</div></div>
188      <div class="kpi gold"><div class="l">The Bridge</div><div class="v">${doors.bridge}</div><div class="s">assisted / hybrid</div></div>
189      <div class="kpi teal"><div class="l">Avg readiness</div><div class="v">${Math.round(avg(recs,r=>r.T.RDY))}</div>
190        <div class="s">${unready} below the gate (45)</div></div>
191      <div class="kpi rose"><div class="l">Avg inherited pressure</div><div class="v">${Math.round(avg(recs,r=>r.T.PRS))}</div>
192        <div class="s">mirror gap, scaled</div></div>
193      <div class="kpi ind"><div class="l">Council dissent</div><div class="v">${withC?Math.round(dissents/withC*100)+'%':'\u2014'}</div>
194        <div class="s">${withC?dissents+' of '+withC+' readings':'no council data yet'}</div></div>
195    </div>`;
196  }
197  
198  function hbar(label,val,max,color,extra=''){
199    return `<div class="hbar"><div class="t"><span>${label}</span><b>${extra||Math.round(val)}</b></div>
200      <div class="bar"><i style="width:${max?val/max*100:0}%;background:${color}"></i></div></div>`;
201  }
202  
203  function donut(recs){
204    const doors={love:0,arranged:0,bridge:0};
205    recs.forEach(r=>doors[r.rank[0]]++);
206    const total=recs.length||1;
207    let acc=0, segs='';
208    ['love','arranged','bridge'].forEach(d=>{
209      const frac=doors[d]/total, C=2*Math.PI*54;
210      segs+=`<circle r="54" cx="70" cy="70" fill="none" stroke="${DOORC[d]}" stroke-width="14"
211        stroke-dasharray="${frac*C} ${C}" stroke-dashoffset="${-acc*C}"
212        transform="rotate(-90 70 70)" opacity=".9"/>`;
213      acc+=frac;
214    });
215    return `<div class="donutwrap">
216      <svg width="140" height="140" viewBox="0 0 140 140">
217        <circle r="54" cx="70" cy="70" fill="none" stroke="rgba(255,255,255,.06)" stroke-width="14"/>
218        ${segs}
219        <text x="70" y="66" text-anchor="middle" fill="#f4ece6" font-family="Cormorant Garamond" font-size="26">${recs.length}</text>
220        <text x="70" y="84" text-anchor="middle" fill="#6d5b68" font-size="8" letter-spacing="2">READINGS</text>
221      </svg>
222      <div style="flex:1;min-width:180px">
223        ${['love','arranged','bridge'].map(d=>hbar(DOORN[d]+' · '+DOORS[d],doors[d],total,DOORC[d],doors[d]+' ('+Math.round(doors[d]/total*100)+'%)')).join('')}
224      </div>
225    </div>`;
226  }
227  
228  function threadChart(recs){
229    const men=recs.filter(r=>r.gender==='A man'), women=recs.filter(r=>r.gender==='A woman');
230    return THREADS.map(t=>{
231      const all=avg(recs,r=>r.T[t.k]), m=avg(men,r=>r.T[t.k]), w=avg(women,r=>r.T[t.k]);
232      return `<div class="hbar">
233        <div class="t"><span style="color:${t.c}">${t.name}</span>
234          <b>${Math.round(all)}${(men.length&&women.length)?` <span style="color:var(--dim);font-weight:300">· M ${Math.round(m)} / W ${Math.round(w)}</span>`:''}</b></div>
235        <div class="bar"><i style="width:${all}%;background:${t.c}"></i></div>
236      </div>`;
237    }).join('');
238  }
239  
240  function readinessHist(recs){
241    const bins=[0,0,0,0,0];
242    recs.forEach(r=>bins[Math.min(4,Math.floor(r.T.RDY/20))]++);
243    const mx=Math.max(...bins,1);
244    const labels=['0–19','20–39','40–59','60–79','80–100'];
245    return bins.map((b,i)=>hbar('Readiness '+labels[i],b,mx,i<3?'#e0577a':'#4f9c96',b+'')).join('')
246     + `<div class="legend"><span><i style="background:#e0577a"></i>below / near the gate</span><span><i style="background:#4f9c96"></i>ready band</span></div>`;
247  }
248  
249  function miniThreads(T){
250    return `<span class="mini">${THREADS.map(t=>
251      `<i style="height:${Math.max(2,T[t.k]/100*20)}px;background:${t.c}" title="${t.name}: ${Math.round(T[t.k])}"></i>`).join('')}</span>`;
252  }
253  
254  function explainTable(rec){
255    const ex=explain(rec.T);
256    return `<table class="explain">
257      <tr><th>Component of the score</th><th style="text-align:right">Points</th></tr>
258      ${['love','arranged','bridge'].map(d=>`
259        <tr><td colspan="2" style="padding-top:12px;color:${DOORC[d]};font-size:.66rem;letter-spacing:.2em;text-transform:uppercase">${DOORN[d]}</td></tr>
260        ${ex.rows[d].map(r=>`<tr><td style="color:var(--mut)">${r[0]}</td>
261          <td style="text-align:right" class="${r[1]<0?'neg':''}">${r[1]>=0?'+':''}${r[1].toFixed(1)}</td></tr>`).join('')}
262        <tr class="tot"><td>Raw total → normalised share</td>
263          <td style="text-align:right">${ex.raw[d].toFixed(1)} → ${ex.pct[d].toFixed(1)}%</td></tr>`).join('')}
264    </table>
265    <p style="font-size:.7rem;color:var(--dim);margin-top:12px;line-height:1.7">
266    The three raw totals are normalised to shares summing to 100%. The verdict is the highest share; confidence
267    comes from the gap to the runner-up (&gt;14 Clear, 6–14 Leaning, &lt;6 Split). Security terms:
268    SEC ${ex.SEC.toFixed(0)} (general), SEC<sub>L</sub> ${ex.SECL.toFixed(0)} (avoidance-weighted, used by The Chosen).
269    Recorded shares from the live session: ${rec.pct.love}% / ${rec.pct.arranged}% / ${rec.pct.bridge}%.</p>`;
270  }
271  
272  
273  const AGC={attachment:'#5f7fb8',kinship:'#e0577a',mirror:'#b8556e',regret:'#9d86e8',readiness:'#cbb27a'};
274  function councilBlock(rec){
275    const C=rec.council;
276    if(!C) return `<div class="dsec"><div class="tg">Council</div>
277      <div style="font-size:.74rem;color:var(--dim);line-height:1.7">
278      This reading was recorded before the council was added, so no agent breakdown exists for it.
279      Readings taken from now on include one.</div></div>`;
280    const chip=a=>a.veto?'<span class="lean lean-veto">VETO</span>'
281      :a.lean?`<span class="lean lean-${a.lean}">${DOORN[a.lean]}</span>`
282      :'<span class="lean lean-none">abstained</span>';
283    return `<div class="dsec">
284      <div class="tg">Council \u2014 how the verdict was argued</div>
285      ${(C.agents||[]).map(a=>`
286        <div class="ag ${a.seated?'':'off'}">
287          <div class="agh">
288            <span class="agn">${a.name}${a.seated?'':' <span style="color:var(--dim);font-size:.66rem">\u00b7 not seated</span>'}</span>
289            ${chip(a)}
290          </div>
291          <div class="agbar"><i style="width:${a.rel}%;background:${a.seated?(AGC[a.id]||'#d9a860'):'rgba(255,255,255,.15)'}"></i></div>
292          <div class="agf">relevance ${a.rel} \u00b7 confidence ${a.conf}</div>
293        </div>`).join('')}
294      ${(C.splits&&C.splits.length)?`<div class="cnote"><b style="color:var(--rose)">Disagreements:</b> ${
295        C.splits.map(sp=>`${sp.a} wanted ${sp.aLean?DOORN[sp.aLean]:'\u2014'} vs ${sp.b} wanted ${sp.bLean?DOORN[sp.bLean]:'\u2014'}`).join(' \u00b7 ')}</div>`:''}
296      <div class="cnote">
297        <b>Council vote:</b> ${C.councilTop?DOORN[C.councilTop]+' '+C.councilShare+'%':'abstained'}
298        &nbsp;\u00b7&nbsp; <b>Arithmetic:</b> ${DOORN[rec.rank[0]]}
299        &nbsp;\u00b7&nbsp; ${C.vetoed?'<span class="dissent">readiness veto applied</span>'
300          :C.dissent?'<span class="dissent">council dissented</span>':'agreed'}
301      </div>
302      <div class="cnote" style="color:var(--dim)"><b>Router:</b> ${C.routerNote||''}</div>
303    </div>`;
304  }
305  
306  function drawer(rec){
307    const win=rec.rank[0];
308    const worst=(rec.mirrors||[]).slice().sort((a,b)=>b.d-a.d)[0];
309    return `<tr><td colspan="8" style="padding:0"><div class="drawer">
310      <h4>${rec.name} — <span style="color:${DOORC[win]}">${DOORN[win]}</span> (${rec.pct[win].toFixed(1)}%, ${rec.conf})</h4>
311      <div class="meta">${rec.gender} · ${rec.age} · played ${fmtD(rec.ts)} · family volume ${rec.familyVolume}/100 ·
312        coherence ${rec.coh}${rec.external?' · <span style="color:var(--rose)">flagged: choice changes if unobserved</span>':''}</div>
313      <div class="dgrid">
314        <div>
315          <div class="dsec" style="margin-bottom:16px">
316            <div class="tg">The eight threads</div>
317            ${THREADS.map(t=>hbar(t.name,rec.T[t.k],100,t.c)).join('')}
318          </div>
319          <div class="dsec" style="margin-bottom:16px">
320            <div class="tg">Doors</div>
321            ${rec.rank.map(d=>hbar(DOORN[d],rec.pct[d],100,DOORC[d],rec.pct[d].toFixed(1)+'%')).join('')}
322            <div style="font-size:.74rem;color:var(--mut);margin-top:10px">Failure mode: <span style="color:var(--rose)">${rec.fail}</span> · gap to runner-up ${rec.gap} pts</div>
323          </div>
324          <div style="margin-bottom:16px">${councilBlock(rec)}</div>
325          <div class="dsec">
326            <div class="tg">Mirror gaps (want vs expected)</div>
327            ${(rec.mirrors||[]).map(m=>`<div class="mrow"><span>${m.t}</span><b>Δ ${m.d}</b></div>`).join('')}
328            ${worst?`<div style="font-size:.7rem;color:var(--dim);margin-top:10px">Widest gap: "${worst.t}" — the loudest inherited script this user carries.</div>`:''}
329          </div>
330        </div>
331        <div>
332          <div class="dsec" style="margin-bottom:16px">
333            <div class="tg">How the AI scored it — full arithmetic</div>
334            ${explainTable(rec)}
335          </div>
336          <div class="dsec">
337            <div class="tg">Answers given (${(rec.answers||[]).length})</div>
338            <div style="max-height:260px;overflow:auto">
339            ${(rec.answers||[]).map(a=>`<div class="ansrow"><div class="q">${a.q}</div><div class="a">→ ${a.a}</div></div>`).join('')}
340            </div>
341          </div>
342        </div>
343      </div>
344    </div></td></tr>`;
345  }
346  
347  function tableCard(recs){
348    let rows=recs.filter(r=>{
349      if(filterDoor!=='all'&&r.rank[0]!==filterDoor)return false;
350      if(search&&!(r.name||'').toLowerCase().includes(search.toLowerCase()))return false;
351      return true;
352    });
353    const val=r=>{
354      switch(sortKey){
355        case 'name':return (r.name||'').toLowerCase();
356        case 'door':return r.rank[0];
357        case 'score':return r.pct[r.rank[0]];
358        case 'rdy':return r.T.RDY;
359        case 'prs':return r.T.PRS;
360        default:return r.ts;
361      }};
362    rows.sort((a,b)=>val(a)>val(b)?sortDir:-sortDir);
363  
364    const th=(k,l)=>`<th onclick="setSort('${k}')">${l}${sortKey===k?(sortDir>0?' ↑':' ↓'):''}</th>`;
365    return `<div class="card tablecard">
366      <div class="tablehead">
367        <h3>Users · ${rows.length} shown</h3>
368        <div style="display:flex;gap:10px;flex-wrap:wrap">
369          <input class="search" placeholder="search name…" value="${search}" oninput="search=this.value;render()">
370          <select onchange="filterDoor=this.value;render()">
371            <option value="all" ${filterDoor==='all'?'selected':''}>All doors</option>
372            <option value="love" ${filterDoor==='love'?'selected':''}>The Chosen</option>
373            <option value="arranged" ${filterDoor==='arranged'?'selected':''}>The Given</option>
374            <option value="bridge" ${filterDoor==='bridge'?'selected':''}>The Bridge</option>
375          </select>
376        </div>
377      </div>
378      <div style="overflow:auto">
379      <table>
380        <tr>${th('name','User')}${th('ts','Date')}<th style="cursor:default">Profile</th>${th('door','Predicted door')}${th('score','Score')}<th style="cursor:default">Confidence</th>${th('rdy','RDY')}${th('prs','PRS')}</tr>
381        ${rows.map(r=>{
382          const win=r.rank[0];
383          return `<tr class="datarow" onclick="toggle('${r.id}')">
384            <td><b style="font-weight:500">${r.name||'—'}</b><div style="font-size:.68rem;color:var(--dim)">${r.gender||''} · ${r.age||''}</div></td>
385            <td style="color:var(--mut)">${fmtD(r.ts)}</td>
386            <td>${miniThreads(r.T)}</td>
387            <td><span class="pill p-${win}">${DOORN[win]}</span></td>
388            <td class="num">${r.pct[win].toFixed(1)}%</td>
389            <td><span class="pill ${r.conf==='Split'?'p-warn':'p-conf'}">${r.conf}</span></td>
390            <td class="num" style="color:${r.T.RDY<45?'var(--rose)':'var(--teal)'}">${Math.round(r.T.RDY)}</td>
391            <td class="num" style="color:${r.T.PRS>45?'var(--rose)':'var(--mut)'}">${Math.round(r.T.PRS)}</td>
392          </tr>${openId===r.id?drawer(r):''}`;
393        }).join('')}
394      </table></div>
395    </div>`;
396  }
397  
398  function setSort(k){ if(sortKey===k)sortDir*=-1; else{sortKey=k;sortDir=-1;} render(); }
399  function toggle(id){ openId=openId===id?null:id; render(); }
400  
401  function render(){
402    const recs=allRecords();
403    document.getElementById('subline').textContent =
404      (recs.length? `${recs.length} archived readings · last ${fmtD(recs[recs.length-1].ts)}` : 'no readings archived yet') + (cloudStatus?` · cloud: ${cloudStatus}`:'');
405    const app=document.getElementById('app');
406    if(!recs.length){
407      app.innerHTML=`<div class="card empty">
408        <h3>The archive is empty</h3>
409        <p>Play <em>index.html</em> (the main site) in this same browser and every completed reading appears here automatically.<br>
410        Or press <b>Seed demo data</b> above to explore the dashboard with 14 generated profiles.</p></div>`;
411      return;
412    }
413    app.innerHTML = kpis(recs) + `
414      <div class="grid row3">
415        <div class="card"><h3>Verdicts</h3><div class="hint">which door the engine predicted, across all users</div>${donut(recs)}</div>
416        <div class="card"><h3>Thread averages</h3><div class="hint">population mean per thread — split by gender when both present</div>${threadChart(recs)}</div>
417        <div class="card"><h3>Readiness distribution</h3><div class="hint">the gate sits at 45 — below it, path advice is overridden</div>${readinessHist(recs)}</div>
418      </div>` + tableCard(recs);
419  }
420  /* ── login ────────────────────────────────────────────────────
421     The password is verified by Google's Identity Toolkit, not by this
422     page. Nothing here can be bypassed by editing the JavaScript: the
423     Firestore rules only release data to a request carrying a valid ID
424     token for the admin account. The friendly "Impulse" user id is
425     mapped to the account's email address. */
426  const ADMIN_EMAIL='ghosuddin.d@gmail.com';
427  const ADMIN_USER='impulse';                 // typed user id, compared lowercase
428  const TOKEN_KEY='bridge_admin_token';
429  
430  function openDashboard(){
431    document.getElementById('gate').style.display='none';
432    document.querySelector('.wrap').classList.add('on');
433    render();
434    fetchCloud().then(render);
435  }
436  async function signIn(email,password){
437    const r=await fetch('https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key='+CLOUD.apiKey,{
438      method:'POST',headers:{'Content-Type':'application/json'},
439      body:JSON.stringify({email,password,returnSecureToken:true})
440    });
441    const j=await r.json();
442    if(j.error) throw j.error;
443    return j.idToken;
444  }
445  async function tryLogin(ev){
446    ev.preventDefault();
447    const u=document.getElementById('uid').value.trim().toLowerCase();
448    const p=document.getElementById('pwd').value;
449    const err=document.getElementById('gerr');
450    const btn=document.getElementById('gbtn');
451    err.textContent=''; btn.disabled=true; btn.textContent='Checking\u2026';
452    try{
453      if(u!==ADMIN_USER) throw {message:'INVALID_LOGIN_CREDENTIALS'};
454      idToken=await signIn(ADMIN_EMAIL,p);
455      try{ sessionStorage.setItem(TOKEN_KEY,idToken); }catch(e){}
456      openDashboard();
457    }catch(e){
458      const m=(e&&e.message)||'';
459      err.textContent = /INVALID_LOGIN_CREDENTIALS|INVALID_PASSWORD|EMAIL_NOT_FOUND/.test(m)
460        ? 'That user ID and password do not match.'
461        : /TOO_MANY_ATTEMPTS/.test(m)
462        ? 'Too many attempts. Wait a few minutes and try again.'
463        : 'Could not reach the sign-in service. Check your connection.';
464      document.getElementById('pwd').value='';
465      document.getElementById('pwd').focus();
466    }finally{ btn.disabled=false; btn.textContent='Enter'; }
467    return false;
468  }
469  function logout(){
470    idToken=null;
471    try{ sessionStorage.removeItem(TOKEN_KEY); }catch(e){}
472    location.reload();
473  }
474  /* resume a session in this tab — the token is re-validated by the
475     database on the first read, so a forged one gets nothing */
476  (function(){
477    let t=null;
478    try{ t=sessionStorage.getItem(TOKEN_KEY); }catch(e){}
479    if(t){ idToken=t; openDashboard(); }
480    else { const u=document.getElementById('uid'); if(u) u.focus(); }
481  })();
482  
```

---

## 9. Running the project

**Locally** — download the repository and open `index.html` in any modern browser. No
server, no install, no build step. The game works fully offline; only cloud submission and
the dashboard's cloud pull require a connection.

**Deployed** — push to a GitHub repository, then Settings → Pages → Deploy from branch →
`main` / root. The site is live at `https://<username>.github.io/<repo>/`.

**Re-pointing at a different Firebase project** — see the README for the five-step
procedure (create project, enable Firestore, enable Email/Password auth, paste the project
ID and API key into both pages, publish the rules with your own admin UID).

---

*Impulse · The Bridge · v1.0 · MIT Licence*
