"use client";

import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Markdown from "react-markdown";
import Link from "next/link";
import { messages, users, sources, forks } from "@/data/mockDebate";
import { flattenChronological } from "@/lib/tree";
import { Message, Source } from "@/lib/types";
import { findSharedSourcePairs, getMessagesBySource } from "@/lib/interaction-utils";

// Assign each source a distinct color for visual linking
const SOURCE_COLORS: Record<string, { bg: string; text: string; line: string }> = {
  s1: { bg: "bg-blue-500/10", text: "text-blue-400", line: "#3b82f6" },
  s2: { bg: "bg-purple-500/10", text: "text-purple-400", line: "#a855f7" },
  s3: { bg: "bg-amber-500/10", text: "text-amber-400", line: "#f59e0b" },
  s4: { bg: "bg-emerald-500/10", text: "text-emerald-400", line: "#10b981" },
  s5: { bg: "bg-rose-500/10", text: "text-rose-400", line: "#f43f5e" },
  s6: { bg: "bg-cyan-500/10", text: "text-cyan-400", line: "#06b6d4" },
  s7: { bg: "bg-orange-500/10", text: "text-orange-400", line: "#f97316" },
  s8: { bg: "bg-pink-500/10", text: "text-pink-400", line: "#ec4899" },
};

function MinimalMessage({
  message,
  index,
  isEven,
  highlightedSourceId,
  sharedSourceIds,
}: {
  message: Message;
  index: number;
  isEven: boolean;
  highlightedSourceId: string | null;
  sharedSourceIds: Set<string>;
}) {
  const user = users[message.userId];
  const prefix = message.userId === "aj" ? "AJ" : "M";
  const citedSourceIds = message.citations.map((c) => c.sourceId);

  const isHighlighted = highlightedSourceId && citedSourceIds.includes(highlightedSourceId);
  const isDimmed = highlightedSourceId && !isHighlighted;

  // Shared source tint — use the first shared source's color
  const sharedSourceId = citedSourceIds.find((id) => sharedSourceIds.has(id));
  const tintColor = sharedSourceId ? SOURCE_COLORS[sharedSourceId] : null;

  return (
    <motion.div
      id={`msg-${message.id}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: isDimmed ? 0.25 : 1 }}
      transition={{ delay: index * 0.015, duration: 0.3 }}
      className={`px-5 py-4 transition-all ${
        isHighlighted
          ? "bg-zinc-800/60 ring-1 ring-zinc-700"
          : isEven
          ? "bg-zinc-900/50"
          : "bg-zinc-950"
      } ${tintColor && !highlightedSourceId ? tintColor.bg : ""}`}
    >
      <div className="max-w-prose mx-auto pr-10">
        <span className="text-[13px] font-mono text-zinc-600 tracking-wide">{prefix}:</span>
        <div className="mt-1 text-[16px] leading-[1.75] text-zinc-200 font-serif prose prose-invert prose-lg max-w-none prose-p:my-2 prose-blockquote:border-zinc-600 prose-blockquote:italic prose-blockquote:text-zinc-400 prose-strong:text-zinc-100 prose-em:text-zinc-300">
          <Markdown>{message.content}</Markdown>
        </div>

        {/* Inline source badges */}
        {citedSourceIds.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {citedSourceIds.map((sId) => {
              const source = sources.find((s) => s.id === sId);
              const colors = SOURCE_COLORS[sId];
              if (!source || !colors) return null;
              const isShared = sharedSourceIds.has(sId);
              return (
                <span
                  key={sId}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border border-zinc-700/50 ${colors.bg} ${colors.text}`}
                >
                  {isShared && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />}
                  {source.author.split(" ").pop()}
                  {source.year ? ` '${String(source.year).slice(2)}` : ""}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function ForkTypographicDivider({ fork }: { fork: (typeof forks)[0] }) {
  return (
    <div className="py-6 px-5">
      <div className="max-w-prose mx-auto flex items-center gap-4 pr-10">
        <div className="flex-1 h-px bg-zinc-800" />
        <span className="text-[13px] font-serif italic text-zinc-500">{fork.title}</span>
        <div className="flex-1 h-px bg-zinc-800" />
      </div>
    </div>
  );
}

function SourceRail({
  selectedSourceId,
  onSelectSource,
  sharedSourceIds,
}: {
  selectedSourceId: string | null;
  onSelectSource: (id: string | null) => void;
  sharedSourceIds: Set<string>;
}) {
  return (
    <div className="fixed right-0 top-12 bottom-0 w-10 z-10 bg-zinc-950/80 backdrop-blur border-l border-zinc-800/50 flex flex-col items-center py-4 gap-2 overflow-y-auto">
      {sources.map((source) => {
        const colors = SOURCE_COLORS[source.id];
        const isSelected = selectedSourceId === source.id;
        const citingMessages = getMessagesBySource(source.id, messages);
        const isShared = sharedSourceIds.has(source.id);

        return (
          <button
            key={source.id}
            id={`source-${source.id}`}
            onClick={() => onSelectSource(isSelected ? null : source.id)}
            className={`relative w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-bold transition-all ${
              isSelected
                ? `ring-2 ring-offset-1 ring-offset-zinc-950 ${colors?.bg} ${colors?.text}`
                : `bg-zinc-800/60 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300`
            }`}
            style={isSelected ? { boxShadow: `0 0 0 2px ${colors?.line}` } : {}}
            title={`${source.title} (${citingMessages.length} citations)`}
          >
            {source.type === "paper" ? "P" : source.type === "book" ? "B" : source.type === "link" ? "L" : "Q"}
            {citingMessages.length > 1 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-zinc-700 text-[7px] text-zinc-300 flex items-center justify-center border border-zinc-600">
                {citingMessages.length}
              </span>
            )}
            {isShared && !isSelected && (
              <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-amber-500" />
            )}
          </button>
        );
      })}
    </div>
  );
}

function SourceDetailPanel({
  source,
  onClose,
}: {
  source: Source;
  onClose: () => void;
}) {
  const colors = SOURCE_COLORS[source.id];
  const citingMessages = getMessagesBySource(source.id, messages);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="fixed right-12 top-16 w-64 z-20 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl shadow-black/50 overflow-hidden"
    >
      <div className={`px-4 py-3 ${colors?.bg} border-b border-zinc-800`}>
        <div className="flex items-center justify-between">
          <span className={`text-[10px] font-mono uppercase tracking-wider ${colors?.text}`}>
            {source.type}
          </span>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 text-sm">×</button>
        </div>
        <h3 className="text-[13px] font-serif text-zinc-100 mt-1 leading-snug">{source.title}</h3>
        <p className="text-[11px] text-zinc-400 mt-0.5">
          {source.author}{source.year ? `, ${source.year}` : ""}
        </p>
      </div>
      <div className="px-4 py-3">
        {source.description && (
          <p className="text-[11px] text-zinc-500 leading-relaxed mb-3">{source.description}</p>
        )}
        <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-wider mb-2">
          Cited by ({citingMessages.length})
        </p>
        <div className="space-y-1.5">
          {citingMessages.map((msg) => {
            const user = users[msg.userId];
            return (
              <div key={msg.id} className="flex items-start gap-2">
                <div className={`w-4 h-4 rounded-full ${user.color} flex items-center justify-center text-[7px] font-bold text-white flex-shrink-0 mt-0.5`}>
                  {user.avatar}
                </div>
                <p className="text-[11px] text-zinc-400 line-clamp-2 leading-snug">
                  {msg.content.slice(0, 80)}...
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

function SourceGraph({
  sharedPairs,
  onClose,
}: {
  sharedPairs: { sourceId: string; messageIds: string[] }[];
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-x-0 bottom-0 z-30 bg-zinc-900 border-t border-zinc-800 rounded-t-2xl shadow-2xl max-h-[50vh] overflow-y-auto"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <h3 className="text-[13px] font-mono text-zinc-400 uppercase tracking-wider">Source Graph</h3>
        <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 text-sm px-2 py-1">Close</button>
      </div>
      <div className="px-4 py-4">
        <div className="grid grid-cols-2 gap-3">
          {sources.map((source) => {
            const colors = SOURCE_COLORS[source.id];
            const citingCount = getMessagesBySource(source.id, messages).length;
            const isShared = sharedPairs.some((p) => p.sourceId === source.id);
            const size = Math.max(48, citingCount * 16);

            return (
              <div
                key={source.id}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border ${
                  isShared ? "border-amber-500/30 bg-amber-500/5" : "border-zinc-800 bg-zinc-800/30"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full ${colors?.bg} flex items-center justify-center flex-shrink-0`}
                  style={{ width: `${Math.min(size, 48)}px`, height: `${Math.min(size, 48)}px` }}
                >
                  <span className={`text-[11px] font-bold ${colors?.text}`}>{citingCount}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-zinc-300 font-serif leading-snug truncate">{source.title}</p>
                  <p className="text-[9px] text-zinc-500">{source.author.split(" ").pop()}</p>
                  {isShared && (
                    <span className="text-[8px] text-amber-400 font-medium">SHARED</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

export default function V13Page() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [showSourceGraph, setShowSourceGraph] = useState(false);

  const flat = useMemo(() => flattenChronological(messages), []);
  const sharedPairs = useMemo(() => findSharedSourcePairs(messages, sources), []);
  const sharedSourceIds = useMemo(
    () => new Set(sharedPairs.map((p) => p.sourceId)),
    [sharedPairs]
  );

  const selectedSource = selectedSourceId ? sources.find((s) => s.id === selectedSourceId) : null;

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const progress = el.scrollTop / (el.scrollHeight - el.clientHeight);
      setScrollProgress(Math.min(1, Math.max(0, progress)));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  let lastForkId: string | undefined = undefined;

  return (
    <div className="flex flex-col min-h-dvh bg-zinc-950">
      {/* Scroll progress */}
      <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-transparent">
        <motion.div className="h-full bg-zinc-600" style={{ width: `${scrollProgress * 100}%` }} />
      </div>

      <header className="sticky top-0.5 z-20 bg-zinc-950/95 backdrop-blur">
        <div className="flex items-center justify-between px-5 py-3 pr-12">
          <Link href="/" className="text-zinc-600 hover:text-zinc-400 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-[13px] font-mono text-zinc-500 tracking-wider uppercase">
            Source Weaving
          </h1>
          <button
            onClick={() => setShowSourceGraph(!showSourceGraph)}
            className={`px-2 py-0.5 rounded-lg text-[10px] font-medium border transition-colors ${
              showSourceGraph
                ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                : "bg-zinc-800 text-zinc-500 border-zinc-700"
            }`}
          >
            Graph
          </button>
        </div>
      </header>

      {/* Source sidebar rail */}
      <SourceRail
        selectedSourceId={selectedSourceId}
        onSelectSource={setSelectedSourceId}
        sharedSourceIds={sharedSourceIds}
      />

      {/* Source detail panel */}
      <AnimatePresence>
        {selectedSource && (
          <SourceDetailPanel
            source={selectedSource}
            onClose={() => setSelectedSourceId(null)}
          />
        )}
      </AnimatePresence>

      {/* Main content */}
      <main ref={scrollRef} className="flex-1 overflow-y-auto">
        {flat.map((msg, i) => {
          const fork = msg.forkId ? forks.find((f) => f.id === msg.forkId) : undefined;
          const showForkDivider = msg.forkId !== lastForkId && fork;
          lastForkId = msg.forkId;

          return (
            <div key={msg.id}>
              {showForkDivider && fork && <ForkTypographicDivider fork={fork} />}
              <MinimalMessage
                message={msg}
                index={i}
                isEven={i % 2 === 0}
                highlightedSourceId={selectedSourceId}
                sharedSourceIds={sharedSourceIds}
              />
            </div>
          );
        })}
        <div className="h-16" />
      </main>

      {/* Source graph bottom sheet */}
      <AnimatePresence>
        {showSourceGraph && (
          <SourceGraph
            sharedPairs={sharedPairs}
            onClose={() => setShowSourceGraph(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
