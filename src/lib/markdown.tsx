// Minimal, safe markdown: paragraphs, "- " bullets, ``` code blocks, `code`,
// **bold**, *italic*. Renders React elements (never raw HTML).

import { Fragment, type ReactNode } from 'react';
import { HighlightedCode } from './highlight';

const INLINE = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*\s][^*]*\*)/g;

export function inline(text: string, keyBase = 'i'): ReactNode[] {
  const parts = text.split(INLINE);
  return parts.map((part, i) => {
    const k = `${keyBase}-${i}`;
    if (part.startsWith('`') && part.endsWith('`') && part.length > 1) return <code key={k}>{part.slice(1, -1)}</code>;
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) return <strong key={k}>{inline(part.slice(2, -2), k)}</strong>;
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) return <em key={k}>{part.slice(1, -1)}</em>;
    return <Fragment key={k}>{part}</Fragment>;
  });
}

export function Md({ text, className }: { text: string; className?: string }) {
  const blocks: ReactNode[] = [];
  const lines = text.replace(/\r/g, '').split('\n');
  let i = 0;
  let para: string[] = [];
  const flush = () => {
    if (para.length) {
      blocks.push(<p key={`p${blocks.length}`}>{inline(para.join(' '), `p${blocks.length}`)}</p>);
      para = [];
    }
  };
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim().startsWith('```')) {
      flush();
      const code: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) code.push(lines[i++]);
      i++;
      blocks.push(<HighlightedCode key={`c${blocks.length}`} code={code.join('\n')} />);
      continue;
    }
    if (/^\s*[-•]\s+/.test(line)) {
      flush();
      const items: string[] = [];
      while (i < lines.length && /^\s*[-•]\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*[-•]\s+/, ''));
      const k = `u${blocks.length}`;
      blocks.push(
        <ul key={k}>
          {items.map((it, j) => (
            <li key={j}>{inline(it, `${k}-${j}`)}</li>
          ))}
        </ul>,
      );
      continue;
    }
    if (/^\s*\d+[.)]\s+/.test(line)) {
      flush();
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*\d+[.)]\s+/, ''));
      const k = `o${blocks.length}`;
      blocks.push(
        <ol key={k}>
          {items.map((it, j) => (
            <li key={j}>{inline(it, `${k}-${j}`)}</li>
          ))}
        </ol>,
      );
      continue;
    }
    if (line.trim() === '') {
      flush();
    } else {
      para.push(line.trim());
    }
    i++;
  }
  flush();
  return <div className={`md ${className ?? ''}`}>{blocks}</div>;
}
