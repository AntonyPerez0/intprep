// Parses the annotated Python format described in src/content/types.ts.

export interface SolutionLine {
  text: string;
  /** Index of the chunk this line belongs to. */
  chunk: number;
  key: boolean;
  header: boolean;
}

export interface Chunk {
  explain: string;
  header: boolean;
  /** Lines of code (blank lines trimmed from both ends). */
  lines: string[];
  /** Indices into `lines` that are key lines. */
  keyLines: number[];
}

export interface ParsedSolution {
  /** Clean, runnable code with all markers removed. */
  code: string;
  chunks: Chunk[];
  lines: SolutionLine[];
}

const CHUNK_RE = /^\s*#@\s?(.*)$/;
const KEY_RE = /\s+#!\s*$/;

const cache = new Map<string, ParsedSolution>();

export function parseSolution(src: string): ParsedSolution {
  const hit = cache.get(src);
  if (hit) return hit;

  const chunks: Chunk[] = [];
  let current: Chunk | null = null;

  for (const rawLine of src.split('\n')) {
    const m = rawLine.match(CHUNK_RE);
    if (m) {
      current = { explain: m[1].trim(), header: false, lines: [], keyLines: [] };
      chunks.push(current);
      continue;
    }
    if (!current) {
      current = {
        explain: 'The signature LeetCode gives you. It is pre-filled during drills.',
        header: true,
        lines: [],
        keyLines: [],
      };
      chunks.push(current);
    }
    const key = KEY_RE.test(rawLine);
    const text = rawLine.replace(KEY_RE, '').replace(/\s+$/, '');
    if (key) current.keyLines.push(current.lines.length);
    current.lines.push(text);
  }

  // Trim blank lines at the ends of every chunk (keeping key-line indices right).
  for (const c of chunks) {
    while (c.lines.length && c.lines[0].trim() === '') {
      c.lines.shift();
      c.keyLines = c.keyLines.map((i) => i - 1);
    }
    while (c.lines.length && c.lines[c.lines.length - 1].trim() === '') c.lines.pop();
  }
  const nonEmpty = chunks.filter((c) => c.lines.length > 0);

  const lines: SolutionLine[] = [];
  nonEmpty.forEach((c, ci) => {
    c.lines.forEach((text, li) => {
      lines.push({ text, chunk: ci, key: c.keyLines.includes(li), header: c.header });
    });
  });

  const parsed: ParsedSolution = {
    code: lines.map((l) => l.text).join('\n'),
    chunks: nonEmpty,
    lines,
  };
  cache.set(src, parsed);
  return parsed;
}

// ── The parts a learner writes in a guided lesson ──────────────────────────

export interface LessonPart {
  chunk: Chunk;
  /** Index of the chunk in the parsed solution (its lines carry it as `chunk`). */
  ci: number;
  /** Signature lines the part opens with: given while writing, like the header. */
  lead: string[];
  /** The lines to write. Signature lines a part ends with are given with the next part. */
  body: string[];
}

/**
 * A class line, or a function or method signature at class level: the lines LeetCode's starter
 * code gives (`class Solution:`, `def get(self, key: int) -> int:`) or that only name a helper.
 * They are given, like the header; nested helpers (`def dfs(r, c):`) are part of the logic.
 */
const SIGNATURE = /^(class\s+\w+.*|def\s+\w+\(.*\).*|    def\s+\w+\(self\b.*\).*):\s*(#.*)?$/;

/**
 * The parts the learner writes in a guided lesson ("Write the code"): every chunk but the header.
 * Signature lines at the start or end of a chunk (design problems put each method in its own
 * part) are given, not typed.
 */
export function lessonParts(parsed: ParsedSolution): LessonPart[] {
  return parsed.chunks.flatMap((chunk, ci) => {
    if (chunk.header) return [];
    const { lines } = chunk;
    const given = (l: string) => l.trim() === '' || SIGNATURE.test(l);
    let a = 0;
    while (a < lines.length && given(lines[a])) a++;
    let b = lines.length;
    while (b > a && given(lines[b - 1])) b--;
    // A part that is only signatures (none today) is written whole.
    if (a === b) return [{ chunk, ci, lead: [], body: lines }];
    return [{ chunk, ci, lead: lines.slice(0, a), body: lines.slice(a, b) }];
  });
}

/**
 * Typographic quotes as straight ones. Phones type curly quotes when "smart punctuation" is on
 * (iOS by default): `‘a’` and `“a”` are `'a'` and `"a"` in code. Low-9 and reversed quotes and
 * primes map too. One character for one, so indices in the result match the original line.
 */
export function straightQuotes(s: string): string {
  return s.replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'").replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"');
}

/**
 * Normalize a line of code for "did you type it right?" comparisons:
 * - the trailing comment and the quote style (`'a'` / `"a"`) do not matter, nor curly quotes
 *   typed by a phone's smart punctuation (`‘a’` is `'a'`);
 * - string contents are kept as written: `" "` is not `""`, and `"Hi there"` is not `"Hithere"`;
 * - outside strings, spacing around operators and punctuation does not matter (`a+b` is
 *   `a + b`), but a space between two words does (`for n in` is not `forn in`);
 * - a trailing comma before `)` or `]` does not matter, nor the case of hex digits (`0xff`).
 */
export function normalizeCode(s: string): string {
  const line = stripComment(straightQuotes(s));
  let out = '';
  let code = '';
  let i = 0;
  while (i < line.length) {
    const quote = line[i];
    if (quote !== '"' && quote !== "'") {
      code += line[i++];
      continue;
    }
    out += normalizeCodePart(code);
    code = '';
    let j = i + 1;
    while (j < line.length && line[j] !== quote) j += line[j] === '\\' ? 2 : 1;
    // An unterminated string keeps its missing close, so it never matches a finished one.
    out += `"${line.slice(i + 1, Math.min(j, line.length))}${j < line.length ? '"' : ''}`;
    i = j + 1;
  }
  return out + normalizeCodePart(code);
}

/** Code between string literals: one space between words, none around anything else. */
function normalizeCodePart(code: string): string {
  return code
    .replace(/\s+/g, ' ')
    .replace(/ ?([^\w ]) ?/g, '$1')
    .trim()
    .replace(/,\)/g, ')')
    .replace(/,\]/g, ']')
    .replace(/\b0[xX][0-9a-fA-F]+\b/g, (m) => m.toLowerCase());
}

/** Remove a trailing `# comment`, ignoring `#` characters inside string literals (curly quotes included). */
export function stripComment(line: string): string {
  const flat = straightQuotes(line);
  let quote: string | null = null;
  for (let i = 0; i < flat.length; i++) {
    const ch = flat[i];
    if (quote) {
      if (ch === '\\') i++;
      else if (ch === quote) quote = null;
    } else if (ch === '"' || ch === "'") quote = ch;
    else if (ch === '#') return line.slice(0, i);
  }
  return line;
}
