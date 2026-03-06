"use client";

import { useState, useCallback } from "react";
import type { ChatMessage, GhostBranch } from "../lib/types";
import { debug } from "../lib/debugLogger";

export function useGhosts() {
  const [ghosts, setGhosts] = useState<GhostBranch[]>([]);
  const [dismissedGhosts, setDismissedGhosts] = useState<Set<string>>(new Set());

  const activeGhostCount = ghosts.filter((g) => !dismissedGhosts.has(g.id)).length;

  const fetchGhosts = useCallback(async (msgs: ChatMessage[]) => {
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
        setGhosts((prev) => [...prev, ...newGhosts]);
      }
    } catch {
      // Ghost generation is optional
    }
  }, []);

  const dismissGhost = useCallback((id: string) => {
    setDismissedGhosts((prev) => new Set(prev).add(id));
  }, []);

  const getGhostsAfter = useCallback(
    (messageId: string) =>
      ghosts.filter((g) => g.afterMessageId === messageId && !dismissedGhosts.has(g.id)),
    [ghosts, dismissedGhosts],
  );

  return {
    ghosts,
    dismissedGhosts,
    activeGhostCount,
    fetchGhosts,
    dismissGhost,
    getGhostsAfter,
  };
}
