"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Markdown from "react-markdown";
import Link from "next/link";
import { messages, users, sources, forks } from "@/data/mockDebate";
import { flattenChronological, getParentMessage } from "@/lib/tree";
import { Message, Source, Citation } from "@/lib/types";

function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

const REACTIONS = ["🔥", "👏", "🤔", "❌"];

function QuotedReplyCard({ parent }: { parent: Message }) {
  const user = users[parent.userId];
  return (
    <div className="mb-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-800/80 border border-zinc-700/50">
      <div className="flex items-center gap-1.5">
        <div className={`w-3 h-3 rounded-full ${user.color}`} />
        <span className="text-[10px] font-semibold text-zinc-400">{user.name}</span>
      </div>
      <p className="text-[11px] text-zinc-500 line-clamp-2 mt-0.5 leading-snug">
        {parent.content.slice(0, 100)}{parent.content.length > 100 ? "..." : ""}
      </p>
    </div>
  );
}

function SignalMessage({
  message,
  index,
  showName,
}: {
  message: Message;
  index: number;
  showName: boolean;
}) {
  const user = users[message.userId];
  const isAJ = message.userId === "aj";
  const borderColor = isAJ ? "border-l-blue-500" : "border-l-purple-500";
  const parentMsg = getParentMessage(message.parentId, messages);
  const fork = message.forkId ? forks.find((f) => f.id === message.forkId) : undefined;
  const citedSources = message.citations
    .map((c) => ({ citation: c, source: sources.find((s) => s.id === c.sourceId)! }))
    .filter((c) => c.source);

  const [showReactions, setShowReactions] = useState(false);
  const [activeReactions, setActiveReactions] = useState<string[]>([]);
  const [contextMenu, setContextMenu] = useState(false);

  const showQuotedReply = parentMsg && parentMsg.userId !== message.userId;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: "spring", damping: 30, stiffness: 300, delay: index * 0.01 }}
      className={`border-l-[3px] ${borderColor} px-2.5 py-1 ${showName ? "mt-2" : "mt-0.5"}`}
      onContextMenu={(e) => { e.preventDefault(); setContextMenu(!contextMenu); }}
      onClick={() => setContextMenu(false)}
    >
      {/* Name + avatar row */}
      {showName && (
        <div className="flex items-center gap-1.5 mb-0.5">
          <div className={`w-5 h-5 rounded-full ${user.color} flex items-center justify-center text-[8px] font-bold text-white`}>
            {user.avatar}
          </div>
          <span className="text-[11px] font-semibold text-zinc-300">{user.name}</span>
          <span className="text-[10px] text-zinc-600">{formatTime(message.timestamp)}</span>
          {fork && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500 border border-zinc-700">
              ⑂ {fork.title}
            </span>
          )}
        </div>
      )}

      {/* Quoted reply */}
      {showQuotedReply && parentMsg && <QuotedReplyCard parent={parentMsg} />}

      {/* Content */}
      <div className="text-[14px] leading-relaxed text-zinc-300 prose prose-invert prose-sm max-w-none prose-p:my-0.5 prose-blockquote:border-zinc-600 prose-strong:text-zinc-100">
        <Markdown>{message.content}</Markdown>
      </div>

      {/* Citations */}
      {citedSources.length > 0 && (
        <div className="mt-1 space-y-1">
          {citedSources.map(({ citation, source }) => (
            <div key={citation.id} className="flex items-center gap-2 px-2 py-1 rounded bg-zinc-800/60 border border-zinc-700/30">
              <svg className="w-3 h-3 text-zinc-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <span className="text-[10px] text-zinc-400 truncate">{source.title}</span>
            </div>
          ))}
        </div>
      )}

      {/* Reactions row */}
      {activeReactions.length > 0 && (
        <div className="flex gap-1 mt-1">
          {activeReactions.map((r) => (
            <span key={r} className="text-[11px] px-1.5 py-0.5 rounded-full bg-zinc-800 border border-zinc-700">
              {r} 1
            </span>
          ))}
        </div>
      )}

      {/* Tap to react */}
      <div className="flex gap-1 mt-1">
        {REACTIONS.map((r) => (
          <button
            key={r}
            onClick={(e) => {
              e.stopPropagation();
              setActiveReactions((prev) =>
                prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]
              );
            }}
            className={`text-xs px-1.5 py-0.5 rounded-full transition-colors ${
              activeReactions.includes(r) ? "bg-zinc-700" : "bg-zinc-800/40 hover:bg-zinc-800"
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Context menu */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute right-2 mt-1 bg-zinc-800 border border-zinc-700 rounded-xl shadow-2xl shadow-black/50 py-1 z-30"
          >
            {["Reply", "Fork", "React", "Cite"].map((action) => (
              <button
                key={action}
                className="block w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700"
                onClick={() => setContextMenu(false)}
              >
                {action}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ForkDividerBar({ fork }: { fork: typeof forks[0] }) {
  const colorMap: Record<string, string> = {
    "border-amber-400": "from-amber-500/20 via-amber-500/5 to-transparent text-amber-400",
    "border-rose-400": "from-rose-500/20 via-rose-500/5 to-transparent text-rose-400",
    "border-emerald-400": "from-emerald-500/20 via-emerald-500/5 to-transparent text-emerald-400",
  };
  const c = colorMap[fork.color] || "from-zinc-500/20 to-transparent text-zinc-400";
  return (
    <div className={`py-2 px-3 my-2 bg-gradient-to-r ${c} rounded-lg`}>
      <div className="flex items-center gap-2">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
        <span className="text-[11px] font-semibold">{fork.title}</span>
        {fork.description && <span className="text-[10px] opacity-60">— {fork.description}</span>}
      </div>
    </div>
  );
}

export default function V3Page() {
  const flat = useMemo(() => flattenChronological(messages), []);

  // Track current fork to show dividers
  let lastForkId: string | undefined = undefined;
  let lastUserId: string | undefined = undefined;

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
            <p className="text-[11px] text-zinc-500">Signal / Telegram Style</p>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-20 px-1">
        {flat.map((msg, i) => {
          const showForkDivider = msg.forkId !== lastForkId && msg.forkId;
          const fork = msg.forkId ? forks.find((f) => f.id === msg.forkId) : undefined;
          const showName = msg.userId !== lastUserId || showForkDivider;
          lastForkId = msg.forkId;
          lastUserId = msg.userId;

          return (
            <div key={msg.id} className="relative">
              {showForkDivider && fork && <ForkDividerBar fork={fork} />}
              <SignalMessage message={msg} index={i} showName={!!showName} />
            </div>
          );
        })}
      </main>

      {/* Composer */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-zinc-900/95 backdrop-blur border-t border-zinc-800">
        <div className="max-w-lg mx-auto flex items-center gap-2 px-3 py-2">
          <button className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <div className="flex-1 bg-zinc-800 rounded-full px-4 py-2 text-sm text-zinc-500">Message</div>
          <button className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </button>
        </div>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </div>
    </div>
  );
}
