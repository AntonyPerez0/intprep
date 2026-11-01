// Picks which lines of a snippet to blank out for a "Fill in the gaps" exercise: most of the
// pattern stays visible and the learner types the few lines that carry the idea.
//
// - Never blanks blank lines, comment-only lines, `pass` / `else:` / `try:` / `finally:` /
//   `break` / `continue` / a bare `return`, lone brackets, decorators, imports, `def` / `class`
//   headers (their names are arbitrary), docstrings, any line of a statement that spans several
//   lines, or a line the caller excludes (e.g. the class and def header it keeps visible).
// - Prefers key lines (the `#!` lines of a solution) first, then the lines with the most logic:
//   conditions, loop headers, assignments that call or index, return expressions.
// - Spreads the gaps out, so they are rarely next to each other.
// - Deterministic: the same seed always gives the same gaps. Seed 0 (the default) is the
//   canonical set. Seeds are rounds of practice (pass the attempt number): seed n avoids the
//   lines of seed n − 1 where it can and never repeats its set when another set exists, so
//   "new gaps" practises other lines.
//
// Pure: no React, no DOM. The editor lives in src/components/CodeGaps.tsx.

import { lineKey } from './codegrade';
import { normalizeCode, parseSolution, stripComment } from './parseSolution';

export interface PickGapsOptions {
  /** Indices of key lines (e.g. `parseSolution(src).lines[i].key`); blanked first. */
  keyLines?: number[];
  /** Share of the snippet's code lines to blank. Default 0.3 (about 70% stays visible). */
  ratio?: number;
  /** Fewest gaps. Default 1 (when the snippet has any line that can be blanked). */
  min?: number;
  /** Most gaps. Default 12. */
  max?: number;
  /**
   * Round of practice: 0 (default) = the canonical set (key lines first); 1, 2… each avoid the
   * previous round's gaps where possible. Wraps at 64.
   */
  seed?: number;
  /** Line indices that must stay visible (e.g. the class / def header). */
  exclude?: number[];
}

const KEY_MARK = /\s+#!\s*$/;

/** Statements that are never worth a gap: the learner would only be typing punctuation. */
const TRIVIAL =
  /^(pass|break|continue|return|else:|try:|finally:|except:|except\s+[\w.]+(\s+as\s+\w+)?:|\.\.\.|[)\]}]+[,:]?)$/;

/** Line kinds that stay visible: structure, not logic. */
const STRUCTURE = /^(@|import\s|from\s+\S+\s+import\s|(async\s+)?def\s|class\s|global\s|nonlocal\s|"""|''')/;

/** A right-hand side that only sets something up: `0`, `[]`, `{}`, `set()`, `"0"`, `None`. */
const LITERAL = /^(-?\d+(\.\d+)?|True|False|None|\[\]|\{\}|\(\)|"[^"]*"|'[^']*'|\w+\(\)|float\(["'][-+]?inf["']\))$/;

/**
 * Lines that belong to a statement spanning several lines (open brackets, a trailing
 * backslash) or sit inside a triple-quoted string. Blanking one of those would leave the
 * learner half a statement.
 */
function multiLineParts(lines: string[]): boolean[] {
  const out: boolean[] = new Array(lines.length).fill(false);
  let depth = 0;
  let triple: string | null = null;
  let continued = false;
  lines.forEach((raw, idx) => {
    const line = raw.replace(KEY_MARK, '');
    const startDepth = depth;
    const startTriple = triple;
    const startContinued = continued;
    let quote: string | null = null;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (triple) {
        if (line.startsWith(triple, i)) {
          i += 2;
          triple = null;
        }
      } else if (quote) {
        if (ch === '\\') i++;
        else if (ch === quote) quote = null;
      } else if (ch === '#') break;
      else if (ch === '"' || ch === "'") {
        const t = ch.repeat(3);
        if (line.startsWith(t, i)) {
          triple = t;
          i += 2;
        } else quote = ch;
      } else if (ch === '(' || ch === '[' || ch === '{') depth++;
      else if (ch === ')' || ch === ']' || ch === '}') depth = Math.max(0, depth - 1);
    }
    continued = /\\\s*$/.test(stripComment(line));
    out[idx] = startDepth > 0 || depth > 0 || !!startTriple || !!triple || startContinued || continued;
  });
  return out;
}

/** The code of a line without its trailing comment, `#!` marker or surrounding whitespace. */
function codeOf(line: string): string {
  return stripComment(line.replace(KEY_MARK, '')).trim();
}

/**
 * Indices of the lines that may be blanked, before any preference: every line except the
 * ones listed at the top of this file. `exclude` lines are left out too.
 */
export function gapCandidates(lines: string[], exclude: number[] = []): number[] {
  const skip = new Set(exclude);
  const partial = multiLineParts(lines);
  const out: number[] = [];
  lines.forEach((line, i) => {
    if (skip.has(i) || partial[i]) return;
    const code = codeOf(line);
    if (!code || TRIVIAL.test(code) || STRUCTURE.test(code)) return;
    if (normalizeCode(code).length < 3) return; // `x`, `}`, `0`…
    out.push(i);
  });
  return out;
}

/**
 * How much logic a line carries (roughly 1–12): conditions and loop headers first, then
 * assignments that compute something, calls, and returns with an expression.
 */
export function lineWeight(line: string): number {
  const code = codeOf(line);
  let w = 1;
  if (/^(if|elif|while|for)\b/.test(code)) w += 5;
  else if (/^return\b/.test(code)) {
    const expr = code.replace(/^return\s*/, '');
    w += /^(True|False|None|-?\d+|\[\]|\{\}|""|''|\w+)$/.test(expr) ? 0.5 : 3;
  } else if (/^(yield|raise|assert|del)\b/.test(code)) w += 2;
  else if (/^[\w.,\s[\]()*]+?\s*(\/\/|\*\*|>>|<<|[-+*/%|&^@])?=(?!=)/.test(code)) {
    // Assignment. A literal on the right (`best = 0`, `seen = {}`) is setup, not logic.
    const rhs = code.replace(/^[^=]*=/, '').trim();
    const literal = rhs.split(',').every((part) => LITERAL.test(part.trim()));
    w += literal ? 0.5 : 3;
    if (/^[\w.]+\s*(\/\/|\*\*|>>|<<|[-+*/%|&^@])=/.test(code)) w += literal ? 1.5 : 0; // `l += 1`: the pointer moves
  } else if (/^[\w.]+\(.*\)$/.test(code)) {
    // A call statement: `path.append(x)`, `dfs(r, c)`. With no or only literal arguments
    // (`path.pop()`, `backtrack(0)`) there is less to recall.
    const args = code.slice(code.indexOf('(') + 1, -1).trim();
    w += !args || args.split(',').every((a) => LITERAL.test(a.trim())) ? 1.5 : 3;
  }

  // Logic inside the line: operators, comparisons, indexing, calls with arguments.
  const ops = code.match(/==|!=|<=|>=|<|>|\/\/|\*\*|[-+*/%]|\b(and|or|not|in|is)\b/g)?.length ?? 0;
  const idx = code.match(/\w\s*\[[^\]]+\]/g)?.length ?? 0;
  const calls = code.match(/\w\s*\([^)]/g)?.length ?? 0;
  w += Math.min(4, ops * 0.6 + idx * 0.7 + calls * 0.5);
  if (/\bfor\b.+\bin\b/.test(code) && !/^for\b/.test(code)) w += 1.5; // a comprehension
  // A trailing comment means the author thought the line worth explaining (templates have no
  // key lines, so this is their strongest signal). <CodeGaps> shows it as the gap's hint.
  const hasComment = /#/.test(line.replace(KEY_MARK, '').slice(stripComment(line).length));
  if (w >= 2.5 && hasComment) w += 1.5;
  return w;
}

// ── Seeded randomness ───────────────────────────────────────────────────────

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Mix the seed so nearby seeds (1, 2, 3…) give unrelated sequences. */
function rngFor(seed: number, salt = 0): () => number {
  let h = (Math.trunc(seed) ^ 0x9e3779b9) + salt * 0x85ebca6b;
  h = Math.imul(h ^ (h >>> 16), 0x7feb352d);
  h = Math.imul(h ^ (h >>> 15), 0x846ca68b);
  return mulberry32(h ^ (h >>> 16));
}

// ── Selection ───────────────────────────────────────────────────────────────

/** How many gaps a snippet with `base` code lines gets (rounds down at .5, so ≥ ~70% stays visible). */
export function gapCount(base: number, candidates: number, { ratio = 0.3, min = 1, max = 12 }: PickGapsOptions = {}): number {
  const want = Math.floor(ratio * base + 0.4);
  return Math.max(0, Math.min(candidates, Math.max(min, Math.min(max, want))));
}

/**
 * Pick `n` lines: highest score first, each pick making its neighbours less attractive.
 * `used` is how recently each line was a gap (1 = last round), so later rounds rotate.
 */
function select(
  cands: number[],
  pos: Map<number, number>,
  weight: Map<number, number>,
  keys: Set<number>,
  n: number,
  seed: number,
  used: Map<number, number>,
  salt = 0,
): number[] {
  const rnd = rngFor(seed, salt);
  // Seed 0: key lines always first, no randomness. Later rounds: key lines are still favoured,
  // but lines that were gaps recently step back and comparable lines take turns.
  const keyBonus = seed === 0 ? 40 : 3;
  const jitter = seed === 0 ? 0 : 4 + salt * 3;
  const score = new Map<number, number>();
  for (const i of cands) {
    score.set(i, weight.get(i)! + (keys.has(i) ? keyBonus : 0) + rnd() * jitter - (used.get(i) ?? 0) * (4.5 + salt * 6));
  }
  const chosen: number[] = [];
  const left = new Set(cands);
  while (chosen.length < n && left.size) {
    let best = -1;
    let bestScore = -Infinity;
    for (const i of left) {
      // Spread: a gap right next to another one costs a lot, two or three lines away a little.
      let sc = score.get(i)!;
      for (const c of chosen) {
        const d = Math.abs(pos.get(i)! - pos.get(c)!);
        sc -= d === 1 ? 4 : d === 2 ? 1.5 : d === 3 ? 0.5 : 0;
      }
      if (sc > bestScore) {
        bestScore = sc;
        best = i;
      }
    }
    chosen.push(best);
    left.delete(best);
  }
  return chosen.sort((a, b) => a - b);
}

const sameSet = (a: number[], b: number[]) => a.length === b.length && a.every((x, i) => x === b[i]);

/** Seeds are meant to be attempt numbers (0, 1, 2…); larger ones wrap around. */
const SEED_CYCLE = 64;

/**
 * The line indices to blank, sorted. See the top of this file for the rules.
 * @param lines The snippet, one entry per line (blank and comment lines included, so indices
 *              match what you display). A trailing `#!` marks a key line too.
 */
export function pickGaps(lines: string[], opts: PickGapsOptions = {}): number[] {
  const { keyLines = [], exclude = [], seed = 0 } = opts;
  const skip = new Set(exclude);
  let cands = gapCandidates(lines, exclude);
  // Nothing qualifies (e.g. a snippet of one `return`): fall back to any visible code line.
  if (!cands.length) cands = lines.flatMap((l, i) => (!skip.has(i) && codeOf(l) !== '' ? [i] : []));
  if (!cands.length) return [];

  // Distance counts code lines only, so blank and comment lines do not separate two gaps.
  const pos = new Map<number, number>();
  let code = 0;
  let base = 0; // code lines the learner sees or types (the header is not part of the exercise)
  lines.forEach((l, i) => {
    if (codeOf(l) === '') return;
    pos.set(i, code++);
    if (!skip.has(i)) base++;
  });
  const isCand = new Set(cands);
  const keys = new Set(keyLines.filter((i) => isCand.has(i)));
  lines.forEach((l, i) => {
    if (KEY_MARK.test(l) && isCand.has(i)) keys.add(i);
  });
  const weight = new Map(cands.map((i) => [i, lineWeight(lines[i])]));
  const n = gapCount(base, cands.length, opts);
  if (n === 0) return [];

  // Seed r is round r of practice: lines that were gaps in recent rounds step back (fading
  // by half each round), and a round never repeats the previous round's set when another exists.
  const rounds = Math.abs(Math.trunc(seed)) % SEED_CYCLE;
  const used = new Map<number, number>();
  let set = select(cands, pos, weight, keys, n, 0, used);
  for (let r = 1; r <= rounds; r++) {
    const prev = set;
    for (const i of cands) used.set(i, (used.get(i) ?? 0) / 2 + (prev.includes(i) ? 1 : 0));
    set = select(cands, pos, weight, keys, n, r, used);
    for (let salt = 1; salt <= 3 && sameSet(set, prev) && n < cands.length; salt++) {
      set = select(cands, pos, weight, keys, n, r, used, salt);
    }
    if (sameSet(set, prev) && n < cands.length) {
      // Still the same: swap the weakest gap for the strongest line that was not a gap.
      const out = prev.reduce((a, b) => (weight.get(b)! < weight.get(a)! ? b : a));
      const inn = cands.filter((i) => !prev.includes(i)).reduce((a, b) => (weight.get(b)! > weight.get(a)! ? b : a));
      set = [...prev.filter((i) => i !== out), inn].sort((a, b) => a - b);
    }
  }
  return set;
}

// ── Sources ─────────────────────────────────────────────────────────────────

export interface GapSource {
  /** Clean lines to display: `#@` chunk comments and `#!` markers removed. */
  lines: string[];
  /** Indices of key lines (`#!`). */
  keyLines: number[];
  /** Indices of the header (the class / def LeetCode gives you): keep these visible. */
  header: number[];
}

/**
 * Lines, key lines and header of a snippet, ready for `pickGaps` and `<CodeGaps>`.
 * Takes an annotated solution (`#@` chunks, `#!` key lines; see content/types.ts) or plain
 * code such as a pattern template (no header: every line can be a gap).
 */
export function gapSource(src: string): GapSource {
  if (!/^\s*#@/m.test(src)) {
    const raw = src.split('\n');
    return {
      lines: raw.map((l) => l.replace(KEY_MARK, '').replace(/\s+$/, '')),
      keyLines: raw.flatMap((l, i) => (KEY_MARK.test(l) ? [i] : [])),
      header: [],
    };
  }
  const parsed = parseSolution(src);
  return {
    lines: parsed.lines.map((l) => l.text),
    keyLines: parsed.lines.flatMap((l, i) => (l.key ? [i] : [])),
    header: parsed.lines.flatMap((l, i) => (l.header ? [i] : [])),
  };
}

// ── Grading ─────────────────────────────────────────────────────────────────

export interface GapResult {
  /** What the learner typed, as typed. */
  got: string;
  /** The expected line, as written in the snippet (indentation and trailing comment included). */
  exp: string;
  ok: boolean;
  /** Nothing typed (counts as wrong). */
  empty: boolean;
}

export interface GapsGrade {
  /** One per gap, in order. */
  results: GapResult[];
  correct: number;
  total: number;
  /** Every gap right. */
  perfect: boolean;
  /** 0–1: correct / total (1 when there are no gaps). */
  score: number;
}

/**
 * Grade typed gaps against the lines they replace, one to one. Lines compare with the typing
 * kit's `lineKey`: whitespace (and so indentation), quote style, trailing comments and trailing
 * commas do not matter.
 * @param values        What the learner typed, one entry per gap (missing entries count as empty).
 * @param expectedLines The blanked lines, in the same order (`gaps.map((i) => lines[i])`).
 */
export function gradeGaps(values: readonly string[], expectedLines: readonly string[]): GapsGrade {
  const results = expectedLines.map((exp, k): GapResult => {
    const got = values[k] ?? '';
    const empty = got.trim() === '';
    return { got, exp, empty, ok: lineKey(got) === lineKey(exp) && (!empty || codeOf(exp) === '') };
  });
  const correct = results.filter((r) => r.ok).length;
  const total = results.length;
  return { results, correct, total, perfect: correct === total, score: total ? correct / total : 1 };
}

/** "2 of 3 gaps correct". */
export function gapsSummary(g: Pick<GapsGrade, 'correct' | 'total'>): string {
  return `${g.correct} of ${g.total} gap${g.total === 1 ? '' : 's'} correct`;
}
