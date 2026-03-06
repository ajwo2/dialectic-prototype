"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import type { GhostBranch } from "../lib/types";
import { GHOST_CATEGORIES } from "../lib/constants";

export function GhostBranchPill({
  ghost,
  onMaterialize,
  onDismiss,
}: {
  ghost: GhostBranch;
  onMaterialize: (ghost: GhostBranch) => void;
  onDismiss: (id: string) => void;
}) {
  const [visible, setVisible] = useState(false);
  const cat = GHOST_CATEGORIES[ghost.category];

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 1500 + Math.random() * 1000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, x: 100 }}
      className="flex justify-center my-2"
    >
      <div className="relative group">
        <button
          onClick={() => onMaterialize(ghost)}
          className="ghost-shimmer px-4 py-2 rounded-full border-2 border-dashed border-zinc-600/50 bg-zinc-900/50 text-[12px] text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 hover:bg-zinc-800/80 transition-all flex items-center gap-2"
        >
          <span className="text-[11px] opacity-70">{cat?.emoji}</span>
          <span>{ghost.suggestion}</span>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDismiss(ghost.id); }}
          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-500 text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          ×
        </button>
      </div>
    </motion.div>
  );
}
