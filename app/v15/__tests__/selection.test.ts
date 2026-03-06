import { describe, it, expect, beforeEach } from "vitest";
import { extractSelectionOffsets } from "../lib/selection";

function createSpan(offsetStart: number, offsetEnd: number, text: string): HTMLSpanElement {
  const span = document.createElement("span");
  span.dataset.offsetStart = String(offsetStart);
  span.dataset.offsetEnd = String(offsetEnd);
  span.textContent = text;
  return span;
}

describe("extractSelectionOffsets", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("p");
    document.body.appendChild(container);
  });

  it("extracts offsets within a single span", () => {
    const span = createSpan(0, 11, "Hello world");
    container.appendChild(span);

    const range = document.createRange();
    range.setStart(span.firstChild!, 2);
    range.setEnd(span.firstChild!, 7);

    const result = extractSelectionOffsets(range);
    expect(result).toEqual({ start: 2, end: 7 });
  });

  it("extracts offsets crossing span boundary", () => {
    const span1 = createSpan(0, 6, "Hello ");
    const span2 = createSpan(6, 11, "world");
    container.appendChild(span1);
    container.appendChild(span2);

    const range = document.createRange();
    range.setStart(span1.firstChild!, 3);
    range.setEnd(span2.firstChild!, 3);

    const result = extractSelectionOffsets(range);
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

    const result = extractSelectionOffsets(range);
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

    const result = extractSelectionOffsets(range);
    expect(result).toEqual({ start: 5, end: 11 });
  });

  it("returns null when no data-offset attributes", () => {
    const div = document.createElement("div");
    div.textContent = "No offsets here";
    container.appendChild(div);

    const range = document.createRange();
    range.setStart(div.firstChild!, 0);
    range.setEnd(div.firstChild!, 5);

    const result = extractSelectionOffsets(range);
    expect(result).toBeNull();
  });

  it("returns null for zero-length selection", () => {
    const span = createSpan(0, 11, "Hello world");
    container.appendChild(span);

    const range = document.createRange();
    range.setStart(span.firstChild!, 5);
    range.setEnd(span.firstChild!, 5);

    const result = extractSelectionOffsets(range);
    expect(result).toBeNull();
  });
});
