import type { CSSProperties } from 'react';

export type PipMood = 'happy' | 'cheer' | 'sad' | 'think';

const BODY = '#9be7b4';
const SHADE = '#62c987';
const INK = '#1e1b16';

/**
 * Pip, IntPrep's mascot: a keycap with a face, drawn as a sticker (the ink outline and the blink
 * are in components.css, `.pip`). A key belongs to no programming language, so Pip stays when the
 * app teaches more than Python. Decorative unless `label` is given. Same colors in both themes.
 */
export function Pip({
  size = 64,
  mood = 'happy',
  className = '',
  label,
  style,
}: {
  size?: number;
  mood?: PipMood;
  className?: string;
  label?: string;
  style?: CSSProperties;
}) {
  const look = mood === 'think' ? [2, -2.5] : mood === 'sad' ? [0, 2.5] : [1.5, 1];
  return (
    <svg
      className={`pip pip-${mood} ${className}`}
      width={size}
      height={Math.round((size * 116) / 120)}
      viewBox="0 0 120 116"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      style={style}
    >
      {/* feet, the key's side wall, then its top face */}
      <ellipse cx="42" cy="107" rx="11" ry="6" fill={SHADE} />
      <ellipse cx="78" cy="107" rx="11" ry="6" fill={SHADE} />
      <rect x="15" y="30" width="90" height="74" rx="20" fill={SHADE} />
      <rect x="21" y="16" width="78" height="70" rx="18" fill={BODY} />
      <rect x="31" y="23" width="30" height="6" rx="3" fill="#fff" opacity=".5" />
      {mood === 'cheer' ? (
        <g fill="none" stroke={INK} strokeWidth="3.6" strokeLinecap="round">
          <path d="M38.5 49q7.5-9 15 0" />
          <path d="M66.5 49q7.5-9 15 0" />
        </g>
      ) : (
        <g className="pip-eyes">
          <circle cx="46" cy="46" r="9" fill="#fff" />
          <circle cx="74" cy="46" r="9" fill="#fff" />
          <circle cx={46 + look[0]} cy={46 + look[1]} r="4.7" fill={INK} />
          <circle cx={74 + look[0] - 3} cy={46 + look[1]} r="4.7" fill={INK} />
          <circle cx={47.7 + look[0]} cy={44 + look[1]} r="1.7" fill="#fff" />
          <circle cx={72.7 + look[0]} cy={44 + look[1]} r="1.7" fill="#fff" />
        </g>
      )}
      <ellipse cx="33" cy="59" rx="5" ry="3.2" fill="#ff8fb1" opacity=".85" />
      <ellipse cx="87" cy="59" rx="5" ry="3.2" fill="#ff8fb1" opacity=".85" />
      {mood === 'cheer' ? (
        <path d="M51 59h18q-2 11-9 11t-9-11z" fill={INK} />
      ) : (
        <path
          d={mood === 'sad' ? 'M54 66q6-5 12 0' : mood === 'think' ? 'M55 64q5 1 10-1' : 'M53 61q7 6 14 0'}
          fill="none"
          stroke={INK}
          strokeWidth="3"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

const SYMBOLS = ['{', '}', '[', ']', '(', ')', ':', '=', '#', '+'];
const COLORS = ['var(--sun)', 'var(--mint)', 'var(--tomato)', 'var(--brand-400)', 'var(--rose)'];

/** Code-symbol confetti for an end screen. Purely decorative; hidden when motion is reduced. */
export function Confetti({ count = 32 }: { count?: number }) {
  return (
    <div className="confetti" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => {
        // Spread without a random source, so a re-render never reshuffles the pieces.
        const left = (i * 37 + 11) % 100;
        const delay = ((i * 53) % 60) / 100;
        const drift = ((i * 29) % 120) - 60;
        const spin = ((i * 97) % 720) - 360;
        return (
          <i
            key={i}
            style={
              {
                left: `${left}%`,
                color: COLORS[i % COLORS.length],
                animationDelay: `${delay}s`,
                '--x': `${drift}px`,
                '--r': `${spin}deg`,
              } as CSSProperties
            }
          >
            {SYMBOLS[i % SYMBOLS.length]}
          </i>
        );
      })}
    </div>
  );
}
