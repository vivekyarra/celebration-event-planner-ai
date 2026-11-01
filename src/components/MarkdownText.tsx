import React from 'react';
import { parseBlocks } from '../utils/markdown';

/**
 * Renders the small markdown subset produced by the copilot (**bold**, *italic*,
 * "- " / "1. " lists and paragraphs) as React elements. Text is never injected
 * as HTML, so model output cannot execute markup or scripts.
 */
function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|\*[^*\s][^*]*\*)/g).filter(Boolean).map((part, i) => {
    const key = `${keyPrefix}-${i}`;
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return <strong key={key}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return <em key={key}>{part.slice(1, -1)}</em>;
    }
    return <React.Fragment key={key}>{part}</React.Fragment>;
  });
}

export const MarkdownText: React.FC<{ text: string }> = ({ text }) => (
  <div className="markdown-text">
    {parseBlocks(text).map((block, b) => {
      if (block.kind === 'p') {
        return (
          <p key={b}>
            {block.lines.map((line, l) => (
              <React.Fragment key={l}>
                {l > 0 && <br />}
                {renderInline(line, `${b}-${l}`)}
              </React.Fragment>
            ))}
          </p>
        );
      }
      const List = block.kind;
      return (
        <List key={b}>
          {block.items.map((item, i) => (
            <li key={i}>{renderInline(item, `${b}-${i}`)}</li>
          ))}
        </List>
      );
    })}
  </div>
);
