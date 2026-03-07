"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { ChatMessage, BranchThread, GhostBranch, MessageAttachment } from "../lib/types";
import type { DbMessage, DbThread, DbGhost } from "../lib/db";
import { debug } from "../lib/debugLogger";
import type { UserId } from "./useIdentity";

interface AppState {
  messages: ChatMessage[];
  threads: BranchThread[];
  ghosts: GhostBranch[];
}

function dbMessageToChat(m: DbMessage): ChatMessage {
  return {
    id: m.id,
    role: m.role as "user" | "assistant",
    authorId: m.author_id,
    content: m.content,
    timestamp: m.created_at,
    replyToId: m.reply_to_id ?? undefined,
    threadId: m.thread_id,
  };
}

function dbThreadToBranch(t: DbThread, threadMessages: ChatMessage[]): BranchThread {
  return {
    id: t.id,
    parentMessageId: t.parent_message_id,
    parentThreadId: t.parent_thread_id,
    highlightedText: t.highlighted_text,
    highlightStart: t.highlight_start,
    highlightEnd: t.highlight_end,
    action: t.action as BranchThread["action"],
    messages: threadMessages,
    isCollapsed: true,
    sourceType: (t.source_type || "highlight") as "highlight" | "ghost",
    closed: !!t.closed,
    createdAt: t.created_at,
  };
}

function dbGhostToGhost(g: DbGhost): GhostBranch {
  return {
    id: g.id,
    afterMessageId: g.after_message_id,
    suggestion: g.suggestion,
    category: g.category as GhostBranch["category"],
  };
}

export function useChat(userId: UserId | null) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [threads, setThreads] = useState<BranchThread[]>([]);
  const [ghosts, setGhosts] = useState<GhostBranch[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loadingContext, setLoadingContext] = useState<"main" | string | null>(null);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  const isMainLoading = loadingContext === "main";

  // Client-side attachment storage (not persisted to DB)
  const attachmentsMap = useRef<Map<string, MessageAttachment[]>>(new Map());

  // Ref to track latest counts for smart polling
  const stateRef = useRef({ messageCount: 0, threadCount: 0, ghostCount: 0 });

  const hydrateState = useCallback((data: { messages: DbMessage[]; threads: DbThread[]; ghosts: DbGhost[]; typing?: string[] }) => {
    const allDbMessages = data.messages.map(dbMessageToChat);

    // Split: main messages (no thread_id) and thread messages
    const mainMessages = allDbMessages.filter((m) => !m.threadId);
    const threadMessagesMap = new Map<string, ChatMessage[]>();
    for (const m of allDbMessages) {
      if (m.threadId) {
        const arr = threadMessagesMap.get(m.threadId) || [];
        arr.push(m);
        threadMessagesMap.set(m.threadId, arr);
      }
    }

    const hydratedThreads = data.threads.map((t) =>
      dbThreadToBranch(t, threadMessagesMap.get(t.id) || []),
    );

    const hydratedGhosts = data.ghosts.map(dbGhostToGhost);

    // Only update if counts changed (avoid unnecessary re-renders)
    const newCount = {
      messageCount: data.messages.length,
      threadCount: data.threads.length,
      ghostCount: data.ghosts.length,
    };

    if (
      newCount.messageCount !== stateRef.current.messageCount ||
      newCount.threadCount !== stateRef.current.threadCount ||
      newCount.ghostCount !== stateRef.current.ghostCount
    ) {
      stateRef.current = newCount;
      // Merge client-side attachments back into messages
      const messagesWithAttachments = mainMessages.map((m) => {
        const atts = attachmentsMap.current.get(m.id);
        return atts ? { ...m, attachments: atts } : m;
      });
      setChatMessages(messagesWithAttachments);
      setThreads(hydratedThreads);
      setGhosts(hydratedGhosts);
    }

    // Always update typing (changes frequently, not count-gated)
    if (data.typing) {
      setTypingUsers(data.typing);
    }
  }, []);

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch("/api/state");
      if (!res.ok) throw new Error("Failed to fetch state");
      const data = await res.json();
      hydrateState(data);
      return data;
    } catch (err) {
      console.error("fetchState error:", err);
      return null;
    }
  }, [hydrateState]);

  // Initial fetch
  useEffect(() => {
    if (!userId) return;
    fetchState().then((data) => {
      if (data) setInitialized(true);
    });
  }, [userId, fetchState]);

  // Polling every 3 seconds
  useEffect(() => {
    if (!userId || !initialized) return;
    const interval = setInterval(fetchState, 3000);
    return () => clearInterval(interval);
  }, [userId, initialized, fetchState]);

  const postMessage = useCallback(
    async (content: string, attachments?: ChatMessage["attachments"]) => {
      if (!content.trim() || !userId) return;

      const messageId = `m-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

      // Optimistic update
      const optimisticMsg: ChatMessage = {
        id: messageId,
        role: userId === "aj" ? "user" : "assistant",
        authorId: userId,
        content: content.trim(),
        timestamp: new Date().toISOString(),
        replyToId: replyTo?.id,
        attachments,
      };
      // Store attachments client-side
      if (attachments && attachments.length > 0) {
        attachmentsMap.current.set(messageId, attachments);
      }
      setChatMessages((prev) => [...prev, optimisticMsg]);
      setInputValue("");
      setReplyTo(null);
      setError(null);

      debug.log("chat", "send", { content: content.trim(), replyTo: replyTo?.id });

      try {
        const res = await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: messageId,
            content: content.trim(),
            authorId: userId,
            replyToId: replyTo?.id || null,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Failed to send message");
          return null;
        }

        // Refetch to get server-confirmed state
        const state = await fetchState();
        return state?.messages ? state.messages.map(dbMessageToChat) : null;
      } catch {
        setError("Failed to connect.");
        return null;
      }
    },
    [userId, replyTo, fetchState],
  );

  const postThreadMessage = useCallback(
    async (threadId: string, content: string) => {
      if (!content.trim() || !userId) return;

      const messageId = `tm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

      // Optimistic update
      const optimisticMsg: ChatMessage = {
        id: messageId,
        role: userId === "aj" ? "user" : "assistant",
        authorId: userId,
        content: content.trim(),
        timestamp: new Date().toISOString(),
        threadId,
      };
      setThreads((prev) =>
        prev.map((t) =>
          t.id === threadId ? { ...t, messages: [...t.messages, optimisticMsg] } : t,
        ),
      );

      try {
        const res = await fetch(`/api/threads/${threadId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: messageId,
            content: content.trim(),
            authorId: userId,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Failed to send thread message");
          return;
        }

        await fetchState();
      } catch {
        setError("Failed to connect.");
      }
    },
    [userId, fetchState],
  );

  const createThread = useCallback(
    async (
      action: BranchThread["action"],
      text: string,
      messageId: string,
      highlightStart: number,
      highlightEnd: number,
      parentThreadId: string | null,
      sourceType: "highlight" | "ghost" = "highlight",
    ) => {
      const threadId = `bt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

      // Optimistic update
      const newThread: BranchThread = {
        id: threadId,
        parentMessageId: messageId,
        parentThreadId,
        highlightedText: text,
        highlightStart,
        highlightEnd,
        action,
        messages: [],
        isCollapsed: true,
        sourceType,
        closed: false,
        createdAt: new Date().toISOString(),
      };

      debug.log("thread", "create", {
        id: threadId,
        action,
        text,
        highlightStart,
        highlightEnd,
        parentMessageId: messageId,
        parentThreadId,
        sourceType,
      });

      setThreads((prev) => [...prev, newThread]);

      try {
        await fetch("/api/threads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: threadId,
            parentMessageId: messageId,
            parentThreadId,
            highlightedText: text,
            highlightStart,
            highlightEnd,
            action,
            sourceType,
          }),
        });

        await fetchState();
      } catch {
        // Thread was added optimistically, will sync on next poll
      }

      return newThread;
    },
    [fetchState],
  );

  const dismissGhost = useCallback(
    async (ghostId: string) => {
      setGhosts((prev) => prev.filter((g) => g.id !== ghostId));

      try {
        await fetch(`/api/ghosts/${ghostId}`, { method: "PATCH" });
      } catch {
        // Dismissed optimistically
      }
    },
    [],
  );

  const toggleThreadClosed = useCallback(
    async (threadId: string, closed: boolean) => {
      // Optimistic update
      setThreads((prev) =>
        prev.map((t) => (t.id === threadId ? { ...t, closed } : t)),
      );

      try {
        await fetch(`/api/threads/${threadId}/close`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ closed }),
        });
      } catch {
        // Revert on failure
        setThreads((prev) =>
          prev.map((t) => (t.id === threadId ? { ...t, closed: !closed } : t)),
        );
      }
    },
    [],
  );

  const fetchGhosts = useCallback(
    async (msgs: ChatMessage[]) => {
      try {
        const res = await fetch("/api/ghost", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: msgs.map((m) => ({ role: m.role, content: m.content })),
          }),
        });
        const data = await res.json();
        if (data.ghosts && data.ghosts.length > 0) {
          const lastMsgId = msgs[msgs.length - 1].id;
          const newGhosts: GhostBranch[] = data.ghosts.map(
            (g: { suggestion: string; category: string }, i: number) => ({
              id: `g-${Date.now()}-${i}`,
              afterMessageId: lastMsgId,
              suggestion: g.suggestion,
              category: g.category as GhostBranch["category"],
            }),
          );
          debug.log("ghost", "fetched", { count: newGhosts.length, afterMessage: lastMsgId });

          // Persist ghosts to DB
          for (const ghost of newGhosts) {
            try {
              await fetch("/api/ghosts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(ghost),
              });
            } catch {
              // Ghost persistence is optional
            }
          }

          setGhosts((prev) => [...prev, ...newGhosts]);
        }
      } catch {
        // Ghost generation is optional
      }
    },
    [],
  );

  const getGhostsAfter = useCallback(
    (messageId: string) => ghosts.filter((g) => g.afterMessageId === messageId),
    [ghosts],
  );

  // Debounced typing ping (at most once per second)
  const lastTypingPing = useRef(0);
  const sendTypingPing = useCallback(() => {
    if (!userId) return;
    const now = Date.now();
    if (now - lastTypingPing.current < 1000) return;
    lastTypingPing.current = now;
    fetch("/api/typing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    }).catch(() => {}); // fire-and-forget
  }, [userId]);

  // Fire typing ping when inputValue changes (user is typing)
  useEffect(() => {
    if (inputValue.length > 0) {
      sendTypingPing();
    }
  }, [inputValue, sendTypingPing]);

  const deleteMessage = useCallback(
    async (messageId: string) => {
      // Optimistic removal
      setChatMessages((prev) => prev.filter((m) => m.id !== messageId));
      setThreads((prev) =>
        prev.map((t) => ({
          ...t,
          messages: t.messages.filter((m) => m.id !== messageId),
        })),
      );

      try {
        await fetch("/api/messages", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: messageId }),
        });
        stateRef.current.messageCount--; // prevent poll from re-adding
      } catch {
        // Will resync on next poll
      }
    },
    [],
  );

  const activeGhostCount = ghosts.length;

  return {
    inputRef,
    chatMessages,
    setChatMessages,
    threads,
    setThreads,
    ghosts,
    inputValue,
    setInputValue,
    loadingContext,
    setLoadingContext,
    replyTo,
    setReplyTo,
    error,
    setError,
    isMainLoading,
    initialized,
    postMessage,
    postThreadMessage,
    createThread,
    fetchGhosts,
    dismissGhost,
    toggleThreadClosed,
    getGhostsAfter,
    activeGhostCount,
    typingUsers,
    fetchState,
    deleteMessage,
  };
}
