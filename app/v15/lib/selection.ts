/**
 * TreeWalker-based selection offset extraction.
 *
 * Computes absolute character offsets relative to a root element by walking
 * all text nodes in document order. This is the same approach used by
 * Hypothesis, Apache Annotator, and the W3C Web Annotation model.
 *
 * Unlike the previous data-offset-attribute approach, this handles ALL cases:
 *  1. range container is a Text node (offset = char index within that node)
 *  2. range container is an Element (offset = child node index)
 *  3. range container is the root <p> itself (mobile touch selections)
 */

/**
 * Given a root container and a browser Selection Range, return the absolute
 * character start/end offsets within root.textContent.
 *
 * Returns null if the selection is not within root, or is zero-length.
 */
export function extractSelectionOffsets(
  range: Range,
  root: HTMLElement,
): { start: number; end: number } | null {
  if (!root.contains(range.startContainer) || !root.contains(range.endContainer)) {
    return null;
  }

  const start = resolveOffset(root, range.startContainer, range.startOffset);
  const end = resolveOffset(root, range.endContainer, range.endOffset);

  if (start === null || end === null) return null;

  const lo = Math.min(start, end);
  const hi = Math.max(start, end);

  if (hi <= lo) return null;
  return { start: lo, end: hi };
}

/**
 * Resolve a (container, offset) pair from a Range into an absolute
 * character offset within `root.textContent`.
 */
function resolveOffset(
  root: HTMLElement,
  container: Node,
  offset: number,
): number | null {
  // Determine the target text node and character offset within it.
  let targetNode: Node;
  let charOffset: number;

  if (container.nodeType === Node.TEXT_NODE) {
    // Case 1: container is a text node. offset is a character index.
    targetNode = container;
    charOffset = offset;
  } else {
    // Case 2/3: container is an Element. offset is a child node index.
    // The position is "before child[offset]" (or after last child).
    if (offset < container.childNodes.length) {
      // Position is at the START of child[offset]
      targetNode = container.childNodes[offset];
      charOffset = 0;
    } else if (container.childNodes.length > 0) {
      // Position is AFTER the last child
      const lastChild = container.childNodes[container.childNodes.length - 1];
      targetNode = lastChild;
      charOffset = getTextLength(lastChild);
    } else {
      // Empty element
      return countCharsBeforeNode(root, container);
    }
  }

  // Walk all text nodes under root in document order, counting characters
  // until we reach our target.
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
  let charCount = 0;
  let node: Text | null;

  while ((node = walker.nextNode() as Text | null)) {
    if (node === targetNode) {
      // Target is this text node itself
      return charCount + charOffset;
    }

    // Target might be an element containing this text node
    if (targetNode.nodeType !== Node.TEXT_NODE && targetNode.contains(node)) {
      return charCount + charOffset;
    }

    charCount += node.textContent?.length ?? 0;
  }

  // Fallback: target was not a text node and not an ancestor of any text node.
  // Count all text before it in DOM order.
  return countCharsBeforeNode(root, targetNode) + charOffset;
}

/**
 * Get total text length under a node (recursive).
 */
function getTextLength(node: Node): number {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent?.length ?? 0;
  }
  let len = 0;
  const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, null);
  while (walker.nextNode()) {
    len += walker.currentNode.textContent?.length ?? 0;
  }
  return len;
}

/**
 * Count all text characters under `root` that appear before `target`
 * in document order.
 */
function countCharsBeforeNode(root: Node, target: Node): number {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
  let count = 0;
  let node: Node | null;
  while ((node = walker.nextNode())) {
    // Stop if we've reached or passed the target in DOM order
    if (
      node === target ||
      target.contains(node) ||
      (target.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0
    ) {
      break;
    }
    count += node.textContent?.length ?? 0;
  }
  return count;
}
