// For a learner who said they are new to coding and still has beginner lessons left: a note on
// the pages that lead into pattern lessons (a unit, a problem, the pattern guide). Nothing is
// locked; the note says what the lesson ahead assumes and links to their next beginner lesson.

import { Link } from 'react-router-dom';
import { ArrowRight, Sprout } from 'lucide-react';
import { FOUNDATIONS } from '../content/index';
import type { Progress } from '../lib/store';

export function BeginnerNote({ p, what }: { p: Progress; what: string }) {
  if (p.settings.experience !== 'none') return null;
  const left = FOUNDATIONS.filter((l) => !p.lessonsDone[`f:${l.id}`]);
  if (!left.length) return null;
  return (
    <div className="callout callout-info beginner-note">
      <Sprout aria-hidden="true" />
      <div>
        <strong>
          {left.length} beginner {left.length === 1 ? 'lesson' : 'lessons'} to go.
        </strong>{' '}
        {what} assumes what they teach: lists, dicts, functions, classes and Big-O. You can jump in, but it will make sense faster after them.{' '}
        <Link to={`/foundations/${left[0].id}`} className="beginner-note-link">
          Next lesson: {left[0].title}
          <ArrowRight aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
