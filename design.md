# IMPULSE · The Bridge — Design Document

**Impulse · v1.0**
*"If you have lost your path in love, Impulse shows you the direction — not the path."*
An emotional-analysis engine and game that reads a person's inner wiring and tells them which door — love marriage, arranged marriage, or the bridge between them — their psyche is actually built to survive.

---

## 0. The Premise (read this first)

Almost every "love vs arranged" quiz on the internet asks the wrong question. They ask *which one do you like more*. That is a preference, and preferences are cheap — they change with the last movie you watched.

This system asks a harder question:

> **Both doors lead to a room where something breaks. Which breakage can you live inside?**

Love marriage fails through **disillusionment**. You chose from a peak, and the peak flattens. The person you fought your family for becomes a person who leaves dishes in the sink. The story you told yourself stops being true, and you have no one to blame — you picked them.

Arranged marriage fails through **resignation**. You never had the peak, so nothing flattens. Instead a slow question builds: *is this all it was?* You did everything right. That is exactly what makes it hard to name as wrong.

Neither failure is worse. They are different *shapes of pain*, and human beings are not equally built for both. Some people can metabolise disillusionment and would be destroyed by resignation. Some are the reverse. **That is the actual finding this system produces.**

So the output is never "arranged marriage is better for you." The output is:

1. Which door your wiring fits
2. **How you will most likely fail inside it** (your failure mode)
3. What you must therefore look for in a person
4. And whether you are *ready for any door at all* — a separate question that most people skip

---

## 1. The Eight Threads

Everything the player does moves eight numbers, each 0–100. They are called Threads, not scores, because in the game they are drawn as threads of light.

### AUT — Self-Authorship
How much of the *meaning* of your marriage depends on you having chosen it yourself.

High AUT people are not necessarily rebels. They are people for whom an outcome loses value if it was handed to them. A high-AUT person given a perfect partner by their parents will, five years in, quietly grieve a decision they never got to make. A low-AUT person handed the same partner feels held, not handled.

*The test:* would you rather be right by accident or wrong by your own hand?

### KIN — Kinship Weight
How embedded you are in the family system, and — critically — whether that system reads as **resource** or **cage**.

This is the most misread thread. High KIN is not weakness. A person with high KIN has a functioning support architecture; they marry into a net, not a void. Low KIN is not freedom either — it often means the net was never trustworthy. The engine tracks *sign* as well as magnitude: KIN measures pull, and a second signal (see PRS) measures whether that pull is warm or heavy.

### ANX — Anxious Attachment
Fear of abandonment. Reads meaning into silence. Confuses intensity with love, because intensity is the only proof that registers.

High ANX plus love marriage is the most volatile combination in this system. The chase feels like aliveness; the calm afterwards feels like loss.

### AVO — Avoidant Attachment
Deactivation under closeness. Needs distance to feel safe. Experiences a partner's need as a demand.

High AVO plus arranged marriage is the most *deceptively stable* combination — it can look like a good marriage for twenty years and be two people politely not knowing each other.

Security is derived, not asked for: `SEC = 100 − max(ANX, AVO)` softened by their overlap.

### AMB — Ambiguity Tolerance
Capacity to hold an unresolved question without needing to close it.

This maps directly onto the structural difference between the two paths:

| | Front-loaded | Back-loaded |
|---|---|---|
| **Love marriage** | discovery, chemistry, uncertainty | certainty (or its collapse) |
| **Arranged marriage** | certainty, structure, decision | discovery (or its absence) |

Low AMB people find love marriage's long unresolved middle unbearable. High AMB people find arranged marriage's early closure suffocating.

### REG — Regret Orientation
Whether you regret **action** or **inaction** more.

Psychology's most reliable finding here: in the short term people regret what they did; over a lifetime they overwhelmingly regret what they didn't do. But the *rate* of that flip varies enormously by person, and it is the single best predictor of whether someone will forgive themselves for choosing love.

High REG (inaction-regretting) → the unchosen door haunts them. They must choose.
Low REG (action-regretting) → the wrong choice haunts them. They must be guided.

### PRS — Gendered Pressure Delta
**The core original mechanic of this system.** See §3.

Not "what do you believe about gender." Instead: the measured *gap* between what you want and what you believe is expected of someone of your gender. PRS is that gap, in absolute points.

### RDY — Readiness
Emotional availability, self-knowledge, life stability. Deliberately **orthogonal to path**.

A person can be a textbook love-marriage temperament and completely unready to marry anyone. Conflating these is the most common failure of every tool in this space. Here, RDY gates the result: below 45, the verdict opens with *neither door yet*, and the path reading becomes advisory rather than prescriptive.

---

## 2. The Three Doors

Two doors is a false frame. The engine scores three.

### Door I — The Chosen (love marriage)
You need the decision to be yours. You will pay a real price for that, and you have to know the price before you pay it.

### Door II — The Given (arranged marriage)
You draw strength from structure and from being held by a system larger than you. Certainty first, intimacy earned after.

### Door III — The Bridge (assisted / hybrid)
Family opens the door; you walk through it or you don't. Veto power without the burden of the entire search.

This is where most real modern answers land, and almost no existing tool models it. The Bridge is not a compromise or a fence-sit — it is a genuine third architecture with its own distinct failure mode (*paralysis*: infinite optionality with a permanent safety net, so no choice ever becomes final).

**Scoring**

```
SEC   = 100 − max(ANX, AVO) + 8
SEC_L = 100 − (0.65·AVO + 0.45·ANX)

love     = 0.30·AUT + 0.20·AMB + 0.20·REG + 0.15·(100−KIN) + 0.15·SEC_L  − 0.14·PRS
arranged = 0.30·KIN + 0.20·(100−AMB) + 0.20·(100−REG) + 0.15·(100−AUT) + 0.15·SEC
bridge   = 0.45·min(AUT,KIN) + 0.25·(100−|AUT−KIN|) + 0.15·AMB + 0.15·SEC − 0.05·PRS
```

Two deliberate asymmetries:

- **Insecurity is priced differently per door.** Avoidance weighs heavier against the Chosen (an unstructured search punishes withdrawal); anxiety weighs heavier against the Given (structure without chosen-ness starves the anxious). Using one flat security term would have systematically pushed every insecure person toward love, which is wrong.
- **Inherited pressure taxes only the doors that require standing against the room.** The Chosen pays 0.14·PRS, the Bridge 0.05·PRS, the Given nothing — because the Given is the door the room already approves of.

The `min(AUT, KIN)` term is the important one: the Bridge only scores high when a person genuinely holds **both** the need to choose and the need to belong. It cannot be reached by being lukewarm about both — that produces a low score on all three doors, which the engine reports honestly as *"you have not yet decided what you want, and that is the finding."*

The three are then normalised to percentages, with a **confidence band** derived from separation:

- gap > 14 points → *Clear*
- gap 6–14 → *Leaning*
- gap < 6 → *Split* — and a Split result is treated as a real, reportable outcome, not a failure to measure

*Calibrated against six simulated archetype playthroughs; all three doors are reachable and the band spread is genuine rather than always-Clear.*

### Coherence
A hidden ninth number. Tracks contradiction between answers that should co-vary. Low coherence is not noise — it is the signature of someone genuinely torn, usually between what they want and what they were raised to want. The report names this directly.

---

## 3. The Mirror — the gender mechanic

This is the part the project brief asked for and the part no quiz does properly.

The naive approach — "do you think men should propose?" — measures nothing but a person's willingness to sound modern. Everyone passes. It's a mirror that only shows you your good side.

**Our approach:** ask the same scenario twice, side by side, on two sliders.

> **A.** What *you* would actually want here.
> **B.** What you believe is expected of *a person of your gender* here.

The player sets both. The engine records the **delta**.

```
PRS = mean(|A − B|) across all Mirror scenarios
```

What this produces:

| Delta | Reading |
|---|---|
| **Near zero, high B** | Aligned-traditional. You want what you were taught to want. Genuinely low-friction — this is not a problem, and the report says so plainly. |
| **Near zero, low B** | Aligned-progressive. Same alignment, different content. |
| **Wide** | **Friction.** You want one thing and carry another. Every marriage decision you make will be a negotiation with a room that isn't present. |

The Mirror is asked identically to every player. Nothing is gendered by the engine — the player supplies the gendered content themselves, from their own lived expectation. The system stays descriptive of the person, never prescriptive about the gender.

**Why this matters for the verdict:** high PRS plus high AUT is the highest-conflict profile in the whole system — someone who needs to author their own life while carrying a loud inherited script. It also strongly predicts *which* failure mode fires. High PRS is not a defect; it's the cost line on the invoice, and the report prints it.

The six Mirror scenarios cover: who initiates, career vs relocation, financial asymmetry, emotional expression in conflict, the timeline clock, and family caregiving after marriage.

---

## 4. Structure of Play

Five chapters, 26 beats, ~10 minutes. No score is ever shown mid-game — the threads are drawn as light on the left edge, moving, unlabelled, so the player feels change without being able to game it.

**Chapter 0 — The Threshold**
Name, gender, age band. One slider: *how loudly does your family's opinion live in your head?* This is a calibration prime, not a question — it sets the emotional register.

**Chapter I — The House You Grew Up In** (5)
Kinship. Whether the family net is warm or heavy. Base KIN, first RDY signal.

**Chapter II — The Room With No Lights** (5)
Attachment. Conflict, silence, distance, jealousy, repair. ANX and AVO.

**Chapter III — The Fork** (5)
Autonomy and ambiguity. The unresolved middle. AUT and AMB.

**Chapter IV — The Mirror** (6)
The dual-slider mechanic. PRS.

**Chapter V — Ten Years From Now** (5)
Regret. Written in future tense, second person — the player reads their own older self. REG and final RDY.

**The Verdict**
Radar of eight threads → three-door bars with confidence → narrative report.

---

## 5. The Report

Six sections, in this order deliberately:

1. **Your door** — with confidence, and the runner-up named, because the runner-up is where you'll drift under stress.
2. **Why** — the two or three threads that actually decided it, in plain language, with their numbers.
3. **Your failure mode** — the specific way this will most likely go wrong for *you*. The section people screenshot.
4. **Your ask** — what to look for in a person, phrased as findable qualities, not virtues.
5. **The invoice** — the price of your door, stated flatly. Every door has one. A reading that only lists benefits is flattery.
6. **Readiness** — separate, unflinching, and if low, it overrides everything above.

### Failure modes

| Condition | Name | Reading |
|---|---|---|
| Love + ANX>60 | **Disillusionment through intensity** | You'll mistake the chase for the love and find peace unbearable. |
| Love + PRS>35 | **The price you didn't read** | You'll win the fight and pay for it in instalments for a decade. |
| Arranged + AUT>60 | **The quiet resignation** | Nothing will be wrong. That will be the problem. |
| Arranged + AVO>60 | **Two polite strangers** | You'll build a functioning household and never be known inside it. |
| Bridge + AMB<40 | **Paralysis at the bridge** | Infinite options plus a permanent safety net means no choice ever becomes final. |
| Any + coherence<50 | **The unnamed fight** | You are arguing with someone who isn't in the room. Name them before you marry anyone. |
| Any + RDY<45 | **Neither door yet** | This is not a verdict against you. It is a verdict about timing. |

---

## 6. What this system refuses to do

Stated as design constraints, because they were easy to violate:

- **It never says one path is better.** Only which one *this person* is built for.
- **It never assigns traits by gender.** The Mirror mechanic makes the player supply their own expectation; the engine only measures the gap.
- **It never treats tradition as backwardness or modernity as progress.** Aligned-traditional is reported as a low-friction strength.
- **It never flatters.** Every door gets an invoice.
- **It never claims prediction.** This is a structured mirror. It tells you what you already told it, arranged so you can finally see the shape. The last line of the report says exactly that.

---

## 7. The Council — six agents, a router, and a synthesiser

The arithmetic in §2 produces a number. The council produces an *argument*. Both run on every reading, and — this is the point — **they are allowed to disagree in front of the reader**.

### The agents

| Agent | Reads | Leans toward |
|---|---|---|
| **Attachment** | Chapter II — anxious/avoidant wiring, conflict behaviour | Anxious → Bridge (needs two guarantees). Avoidant → Given (structure without intimacy on demand). Fearful → abstains, raises alarm. |
| **Kinship** | Chapter I — family as net vs cage, cost of disapproval | High KIN + high AUT → Bridge. High KIN alone → Given. Low KIN → Chosen. |
| **Mirror** | Chapter IV — the want/expectation gap | High PRS + high AUT → Bridge (love is not wrong, it is *expensive*). High PRS + low AUT → Given. |
| **Regret** | Chapter V — which regret you can forgive | Inaction-regretting → Chosen. Action-regretting → Given. |
| **Readiness** | all chapters | Never leans. **Holds the veto.** |

Each returns four things: a **relevance** (how much this player's answers give it to weigh), a **lean**, a **confidence**, and — separately — a **concern**: the thing it is watching for even if the door goes its way.

### The Router

Not every agent matters to every player. The router computes relevance per agent and **seats** only those above 45; the rest are shown as *consulted, not seated*, with the reason stated in plain language. A player whose want and expectation barely diverge genuinely has little for the Mirror agent to weigh, and the report says so rather than manufacturing an insight.

Readiness is always seated.

### The Synthesiser

Weighted vote across seated agents: `weight = relevance × confidence`. Then one of four outcomes, in priority order:

1. **Veto** — readiness below the gate. The door stands; the year does not.
2. **Dissent** — the council's weighted lean differs from the arithmetic. Both are printed. The reader gets the arithmetic as their door and the council as their warning.
3. **Split** — agents agree on the door but two of them wanted different things. The tension is named, with what each was protecting.
4. **No quorum** — no seated agent found its domain loud enough to argue. Reported honestly as an enviable result rather than dressed up as unanimity.

The synthesiser never overrules the arithmetic. It is a second opinion that is permitted to be uncomfortable — which is the only kind worth printing.

*Verified across seven simulated archetypes: all three leans reachable, routing genuinely varies by player, and veto / dissent / split / no-quorum each fire.*

## 8. Data storage & administration

Every completed reading is archived automatically to the browser's local storage under the key `bridge_records_v1`. One record per playthrough:

```
{ id, ts, name, gender, age, familyVolume,
  T:{AUT,KIN,ANX,AVO,AMB,REG,PRS,RDY}, coh, external,
  pct:{love,arranged,bridge}, rank, gap, conf, fail,
  mirrors:[{t,a,b,d}×6], answers:[{q,a}×20] }
```

No server, no accounts, nothing leaves the device. `the-bridge-admin.html`, opened in the same browser, reads the same archive and shows: KPI cards (totals, door split, avg readiness, avg pressure), a verdict donut, per-thread population averages with a men/women comparison when both are present, a readiness histogram against the 45-point gate, and a per-user table with full drill-down — all eight threads, all three door scores, every mirror gap, every answer given, and a term-by-term arithmetic table showing exactly how the engine computed each door score for that user (the "how the AI predicted it" view; the dashboard mirrors the engine formula and its output is verified identical to the game's recorded shares).

Archives move between devices via Export / Import JSON in the dashboard header; import de-duplicates by record id. Seed-demo generates 14 plausible profiles through the real engine for exploring the dashboard before real data exists.

## 9. Files

| File | What |
|---|---|
| `THE-BRIDGE-design.md` | This document — framework, math, constraints |
| `the-bridge.html` | The game. Self-contained, offline, archives every reading |
| `the-bridge-admin.html` | Admin dashboard. Reads the archive, explains every score |

---

*Impulse · The Bridge · built from scratch, v1.0*
