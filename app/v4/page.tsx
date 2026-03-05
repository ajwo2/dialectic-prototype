"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Markdown from "react-markdown";
import Link from "next/link";
import { messages, users, sources, forks } from "@/data/mockDebate";
import { flattenChronological } from "@/lib/tree";
import { Message, Source, Citation } from "@/lib/types";

function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function formatDay(ts: string) {
  return new Date(ts).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function RichCitationEmbed({ citation, source }: { citation: Citation; source: Source }) {
  const typeIcon = source.type === "paper" || source.type === "link" ? "🔗" : source.type === "book" ? "📚" : "💬";
  return (
    <div className="mt-2 rounded-xl border border-zinc-700/50 bg-zinc-800/60 overflow-hidden">
      {citation.quote && (
        <div className="px-3 py-2 bg-zinc-800/80 border-b border-zinc-700/30">
          <p className="text-xs italic text-zinc-400 leading-relaxed">&ldquo;{citation.quote}&rdquo;</p>
        </div>
      )}
      <div className="px-3 py-2.5 flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-zinc-700/50 flex items-center justify-center text-lg flex-shrink-0">
          {typeIcon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-zinc-200 leading-snug">{source.title}</p>
          <p className="text-[11px] text-zinc-500 mt-0.5">{source.author}{source.year ? ` · ${source.year}` : ""}</p>
          {source.description && (
            <p className="text-[11px] text-zinc-600 mt-1 line-clamp-2 leading-relaxed">{source.description}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function ConversationCard({
  message,
  index,
}: {
  message: Message;
  index: number;
}) {
  const user = users[message.userId];
  const fork = message.forkId ? forks.find((f) => f.id === message.forkId) : undefined;
  const citedSources = message.citations
    .map((c) => ({ citation: c, source: sources.find((s) => s.id === c.sourceId)! }))
    .filter((c) => c.source);

  // Fork color for left border
  const forkBorderColor = fork
    ? fork.color.replace("border-", "border-l-").replace(/^border-l-/, "border-l-")
    : "";

  const [reacted, setReacted] = useState<string | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 200, delay: index * 0.02 }}
      className={`mx-3 mb-2 rounded-2xl border border-zinc-800/80 bg-zinc-900/80 shadow-sm shadow-black/20 overflow-hidden ${
        fork ? `border-l-[3px] ${forkBorderColor}` : ""
      }`}
    >
      {/* Author row */}
      <div className="flex items-center gap-2.5 px-3 pt-3 pb-1">
        <div className={`w-7 h-7 rounded-full ${user.color} flex items-center justify-center text-[10px] font-bold text-white`}>
          {user.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold text-zinc-200">{user.name}</span>
          {fork && (
            <span className="text-[10px] text-zinc-500 ml-2">in {fork.title}</span>
          )}
        </div>
        <span className="text-[10px] text-zinc-600">{formatTime(message.timestamp)}</span>
      </div>

      {/* Content */}
      <div className="px-3 pb-2">
        <div className="text-[14px] leading-relaxed text-zinc-300 prose prose-invert prose-sm max-w-none prose-p:my-1 prose-blockquote:border-zinc-600 prose-strong:text-zinc-100 prose-blockquote:my-2">
          <Markdown>{message.content}</Markdown>
        </div>

        {/* Rich citation embeds */}
        {citedSources.map(({ citation, source }) => (
          <RichCitationEmbed key={citation.id} citation={citation} source={source} />
        ))}
      </div>

      {/* Action row — always visible */}
      <div className="flex items-center border-t border-zinc-800/50 px-1">
        <button className="flex-1 flex items-center justify-center gap-1.5 py-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 rounded-lg transition-colors text-xs">
          <span>↩</span> Reply
        </button>
        <button className="flex-1 flex items-center justify-center gap-1.5 py-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 rounded-lg transition-colors text-xs">
          <span>⑂</span> Fork
        </button>
        <button
          onClick={() => setReacted(reacted ? null : "❤️")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-colors text-xs ${
            reacted ? "text-red-400 bg-red-500/10" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
          }`}
        >
          <span>{reacted || "❤️"}</span> {reacted ? "1" : "React"}
        </button>
      </div>
    </motion.div>
  );
}

function SummaryHeader() {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="mx-3 mb-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full rounded-2xl border border-purple-800/30 bg-gradient-to-r from-purple-900/20 to-blue-900/20 px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm">✨</span>
          <span className="text-xs font-semibold text-purple-300">AI Summary</span>
          <svg className={`w-3 h-3 text-purple-400 ml-auto transition-transform ${expanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        {!expanded && (
          <p className="text-[11px] text-zinc-400 mt-1">
            Core question: How does culture shape personality? Tap to expand...
          </p>
        )}
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden rounded-b-2xl border border-t-0 border-zinc-800 bg-zinc-900/50 px-4 py-3"
          >
            <p className="text-xs text-zinc-400 leading-relaxed">
              <strong className="text-zinc-300">Core Question:</strong> How does culture shape personality, and can we meaningfully study this relationship?
            </p>
            <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
              Key themes: Big Five universality, biology-culture co-constitution, I/C framework limitations, Asia-as-monolith problem, culture as emergent process.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function V4Page() {
  const flat = useMemo(() => flattenChronological(messages), []);

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
            <p className="text-[11px] text-zinc-500">Conversation Cards</p>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pt-3 pb-20">
        <SummaryHeader />
        {flat.map((msg, i) => (
          <ConversationCard key={msg.id} message={msg} index={i} />
        ))}
      </main>

      {/* Composer */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-zinc-900/95 backdrop-blur border-t border-zinc-800">
        <div className="max-w-lg mx-auto flex items-center gap-2 px-3 py-2">
          <div className="flex-1 bg-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-500">
            Add to the conversation...
          </div>
          <button className="px-4 py-2.5 bg-blue-600 rounded-xl text-sm font-medium text-white">
            Send
          </button>
        </div>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </div>
    </div>
  );
}
