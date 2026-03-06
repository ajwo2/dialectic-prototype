"use client";

import { useState, useCallback } from "react";
import type { BranchThread } from "../lib/types";

export function useThreadNav(threads: BranchThread[]) {
  const [focusStack, setFocusStack] = useState<string[]>([]);
  const [showThreadNav, setShowThreadNav] = useState(false);
  const [threadNavFilter, setThreadNavFilter] = useState<BranchThread["action"] | "all">("all");

  const currentFocusedThreadId = focusStack.length > 0 ? focusStack[focusStack.length - 1] : null;
  const currentFocusedThread = currentFocusedThreadId
    ? threads.find((t) => t.id === currentFocusedThreadId) ?? null
    : null;

  const focusThread = useCallback((threadId: string) => {
    setFocusStack((prev) => [...prev, threadId]);
  }, []);

  const navigateBreadcrumb = useCallback((depth: number) => {
    if (depth === -1) {
      setFocusStack([]);
    } else {
      setFocusStack((prev) => prev.slice(0, depth + 1));
    }
  }, []);

  const getThreadsForMessage = useCallback(
    (messageId: string, parentThreadId: string | null) =>
      threads.filter((t) => t.parentMessageId === messageId && t.parentThreadId === parentThreadId),
    [threads],
  );

  const buildFocusPath = useCallback(
    (threadId: string): string[] => {
      const thread = threads.find((t) => t.id === threadId);
      if (!thread || !thread.parentThreadId) return [threadId];
      return [...buildFocusPath(thread.parentThreadId), threadId];
    },
    [threads],
  );

  return {
    focusStack,
    setFocusStack,
    showThreadNav,
    setShowThreadNav,
    threadNavFilter,
    setThreadNavFilter,
    currentFocusedThreadId,
    currentFocusedThread,
    focusThread,
    navigateBreadcrumb,
    getThreadsForMessage,
    buildFocusPath,
  };
}
