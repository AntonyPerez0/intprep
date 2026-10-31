// A compact Python syntax highlighter that returns React nodes per line.

import type { ReactNode } from 'react';

const KEYWORDS = new Set(
  'and as assert break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield'.split(
    ' ',
  ),
);
const CONSTANTS = new Set(['True', 'False', 'None', 'self']);
const BUILTINS = new Set(
  'abs all any bin bool chr defaultdict deque dict divmod enumerate filter float heapq int isinstance len list map max min next ord pow print range reversed round set sorted str sum tuple zip Counter collections heappush heappop heapify cache lru_cache inf math float List Optional ListNode TreeNode Node'.split(
    ' ',
  ),
);

const TOKEN =
  /(#.*$)|("""[\s\S]*?"""|'''[\s\S]*?'''|f?"(?:\\.|[^"\\])*"|f?'(?:\\.|[^'\\])*')|(@[A-Za-z_][\w.]*)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_]\w*)|(\s+)|([^\sA-Za-z_\d])/g;

export function highlightLine(line: string): ReactNode[] {
  const out: ReactNode[] = [];
  let prev = '';
  let m: RegExpExecArray | null;
  TOKEN.lastIndex = 0;
  let k = 0;
  while ((m = TOKEN.exec(line))) {
    const [tok, comment, str, deco, num, ident] = m;
    if (comment) out.push(<span key={k++} className="tk-com">{tok}</span>);
    else if (str) out.push(<span key={k++} className="tk-str">{tok}</span>);
    else if (deco) out.push(<span key={k++} className="tk-deco">{tok}</span>);
    else if (num) out.push(<span key={k++} className="tk-num">{tok}</span>);
    else if (ident) {
      let cls = '';
      if (KEYWORDS.has(tok)) cls = 'tk-kw';
      else if (CONSTANTS.has(tok)) cls = 'tk-const';
      else if (prev === 'def' || prev === 'class') cls = 'tk-fn';
      else if (BUILTINS.has(tok)) cls = 'tk-bi';
      out.push(cls ? <span key={k++} className={cls}>{tok}</span> : tok);
      prev = tok;
      continue;
    } else out.push(tok);
    if (!/^\s+$/.test(tok)) prev = tok;
  }
  return out;
}

export function HighlightedCode({ code, className }: { code: string; className?: string }) {
  return (
    <pre className={`code ${className ?? ''}`}>
      {code.split('\n').map((l, i) => (
        <div key={i} className="code-line">
          {l === '' ? '\u00a0' : highlightLine(l)}
        </div>
      ))}
    </pre>
  );
}
