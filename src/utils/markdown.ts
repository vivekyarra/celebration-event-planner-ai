/** Lightweight markdown block parser for copilot answers (no HTML output). */

export type Block = { kind: 'p'; lines: string[] } | { kind: 'ul' | 'ol'; items: string[] };

/** Groups markdown lines into paragraphs and lists. */
export function parseBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    const bullet = line.match(/^[-*•]\s+(.*)$/);
    const numbered = line.match(/^\d+[.)]\s+(.*)$/);
    const kind = bullet ? 'ul' : numbered ? 'ol' : 'p';
    const content = bullet?.[1] ?? numbered?.[1] ?? line.replace(/^#{1,6}\s+/, '');
    const last = blocks[blocks.length - 1];
    if (kind === 'p') {
      if (last?.kind === 'p') last.lines.push(content);
      else blocks.push({ kind: 'p', lines: [content] });
    } else if (last?.kind === kind) {
      last.items.push(content);
    } else {
      blocks.push({ kind, items: [content] });
    }
  }
  return blocks;
}
