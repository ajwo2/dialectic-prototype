"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { ChatMessage, BranchThread } from "../lib/types";
import { formatRelativeTime } from "../lib/formatters";

export function ThreadNavigator({
  threads,
  chatMessages,
  onSelectThread,
  onClose,
  filter,
  onFilterChange,
  onToggleClosed,
}: {
  threads: BranchThread[];
  chatMessages: ChatMessage[];
  onSelectThread: (threadId: string) => void;
  onClose: () => void;
  filter: BranchThread["action"] | "all";
  onFilterChange: (f: BranchThread["action"] | "all") => void;
  onToggleClosed?: (threadId: string, closed: boolean) => void;
}) {
  const actionColors: Record<string, string> = {
    branch: "bg-amber-500",
    challenge: "bg-red-500",
    define: "bg-blue-500",
    connect: "bg-green-500",
  };

  const actionLabels: Record<string, string> = {
    branch: "Branch",
    challenge: "Challenge",
    define: "Define",
    connect: "Connect",
  };

  const getThreadDepth = (thread: BranchThread): number => {
    let depth = 0;
    let current = thread;
    while (current.parentThreadId) {
      depth++;
      const parent = threads.find((t) => t.id === current.parentThreadId);
      if (!parent) break;
      current = parent;
    }
    return depth;
  };

  const getParentMessagePreview = (thread: BranchThread): string => {
    const mainMsg = chatMessages.find((m) => m.id === thread.parentMessageId);
    if (mainMsg) return mainMsg.content;
    for (const t of threads) {
      const msg = t.messages.find((m) => m.id === thread.parentMessageId);
      if (msg) return msg.content;
    }
    return "";
  };

  const activeThreads = threads.filter((t) => !t.closed);
  const archivedThreads = threads.filter((t) => t.closed);
  const [showArchived, setShowArchived] = useState(false);

  const filtered = filter === "all" ? activeThreads : activeThreads.filter((t) => t.action === filter);
  const sorted = [...filtered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const archivedFiltered = filter === "all" ? archivedThreads : archivedThreads.filter((t) => t.action === filter);
  const archivedSorted = [...archivedFiltered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const filterOptions: { key: BranchThread["action"] | "all"; label: string; color: string }[] = [
    { key: "all", label: "All", color: "bg-zinc-500" },
    { key: "branch", label: "Branch", color: "bg-amber-500" },
    { key: "challenge", label: "Challenge", color: "bg-red-500" },
    { key: "define", label: "Define", color: "bg-blue-500" },
    { key: "connect", label: "Connect", color: "bg-green-500" },
  ];

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[35] bg-black/40"
        onClick={onClose}
      />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        drag="y"
        dragConstraints={{ top: 0 }}
        dragElastic={0.2}
        onDragEnd={(_, info) => { if (info.offset.y > 100) onClose(); }}
        className="fixed bottom-0 left-0 right-0 z-40 max-h-[85vh] bg-zinc-900 rounded-t-2xl border-t border-zinc-700 flex flex-col"
      >
        <div className="flex-shrink-0 pt-3 pb-2 px-4">
          <div className="w-10 h-1 rounded-full bg-zinc-600 mx-auto mb-3" />
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-zinc-100">
              Threads <span className="text-zinc-500 text-sm font-normal">({activeThreads.length})</span>
            </h2>
            <button onClick={onClose} className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-zinc-200 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        <div className="flex-shrink-0 px-4 pb-3 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2">
            {filterOptions.map((opt) => {
              const count = opt.key === "all" ? activeThreads.length : activeThreads.filter((t) => t.action === opt.key).length;
              if (opt.key !== "all" && count === 0) return null;
              const isActive = filter === opt.key;
              return (
                <button
                  key={opt.key}
                  onClick={() => onFilterChange(opt.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-colors whitespace-nowrap ${
                    isActive ? "bg-zinc-700 text-zinc-100" : "bg-zinc-800/80 text-zinc-400 hover:bg-zinc-800"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${opt.color}`} />
                  {opt.label}
                  <span className={`text-[10px] ${isActive ? "text-zinc-300" : "text-zinc-500"}`}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-[env(safe-area-inset-bottom)]">
          {sorted.length === 0 && archivedSorted.length === 0 ? (
            <div className="text-center py-10 text-zinc-500 text-sm">No threads yet</div>
          ) : (
            <div className="space-y-2 pb-4">
              {sorted.map((thread) => {
                const depth = getThreadDepth(thread);
                const parentPreview = getParentMessagePreview(thread);
                return (
                  <button
                    key={thread.id}
                    onClick={() => onSelectThread(thread.id)}
                    className="w-full text-left p-3 rounded-xl bg-zinc-800/60 border border-zinc-700/50 hover:bg-zinc-800 transition-colors active:scale-[0.98]"
                  >
                    <div className="flex items-start gap-2.5">
                      <span className={`w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0 ${actionColors[thread.action]}`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] text-zinc-200 line-clamp-2 leading-snug">
                          &ldquo;{thread.highlightedText}&rdquo;
                        </p>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wide">{actionLabels[thread.action]}</span>
                          <span className="text-[10px] text-zinc-600">·</span>
                          <span className="text-[10px] text-zinc-500">{thread.messages.length} {thread.messages.length === 1 ? "reply" : "replies"}</span>
                          {depth > 0 && (
                            <>
                              <span className="text-[10px] text-zinc-600">·</span>
                              <span className="text-[10px] text-zinc-500">{"↳".repeat(depth)} depth {depth}</span>
                            </>
                          )}
                          <span className="text-[10px] text-zinc-600">·</span>
                          <span className="text-[10px] text-zinc-500">{formatRelativeTime(thread.createdAt)}</span>
                        </div>
                        {parentPreview && (
                          <p className="text-[11px] text-zinc-600 truncate mt-1">↩ {parentPreview.slice(0, 60)}</p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}

              {archivedSorted.length > 0 && (
                <>
                  <button
                    onClick={() => setShowArchived((v) => !v)}
                    className="w-full flex items-center gap-2 py-2 mt-2 text-zinc-500 hover:text-zinc-400 transition-colors"
                  >
                    <svg className={`w-3 h-3 transition-transform ${showArchived ? "rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="text-[11px] font-medium uppercase tracking-wide">Archived</span>
                    <span className="text-[10px] text-zinc-600">{archivedSorted.length}</span>
                  </button>

                  {showArchived && archivedSorted.map((thread) => {
                    const depth = getThreadDepth(thread);
                    const parentPreview = getParentMessagePreview(thread);
                    return (
                      <div
                        key={thread.id}
                        className="w-full text-left p-3 rounded-xl bg-zinc-800/30 border border-zinc-700/30 opacity-70"
                      >
                        <div className="flex items-start gap-2.5">
                          <span className={`w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0 ${actionColors[thread.action]}`} />
                          <div className="min-w-0 flex-1">
                            <button
                              onClick={() => onSelectThread(thread.id)}
                              className="text-left"
                            >
                              <p className="text-[13px] text-zinc-400 line-clamp-2 leading-snug">
                                &ldquo;{thread.highlightedText}&rdquo;
                              </p>
                            </button>
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wide">{actionLabels[thread.action]}</span>
                              <span className="text-[10px] text-zinc-600">·</span>
                              <span className="text-[10px] text-zinc-500">{thread.messages.length} {thread.messages.length === 1 ? "reply" : "replies"}</span>
                              {depth > 0 && (
                                <>
                                  <span className="text-[10px] text-zinc-600">·</span>
                                  <span className="text-[10px] text-zinc-500">{"↳".repeat(depth)} depth {depth}</span>
                                </>
                              )}
                              <span className="text-[10px] text-zinc-600">·</span>
                              <span className="text-[10px] text-zinc-500">{formatRelativeTime(thread.createdAt)}</span>
                              {onToggleClosed && (
                                <>
                                  <span className="text-[10px] text-zinc-600">·</span>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); onToggleClosed(thread.id, false); }}
                                    className="text-[10px] text-emerald-500 hover:text-emerald-400 font-medium transition-colors"
                                  >
                                    Reopen
                                  </button>
                                </>
                              )}
                            </div>
                            {parentPreview && (
                              <p className="text-[11px] text-zinc-600 truncate mt-1">↩ {parentPreview.slice(0, 60)}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}
