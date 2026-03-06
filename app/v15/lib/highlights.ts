import type { HighlightRange, BranchThread } from "./types";
import { ACTION_HIGHLIGHT_COLORS } from "./constants";

/**
 * Build sorted, non-overlapping highlight ranges from stored offsets.
 * No indexOf — uses highlightStart/highlightEnd directly.
 * When ranges overlap the shorter one wins (more precise).
 */
export function buildHighlightRanges(
  threads: Pick<BranchThread, "highlightStart" | "highlightEnd" | "action">[],
): HighlightRange[] {
  const ranges: HighlightRange[] = [];

  for (const t of threads) {
    if (t.highlightStart < 0 || t.highlightEnd <= t.highlightStart) continue;
    const color = ACTION_HIGHLIGHT_COLORS[t.action].bg;
    ranges.push({ start: t.highlightStart, end: t.highlightEnd, color });
  }

  if (ranges.length === 0) return [];

  // Sort by start, then shorter first so short precise highlights aren't swallowed.
  ranges.sort((a, b) => a.start - b.start || (a.end - a.start) - (b.end - b.start));

  // Flatten overlaps: when ranges overlap, keep both but split so there's no overlap.
  const flat: HighlightRange[] = [];
  for (const r of ranges) {
    if (flat.length === 0) {
      flat.push({ ...r });
      continue;
    }
    const prev = flat[flat.length - 1];
    if (r.start >= prev.end) {
      // No overlap
      flat.push({ ...r });
    } else if (r.start === prev.start) {
      // Same start — shorter already in flat (due to sort), skip the longer duplicate
      continue;
    } else {
      // Partial overlap — the non-overlapping tail of r becomes its own range
      if (r.end > prev.end) {
        flat.push({ start: prev.end, end: r.end, color: r.color });
      }
      // else r is fully contained in prev, skip
    }
  }

  return flat;
}
