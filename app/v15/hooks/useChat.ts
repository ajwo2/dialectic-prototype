"use client";

import { useState, useRef, useCallback } from "react";
import type { ChatMessage } from "../lib/types";
import { STARTERS } from "../lib/starterMessages";
import { debug } from "../lib/debugLogger";

export function useChat() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(STARTERS);
  const [inputValue, setInputValue] = useState("");
  const [loadingContext, setLoadingContext] = useState<"main" | string | null>(null);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isMainLoading = loadingContext === "main";

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isMainLoading) return;

      const userMsg: ChatMessage = {
        id: `u-${Date.now()}`,
        role: "user",
        content: content.trim(),
        timestamp: new Date().toISOString(),
        ...(replyTo ? { replyToId: replyTo.id } : {}),
      };

      const nextMessages = [...chatMessages, userMsg];
      setChatMessages(nextMessages);
      setInputValue("");
      setReplyTo(null);
      setLoadingContext("main");
      setError(null);

      debug.log("chat", "send", { content: content.trim(), replyTo: replyTo?.id });

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
          }),
        });

        const data = await res.json();

        if (data.error) {
          setError(data.error);
          setLoadingContext(null);
          return;
        }

        const assistantMsg: ChatMessage = {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: data.response,
          timestamp: new Date().toISOString(),
        };

        const allMessages = [...nextMessages, assistantMsg];
        setChatMessages(allMessages);
        setLoadingContext(null);
        return allMessages;
      } catch {
        setError("Failed to connect. Check your API key.");
        setLoadingContext(null);
        return null;
      }
    },
    [chatMessages, isMainLoading, replyTo],
  );

  return {
    inputRef,
    chatMessages,
    setChatMessages,
    inputValue,
    setInputValue,
    loadingContext,
    setLoadingContext,
    replyTo,
    setReplyTo,
    error,
    setError,
    isMainLoading,
    sendMessage,
  };
}
