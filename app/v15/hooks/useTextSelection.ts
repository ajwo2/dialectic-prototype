"use client";

import { useState, useCallback, useEffect } from "react";
import type { ChatMessage, BranchThread, SelectionToolbar } from "../lib/types";
import { extractSelectionOffsets } from "../lib/selection";
import { debug } from "../lib/debugLogger";

export function useTextSelection(
  chatMessages: ChatMessage[],
  threads: BranchThread[],
) {
  const [toolbar, setToolbar] = useState<SelectionToolbar | null>(null);

  const processSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.toString().trim()) return;
    if (selection.toString().trim().length < 3) return;

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    // Find the message <p data-message-id> element that contains this selection.
    // Walk up from the range's common ancestor to find it.
    let messageEl: HTMLElement | null = null;
    let threadId: string | null = null;

    let node: Node | null = range.commonAncestorContainer;
    while (node) {
      if (node instanceof HTMLElement) {
        if (!messageEl && node.dataset.messageId && node.tagName === "P") {
          messageEl = node;
        }
        if (!threadId && node.dataset.threadId) {
          threadId = node.dataset.threadId;
        }
      }
      node = node.parentNode;
    }

    // Also check if the range.startContainer is inside a different message
    // (for cross-element selections, we use commonAncestorContainer above)
    if (!messageEl) {
      let startNode: Node | null = range.startContainer;
      while (startNode) {
        if (startNode instanceof HTMLElement && startNode.dataset.messageId && startNode.tagName === "P") {
          messageEl = startNode;
          break;
        }
        startNode = startNode.parentNode;
      }
    }

    if (!messageEl) return;

    const messageId = messageEl.dataset.messageId!;

    // Use TreeWalker-based offset extraction relative to the message <p> element
    const offsets = extractSelectionOffsets(range, messageEl);

    if (offsets) {
      // Find the message content to extract highlighted text
      const msg =
        chatMessages.find((m) => m.id === messageId) ??
        threads.flatMap((t) => t.messages).find((m) => m.id === messageId);

      const rawSlice = msg ? msg.content.slice(offsets.start, offsets.end) : null;
      const text = rawSlice ? rawSlice.trim() : selection.toString().trim();

      if (text.length < 3) return;

      // Compute trimmed offsets: adjust start/end to match the trimmed text
      // so the highlight aligns exactly with the trimmed text in the content
      let highlightStart = offsets.start;
      let highlightEnd = offsets.end;
      if (rawSlice && msg) {
        const leadingWhitespace = rawSlice.length - rawSlice.trimStart().length;
        const trailingWhitespace = rawSlice.length - rawSlice.trimEnd().length;
        highlightStart = offsets.start + leadingWhitespace;
        highlightEnd = offsets.end - trailingWhitespace;
      }

      debug.log("selection", "capture", {
        rawText: selection.toString(),
        computedOffsets: offsets,
        trimmedOffsets: { start: highlightStart, end: highlightEnd },
        extractedText: text,
        messageId,
        rootTextContent: messageEl.textContent?.slice(0, 50),
      });

      setToolbar({
        x: rect.left + rect.width / 2,
        y: rect.top,
        text,
        messageId,
        threadId,
        highlightStart,
        highlightEnd,
      });
    } else {
      // Fallback: no valid offsets computed
      const text = selection.toString().trim();
      if (text.length < 3) return;

      debug.log("selection", "capture-fallback", {
        text,
        messageId: messageEl.dataset.messageId,
        reason: "extractSelectionOffsets returned null",
      });

      setToolbar({
        x: rect.left + rect.width / 2,
        y: rect.top,
        text,
        messageId,
        threadId,
        highlightStart: -1,
        highlightEnd: -1,
      });
    }

    // Immediately clear native selection to dismiss Android Chrome's
    // action toolbar (Copy/Share/Select all). Our app stores the
    // selection data in state above, so the native selection is no
    // longer needed.
    selection.removeAllRanges();
  }, [chatMessages, threads]);

  useEffect(() => {
    // On desktop, process on mouseup
    document.addEventListener("mouseup", processSelection);

    // On mobile, use selectionchange for faster response — the native
    // toolbar appears as soon as selection is created, so we need to
    // intercept it via selectionchange rather than waiting for touchend.
    let selectionTimeout: ReturnType<typeof setTimeout> | null = null;
    const handleSelectionChange = () => {
      // Debounce: selectionchange fires many times during drag-to-select.
      // Process once the user stops adjusting (80ms after last change).
      if (selectionTimeout) clearTimeout(selectionTimeout);
      selectionTimeout = setTimeout(processSelection, 80);
    };
    document.addEventListener("selectionchange", handleSelectionChange);

    // Prevent native context menu on message bubbles to avoid competing with app toolbar
    const preventContextMenu = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.closest?.("[data-message-id]")) {
        e.preventDefault();
      }
    };
    document.addEventListener("contextmenu", preventContextMenu);

    return () => {
      document.removeEventListener("mouseup", processSelection);
      document.removeEventListener("selectionchange", handleSelectionChange);
      document.removeEventListener("contextmenu", preventContextMenu);
      if (selectionTimeout) clearTimeout(selectionTimeout);
    };
  }, [processSelection]);

  const closeToolbar = useCallback(() => {
    setToolbar(null);
  }, []);

  return { toolbar, setToolbar, closeToolbar };
}
