/*
 * Validates teaching content.
 *
 *   npm run validate                 # everything
 *   npm run validate -- trees heap   # just these categories
 *   npm run validate -- foundations  # just the beginner track
 *
 * Checks structure, the annotated-solution format, quiz answers, mini-markdown
 * balance, and compiles every Python solution/template with python3. Foundations
 * snippets that declare an `output` (code slides, and "Your turn" starter + answer
 * and every accepted answer) are also run, and must print exactly that output; a
 * slide's wrong options (`pick`) are run too, and must not. Picked slides follow
 * "Pick first, then type" (checkPickedIdeas).
 * A few self-checks keep the typing kit's grading honest (e.g. curly quotes).
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { CATEGORIES } from '../src/content/categories';
import { CONTENT, PROBLEM_BY_ID } from '../src/content/index';
import { FOUNDATIONS } from '../src/content/foundations';
import { isSignatureLine, lessonParts, parseSolution } from '../src/lib/parseSolution';
import { baseIndent, codeLines, gradeBest, gradeCode, indentOf, lineKey, reindent } from '../src/lib/codegrade';
import { gradeGaps } from '../src/lib/gaps';
import { normalizeCode, stripComment } from '../src/lib/parseSolution';
import type { CategoryId, QuizQuestion, TypeSlide } from '../src/content/types';
import { addDays, today } from '../src/lib/date';
import { gradeFrom, review, type SrsCard } from '../src/lib/srs';

const args = process.argv.slice(2);
const wantAll = args.length === 0;
const errors: string[] = [];
const warnings: string[] = [];
/**
 * Python to compile; with `output`, also run it and compare what it prints. A `wrong` snippet (a
 * slide's wrong option) may fail to compile or raise, but must not print `output`.
 */
const pyFiles: { label: string; code: string; output?: string; wrong?: boolean }[] = [];

const err = (where: string, msg: string) => errors.push(`✗ ${where}: ${msg}`);
const warn = (where: string, msg: string) => warnings.push(`⚠ ${where}: ${msg}`);

function checkMarkdown(where: string, text: string) {
  const ticks = (text.match(/`/g) || []).length;
  if (ticks % 2 !== 0) err(where, 'odd number of backticks (unclosed `code`)');
  const bolds = (text.match(/\*\*/g) || []).length;
  if (bolds % 2 !== 0) err(where, 'odd number of ** (unclosed bold)');
}

function checkQuiz(where: string, q: QuizQuestion) {
  if (!q.q?.trim()) err(where, 'quiz question text is empty');
  if (!Array.isArray(q.options) || q.options.length < 2 || q.options.length > 5)
    err(where, 'quiz needs 2–5 options');
  else if (!(q.answer >= 0 && q.answer < q.options.length)) err(where, `answer index ${q.answer} out of range`);
  if (new Set(q.options).size !== q.options.length) err(where, 'duplicate quiz options');
  if (!q.explain?.trim()) err(where, 'quiz explanation is empty');
  checkMarkdown(where, q.q);
  checkMarkdown(where, q.explain);
  q.options.forEach((o) => checkMarkdown(where, o));
}

function nonEmpty(where: string, field: string, v: unknown) {
  if (typeof v !== 'string' || !v.trim()) err(where, `"${field}" is empty`);
}

function checkCategory(cat: CategoryId) {
  const meta = CATEGORIES.find((c) => c.id === cat)!;
  const content = CONTENT[cat];
  const g = content.guide;
  const gw = `${cat}/guide`;
  if (!g || g.summary === 'Coming soon.') {
    err(gw, 'guide is still a placeholder');
  } else {
    if (g.category !== cat) err(gw, `category is "${g.category}"`);
    for (const f of ['summary', 'analogy', 'template', 'complexity'] as const) nonEmpty(gw, f, g[f]);
    if (g.whenToUse.length < 3) err(gw, 'whenToUse needs ≥ 3 items');
    if (g.templateNotes.length < 2) err(gw, 'templateNotes needs ≥ 2 items');
    if (g.quiz.length < 2) err(gw, 'quiz needs ≥ 2 questions');
    g.quiz.forEach((q, i) => checkQuiz(`${gw}/quiz[${i}]`, q));
    [g.summary, g.analogy, ...g.whenToUse, ...g.templateNotes].forEach((t) => checkMarkdown(gw, t));
    pyFiles.push({ label: `${gw}/template`, code: g.template });
  }

  const ids = content.problems.map((p) => p.id);
  for (const id of meta.problemIds) if (!ids.includes(id)) err(cat, `missing problem "${id}"`);
  for (const id of ids) if (!meta.problemIds.includes(id)) err(cat, `unexpected problem id "${id}"`);
  if (new Set(ids).size !== ids.length) err(cat, 'duplicate problem ids');

  for (const p of content.problems) {
    const w = `${cat}/${p.id}`;
    if (p.category !== cat) err(w, `category is "${p.category}"`);
    if (!['Easy', 'Medium', 'Hard'].includes(p.difficulty)) err(w, 'bad difficulty');
    if (!(p.num > 0)) err(w, 'num must be the LeetCode number');
    for (const f of ['title', 'pattern', 'prompt', 'brute', 'insight', 'mnemonic', 'solution', 'time', 'space', 'complexityWhy'] as const)
      nonEmpty(w, f, p[f]);
    if (!p.examples?.length) err(w, 'needs ≥ 1 example');
    p.examples?.forEach((e, i) => {
      nonEmpty(`${w}/examples[${i}]`, 'input', e.input);
      nonEmpty(`${w}/examples[${i}]`, 'output', e.output);
    });
    if ((p.signals?.length ?? 0) < 2) err(w, 'signals needs ≥ 2 items');
    if ((p.hints?.length ?? 0) < 2 || p.hints.length > 4) err(w, 'hints needs 2–4 items');
    if ((p.steps?.length ?? 0) < 3 || p.steps.length > 8) err(w, 'steps needs 3–8 items');
    if (new Set(p.steps).size !== p.steps.length) err(w, 'steps must be unique (used for ordering drills)');
    if ((p.pitfalls?.length ?? 0) < 2) err(w, 'pitfalls needs ≥ 2 items');
    if (p.mnemonic && p.mnemonic.split(/\s+/).length > 16) warn(w, 'mnemonic is long (aim for ≤ 12 words)');
    if (!/^O\(.+\)$/.test(p.time.split(' ')[0]) && !p.time.startsWith('O(')) warn(w, `time "${p.time}" should be Big-O like O(n)`);
    if (!p.space.startsWith('O(')) warn(w, `space "${p.space}" should be Big-O like O(1)`);
    (p.alsoAccept ?? []).forEach((a) => {
      if (!CATEGORIES.some((c) => c.id === a)) err(w, `alsoAccept has unknown category "${a}"`);
    });
    [p.prompt, p.brute, p.insight, ...p.hints, ...p.signals, ...p.pitfalls, ...p.steps, p.complexityWhy].forEach((t) =>
      checkMarkdown(w, t),
    );

    const parsed = parseSolution(p.solution);
    const body = parsed.chunks.filter((c) => !c.header);
    if (body.length < 2) err(w, 'solution needs ≥ 2 #@ chunks');
    if (!parsed.chunks[0]?.header) warn(w, 'solution has no header (class/def line before the first #@)');
    const keys = parsed.lines.filter((l) => l.key && !l.header);
    if (keys.length < 1) err(w, 'solution needs ≥ 1 key line marked with  #!');
    if (keys.length > 6) warn(w, `${keys.length} key lines — keep it to the 1–5 most important`);
    body.forEach((c, i) => {
      if (!c.explain) err(w, `chunk ${i} has an empty #@ explanation`);
      if (c.lines.length === 0) err(w, `chunk ${i} ("${c.explain.slice(0, 30)}") has no code`);
      if (c.lines.length > 9) warn(w, `chunk ${i} is ${c.lines.length} lines — split it so learners can digest it`);
      checkMarkdown(w, c.explain);
    });
    // The parts a learner writes (guided lesson, review's Write a part, Code from memory) are
    // asked for by their explanation alone in a review, with nothing after them shown.
    lessonParts(parsed).forEach(({ chunk, body: part }) => {
      const where = `"${chunk.explain.slice(0, 40)}"`;
      // A class-level signature is given only where a part opens; inside a part it would be typed.
      if (part.some(isSignatureLine)) err(w, `part ${where} has a class-level def inside it: start a new #@ chunk at it`);
      // A closing return one level out is part of what to write: the explanation must say so.
      const code = codeLines(part);
      const last = code[code.length - 1] ?? '';
      if (code.length > 1 && /^\s*return\b/.test(last) && indentOf(last) < indentOf(code[code.length - 2]) && !/\breturn/i.test(chunk.explain))
        err(w, `part ${where} ends with a dedented \`${last.trim()}\` its explanation does not mention`);
    });
    if (/\t/.test(p.solution)) err(w, 'solution contains tabs — use 4 spaces');
    pyFiles.push({ label: w, code: parsed.code });
    pyFiles.push({ label: `${w} (annotated)`, code: p.solution });
  }
}

function checkFoundations() {
  if (FOUNDATIONS.length === 0) {
    err('foundations', 'no lessons yet');
    return;
  }
  const ids = new Set<string>();
  FOUNDATIONS.forEach((l) => {
    const w = `foundations/${l.id}`;
    if (ids.has(l.id)) err(w, 'duplicate lesson id');
    ids.add(l.id);
    for (const f of ['id', 'title', 'icon', 'blurb'] as const) nonEmpty(w, f, l[f]);
    if (l.slides.length < 4) err(w, 'lesson needs ≥ 4 slides');
    if (!l.slides.some((s) => s.kind === 'quiz')) err(w, 'lesson needs ≥ 1 quiz slide');
    l.slides.forEach((s, i) => {
      const sw = `${w}/slide[${i}]`;
      if (s.kind === 'text') {
        nonEmpty(sw, 'body', s.body);
        checkMarkdown(sw, s.body);
      } else if (s.kind === 'code') {
        nonEmpty(sw, 'code', s.code);
        if (s.body) checkMarkdown(sw, s.body);
        pyFiles.push({ label: sw, code: s.code, output: s.output });
      } else if (s.kind === 'quiz') {
        checkQuiz(sw, s);
      } else if (s.kind === 'type') {
        // "Your turn": the learner writes code that is graded against answer + accept.
        nonEmpty(sw, 'prompt', s.prompt);
        nonEmpty(sw, 'answer', s.answer);
        nonEmpty(sw, 'explain', s.explain);
        [s.prompt, s.explain, s.hint ?? ''].forEach((t) => checkMarkdown(sw, t));
        if (s.hint !== undefined) nonEmpty(sw, 'hint', s.hint);
        if (s.output !== undefined) nonEmpty(sw, 'output', s.output);
        const answers = [s.answer, ...(s.accept ?? [])];
        if (s.accept?.some((a) => !a.trim())) err(sw, 'an "accept" answer is empty');
        if (new Set(answers.map((a) => codeLines(a).map(lineKey).join('\n'))).size !== answers.length)
          err(sw, '"accept" repeats the answer (or another accepted answer) after normalizing');
        if (answers.some((a) => /\t/.test(a)) || /\t/.test(s.starter ?? '')) err(sw, 'code contains tabs — use 4 spaces');
        // The editor starts at the answer's column and grading is anchored there (LessonPlayer), so
        // every accepted answer must start at that column too, and grade perfect against itself
        // typed the way a learner does: from the editor's column.
        const col = baseIndent(s.answer);
        answers.forEach((a) => {
          if (baseIndent(a) !== col) err(sw, `an accepted answer starts at column ${baseIndent(a)}, the answer at ${col}: ${a.trim().split('\n')[0]}`);
          const typed = a
            .split('\n')
            .map((l) => reindent(l, col, 0))
            .join('\n');
          if (!gradeCode(typed, a, { anchor: col }).perfect) err(sw, `answer does not grade as correct against itself: ${a.trim().split('\n')[0]}`);
        });
        // starter + answer (and starter + each accepted answer) must be valid Python.
        answers.forEach((a, k) =>
          pyFiles.push({ label: `${sw}/${k === 0 ? 'answer' : `accept[${k - 1}]`}`, code: s.starter ? `${s.starter}\n${a}` : a, output: s.output }),
        );
        if (s.pick !== undefined) checkPick(sw, s);
      } else {
        err(sw, `unknown slide kind`);
      }
    });
    // "Pick first, then type": the lesson's last "Your turn" slide is typed.
    const types = l.slides.filter((s): s is TypeSlide => s.kind === 'type');
    const last = types[types.length - 1];
    if (last?.pick) err(w, `the last "Your turn" slide ("${last.title ?? last.prompt.slice(0, 30)}") has wrong options: keep it typed`);
  });
  checkPickedIdeas();
}

/**
 * "Pick first, then type" across the track (docs/CONTENT_GUIDE.md, "Pick options"): a slide with
 * `pick` is the first exercise on each idea it names in `ideas`, and each of those ideas is typed
 * again later, on a slide without `pick` in the same lesson or the next one that names it too.
 * A typed slide's `ideas` must each be introduced by an earlier picked slide (a misspelled link fails).
 * Limits: the ideas are the author's labels. This cannot tell whether a slide's code really uses
 * an idea, whether a typed slide without `ideas` is the first exercise on something new (that
 * one should be picked), or whether the typed slide practices the idea well.
 */
function checkPickedIdeas() {
  const slides = FOUNDATIONS.flatMap((l, li) =>
    l.slides.flatMap((s, i) => (s.kind === 'type' ? [{ s, li, where: `foundations/${l.id}/slide[${i}]` }] : [])),
  );
  const firstOn = new Map<string, { where: string; picked: boolean }>();
  slides.forEach(({ s, li, where }, k) => {
    const ideas = s.ideas ?? [];
    if (ideas.some((d) => !d.trim())) err(where, 'an "ideas" entry is empty');
    if (new Set(ideas).size !== ideas.length) err(where, '"ideas" repeats an idea');
    if (s.pick) {
      if (!ideas.length) err(where, 'a slide with "pick" names the new ideas it introduces in "ideas"');
      for (const idea of ideas) {
        const seen = firstOn.get(idea);
        if (seen) err(where, `"${idea}" is already practiced at ${seen.where}: only the first exercise on an idea is picked`);
        const typedLater = slides.some((t, j) => j > k && !t.s.pick && t.li - li <= 1 && t.s.ideas?.includes(idea));
        if (!typedLater) err(where, `picked idea "${idea}" is never typed again: name it in "ideas" on a later typed slide in this lesson or the next`);
      }
    } else {
      for (const idea of ideas)
        if (!firstOn.get(idea)?.picked) err(where, `"${idea}" is in "ideas", but no earlier picked slide introduces it`);
    }
    for (const idea of ideas) if (!firstOn.has(idea)) firstOn.set(idea, { where, picked: !!s.pick });
  });
}

/** A snippet's comparison key with its indentation, as "Pick the right code" matches options. */
const blockKey = (code: string) =>
  codeLines(code)
    .map((l) => `${indentOf(l)}:${lineKey(l)}`)
    .join('\n');

/**
 * A "Your turn" slide's wrong options (`pick`, "Pick the right code"): 2–3 distinct snippets, each
 * written at its real column in the file like `answer`, none the answer or an accepted answer
 * (normalized line by line, indentation included) and none graded right against them; with an
 * `output`, none may print it (the python3 run below). The answer must not be the options' center.
 */
function checkPick(sw: string, s: TypeSlide) {
  const pick = s.pick ?? [];
  if (pick.length < 2 || pick.length > 3) err(sw, `"pick" needs 2–3 wrong options, has ${pick.length}`);
  // Picked or typed, the slide describes the task, not how to answer it.
  for (const [field, text] of [['title', s.title ?? ''], ['prompt', s.prompt]] as const)
    if (/(^|[.:;!?]\s+)(Write|Type|Pick)\b/.test(text)) err(sw, `the ${field} starts a sentence with "Write", "Type" or "Pick": describe the task, so it reads well picked or typed`);
  if (pick.some((p) => !p.trim())) err(sw, 'a "pick" option is empty');
  if (new Set(pick.map(blockKey)).size !== pick.length) err(sw, '"pick" repeats an option after normalizing');
  const answers = [s.answer, ...(s.accept ?? [])];
  const right = new Set(answers.map(blockKey));
  const col = baseIndent(s.answer);
  pick.forEach((p, k) => {
    const pw = `${sw}/pick[${k}]`;
    if (/\t/.test(p)) err(pw, 'code contains tabs — use 4 spaces');
    if (right.has(blockKey(p))) err(pw, 'equals the answer or an accepted answer after normalizing');
    // The pick is graded at its real columns (anchored at 0), as the lesson player grades it.
    else if (gradeBest(p, answers, { anchor: 0 }).grade.perfect) err(pw, 'grades as correct against the answer');
    if (codeLines(p).some((l) => indentOf(l) % 4 !== 0)) err(pw, 'indent with 4 spaces per level');
    if (Math.abs(baseIndent(p) - col) > 4) err(pw, `starts at column ${baseIndent(p)}, more than a level from the answer's ${col}`);
    if (s.output !== undefined) pyFiles.push({ label: pw, code: s.starter ? `${s.starter}\n${p}` : p, output: s.output, wrong: true });
  });
  // The answer must not be the one option the others are variations of: with each wrong option one
  // mistake away at a different place, the answer is the only one that agrees with the others
  // everywhere, and a guess of the most typical option wins. Each option's distance to the others,
  // summed, is a token edit distance (an indentation level counts as one token); the answer may tie
  // for the smallest total, but not have it alone.
  if (pick.length >= 2) {
    const toks = [s.answer, ...pick].map(codeTokens);
    const total = toks.map((t, i) => toks.reduce((sum, u, j) => (i === j ? sum : sum + editDistance(t, u)), 0));
    if (total[0] < Math.min(...total.slice(1)))
      err(sw, `"pick": the answer is the center of its options (token distance to the others: answer ${total[0]}, wrong options ${total.slice(1).join(', ')}); put every mistake at the same place, or make one option two of the others' mistakes together`);
  }
}

const TOKEN = /[A-Za-z_]\w*|\d[\d_]*(?:\.\d+)?|"(?:[^"\\]|\\.)*"?|'(?:[^'\\]|\\.)*'?|\*\*=?|\/\/=?|[=!<>]=|[-+*/%]=|->|\S/g;
/** A snippet as tokens: each code line's indentation (one token), then its words, numbers, strings and symbols. */
const codeTokens = (code: string) => codeLines(code).flatMap((l) => [`indent:${indentOf(l)}`, ...(stripComment(l).match(TOKEN) ?? [])]);
/** Levenshtein distance between two token lists. */
function editDistance(a: string[], b: string[]) {
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[b.length];
}

/**
 * The typing kit compares typed code with `normalizeCode` / `lineKey`. These cases pin the rules
 * that matter to learners, so a change that breaks them fails CI.
 */
function checkTypingKit() {
  const w = 'typing kit';
  const same: [string, string][] = [
    // Phones type curly quotes ("smart punctuation", on by default on iOS).
    ['print(\u201chi\u201d)', 'print("hi")'],
    ["s = \u2018a\u2019", "s = 'a'"],
    ['seen[\u2018key\u2019] = 1', 'seen["key"] = 1'],
    ['x = \u201ea\u201c', 'x = "a"'],
    ['print(\u201c#\u201d)  # a comment', 'print("#")'],
    ['if s == \u2018\u2019:', "if s == '':"],
    ['a+b', 'a + b'],
    ['f(x, y,)', 'f(x, y)'],
  ];
  for (const [typed, exp] of same) if (lineKey(typed) !== lineKey(exp)) err(w, `"${typed}" should match "${exp}"`);
  const differ: [string, string][] = [
    ['print(" ")', 'print("")'],
    ['forn in nums:', 'for n in nums:'],
    ['print(\u201cHi there\u201d)', 'print("Hithere")'],
  ];
  for (const [typed, exp] of differ) if (lineKey(typed) === lineKey(exp)) err(w, `"${typed}" should not match "${exp}"`);
  if (stripComment('print(\u201c#\u201d)  # note') !== 'print(\u201c#\u201d)  ') err(w, 'stripComment should keep a # inside curly quotes');
  if (normalizeCode('d = {\u2018a\u2019: 1}') !== normalizeCode('d = {"a": 1}')) err(w, 'normalizeCode should straighten curly quotes');
  if (!gradeCode('if s == \u2018\u2019:\n    return \u201cempty\u201d', 'if s == "":\n    return "empty"').perfect)
    err(w, 'gradeCode should accept curly quotes');
  if (!gradeGaps(['return \u2018\u2019.join(out)'], ["return ''.join(out)"]).perfect) err(w, 'gradeGaps should accept curly quotes');
}

/**
 * The scheduler's rules that a change could quietly break: a card pulled forward (a Pattern Blitz
 * miss sets its due day to today) is reviewed as early, so a miss never pushes it out further than
 * getting it right would have; a card that is simply due grows as usual; near misses are fuzzy.
 */
function checkScheduler() {
  const w = 'scheduler';
  const t = today();
  const card = (interval: number, lastAgo: number): SrsCard => ({ due: t, interval, ease: 2.5, reps: 5, lapses: 0, last: addDays(t, -lastAgo) });
  const pulled = card(53, 3);
  const good = review(pulled, 'good').interval;
  const hard = review(pulled, 'hard').interval;
  if (good > 10) err(w, `a 53-day card reviewed 3 days ago and pulled in (good) should get about 8 days, got ${good}`);
  if (hard > 53) err(w, `a pulled-in card graded hard should not grow past its interval, got ${hard}`);
  const sameDay = review(card(23, 0), 'good').interval;
  if (sameDay > 23) err(w, `a card reviewed again on the day it was reviewed should not grow, got ${sameDay}`);
  const due = review(card(53, 53), 'good').interval;
  if (due <= 53) err(w, `a card that is simply due (good) should grow past 53 days, got ${due}`);
  if (gradeFrom(2, 3) !== 'hard') err(w, 'one miss in three should be hard');
  if (gradeFrom(1 + 2 * 0.5, 3) !== 'hard') err(w, 'two near misses in three should be hard');
  if (gradeFrom(1, 3) !== 'again') err(w, 'two misses in three should be again');
  if (gradeFrom(3, 3) !== 'good') err(w, 'three right should be good');
}

// ── Choices: the options of picked code ────────────────────────────────────
// Every option set the app shows for picked code, rebuilt here with fixed seeds the way each screen
// builds it (Pick the key line, Pick the gaps and the one-line part in the review, the guided
// lesson's one-line parts and final gaps, Code from memory's gaps and part by part, Key lines,
// Template practice and the pattern guide's Your turn), plus the guided lesson's Arrange
// distractors. A wrong option must never mean the same as the answer (or be on a deny list: the
// one scripts/check-distractors.py writes, or the templates' own), two wrong options must never
// mean the same, an Arrange distractor is never a line of the solution, and every set a screen
// asks is a real pick: at least three options (`isRealPick`; a line with fewer is shown as given or
// another is asked). The answer must not be guessable from the set's shape: it may be the option
// closest to all the others (summed token edit distance) in at most 35% of the sets, and picking the
// shortest option may win at most 31% of the time (chance is about 25%).
import { answerIsCenter, canonKey, contextKey, gapChoices, isGivenLine, isRealPick, MIN_PICK_OPTIONS } from '../src/lib/choices';
import { arrangeBlocks } from '../src/lib/arrange';
import { arrangeableNow, keyLineDrill, keyLineIndices, keyLinePickable, oneLinePick, partPickable, reviewGaps, reviewParts } from '../src/lib/drills';
import { blitzKeyLines, keyLineChoices, keyLinePickable as blitzPickable, keyLineView } from '../src/lib/blitzLines';
import { gapSource, pickableGaps, pickGaps } from '../src/lib/gaps';
import { guideFor, PROBLEMS } from '../src/content/index';
import { DISTRACTOR_DENY, NO_DISTRACTOR_PARTS } from '../src/content/distractorDeny';
import { TEMPLATE_DENY } from '../src/content/templateDeny';
import { seededRandom } from '../src/lib/random';

const CENTER_MAX = 0.35;
const SHORTEST_MAX = 0.31;

function checkChoices() {
  const w = 'choices';
  const by = new Map<string, { sets: number; center: number; options: number; short: number; shortest: number; chance: number }>();
  const bad = new Set<string>();
  let denied: Readonly<Record<string, readonly string[]>> = {};
  const report = (where: string, msg: string) => {
    if (bad.size < 40 && !bad.has(`${where}: ${msg}`)) err(`${w}/${where}`, msg);
    bad.add(`${where}: ${msg}`);
  };
  const size = (s: string) => s.replace(/\s+/g, '').length;
  // `at`: the answer's line in its solution, for the deny list's own entry of a line whose code is
  // there twice (`lineKey@index`); without it, every such entry counts.
  const deniedFor = (answer: string, at?: number): readonly string[] | undefined => {
    const key = lineKey(answer);
    if (denied[key]) return denied[key];
    if (at !== undefined) return denied[`${key}@${at}`];
    const all = Object.entries(denied).filter(([k]) => k.startsWith(`${key}@`) && /^\d+$/.test(k.slice(key.length + 1)));
    return all.length ? all.flatMap(([, v]) => v) : undefined;
  };
  const look = (screen: string, where: string, answer: string, options: readonly string[], at?: number) => {
    const st = by.get(screen) ?? { sets: 0, center: 0, options: 0, short: 0, shortest: 0, chance: 0 };
    by.set(screen, st);
    st.sets++;
    st.options += options.length;
    if (options.length < 4) st.short++;
    if (!isRealPick(answer, options)) report(where, `${JSON.stringify(answer.trim())} is asked as a pick with ${options.length} option${options.length === 1 ? '' : 's'} (at least ${MIN_PICK_OPTIONS}): show it as given or ask another line`);
    const wrong = options.filter((o) => o !== answer);
    if (wrong.length === options.length) report(where, `the answer ${JSON.stringify(answer.trim())} is not among its options`);
    const key = canonKey(answer);
    const seen = new Set<string>();
    for (const o of wrong) {
      const k = canonKey(o);
      if (k === key) report(where, `${JSON.stringify(o.trim())} means the same as the answer ${JSON.stringify(answer.trim())}`);
      if (deniedFor(answer, at)?.some((d) => d === lineKey(o) || canonKey(d) === k)) report(where, `${JSON.stringify(o.trim())} runs like the answer (deny list) but is offered`);
      if (seen.has(k)) report(where, `two wrong options mean the same: ${JSON.stringify(o.trim())}`);
      seen.add(k);
    }
    if (answerIsCenter([answer, ...wrong])) st.center++;
    // A guess of the shortest option (ties shared).
    const lens = options.map(size);
    const min = Math.min(...lens);
    const ties = lens.filter((l) => l === min).length;
    if (size(answer) === min) st.shortest += 1 / ties;
    st.chance += 1 / Math.max(1, options.length);
  };
  // How many lines are given rather than picked (bare structure, or too few options), for the record.
  let keyGiven = 0;
  let keyTotal = 0;
  let partGiven = 0;
  let partLines = 0;
  for (const p of PROBLEMS) {
    const parsed = parseSolution(p.solution);
    const all = parsed.lines.map((l) => l.text);
    denied = DISTRACTOR_DENY[contextKey(all)] ?? {};
    // A part's body line `j` as a line of the solution.
    const lineAt = (lp: { ci: number; lead: readonly string[] }, j: number) => parsed.lines.findIndex((l) => l.chunk === lp.ci) + lp.lead.length + j;
    // Pick the key line: only key lines that are a real pick are dealt picked (`pickKeyLine`).
    for (const i of keyLineIndices(p)) {
      keyTotal++;
      if (!keyLinePickable(p, i)) {
        keyGiven++;
        continue;
      }
      const d = keyLineDrill(p, undefined, i, seededRandom(i + 1))!;
      look('review: Pick the key line', `${p.id}:${i + 1}`, d.option, d.options, i);
    }
    const src = gapSource(p.solution);
    for (const seed of [0, 2]) {
      const g = reviewGaps(p, seed);
      const set = pickableGaps(g.lines, g.gaps, seed, { exclude: g.header, keyLines: g.keyLines });
      set.choices.forEach((c, k) => look('review: Pick the gaps', `${p.id}:${set.gaps[k] + 1}`, c.answer, c.options, set.gaps[k]));
    }
    // The review's one-line part (only parts that are a real pick are dealt picked: `pickPart`).
    for (const lp of reviewParts(p).values()) {
      if (codeLines(lp.body).length !== 1 || !partPickable(p, lp)) continue;
      const c = oneLinePick(p, lp.ci, 0).choice;
      look('review: one-line part', `${p.id}/part ${lp.ci}`, c.answer, c.options, lineAt(lp, lp.body.findIndex((l) => stripComment(l).trim())));
    }
    const parts = lessonParts(parsed);
    parts.forEach((lp) => {
      const code = codeLines(lp.body);
      const keyLines = lp.chunk.keyLines.map((j) => j - lp.lead.length).filter((j) => j >= 0 && j < lp.body.length);
      if (code.length > 1) {
        const set = arrangeBlocks(lp.body, 0, { keyLines, avoid: all });
        const x = set.blocks.find((b) => b.distractor);
        if (x && all.some((l) => l.trim() && lineKey(l) === lineKey(x.text))) report(`${p.id}/part ${lp.ci}`, `the Arrange distractor ${JSON.stringify(x.text.trim())} is a line of the solution`);
        if (x && canonKey(x.text) === canonKey(set.expected.find((_, k) => `b${k}` === x.pair) ?? '')) report(`${p.id}/part ${lp.ci}`, `the Arrange distractor ${JSON.stringify(x.text.trim())} means the same as its line`);
        return;
      }
      const line = lp.body.find((l) => stripComment(l).trim()) ?? '';
      if (!line) return;
      const later = parsed.chunks.slice(lp.ci + 1).flatMap((c) => c.lines);
      const c = gapChoices([line], [0], 0, 3, later, { context: all, visible: [...parsed.chunks.slice(0, lp.ci).flatMap((x) => x.lines), ...lp.lead] })[0];
      // A line that is no real pick is shown as given (ProblemLesson's pickLines).
      if (isRealPick(line, c.options)) look('lesson: one-line part', `${p.id}/part ${lp.ci}`, c.answer, c.options, lineAt(lp, lp.body.indexOf(line)));
    });
    const keys = new Set(src.keyLines.map((i) => lineKey(src.lines[i])).filter(Boolean));
    const header = new Set(src.header);
    const min = Math.max(1, src.lines.filter((l, i) => !header.has(i) && keys.has(lineKey(l))).length);
    const lessonGaps = pickableGaps(src.lines, pickGaps(src.lines, { keyLines: src.keyLines, exclude: src.header, min }), 0, { exclude: src.header, keyLines: src.keyLines });
    lessonGaps.choices.forEach((c, k) => look('lesson: Pick the gaps', `${p.id}:${lessonGaps.gaps[k] + 1}`, c.answer, c.options, lessonGaps.gaps[k]));
    for (const round of [0, 1]) {
      const set = pickableGaps(src.lines, pickGaps(src.lines, { keyLines: src.keyLines, exclude: src.header, seed: round }), round, { exclude: src.header, keyLines: src.keyLines });
      set.choices.forEach((c, k) => look('Code from memory: Pick the gaps', `${p.id}:${set.gaps[k] + 1}`, c.answer, c.options, set.gaps[k]));
    }
    const header2 = parsed.chunks.filter((c) => c.header).flatMap((c) => c.lines);
    parts.forEach((cur, step) => {
      const lines = cur.body.filter((l) => l.trim());
      lines.forEach((tapLine, k) => {
        if (!stripComment(tapLine).trim()) return;
        const later = [...lines.slice(k + 1), ...parts.slice(step + 1).flatMap((b) => b.body)];
        const shown = [...header2, ...parts.slice(0, step).flatMap((b) => b.chunk.lines), ...cur.lead, ...lines.slice(0, k)];
        const c = gapChoices([tapLine], [0], 7 + step * 101 + k, 3, later, { context: all, visible: shown })[0];
        partLines++;
        // Rebuild's PartsSession shows a line that is no real pick as given.
        if (isRealPick(tapLine, c.options)) look('Code from memory: part by part', `${p.id}/part ${cur.ci}`, c.answer, c.options, lineAt(cur, cur.body.flatMap((l, j) => (l.trim() ? [j] : []))[k]));
        else partGiven++;
      });
    });
    for (const k of blitzKeyLines(p)) {
      if (!blitzPickable(p, k)) continue;
      const c = keyLineChoices(p, k, keyLineView(p, k), 7919 * (k + 1));
      look('Key lines', `${p.id}:${k + 1}`, c.answer, c.options, k);
    }
  }
  // The deny lists still match: each key is a solution's (or template's) `contextKey`, and each
  // answer one of its lines. A solution edited since the list was made would lose its entries.
  const solutionKeys = new Map(PROBLEMS.map((p) => [contextKey(parseSolution(p.solution).lines.map((l) => l.text)), p.id]));
  for (const [key, lines] of Object.entries(DISTRACTOR_DENY)) {
    const id = solutionKeys.get(key);
    if (!id) report('deny list', `src/content/distractorDeny.ts has entries for a solution that no longer exists (key ${key}): run python3 scripts/check-distractors.py`);
    else {
      const sol = parseSolution(PROBLEM_BY_ID[id].solution).lines.map((l) => lineKey(stripComment(l.text)));
      const have = new Set(sol);
      for (const a of Object.keys(lines)) {
        // `lineKey@index`: the line at that index has that code.
        const at = a.match(/^(.*)@(\d+)$/);
        if (at ? sol[Number(at[2])] !== at[1] : !have.has(a)) report('deny list', `${id}: no line ${JSON.stringify(a)}: run python3 scripts/check-distractors.py`);
      }
    }
  }
  const templateKeys = new Map<string, string>();
  for (const c of CATEGORIES) {
    const g = guideFor(c.id);
    if (g) templateKeys.set(contextKey(gapSource(g.template).lines), c.id);
  }
  for (const [key, lines] of Object.entries(TEMPLATE_DENY)) {
    const cat = templateKeys.get(key);
    if (!cat) {
      report('template deny list', `src/content/templateDeny.ts has entries for a template that changed (key ${key}): recheck them and use the template's new key`);
      continue;
    }
    const have = new Set(gapSource(guideFor(cat as CategoryId)!.template).lines.map((l) => lineKey(stripComment(l))));
    for (const a of Object.keys(lines)) if (!have.has(a)) report('template deny list', `${cat}: no line ${JSON.stringify(a)}`);
  }
  for (const c of CATEGORIES) {
    const g = guideFor(c.id);
    if (!g) continue;
    const src = gapSource(g.template);
    denied = TEMPLATE_DENY[contextKey(src.lines)] ?? {};
    for (const round of [0, 1, 2, 3]) {
      const set = pickableGaps(src.lines, pickGaps(src.lines, { keyLines: src.keyLines, exclude: src.header, seed: round }), round, { exclude: src.header, keyLines: src.keyLines });
      set.choices.forEach((x, k) => look('Template practice: Pick the gaps', `template ${c.id}:${set.gaps[k] + 1}`, x.answer, x.options));
    }
    const set = pickableGaps(src.lines, pickGaps(src.lines, { keyLines: src.keyLines, exclude: src.header, min: 2 }), 0, { exclude: src.header, keyLines: src.keyLines });
    set.choices.forEach((x, k) => look('pattern guide: Your turn', `template ${c.id}:${set.gaps[k] + 1}`, x.answer, x.options));
  }
  // The precomputed list of two-line parts without a distractor is current.
  const noDistractor = PROBLEMS.flatMap((p) => lessonParts(parseSolution(p.solution)).flatMap((lp) => (arrangeableNow(p, lp) ? [] : [`${p.id}:${lp.ci}`])));
  if (JSON.stringify(noDistractor) !== JSON.stringify(NO_DISTRACTOR_PARTS))
    err(w, `src/content/distractorDeny.ts is out of date (parts without an Arrange distractor: ${noDistractor.join(', ') || 'none'}): run python3 scripts/check-distractors.py`);
  let sets = 0;
  let center = 0;
  let shortest = 0;
  let chance = 0;
  for (const [screen, st] of by) {
    sets += st.sets;
    center += st.center;
    shortest += st.shortest;
    chance += st.chance;
    console.log(
      `✓ ${screen}: ${st.sets} option sets, ${(st.options / st.sets).toFixed(2)} options on average (${st.short} with 3), answer is the center in ${((100 * st.center) / st.sets).toFixed(1)}%, the shortest in ${((100 * st.shortest) / st.sets).toFixed(1)}%`,
    );
  }
  console.log(
    `✓ all screens: ${sets} option sets, answer is the center in ${((100 * center) / sets).toFixed(1)}% (at most ${100 * CENTER_MAX}%), the shortest in ${((100 * shortest) / sets).toFixed(1)}% (at most ${100 * SHORTEST_MAX}%, chance ${((100 * chance) / sets).toFixed(1)}%)`,
  );
  console.log(`✓ given, not picked: ${keyGiven} of ${keyTotal} key lines (typed only), ${partGiven} of ${partLines} lines of Code from memory's part by part`);
  if (center > CENTER_MAX * sets) err(w, `the answer is the center of its options in ${((100 * center) / sets).toFixed(1)}% of ${sets} sets (at most ${100 * CENTER_MAX}%): build wrong options at one site or as a 2x2 (src/lib/choices.ts)`);
  if (shortest > SHORTEST_MAX * sets)
    err(w, `picking the shortest option wins ${((100 * shortest) / sets).toFixed(1)}% of ${sets} sets (chance ${((100 * chance) / sets).toFixed(1)}%, at most ${100 * SHORTEST_MAX}%): mix longer and shorter wrong options (src/lib/choices.ts)`);
  if (bad.size > 40) err(w, `…and ${bad.size - 40} more`);
}

for (const c of CATEGORIES) if (wantAll || args.includes(c.id)) checkCategory(c.id);
checkScheduler();
if (wantAll || args.includes('foundations')) checkFoundations();
checkTypingKit();
if (wantAll || args.includes('choices')) checkChoices();

// Compile every Python snippet in one python3 process; run the ones that declare an output and
// compare what they print (exactly, apart from print's final newline).
if (pyFiles.length) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'intprep-py-'));
  const manifest = pyFiles.map((f, i) => {
    const file = path.join(dir, `s${i}.py`);
    fs.writeFileSync(file, f.code + '\n');
    return { label: f.label, file, output: f.output ?? null, wrong: !!f.wrong };
  });
  fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(manifest));
  const checker = `
import contextlib, io, json, signal, sys
m = json.load(open(sys.argv[1]))
bad = 0
ran = 0
wrong = 0
def timeout(*_):
    raise TimeoutError("ran too long")
signal.signal(signal.SIGALRM, timeout)
class Capped(io.StringIO):
    # A wrong option may loop forever printing: stop it once it has printed far more than the answer.
    def __init__(self, cap):
        super().__init__()
        self.cap = cap
    def write(self, s):
        if self.tell() + len(s) > self.cap:
            raise OverflowError("printed too much")
        return super().write(s)
for e in m:
    if e["wrong"]:
        # A wrong option may fail to compile or raise (that is often the mistake); it must not print the output.
        wrong += 1
        try:
            code = compile(open(e["file"]).read(), e["label"], "exec")
        except SyntaxError:
            continue
        buf = Capped(4 * len(e["output"]) + 1000)
        try:
            signal.setitimer(signal.ITIMER_REAL, 1.0)
            with contextlib.redirect_stdout(buf):
                exec(code, {"__name__": "__main__"})
        except BaseException:
            pass
        finally:
            signal.setitimer(signal.ITIMER_REAL, 0)
        got = buf.getvalue()
        if got == e["output"] or got == e["output"] + "\\n":
            bad += 1
            print("PYERR", e["label"], "is a wrong option but prints the expected output", json.dumps(got))
        continue
    try:
        code = compile(open(e["file"]).read(), e["label"], "exec")
    except SyntaxError as ex:
        bad += 1
        print("PYERR", e["label"], "line", ex.lineno, ":", ex.msg)
        continue
    if e["output"] is None:
        continue
    ran += 1
    buf = io.StringIO()
    try:
        signal.alarm(5)
        with contextlib.redirect_stdout(buf):
            exec(code, {"__name__": "__main__"})
    except BaseException as ex:
        bad += 1
        print("PYERR", e["label"], "raised", type(ex).__name__ + ":", ex)
        continue
    finally:
        signal.alarm(0)
    got = buf.getvalue()
    if got != e["output"] and got != e["output"] + "\\n":
        bad += 1
        print("PYERR", e["label"], "prints", json.dumps(got), "but output is", json.dumps(e["output"]))
print("PYOK", len(m) - wrong - bad, "/", len(m) - wrong, "ran", ran, "wrong", wrong)
`;
  const out = execFileSync('python3', ['-I', '-c', checker, path.join(dir, 'manifest.json')], { stdio: ['ignore', 'pipe', 'inherit'] }).toString();
  for (const line of out.trim().split('\n')) {
    if (line.startsWith('PYERR')) errors.push('✗ ' + line.slice(6));
    else
      console.log(
        line.replace(
          /^PYOK (-?\d+ \/ \d+) ran (\d+) wrong (\d+)$/,
          '✓ python compiled $1, ran $2 snippets with their expected output and $3 wrong options without it',
        ),
      );
  }
  fs.rmSync(dir, { recursive: true, force: true });
}

const total = CATEGORIES.filter((c) => wantAll || args.includes(c.id)).reduce(
  (n, c) => n + CONTENT[c.id].problems.length,
  0,
);
console.log(`✓ ${total} problems checked`);
warnings.forEach((w) => console.log(w));
errors.forEach((e) => console.log(e));
if (errors.length) {
  console.log(`\n${errors.length} error(s)`);
  process.exit(1);
}
console.log('\nAll good ✨');
