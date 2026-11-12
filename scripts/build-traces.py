#!/usr/bin/env python3
"""
Build the step-by-step traces the guided lesson shows ("Watch it run"): each problem's own solution
is run on one small input with the judge's tracer (src/judge/judge.py), and every line it executes
is recorded with the variables at that moment. Writes src/content/traces/<unit>.json, one file per
unit, which the app loads when a lesson reaches that step.

    python3 scripts/build-traces.py            # every unit
    python3 scripts/build-traces.py trees      # some units

Rerun it after changing a solution or a problem's examples (`npm run validate:tests` fails when a
trace no longer matches its solution). Needs python3 and `npx tsx`.

Which input: the first example whose whole run fits in MAX_STEPS lines; else the shortest such run
among the examples and the extra tests (at least MIN_STEPS lines, so there is something to watch);
else the first example, cut off at MAX_STEPS.
"""
import hashlib
import json
import os
import signal
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, 'src', 'judge'))
import judge as J  # noqa: E402

MAX_STEPS = 70
MIN_STEPS = 6
OUT = os.path.join(ROOT, 'src', 'content', 'traces')


class Timeout(BaseException):
    pass


def alarm(*_):
    raise Timeout()


def run(p, text, limit):
    signal.signal(signal.SIGALRM, alarm)
    signal.setitimer(signal.ITIMER_REAL, 10)
    try:
        return json.loads(J.trace(dict(problem=p, input=text, maxSteps=limit)))
    except (Timeout, J.BadInput, RecursionError):
        return None
    except Exception:
        return None
    finally:
        signal.setitimer(signal.ITIMER_REAL, 0)


def code_hash(code):
    return hashlib.sha256(code.encode()).hexdigest()[:12]


def pick(p):
    """(trace, how it was chosen) for one problem."""
    full = []
    for k, text in enumerate(p['examples']):
        t = run(p, text, MAX_STEPS)
        if t and not t['truncated'] and len(t['steps']) >= MIN_STEPS:
            return t
        if t:
            full.append(t)
    best = None
    for text in p['examples'] + p['tests']:
        t = run(p, text, MAX_STEPS)
        if t and not t['truncated'] and len(t['steps']) >= MIN_STEPS and (best is None or len(t['steps']) < len(best['steps'])):
            best = t
    if best:
        return best
    if full:
        return full[0]
    # Every run is long (Valid Sudoku walks 81 cells): the start of the first one that runs.
    for text in p['tests']:
        t = run(p, text, MAX_STEPS)
        if t:
            return t
    return None


def compact(t, code):
    """Drop what the app can work out: a step keeps only the variables that changed since the last
    step of the same call (`v`), and the names that went away (`x`)."""
    steps, frames = [], {}
    for s in t['steps']:
        key = (s['d'], s['f'])
        # A new call at this depth starts from nothing.
        prev = frames.get(s['d'])
        if prev is None or prev[0] != key:
            prev = (key, {})
        changed = {k: v for k, v in s['v'].items() if prev[1].get(k) != v}
        gone = [k for k in prev[1] if k not in s['v']]
        frames[s['d']] = (key, dict(s['v']))
        for d in [d for d in frames if d > s['d']]:
            del frames[d]
        out = dict(l=s['l'], d=s['d'], f=s['f'], v=changed)
        if gone:
            out['x'] = gone
        if 'r' in s:
            out['r'] = s['r']
        steps.append(out)
    return dict(input=t['input'], steps=steps, result=t['result'], truncated=t['truncated'], code=code_hash(code))


def main():
    only = set(sys.argv[1:])
    raw = subprocess.run(['npx', 'tsx', os.path.join('scripts', 'judge-problems.ts')], cwd=ROOT, check=True, capture_output=True).stdout
    problems = json.loads(raw)['problems']
    units = {}
    for p in problems:
        units.setdefault(p['category'], []).append(p)
    os.makedirs(OUT, exist_ok=True)
    missing, total, size = [], 0, 0
    for unit, ps in units.items():
        if only and unit not in only:
            continue
        out = {}
        for p in ps:
            t = pick(p)
            if not t:
                missing.append(p['id'])
                continue
            out[p['id']] = compact(t, p['code'])
            total += 1
        path = os.path.join(OUT, unit + '.json')
        with open(path, 'w') as f:
            json.dump(out, f, separators=(',', ':'), ensure_ascii=False)
            f.write('\n')
        size += os.path.getsize(path)
    print(f'wrote {total} traces to src/content/traces ({size // 1024} kB)')
    if missing:
        print('no trace for: ' + ', '.join(missing))


if __name__ == '__main__':
    main()
