"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Markdown from "react-markdown";
import Link from "next/link";
import { messages, users, sources, forks } from "@/data/mockDebate";
import {
  getRootThread,
  getForkMessages,
  getParentMessage,
} from "@/lib/tree";
import { Message, Source, Citation, Fork } from "@/lib/types";

function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function formatDay(ts: string) {
  return new Date(ts).toLocaleDateString("en-US", { month: "long", day: "numeric" });
}

function CitationPreview({ citation, source }: { citation: Citation; source: Source }) {
  return (
    <div className="mt-1.5 rounded-lg bg-black/20 border border-white/10 overflow-hidden">
      {citation.quote && (
        <div className="px-2.5 py-1.5 border-b border-white/10">
          <p className="text-[11px] italic opacity-70 leading-snug">&ldquo;{citation.quote}&rdquo;</p>
        </div>
      )}
      <div className="px-2.5 py-1.5 flex items-center gap-2">
        <div className="w-5 h-5 rounded bg-white/10 flex items-center justify-center flex-shrink-0">
          <svg className="w-3 h-3 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium leading-tight truncate">{source.title}</p>
          <p className="text-[10px] opacity-50">{source.author}{source.year ? ` · ${source.year}` : ""}</p>
        </div>
      </div>
    </div>
  );
}

function Bubble({
  message,
  isMe,
  showTail,
  index,
}: {
  message: Message;
  isMe: boolean;
  showTail: boolean;
  index: number;
}) {
  const parentMsg = getParentMessage(message.parentId, messages);
  const citedSources = message.citations
    .map((c) => ({ citation: c, source: sources.find((s) => s.id === c.sourceId)! }))
    .filter((c) => c.source);
  const showQuotedReply = parentMsg && parentMsg.userId !== message.userId;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 250, delay: index * 0.015 }}
      className={`flex ${isMe ? "justify-end" : "justify-start"} ${showTail ? "mt-2" : "mt-0.5"}`}
    >
      <div className="relative max-w-[75%]">
        <div
          className={`relative rounded-2xl px-3 py-2 ${
            isMe
              ? "bg-blue-500 text-white rounded-br-md"
              : "bg-zinc-800 text-zinc-100 rounded-bl-md"
          } ${showTail ? "" : isMe ? "rounded-br-2xl" : "rounded-bl-2xl"}`}
        >
          {showQuotedReply && parentMsg && (
            <div
              className={`mb-1.5 px-2 py-1 rounded-lg text-[11px] leading-snug ${
                isMe ? "bg-blue-600/60 border-l-2 border-blue-300/50" : "bg-zinc-700/80 border-l-2 border-zinc-500/50"
              }`}
            >
              <span className="font-semibold opacity-80">{users[parentMsg.userId]?.name}</span>
              <p className="opacity-70 line-clamp-2 mt-0.5">{parentMsg.content.slice(0, 80)}{parentMsg.content.length > 80 ? "..." : ""}</p>
            </div>
          )}
          <div className={`text-[15px] leading-relaxed prose max-w-none ${isMe ? "prose-invert prose-p:my-0.5 prose-strong:text-white" : "prose-invert prose-p:my-0.5 prose-strong:text-zinc-100"}`}>
            <Markdown>{message.content}</Markdown>
          </div>
          {citedSources.length > 0 && (
            <div className="mt-1 space-y-1">
              {citedSources.map(({ citation, source }) => (
                <CitationPreview key={citation.id} citation={citation} source={source} />
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function ForkDivider({ fork, messageCount, isExpanded, onToggle }: { fork: Fork; messageCount: number; isExpanded: boolean; onToggle: () => void }) {
  const colorMap: Record<string, string> = {
    "border-amber-400": "bg-amber-400/10 border-amber-400/30 text-amber-400",
    "border-rose-400": "bg-rose-400/10 border-rose-400/30 text-rose-400",
    "border-emerald-400": "bg-emerald-400/10 border-emerald-400/30 text-emerald-400",
  };
  const colors = colorMap[fork.color] || "bg-zinc-700/20 border-zinc-600 text-zinc-400";

  return (
    <div className="py-3 px-2">
      <button
        onClick={onToggle}
        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl border ${colors} transition-colors`}
      >
        <svg className={`w-4 h-4 flex-shrink-0 transition-transform ${isExpanded ? "rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-xs font-semibold flex-1 text-left">{fork.title}</span>
        <span className="text-[10px] opacity-60">{messageCount} msgs</span>
      </button>
    </div>
  );
}

function ForkPills({ forkIds, onSelect }: { forkIds: string[]; onSelect: (id: string) => void }) {
  return (
    <div className="flex gap-2 px-3 py-2">
      {forkIds.map((fId) => {
        const fork = forks.find((f) => f.id === fId);
        if (!fork) return null;
        const colorMap: Record<string, string> = {
          "border-amber-400": "border-amber-400/50 text-amber-400",
          "border-rose-400": "border-rose-400/50 text-rose-400",
          "border-emerald-400": "border-emerald-400/50 text-emerald-400",
        };
        const c = colorMap[fork.color] || "border-zinc-600 text-zinc-400";
        return (
          <button
            key={fId}
            onClick={() => onSelect(fId)}
            className={`text-[11px] px-2.5 py-1 rounded-full border ${c} bg-zinc-900/50 font-medium`}
          >
            ⑂ {fork.title}
          </button>
        );
      })}
    </div>
  );
}

function DayDivider({ day }: { day: string }) {
  return (
    <div className="flex items-center justify-center py-3">
      <span className="text-[11px] font-medium text-zinc-500 bg-zinc-950 px-3">{day}</span>
    </div>
  );
}

export default function V2Page() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [expandedForks, setExpandedForks] = useState<Set<string>>(new Set(forks.map((f) => f.id)));

  const rootThread = useMemo(() => getRootThread(messages), []);

  // Find which messages have forks branching from them
  const forkPoints = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const fork of forks) {
      const existing = map.get(fork.parentMessageId) || [];
      existing.push(fork.id);
      map.set(fork.parentMessageId, existing);
    }
    return map;
  }, []);

  const toggleFork = (id: string) => {
    setExpandedForks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  let globalIdx = 0;
  let lastDay = "";

  return (
    <div className="flex flex-col min-h-dvh bg-zinc-950">
      <header className="sticky top-0 z-20 bg-zinc-950/95 backdrop-blur border-b border-zinc-800">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link href="/" className="text-zinc-500">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="flex-1">
            <h1 className="text-base font-semibold text-zinc-100">Culture & Personality</h1>
            <p className="text-[11px] text-zinc-500">iMessage + Branching</p>
          </div>
        </div>
      </header>

      <main ref={scrollRef} className="flex-1 overflow-y-auto px-3 pb-24">
        {rootThread.map((msg) => {
          const isMe = msg.userId === "aj";
          const day = formatDay(msg.timestamp);
          const showDay = day !== lastDay;
          lastDay = day;
          const idx = globalIdx++;
          const prevRoot = rootThread[rootThread.indexOf(msg) - 1];
          const showTail = !prevRoot || prevRoot.userId !== msg.userId || showDay;
          const forksHere = forkPoints.get(msg.id);

          return (
            <div key={msg.id}>
              {showDay && <DayDivider day={day} />}
              <Bubble message={msg} isMe={isMe} showTail={showTail} index={idx} />

              {/* Fork pills at branch points */}
              {forksHere && <ForkPills forkIds={forksHere} onSelect={(id) => {
                if (!expandedForks.has(id)) toggleFork(id);
                // scroll to fork
              }} />}

              {/* Expanded fork content */}
              {forksHere?.map((forkId) => {
                const fork = forks.find((f) => f.id === forkId)!;
                const forkMsgs = getForkMessages(messages, forkId);
                const isExpanded = expandedForks.has(forkId);
                return (
                  <div key={forkId}>
                    <ForkDivider
                      fork={fork}
                      messageCount={forkMsgs.length}
                      isExpanded={isExpanded}
                      onToggle={() => toggleFork(forkId)}
                    />
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden pl-3 border-l-2 border-zinc-800 ml-3"
                        >
                          {forkMsgs.map((fMsg, fi) => {
                            const fIsMe = fMsg.userId === "aj";
                            const prev = fi > 0 ? forkMsgs[fi - 1] : null;
                            const fShowTail = !prev || prev.userId !== fMsg.userId;
                            return (
                              <Bubble
                                key={fMsg.id}
                                message={fMsg}
                                isMe={fIsMe}
                                showTail={fShowTail}
                                index={globalIdx++}
                              />
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          );
        })}
      </main>

      {/* Composer */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-zinc-900/95 backdrop-blur border-t border-zinc-800">
        <div className="max-w-lg mx-auto flex items-center gap-2 px-3 py-2">
          <div className="flex-1 bg-zinc-800 rounded-full px-4 py-2 text-sm text-zinc-500">iMessage</div>
          <button className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </div>
    </div>
  );
}
