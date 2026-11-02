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
 * and every accepted answer) are also run, and must print exactly that output.
 * A few self-checks keep the typing kit's grading honest (e.g. curly quotes).
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { CATEGORIES } from '../src/content/categories';
import { CONTENT } from '../src/content/index';
import { FOUNDATIONS } from '../src/content/foundations';
import { parseSolution } from '../src/lib/parseSolution';
import { baseIndent, codeLines, gradeCode, lineKey, reindent } from '../src/lib/codegrade';
import { gradeGaps } from '../src/lib/gaps';
import { normalizeCode, stripComment } from '../src/lib/parseSolution';
import type { CategoryId, QuizQuestion } from '../src/content/types';

const args = process.argv.slice(2);
const wantAll = args.length === 0;
const errors: string[] = [];
const warnings: string[] = [];
/** Python to compile; with `output`, also run it and compare what it prints. */
const pyFiles: { label: string; code: string; output?: string }[] = [];

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
      } else {
        err(sw, `unknown slide kind`);
      }
    });
  });
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

for (const c of CATEGORIES) if (wantAll || args.includes(c.id)) checkCategory(c.id);
if (wantAll || args.includes('foundations')) checkFoundations();
checkTypingKit();

// Compile every Python snippet in one python3 process; run the ones that declare an output and
// compare what they print (exactly, apart from print's final newline).
if (pyFiles.length) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'intprep-py-'));
  const manifest = pyFiles.map((f, i) => {
    const file = path.join(dir, `s${i}.py`);
    fs.writeFileSync(file, f.code + '\n');
    return { label: f.label, file, output: f.output ?? null };
  });
  fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(manifest));
  const checker = `
import contextlib, io, json, signal, sys
m = json.load(open(sys.argv[1]))
bad = 0
ran = 0
def timeout(*_):
    raise TimeoutError("ran longer than 5 seconds")
signal.signal(signal.SIGALRM, timeout)
for e in m:
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
print("PYOK", len(m) - bad, "/", len(m), "ran", ran)
`;
  const out = execFileSync('python3', ['-I', '-c', checker, path.join(dir, 'manifest.json')], { stdio: ['ignore', 'pipe', 'inherit'] }).toString();
  for (const line of out.trim().split('\n')) {
    if (line.startsWith('PYERR')) errors.push('✗ ' + line.slice(6));
    else console.log(line.replace(/^PYOK (\d+ \/ \d+) ran (\d+)$/, '✓ python compiled $1, ran $2 snippets with their expected output'));
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
