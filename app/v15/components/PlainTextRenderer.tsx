"use client";

import type { HighlightRange } from "../lib/types";

/**
 * Renders plain text with data-offset spans and optional highlight coloring.
 * This is the core fix: no Markdown parsing, so rendered text === raw content.
 * Every text segment gets data-offset-start/data-offset-end for precise selection capture.
 */
export function PlainTextRenderer({
  content,
  messageId,
  highlights,
}: {
  content: string;
  messageId: string;
  highlights: HighlightRange[];
}) {
  // Build split points from highlight boundaries
  const splitPoints = new Set<number>([0, content.length]);
  for (const h of highlights) {
    splitPoints.add(h.start);
    splitPoints.add(h.end);
  }
  const sorted = [...splitPoints].sort((a, b) => a - b);

  // Build segments
  const segments: { start: number; end: number; color: string | null }[] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const segStart = sorted[i];
    const segEnd = sorted[i + 1];
    if (segStart === segEnd) continue;

    // Find highlight covering this segment
    const hl = highlights.find((h) => h.start <= segStart && h.end >= segEnd);
    segments.push({ start: segStart, end: segEnd, color: hl?.color ?? null });
  }

  return (
    <p data-message-id={messageId}>
      {segments.map((seg) => (
        <span
          key={`${seg.start}-${seg.end}`}
          data-offset-start={seg.start}
          data-offset-end={seg.end}
          className={seg.color ? `${seg.color} rounded-sm px-0.5` : undefined}
        >
          {content.slice(seg.start, seg.end)}
        </span>
      ))}
    </p>
  );
}
