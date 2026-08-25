// Tests for the scoring engine at the heart of Impulse — score(), convene(),
// and admin.html's independent explain() — run against the real source files,
// not a reimplementation, so a change to the shipped formula is what gets
// tested. Uses only Node built-ins (node:test, node:vm): no dependencies,
// consistent with the project's own zero-dependency philosophy.
//
// Run with: node --test test/

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

function slice(src, startMarker, endMarker) {
  const s = src.indexOf(startMarker);
  if (s === -1) throw new Error('start marker not found: ' + startMarker);
  const e = src.indexOf(endMarker, s);
  if (e === -1) throw new Error('end marker not found: ' + endMarker);
  return src.slice(s, e);
}

// Pulls just the pure scoring logic out of index.html — the eight threads,
// the three-door formulas (score), and the Council (convene) — skipping the
// canvas/DOM-driven sections on either side of it entirely.
function loadGameEngine() {
  const html = readFileSync(path.join(root, 'index.html'), 'utf8');
  const chunk = slice(html, '/* ── 1. THE THREADS', '/* ── 5. RENDER');
  const sandbox = { document: { getElementById: () => null }, console };
  vm.createContext(sandbox);
  vm.runInContext(
    chunk + '\nvar __exp = { score, convene, S, clamp, DOOR, THREADS, failure, theAsk };',
    sandbox,
    { filename: 'index.html (extracted engine)' }
  );
  return sandbox.__exp;
}

// Pulls admin.html's independent "explain()" — a deliberately separate,
// decomposed reimplementation of the same formula, used to show its
// arithmetic in the dashboard's drill-down view.
function loadAdminEngine() {
  const html = readFileSync(path.join(root, 'admin.html'), 'utf8');
  const chunk = slice(
    html,
    'const clamp=(v,a=0,b=100)=>Math.max(a,Math.min(b,v));',
    '/* ── storage ── */'
  );
  const sandbox = { console };
  vm.createContext(sandbox);
  vm.runInContext(
    chunk + '\nvar __exp = { explain, clamp, THREADS, DOORC, DOORN };',
    sandbox,
    { filename: 'admin.html (extracted engine)' }
  );
  return sandbox.__exp;
}

function freshTraits(overrides) {
  return Object.assign(
    { AUT: 50, KIN: 50, ANX: 40, AVO: 40, AMB: 50, REG: 50, PRS: 0, RDY: 50 },
    overrides
  );
}

test('score(): the three doors always normalise to ~100%', () => {
  const { score, S } = loadGameEngine();
  Object.assign(S.T, freshTraits({ AUT: 70, KIN: 30, AMB: 60, REG: 60 }));
  const r = score();
  const sum = r.pct.love + r.pct.arranged + r.pct.bridge;
  assert.ok(Math.abs(sum - 100) < 1e-6, `door shares should sum to 100, got ${sum}`);
});

test('score(): high self-authorship + low kinship leans toward the Chosen', () => {
  const { score, S } = loadGameEngine();
  Object.assign(S.T, freshTraits({ AUT: 90, KIN: 15, AMB: 70, REG: 70, PRS: 5 }));
  const r = score();
  assert.equal(r.rank[0], 'love');
});

test('score(): high kinship + low self-authorship leans toward the Given', () => {
  const { score, S } = loadGameEngine();
  Object.assign(S.T, freshTraits({ AUT: 15, KIN: 90, AMB: 20, REG: 20, PRS: 5 }));
  const r = score();
  assert.equal(r.rank[0], 'arranged');
});

test('score(): high self-authorship AND high kinship, held together, favors the Bridge', () => {
  const { score, S } = loadGameEngine();
  Object.assign(S.T, freshTraits({ AUT: 75, KIN: 75, AMB: 70, REG: 50, PRS: 5 }));
  const r = score();
  assert.equal(r.rank[0], 'bridge');
});

test('score(): confidence label matches the documented gap thresholds (Clear >14, Leaning 6-14, Split <6)', () => {
  const { score, S } = loadGameEngine();
  Object.assign(S.T, freshTraits());
  const r = score();
  if (r.gap > 14) assert.equal(r.conf, 'Clear');
  else if (r.gap > 6) assert.equal(r.conf, 'Leaning');
  else assert.equal(r.conf, 'Split');
});

test('score(): inherited pressure taxes love and bridge but never arranged, so arranged\'s share rises as it climbs', () => {
  const { score, S } = loadGameEngine();
  Object.assign(S.T, freshTraits({ AUT: 60, KIN: 40, PRS: 0 }));
  const base = score();
  Object.assign(S.T, freshTraits({ AUT: 60, KIN: 40, PRS: 80 }));
  const taxed = score();
  // arranged's raw score is untouched by PRS while love's and bridge's both
  // fall, so — regardless of how the three shares interact — arranged's
  // normalised share must strictly increase.
  assert.ok(
    taxed.pct.arranged > base.pct.arranged,
    `arranged's share should rise as inherited pressure rises (untaxed door), got ${base.pct.arranged} -> ${taxed.pct.arranged}`
  );
});

test('convene(): Readiness vetoes the verdict below the 45 gate', () => {
  const { score, convene, S } = loadGameEngine();
  Object.assign(S.T, freshTraits({ AUT: 70, KIN: 30, AMB: 60, REG: 60, RDY: 30 }));
  const C = convene(score());
  assert.equal(C.vetoed, true);
  assert.equal(C.reports.find(a => a.id === 'readiness').veto, true);
});

test('convene(): readiness above the gate does not veto', () => {
  const { score, convene, S } = loadGameEngine();
  Object.assign(S.T, freshTraits({ AUT: 70, KIN: 30, AMB: 60, REG: 60, RDY: 80 }));
  const C = convene(score());
  assert.equal(C.vetoed, false);
});

test('convene(): every agent report carries a relevance, and readiness is always seated', () => {
  const { score, convene, S } = loadGameEngine();
  Object.assign(S.T, freshTraits({ AUT: 55, KIN: 45, RDY: 80 }));
  const C = convene(score());
  assert.equal(C.reports.length, 5);
  for (const a of C.reports) {
    assert.ok(Number.isFinite(a.rel), `${a.id} should report a numeric relevance`);
  }
  assert.equal(C.reports.find(a => a.id === 'readiness').seated, true);
});

test('engine parity: admin.html\'s explain() reproduces index.html\'s score() exactly', () => {
  const game = loadGameEngine();
  const admin = loadAdminEngine();
  const T = { AUT: 62, KIN: 41, ANX: 35, AVO: 48, AMB: 57, REG: 44, PRS: 22, RDY: 68 };
  Object.assign(game.S.T, T);
  const r = game.score();
  const ex = admin.explain(T);
  for (const door of ['love', 'arranged', 'bridge']) {
    assert.ok(
      Math.abs(r.pct[door] - ex.pct[door]) < 1e-9,
      `${door} share drifted between index.html and admin.html: game=${r.pct[door]} admin=${ex.pct[door]}`
    );
  }
});
