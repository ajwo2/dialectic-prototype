"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { ChatMessage } from "../lib/types";

export interface Reference {
  id: string;
  label: string;
  title: string;
  url: string;
  argument: string;
  type: "academic" | "book" | "essay" | "concept";
}

export interface ReferenceResult {
  verdict: string;
  sentiment: "support" | "challenge" | "nuance";
  references: Reference[];
}

export function useReferences(
  inputValue: string,
  chatMessages: ChatMessage[],
  currentThreadId: string | null,
) {
  const [result, setResult] = useState<ReferenceResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [enabled, setEnabled] = useState(true);

  const lastFetchedDraft = useRef("");
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const abortController = useRef<AbortController>(undefined);

  const fetchReferences = useCallback(
    async (draft: string) => {
      if (draft.trim().length < 30) {
        setResult(null);
        return;
      }

      const compareLength = Math.floor(draft.length * 0.8);
      if (
        lastFetchedDraft.current &&
        draft.slice(0, compareLength) ===
          lastFetchedDraft.current.slice(0, compareLength)
      ) {
        return;
      }

      abortController.current?.abort();
      const controller = new AbortController();
      abortController.current = controller;

      const context = chatMessages.slice(-4).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      setLoading(true);

      try {
        const res = await fetch("/api/references", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ draft: draft.trim(), context }),
          signal: controller.signal,
        });

        if (!res.ok) {
          setResult(null);
          return;
        }

        const data = await res.json();
        if (data.references && Array.isArray(data.references) && data.references.length > 0) {
          setResult({
            verdict: data.verdict || "",
            sentiment: data.sentiment || "support",
            references: data.references.map(
              (r: Omit<Reference, "id">, i: number) => ({
                ...r,
                id: `ref-${Date.now()}-${i}`,
              }),
            ),
          });
          setDismissed(false);
        }

        lastFetchedDraft.current = draft;
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setResult(null);
      } finally {
        setLoading(false);
      }
    },
    [chatMessages],
  );

  // Debounced fetch on input change
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (!enabled || inputValue.trim().length < 30) {
      return;
    }

    debounceTimer.current = setTimeout(() => {
      fetchReferences(inputValue);
    }, 1500);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [inputValue, enabled, fetchReferences]);

  // Clear when thread changes
  useEffect(() => {
    setResult(null);
    lastFetchedDraft.current = "";
  }, [currentThreadId]);

  const clearReferences = useCallback(() => {
    setResult(null);
    lastFetchedDraft.current = "";
    setDismissed(false);
  }, []);

  const dismiss = useCallback(() => {
    setDismissed(true);
  }, []);

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      if (prev) {
        setResult(null);
        setDismissed(false);
      }
      return !prev;
    });
  }, []);

  return {
    result: dismissed ? null : result,
    loading,
    enabled,
    toggle,
    clearReferences,
    dismiss,
  };
}
