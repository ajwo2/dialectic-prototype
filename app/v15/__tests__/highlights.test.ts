import { describe, it, expect } from "vitest";
import { buildHighlightRanges } from "../lib/highlights";

describe("buildHighlightRanges", () => {
  it("returns empty array for empty threads", () => {
    expect(buildHighlightRanges([])).toEqual([]);
  });

  it("returns a single range", () => {
    const result = buildHighlightRanges([
      { highlightStart: 5, highlightEnd: 10, action: "branch" },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].start).toBe(5);
    expect(result[0].end).toBe(10);
  });

  it("handles multiple non-overlapping ranges", () => {
    const result = buildHighlightRanges([
      { highlightStart: 0, highlightEnd: 5, action: "branch" },
      { highlightStart: 10, highlightEnd: 15, action: "challenge" },
    ]);
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ start: 0, end: 5 });
    expect(result[1]).toMatchObject({ start: 10, end: 15 });
  });

  it("handles overlapping ranges — shorter wins, tail gets remainder", () => {
    // "Hello world" — short highlight [0,5) and long highlight [3,11)
    const result = buildHighlightRanges([
      { highlightStart: 0, highlightEnd: 5, action: "branch" },
      { highlightStart: 3, highlightEnd: 11, action: "challenge" },
    ]);
    // Short range [0,5) keeps its color, remainder [5,11) gets challenge color
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ start: 0, end: 5 });
    expect(result[1]).toMatchObject({ start: 5, end: 11 });
  });

  it("handles same-start ranges — shorter wins", () => {
    const result = buildHighlightRanges([
      { highlightStart: 0, highlightEnd: 5, action: "branch" },
      { highlightStart: 0, highlightEnd: 10, action: "challenge" },
    ]);
    // Shorter [0,5) keeps its color, the longer one's duplicate start is skipped
    // But the tail [5,10) should not appear since same-start skips entirely
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ start: 0, end: 5 });
  });

  it("range at start of message", () => {
    const result = buildHighlightRanges([
      { highlightStart: 0, highlightEnd: 3, action: "define" },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ start: 0, end: 3 });
  });

  it("full-message range", () => {
    const result = buildHighlightRanges([
      { highlightStart: 0, highlightEnd: 100, action: "connect" },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ start: 0, end: 100 });
  });

  it("skips threads with invalid offsets", () => {
    const result = buildHighlightRanges([
      { highlightStart: -1, highlightEnd: -1, action: "branch" },
      { highlightStart: 5, highlightEnd: 5, action: "challenge" },
      { highlightStart: 10, highlightEnd: 8, action: "define" },
      { highlightStart: 0, highlightEnd: 3, action: "connect" },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ start: 0, end: 3 });
  });

  it("resolves duplicate text by stored offsets", () => {
    // Same text "hello" at two different positions
    const result = buildHighlightRanges([
      { highlightStart: 0, highlightEnd: 5, action: "branch" },
      { highlightStart: 20, highlightEnd: 25, action: "challenge" },
    ]);
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ start: 0, end: 5 });
    expect(result[1]).toMatchObject({ start: 20, end: 25 });
  });

  it("fully contained range is skipped", () => {
    const result = buildHighlightRanges([
      { highlightStart: 0, highlightEnd: 20, action: "branch" },
      { highlightStart: 5, highlightEnd: 10, action: "challenge" },
    ]);
    // [0,20) goes first (sorted by start), [5,10) is fully contained → skipped
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ start: 0, end: 20 });
  });
});
