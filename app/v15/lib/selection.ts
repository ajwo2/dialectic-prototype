/**
 * Extract raw content offsets from data-offset-start/data-offset-end attributes
 * on spans rendered by PlainTextRenderer.
 *
 * Returns null if the selection is not within an offset-annotated element.
 */
export function extractSelectionOffsets(
  range: Range,
): { start: number; end: number } | null {
  const startSpan = findOffsetAncestor(range.startContainer);
  const endSpan = findOffsetAncestor(range.endContainer);

  if (!startSpan || !endSpan) return null;

  const spanStart = parseInt(startSpan.dataset.offsetStart!, 10);
  const spanEndStart = parseInt(endSpan.dataset.offsetStart!, 10);

  const rawStart = spanStart + range.startOffset;
  const rawEnd = spanEndStart + range.endOffset;

  if (rawEnd <= rawStart) return null;
  return { start: rawStart, end: rawEnd };
}

/**
 * Walk up the DOM tree to find the nearest element with data-offset-start.
 */
function findOffsetAncestor(node: Node): HTMLElement | null {
  let current: Node | null = node;
  while (current) {
    if (
      current instanceof HTMLElement &&
      current.dataset.offsetStart !== undefined
    ) {
      return current;
    }
    current = current.parentNode;
  }
  return null;
}
