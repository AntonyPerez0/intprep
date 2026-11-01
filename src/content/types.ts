// ─────────────────────────────────────────────────────────────────────────────
// Content schema for IntPrep.
//
// All teaching content lives in plain TypeScript data files so it is type-checked,
// easy to review in a PR, and needs no backend.
//
// PYTHON SOLUTIONS use a tiny annotation format so ONE block of real, runnable
// Python drives the code walkthrough, the fill-in-the-blank drills, and the
// "rebuild from memory" drills:
//
//   • A line whose first non-space characters are `#@ ` starts a new CHUNK.
//     The text after `#@ ` is the plain-English explanation of that chunk.
//     The `#@` line itself is removed from the displayed code.
//   • A line ending in `  #!` is a KEY LINE: the most important idea in the
//     solution. Key lines become fill-in-the-blank / pick-the-line drills.
//     The `#!` marker is removed from the displayed code.
//   • Lines before the first `#@` are the HEADER (class/def signature that
//     LeetCode gives you). They are shown pre-filled during recall drills.
//
// Because the markers are ordinary Python comments, the annotated source still
// compiles and runs, which is how every solution is tested.
//
// Write code with the `py` tag:  solution: py`...`
// It is String.raw (so `\n` inside Python strings stays a backslash-n), strips
// the first newline and trailing whitespace. Never use backticks or `${` inside.
// ─────────────────────────────────────────────────────────────────────────────

export type CategoryId =
  | 'arrays-hashing'
  | 'two-pointers'
  | 'sliding-window'
  | 'stack'
  | 'binary-search'
  | 'linked-list'
  | 'trees'
  | 'tries'
  | 'heap'
  | 'backtracking'
  | 'graphs'
  | 'advanced-graphs'
  | 'dp-1d'
  | 'dp-2d'
  | 'greedy'
  | 'intervals'
  | 'math-geometry'
  | 'bit-manipulation';

export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface Example {
  input: string;
  output: string;
  /** Optional one-line explanation of why the output is correct. */
  note?: string;
}

export interface Problem {
  /** LeetCode slug, e.g. 'two-sum'. Used in URLs and as the link to LeetCode. */
  id: string;
  /** LeetCode problem number. */
  num: number;
  title: string;
  difficulty: Difficulty;
  category: CategoryId;
  /** True for LeetCode Premium problems (we also link a free mirror). */
  premium?: boolean;
  /** Short name of the specific technique, e.g. 'Hash map complement lookup'. */
  pattern: string;
  /**
   * Other categories whose technique is ALSO a fair answer for "which pattern?"
   * (e.g. Generate Parentheses lives under Stack but is really backtracking).
   * These are never used as wrong-answer distractors for this problem.
   */
  alsoAccept?: CategoryId[];
  /** The problem, paraphrased in our own words (mini-markdown). 1–4 sentences. */
  prompt: string;
  examples: Example[];
  /** Phrases/features in the problem that should make you think of the pattern. */
  signals: string[];
  /** Progressive hints, gentle → strong. 2–3 items. */
  hints: string[];
  /** Naive approach and why it is too slow (mini-markdown, include its Big-O). */
  brute: string;
  /** The single "aha" that unlocks the optimal solution. 1–2 sentences. */
  insight: string;
  /** A short, sticky phrase to remember the solution by (≤ 12 words). */
  mnemonic: string;
  /** Plain-English algorithm, in order, 3–7 steps. Used in step-ordering drills. */
  steps: string[];
  /** Annotated Python solution (see header comment). */
  solution: string;
  time: string;
  space: string;
  /** One or two sentences explaining the complexity. */
  complexityWhy: string;
  /** Common bugs and edge cases. 2–4 items. */
  pitfalls: string[];
}

export interface QuizQuestion {
  q: string;
  /** Optional code shown with the question. */
  code?: string;
  options: string[];
  /** Index into options. */
  answer: number;
  explain: string;
}

/** The "unit intro" lesson that teaches a pattern before its problems. */
export interface PatternGuide {
  category: CategoryId;
  /** What the pattern is, in plain English (mini-markdown, 2–5 short paragraphs). */
  summary: string;
  /** A memorable real-world analogy. */
  analogy: string;
  /** Recognition cues: "if you see X, think of this pattern". 4–7 items. */
  whenToUse: string[];
  /** A reusable Python template for the pattern (plain code, no markers needed). */
  template: string;
  /** Notes explaining the template. 2–5 items. */
  templateNotes: string[];
  /** Typical complexity of the pattern, e.g. 'O(n) time, O(1) space'. */
  complexity: string;
  /** 2–4 check-your-understanding questions. */
  quiz: QuizQuestion[];
}

export interface CategoryContent {
  guide: PatternGuide;
  problems: Problem[];
}

// ── Foundations (for absolute beginners) ────────────────────────────────────

/**
 * A "Your turn" slide: the learner writes the code themselves in an editor, and it is checked
 * line by line (whitespace, quote style and comments do not matter; indentation does).
 * `starter + "\n" + answer` (and the same for every `accept`) must be valid Python.
 */
export interface TypeSlide {
  kind: 'type';
  title?: string;
  /** The task (mini-markdown). Name every variable and function the answer uses, exactly. */
  prompt: string;
  /** Read-only code shown above the editor, e.g. a `def` line or a variable to use. */
  starter?: string;
  /**
   * The reference answer, written at its real indentation under `starter` (a function body is
   * indented 4 spaces). The learner types it from the editor's starting column.
   */
  answer: string;
  /** Other answers that also count as correct (same indentation rules as `answer`). */
  accept?: string[];
  /** A nudge shown on request (mini-markdown). */
  hint?: string;
  /** Why the answer works, shown after checking (mini-markdown). */
  explain: string;
  /** What `starter` + `answer` prints, exactly as python3 prints it. Shown as the expected output. */
  output?: string;
}

export type Slide =
  | { kind: 'text'; title?: string; body: string }
  | { kind: 'code'; title?: string; body?: string; code: string; output?: string }
  | ({ kind: 'quiz' } & QuizQuestion)
  | TypeSlide;

export interface Lesson {
  id: string;
  title: string;
  /** One emoji used as the lesson icon. */
  icon: string;
  /** One-line description. */
  blurb: string;
  minutes: number;
  slides: Slide[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Tag for Python code. Raw (backslashes preserved), drops the first newline
 * and any trailing whitespace. Indentation is kept exactly as written, so write
 * Python flush-left inside the template literal.
 */
export function py(strings: TemplateStringsArray, ...values: unknown[]): string {
  const raw = String.raw({ raw: strings.raw }, ...values);
  return raw.replace(/^\r?\n/, '').replace(/\s+$/, '');
}
