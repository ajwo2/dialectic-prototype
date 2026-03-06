"use client";

import { useState, useEffect, useCallback } from "react";

export type UserId = "aj" | "suz";

export interface Identity {
  userId: UserId;
  displayName: string;
}

const IDENTITIES: Record<UserId, Identity> = {
  aj: { userId: "aj", displayName: "A.J." },
  suz: { userId: "suz", displayName: "Suz" },
};

const STORAGE_KEY = "dialectic-userId";

export function useIdentity() {
  const [userId, setUserId] = useState<UserId | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as UserId | null;
    if (stored && (stored === "aj" || stored === "suz")) {
      setUserId(stored);
    }
    setLoaded(true);
  }, []);

  const pickIdentity = useCallback((id: UserId) => {
    localStorage.setItem(STORAGE_KEY, id);
    setUserId(id);
  }, []);

  const switchIdentity = useCallback(() => {
    const next: UserId = userId === "aj" ? "suz" : "aj";
    localStorage.setItem(STORAGE_KEY, next);
    setUserId(next);
  }, [userId]);

  const identity = userId ? IDENTITIES[userId] : null;

  return {
    userId,
    identity,
    loaded,
    pickIdentity,
    switchIdentity,
    displayNameFor: (authorId: string) => IDENTITIES[authorId as UserId]?.displayName ?? authorId,
  };
}
