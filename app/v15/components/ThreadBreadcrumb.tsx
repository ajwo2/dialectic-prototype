"use client";

import { motion } from "framer-motion";
import type { BranchThread } from "../lib/types";

export function ThreadBreadcrumb({
  focusStack,
  threads,
  onNavigate,
}: {
  focusStack: string[];
  threads: BranchThread[];
  onNavigate: (depth: number) => void;
}) {
  if (focusStack.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="sticky top-[52px] z-30 bg-zinc-900/95 backdrop-blur border-b border-zinc-800 px-3 py-2"
    >
      <div className="max-w-lg mx-auto flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
        <button
          onClick={() => onNavigate(-1)}
          className="flex items-center gap-1 text-[12px] text-blue-400 hover:text-blue-300 flex-shrink-0 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Main
        </button>
        {focusStack.map((threadId, i) => {
          const thread = threads.find((t) => t.id === threadId);
          if (!thread) return null;
          const isLast = i === focusStack.length - 1;
          return (
            <div key={threadId} className="flex items-center gap-1.5 min-w-0">
              <span className="text-zinc-600 text-[11px] flex-shrink-0">&gt;</span>
              <button
                onClick={() => !isLast && onNavigate(i)}
                className={`text-[11px] truncate max-w-[120px] transition-colors ${
                  isLast
                    ? "text-zinc-200 font-medium"
                    : "text-blue-400 hover:text-blue-300"
                }`}
              >
                &ldquo;{thread.highlightedText.slice(0, 24)}{thread.highlightedText.length > 24 ? "..." : ""}&rdquo;
              </button>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
