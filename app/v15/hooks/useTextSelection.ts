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

  const handleSelectionChange = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.toString().trim()) return;
    if (selection.toString().trim().length < 3) return;

    // On mobile, add a small delay so we can capture the range before clearing
    // the selection to dismiss the native toolbar (Copy/Share/Select all)

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

      // Clear native selection to dismiss the mobile browser toolbar
      // (Copy/Share/Select all). Our app stores the selection data above.
      requestAnimationFrame(() => {
        window.getSelection()?.removeAllRanges();
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

      // Clear native selection to dismiss the mobile browser toolbar
      requestAnimationFrame(() => {
        window.getSelection()?.removeAllRanges();
      });
    }
  }, [chatMessages, threads]);

  useEffect(() => {
    document.addEventListener("mouseup", handleSelectionChange);
    // Use a short delay on touchend so the selection is fully resolved before we read it
    const handleTouchEnd = () => {
      setTimeout(handleSelectionChange, 10);
    };
    document.addEventListener("touchend", handleTouchEnd);

    // Prevent native context menu on message bubbles to avoid competing with app toolbar
    const preventContextMenu = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.closest?.("[data-message-id]")) {
        e.preventDefault();
      }
    };
    document.addEventListener("contextmenu", preventContextMenu);

    return () => {
      document.removeEventListener("mouseup", handleSelectionChange);
      document.removeEventListener("touchend", handleTouchEnd);
      document.removeEventListener("contextmenu", preventContextMenu);
    };
  }, [handleSelectionChange]);

  const closeToolbar = useCallback(() => {
    setToolbar(null);
  }, []);

  return { toolbar, setToolbar, closeToolbar };
}
