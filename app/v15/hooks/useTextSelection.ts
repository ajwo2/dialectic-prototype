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

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    // Walk up to find message element
    let node: Node | null = range.startContainer;
    let messageId: string | null = null;
    let threadId: string | null = null;
    while (node) {
      if (node instanceof HTMLElement) {
        if (!messageId && node.dataset.messageId) {
          messageId = node.dataset.messageId;
        }
        if (!threadId && node.dataset.threadId) {
          threadId = node.dataset.threadId;
        }
      }
      node = node.parentNode;
    }

    if (!messageId) return;

    // Extract offsets from data-offset-* attributes
    const offsets = extractSelectionOffsets(range);

    if (offsets) {
      // Find the message content to extract highlighted text
      const msg =
        chatMessages.find((m) => m.id === messageId) ??
        threads.flatMap((t) => t.messages).find((m) => m.id === messageId);

      const text = msg
        ? msg.content.slice(offsets.start, offsets.end).trim()
        : selection.toString().trim();

      if (text.length < 3) return;

      debug.log("selection", "capture", {
        rawText: selection.toString(),
        computedOffsets: offsets,
        extractedText: text,
        messageId,
      });

      setToolbar({
        x: rect.left + rect.width / 2,
        y: rect.top,
        text,
        messageId,
        threadId,
        highlightStart: offsets.start,
        highlightEnd: offsets.start + text.length,
      });
    } else {
      // Fallback: use selection text directly (no offset data available)
      const text = selection.toString().trim();
      if (text.length < 3) return;

      debug.log("selection", "capture-fallback", {
        text,
        messageId,
        reason: "no data-offset attributes found",
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
  }, [chatMessages, threads]);

  useEffect(() => {
    document.addEventListener("mouseup", handleSelectionChange);
    document.addEventListener("touchend", handleSelectionChange);
    return () => {
      document.removeEventListener("mouseup", handleSelectionChange);
      document.removeEventListener("touchend", handleSelectionChange);
    };
  }, [handleSelectionChange]);

  const closeToolbar = useCallback(() => {
    setToolbar(null);
  }, []);

  return { toolbar, setToolbar, closeToolbar };
}
