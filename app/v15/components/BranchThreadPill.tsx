"use client";

import { motion } from "framer-motion";
import type { BranchThread } from "../lib/types";

export function BranchThreadPill({
  thread,
  onFocus,
}: {
  thread: BranchThread;
  onFocus: (threadId: string) => void;
}) {
  const actionColors: Record<string, { border: string; bg: string; accent: string }> = {
    branch: { border: "border-amber-500/40", bg: "bg-amber-500/5", accent: "text-amber-400" },
    challenge: { border: "border-red-500/40", bg: "bg-red-500/5", accent: "text-red-400" },
    define: { border: "border-blue-500/40", bg: "bg-blue-500/5", accent: "text-blue-400" },
    connect: { border: "border-green-500/40", bg: "bg-green-500/5", accent: "text-green-400" },
  };

  const colors = actionColors[thread.action];
  const lastMsg = thread.messages[thread.messages.length - 1];

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      onClick={() => onFocus(thread.id)}
      className={`flex items-center gap-2 mx-2 my-1.5 px-3 py-1.5 rounded-full border ${colors.border} ${colors.bg} hover:bg-zinc-800/60 transition-colors text-left w-fit max-w-[90%]`}
    >
      <span className={`text-[11px] ${colors.accent}`}>⑂</span>
      <span className="text-[11px] text-zinc-400 truncate">
        &ldquo;{thread.highlightedText.slice(0, 30)}{thread.highlightedText.length > 30 ? "..." : ""}&rdquo;
      </span>
      {thread.messages.length > 0 && (
        <>
          <span className="text-[10px] text-zinc-600">·</span>
          <span className="text-[10px] text-zinc-500">{thread.messages.length} {thread.messages.length === 1 ? "reply" : "replies"}</span>
        </>
      )}
      {lastMsg && (
        <>
          <span className="text-[10px] text-zinc-600">·</span>
          <span className="text-[10px] text-zinc-500 truncate max-w-[120px]">{lastMsg.content.slice(0, 40)}</span>
        </>
      )}
      <svg className="w-3 h-3 text-zinc-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </motion.button>
  );
}
