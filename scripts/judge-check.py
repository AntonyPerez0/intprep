#!/usr/bin/env python3
"""
Check the tests "run my code" uses (src/content/tests/) with the judge itself (src/judge/judge.py):

    python3 scripts/judge-check.py                 # every problem
    python3 scripts/judge-check.py trees graphs    # some units, or problem ids
    python3 scripts/judge-check.py --min 6         # also fail a problem with fewer than 6 extra tests

For each problem it runs the problem's own solution as if a learner had typed it: every example and
every extra test must be readable and pass, no test may make the solution fail or run long, each
example's stated `output` must be what the solution returns (where the output is a plain value), and
every derivation stage (src/content/derivations.ts) must pass the same tests. Needs python3 and `npx tsx`.
"""
import json
import os
import signal
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, 'src', 'judge'))
import judge as J  # noqa: E402


class Timeout(BaseException):
    pass


def alarm(*_):
    raise Timeout()


def with_timeout(fn, seconds=20):
    signal.signal(signal.SIGALRM, alarm)
    signal.setitimer(signal.ITIMER_REAL, seconds)
    try:
        return fn()
    finally:
        signal.setitimer(signal.ITIMER_REAL, 0)


def stated(output):
    """An example's `output` as a value, or None when it is prose (design classes, 'any order' notes)."""
    try:
        return J.ser(J.parse_val(output))
    except Exception:
        return None


def check(p, min_tests):
    errs, warns = [], []
    S = J.setup(p)
    # Every input must be readable (except examples written in words, which are skipped but counted).
    unreadable = []
    for kind, items in (('example', p['examples']), ('test', p['tests'])):
        for k, text in enumerate(items):
            try:
                if S['kind'] == 'fn':
                    J.build_args(S, text)
                elif S['kind'] == 'design':
                    J.design_ops(S, text)
                else:
                    J.codec_value(S, text)
            except J.BadInput as e:
                (unreadable if kind == 'example' else errs).append(f'{kind}[{k}] cannot be read ({e}): {text[:70]}')
    if unreadable and len(unreadable) < len(p['examples']):
        errs += unreadable
    elif unreadable:
        warns.append(f'its {len(unreadable)} examples are written in words: only the extra tests run')
    if len(set(p['tests'])) != len(p['tests']):
        errs.append('a test is repeated')
    dup = set(p['tests']) & set(p['examples'])
    if dup:
        errs.append(f'a test repeats an example: {sorted(dup)[0][:60]}')
    if len(p['tests']) < min_tests:
        errs.append(f'has {len(p["tests"])} extra tests, needs at least {min_tests}')
    try:
        res = with_timeout(lambda: json.loads(J.judge(dict(problem=p, user=p['code'], mode='submit'))))
    except Timeout:
        return errs + ['the solution ran for more than 20 s on its tests'], warns
    except Exception as e:
        return errs + [f'the judge failed: {type(e).__name__}: {e}'], warns
    if res['status'] != 'done':
        return errs + [f'the solution does not load: {res.get("error")}'], warns
    for r in res['results']:
        if not r['passed']:
            errs.append(f'the solution fails its own test {r["input"][:70]}: {r.get("error") or r.get("got")}')
        if r.get('refSteps', 0) > 300_000:
            warns.append(f'slow test ({r["refSteps"]} steps): {r["input"][:60]}')
    # The examples' stated outputs.
    if S['kind'] == 'fn' and p['id'] not in J.CHECKS:
        shown = {r['input']: r for r in res['results'] if r['example']}
        for text, output in zip(p['examples'], p['outputs']):
            r, want = shown.get(text), stated(output)
            if r is None or want is None:
                continue
            got = stated(r['want'])
            if S['any_order']:
                want, got = J.ser(J.parse_val(output), any_order=S['any_order']), J.ser(J.parse_val(r['want']), any_order=S['any_order'])
            if json.dumps(got) != json.dumps(want):
                errs.append(f'example {text[:50]}: output says {output[:50]}, the solution returns {r["want"][:50]}')
    # Derivation stages are complete answers: they pass the same tests.
    for st in p.get('stages', []):
        try:
            sr = with_timeout(lambda: json.loads(J.judge(dict(problem=p, user=st['code'], mode='submit'))), 60)
        except Timeout:
            errs.append(f'stage "{st["title"]}" ran for more than 60 s')
            continue
        if sr['status'] != 'done':
            errs.append(f'stage "{st["title"]}" does not load: {sr.get("error")}')
            continue
        # A brute force is meant to be too slow for the larger tests: being stopped there is right.
        slow_ok = st['title'] in ('Plain recursion', 'Brute force')
        for r in sr['results']:
            if not r['passed'] and not (slow_ok and (r.get('error') or {}).get('type') == 'TimeLimit'):
                errs.append(f'stage "{st["title"]}" fails {r["input"][:60]}: {r.get("error") or r.get("got")} (want {r.get("want")})')
                break
    return errs, warns


def main():
    args = sys.argv[1:]
    min_tests = 0
    if '--min' in args:
        k = args.index('--min')
        min_tests = int(args[k + 1])
        args = args[:k] + args[k + 2:]
    quiet = '--quiet' in args
    only = {a for a in args if not a.startswith('--')}
    raw = subprocess.run(['npx', 'tsx', os.path.join('scripts', 'judge-problems.ts')], cwd=ROOT, check=True, capture_output=True).stdout
    data = json.loads(raw)
    problems = [p for p in data['problems'] if not only or p['id'] in only or p['category'] in only]
    bad = 0
    for ident in data['unknownTests']:
        print(f'✗ tests: no problem with id {ident}')
        bad += 1
    for ident in data['unknownStages']:
        print(f'✗ derivations: no problem with id {ident}')
        bad += 1
    total = with_tests = 0
    for p in problems:
        errs, warns = check(p, min_tests)
        total += len(p['tests'])
        with_tests += 1 if p['tests'] else 0
        for w in warns:
            if not quiet:
                print(f'⚠ {p["category"]}/{p["id"]}: {w}')
        for e in errs:
            print(f'✗ {p["category"]}/{p["id"]}: {e}')
        bad += len(errs)
    # Every problem has a trace ("Watch it run"), made from the solution as it is now.
    import hashlib
    traces = {}
    tdir = os.path.join(ROOT, 'src', 'content', 'traces')
    for name in sorted(os.listdir(tdir)) if os.path.isdir(tdir) else []:
        if name.endswith('.json'):
            with open(os.path.join(tdir, name)) as f:
                for pid, t in json.load(f).items():
                    traces[pid] = (name[:-5], t)
    for p in problems:
        got = traces.get(p['id'])
        n = len(p['code'].split('\n'))
        if not got:
            print(f'✗ {p["category"]}/{p["id"]}: no trace: run python3 scripts/build-traces.py')
            bad += 1
        elif got[0] != p['category'] or got[1].get('code') != hashlib.sha256(p['code'].encode()).hexdigest()[:12]:
            print(f'✗ {p["category"]}/{p["id"]}: its trace was made from an older solution (or sits in another unit\'s file): run python3 scripts/build-traces.py')
            bad += 1
        elif any(not 0 <= s['l'] < n for s in got[1]['steps']):
            print(f'✗ {p["category"]}/{p["id"]}: its trace points past the end of the solution: run python3 scripts/build-traces.py')
            bad += 1
    if not only:
        for pid in set(traces) - {p['id'] for p in problems}:
            print(f'✗ traces: {traces[pid][0]}.json has a trace for {pid}, which is not a problem: run python3 scripts/build-traces.py')
            bad += 1
    stages = sum(len(p.get('stages', [])) for p in problems)
    print(f'{"✗" if bad else "✓"} judge: {len(problems)} solutions run on their examples and {total} extra tests ({with_tests} problems have extra tests), {stages} derivation stages')
    sys.exit(1 if bad else 0)


if __name__ == '__main__':
    main()
