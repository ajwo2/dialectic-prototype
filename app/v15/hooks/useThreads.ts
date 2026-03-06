"use client";

import { useState, useCallback } from "react";
import type { ChatMessage, BranchThread } from "../lib/types";
import { debug } from "../lib/debugLogger";

export function useThreads(
  chatMessages: ChatMessage[],
  loadingContext: string | null,
  setLoadingContext: (ctx: "main" | string | null) => void,
  setError: (err: string | null) => void,
) {
  const [threads, setThreads] = useState<BranchThread[]>([]);
  const [focusStack, setFocusStack] = useState<string[]>([]);
  const [showThreadNav, setShowThreadNav] = useState(false);
  const [threadNavFilter, setThreadNavFilter] = useState<BranchThread["action"] | "all">("all");

  const currentFocusedThreadId = focusStack.length > 0 ? focusStack[focusStack.length - 1] : null;
  const currentFocusedThread = currentFocusedThreadId
    ? threads.find((t) => t.id === currentFocusedThreadId) ?? null
    : null;

  const buildThreadContext = useCallback(
    (thread: BranchThread): { role: "user" | "assistant"; content: string }[] => {
      const context: { role: "user" | "assistant"; content: string }[] = [];

      if (thread.parentThreadId) {
        const parentThread = threads.find((t) => t.id === thread.parentThreadId);
        if (parentThread) {
          context.push(...buildThreadContext(parentThread));
          context.push({
            role: "user",
            content: `[Within this sub-thread, we're now exploring: "${thread.highlightedText}"]`,
          });
        }
      } else {
        const parentMsgIndex = chatMessages.findIndex((m) => m.id === thread.parentMessageId);
        const mainContext = chatMessages.slice(0, parentMsgIndex + 1);
        context.push(...mainContext.map((m) => ({ role: m.role, content: m.content })));
        context.push({
          role: "user",
          content: `[We're exploring a sub-thread about: "${thread.highlightedText}"]`,
        });
      }

      context.push(...thread.messages.map((m) => ({ role: m.role, content: m.content })));
      return context;
    },
    [threads, chatMessages],
  );

  const sendThreadMessage = useCallback(
    async (threadId: string, content: string) => {
      const thread = threads.find((t) => t.id === threadId);
      if (!thread || loadingContext === threadId) return;

      const userMsg: ChatMessage = {
        id: `tu-${Date.now()}`,
        role: "user",
        content: content.trim(),
        timestamp: new Date().toISOString(),
      };

      setThreads((prev) =>
        prev.map((t) =>
          t.id === threadId ? { ...t, messages: [...t.messages, userMsg] } : t,
        ),
      );
      setLoadingContext(threadId);

      const ancestryContext = buildThreadContext(thread);
      const allContextMessages = [
        ...ancestryContext,
        { role: "user" as const, content: content.trim() },
      ];

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: allContextMessages }),
        });

        const data = await res.json();

        if (data.error) {
          setError(data.error);
          setLoadingContext(null);
          return;
        }

        const assistantMsg: ChatMessage = {
          id: `ta-${Date.now()}`,
          role: "assistant",
          content: data.response,
          timestamp: new Date().toISOString(),
        };

        setThreads((prev) =>
          prev.map((t) =>
            t.id === threadId ? { ...t, messages: [...t.messages, assistantMsg] } : t,
          ),
        );
        setLoadingContext(null);
      } catch {
        setError("Failed to connect.");
        setLoadingContext(null);
      }
    },
    [threads, loadingContext, buildThreadContext, setLoadingContext, setError],
  );

  const createThread = useCallback(
    (
      action: BranchThread["action"],
      text: string,
      messageId: string,
      highlightStart: number,
      highlightEnd: number,
      parentThreadId: string | null,
      sourceType: "highlight" | "ghost" = "highlight",
    ) => {
      const newThread: BranchThread = {
        id: `bt-${Date.now()}`,
        parentMessageId: messageId,
        parentThreadId,
        highlightedText: text,
        highlightStart,
        highlightEnd,
        action,
        messages: [],
        isCollapsed: true,
        sourceType,
        createdAt: new Date().toISOString(),
      };

      debug.log("thread", "create", {
        id: newThread.id,
        action,
        text,
        highlightStart,
        highlightEnd,
        parentMessageId: messageId,
        parentThreadId,
        sourceType,
      });

      setThreads((prev) => [...prev, newThread]);
      setFocusStack((prev) => [...prev, newThread.id]);
      return newThread;
    },
    [],
  );

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
    threads,
    setThreads,
    focusStack,
    setFocusStack,
    showThreadNav,
    setShowThreadNav,
    threadNavFilter,
    setThreadNavFilter,
    currentFocusedThreadId,
    currentFocusedThread,
    sendThreadMessage,
    createThread,
    focusThread,
    navigateBreadcrumb,
    getThreadsForMessage,
    buildFocusPath,
  };
}
