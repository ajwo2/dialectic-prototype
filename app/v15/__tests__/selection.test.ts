import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { extractSelectionOffsets } from "../lib/selection";

/**
 * These tests validate the TreeWalker-based selection offset extraction.
 *
 * The key scenarios:
 *  1. Selection within a single text node (simple case)
 *  2. Selection crossing span boundaries (the highlight bleed case)
 *  3. Selection spanning multiple spans
 *  4. Selection at exact span boundaries
 *  5. Range container is an Element (not a Text node)
 *  6. Selection not within root → null
 *  7. Zero-length selection → null
 */

function createSpan(offsetStart: number, offsetEnd: number, text: string): HTMLSpanElement {
  const span = document.createElement("span");
  span.dataset.offsetStart = String(offsetStart);
  span.dataset.offsetEnd = String(offsetEnd);
  span.textContent = text;
  return span;
}

describe("extractSelectionOffsets (TreeWalker)", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("p");
    container.dataset.messageId = "test";
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it("extracts offsets within a single span", () => {
    const span = createSpan(0, 11, "Hello world");
    container.appendChild(span);

    const range = document.createRange();
    range.setStart(span.firstChild!, 2);
    range.setEnd(span.firstChild!, 7);

    const result = extractSelectionOffsets(range, container);
    expect(result).toEqual({ start: 2, end: 7 });
  });

  it("extracts offsets crossing span boundary", () => {
    const span1 = createSpan(0, 6, "Hello ");
    const span2 = createSpan(6, 11, "world");
    container.appendChild(span1);
    container.appendChild(span2);

    const range = document.createRange();
    range.setStart(span1.firstChild!, 3); // "lo " = chars 3-6
    range.setEnd(span2.firstChild!, 3);   // "wor" = chars 6-9

    const result = extractSelectionOffsets(range, container);
    expect(result).toEqual({ start: 3, end: 9 });
  });

  it("extracts offsets spanning multiple spans", () => {
    const span1 = createSpan(0, 5, "Hello");
    const span2 = createSpan(5, 11, " world");
    const span3 = createSpan(11, 21, ", testing!");
    container.appendChild(span1);
    container.appendChild(span2);
    container.appendChild(span3);

    const range = document.createRange();
    range.setStart(span1.firstChild!, 2);
    range.setEnd(span3.firstChild!, 5);

    const result = extractSelectionOffsets(range, container);
    expect(result).toEqual({ start: 2, end: 16 });
  });

  it("handles selection at exact span boundary", () => {
    const span1 = createSpan(0, 5, "Hello");
    const span2 = createSpan(5, 11, " world");
    container.appendChild(span1);
    container.appendChild(span2);

    const range = document.createRange();
    range.setStart(span1.firstChild!, 5);
    range.setEnd(span2.firstChild!, 6);

    const result = extractSelectionOffsets(range, container);
    expect(result).toEqual({ start: 5, end: 11 });
  });

  it("returns null when selection is not within root", () => {
    const span = createSpan(0, 11, "Hello world");
    container.appendChild(span);

    const outsideEl = document.createElement("div");
    outsideEl.textContent = "Outside";
    document.body.appendChild(outsideEl);

    const range = document.createRange();
    range.setStart(outsideEl.firstChild!, 0);
    range.setEnd(outsideEl.firstChild!, 5);

    const result = extractSelectionOffsets(range, container);
    expect(result).toBeNull();

    document.body.removeChild(outsideEl);
  });

  it("returns null for zero-length selection", () => {
    const span = createSpan(0, 11, "Hello world");
    container.appendChild(span);

    const range = document.createRange();
    range.setStart(span.firstChild!, 5);
    range.setEnd(span.firstChild!, 5);

    const result = extractSelectionOffsets(range, container);
    expect(result).toBeNull();
  });

  it("handles range where container is the parent element (not text node)", () => {
    // This is the mobile touch case where the browser sets the range
    // container to the <p> element itself with child node indices
    const span1 = createSpan(0, 5, "Hello");
    const span2 = createSpan(5, 11, " world");
    container.appendChild(span1);
    container.appendChild(span2);

    const range = document.createRange();
    // container = the <p>, offset 0 = before first child, offset 2 = after last child
    range.setStart(container, 0);
    range.setEnd(container, 2);

    const result = extractSelectionOffsets(range, container);
    expect(result).toEqual({ start: 0, end: 11 });
  });

  it("handles range where container is a span element (not text node)", () => {
    const span1 = createSpan(0, 5, "Hello");
    const span2 = createSpan(5, 11, " world");
    container.appendChild(span1);
    container.appendChild(span2);

    // Simulate: start container is span1 (element), offset 0 = before its first child
    // end container is span2's text node, offset 3
    const range = document.createRange();
    range.setStart(span1, 0);
    range.setEnd(span2.firstChild!, 3);

    const result = extractSelectionOffsets(range, container);
    expect(result).toEqual({ start: 0, end: 8 });
  });

  it("works with highlight spans (the key bug scenario)", () => {
    // Simulates: "Summer the longest" where "longe" is already highlighted
    // "Summer the " [0-11] + "longe" [11-16] highlighted + "st" [16-18]
    const span1 = createSpan(0, 11, "Summer the ");
    const span2 = createSpan(11, 16, "longe");
    span2.className = "bg-amber-400/30";
    const span3 = createSpan(16, 18, "st");
    container.appendChild(span1);
    container.appendChild(span2);
    container.appendChild(span3);

    // User selects "longest" crossing from span2 into span3
    const range = document.createRange();
    range.setStart(span2.firstChild!, 0); // start of "longe"
    range.setEnd(span3.firstChild!, 2);   // end of "st"

    const result = extractSelectionOffsets(range, container);
    expect(result).toEqual({ start: 11, end: 18 });

    // Verify the text matches
    const fullText = container.textContent!;
    expect(fullText.slice(result!.start, result!.end)).toBe("longest");
  });

  it("works when selecting within an already-highlighted span", () => {
    // "Hello " [0-6] + "beautiful world" [6-21] highlighted + "!" [21-22]
    const span1 = createSpan(0, 6, "Hello ");
    const span2 = createSpan(6, 21, "beautiful world");
    span2.className = "bg-red-400/30";
    const span3 = createSpan(21, 22, "!");
    container.appendChild(span1);
    container.appendChild(span2);
    container.appendChild(span3);

    // User selects just "world" inside the highlighted span
    const range = document.createRange();
    range.setStart(span2.firstChild!, 10); // "world" starts at index 10 within "beautiful world"
    range.setEnd(span2.firstChild!, 15);

    const result = extractSelectionOffsets(range, container);
    expect(result).toEqual({ start: 16, end: 21 });

    const fullText = container.textContent!;
    expect(fullText.slice(result!.start, result!.end)).toBe("world");
  });
});
