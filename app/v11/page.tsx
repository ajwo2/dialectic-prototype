"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Markdown from "react-markdown";
import Link from "next/link";
import { messages, users, sources, forks } from "@/data/mockDebate";
import { defaultReactions } from "@/data/mockInteractionData";
import { flattenChronological, getParentMessage } from "@/lib/tree";
import { Message, DiscourseReaction } from "@/lib/types";
import { computeThreadTemperature, DISCOURSE_REACTIONS } from "@/lib/interaction-utils";

function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function TemperatureBar({ reactions }: { reactions: DiscourseReaction[] }) {
  const temp = computeThreadTemperature(reactions);
  // Map 0-1 to gradient position: blue (cool) → yellow (warm) → red (hot)
  const hue = Math.round((1 - temp) * 220); // 220 = blue, 0 = red
  return (
    <div className="h-1 rounded-full bg-zinc-800 overflow-hidden mt-1.5">
      <motion.div
        className="h-full rounded-full"
        style={{ backgroundColor: `hsl(${hue}, 70%, 50%)` }}
        initial={{ width: 0 }}
        animate={{ width: `${Math.max(10, temp * 100)}%` }}
        transition={{ type: "spring", damping: 20, stiffness: 150 }}
      />
    </div>
  );
}

function DiscourseReactionBar({
  reactions,
  onToggle,
}: {
  reactions: DiscourseReaction[];
  onToggle: (type: DiscourseReaction["type"]) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1 mt-1.5">
      {DISCOURSE_REACTIONS.map((dr) => {
        const existing = reactions.find((r) => r.type === dr.type);
        const count = existing?.count || 0;
        const isActive = count > 0;
        return (
          <button
            key={dr.type}
            onClick={() => onToggle(dr.type)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] border transition-all ${
              isActive
                ? dr.color
                : "text-zinc-600 bg-zinc-800/40 border-zinc-700/30 hover:bg-zinc-800"
            }`}
          >
            <span>{dr.emoji}</span>
            {isActive && <span>{count}</span>}
          </button>
        );
      })}
    </div>
  );
}

function TensionMessage({
  message,
  index,
  showName,
  reactions,
  onToggleReaction,
}: {
  message: Message;
  index: number;
  showName: boolean;
  reactions: DiscourseReaction[];
  onToggleReaction: (messageId: string, type: DiscourseReaction["type"]) => void;
}) {
  const user = users[message.userId];
  const isAJ = message.userId === "aj";
  const borderColor = isAJ ? "border-l-blue-500" : "border-l-purple-500";
  const parentMsg = getParentMessage(message.parentId, messages);
  const fork = message.forkId ? forks.find((f) => f.id === message.forkId) : undefined;
  const citedSources = message.citations
    .map((c) => ({ citation: c, source: sources.find((s) => s.id === c.sourceId)! }))
    .filter((c) => c.source);

  const temp = computeThreadTemperature(reactions);
  const isHot = temp > 0.6;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: "spring", damping: 30, stiffness: 300, delay: index * 0.01 }}
      className={`border-l-[3px] ${borderColor} px-2.5 py-1.5 ${showName ? "mt-2" : "mt-0.5"} ${
        isHot ? "bg-red-500/[0.03]" : ""
      }`}
    >
      {/* Name row */}
      {showName && (
        <div className="flex items-center gap-1.5 mb-0.5">
          <div
            className={`w-5 h-5 rounded-full ${user.color} flex items-center justify-center text-[8px] font-bold text-white`}
          >
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

      {/* Content */}
      <div className="text-[14px] leading-relaxed text-zinc-300 prose prose-invert prose-sm max-w-none prose-p:my-0.5 prose-blockquote:border-zinc-600 prose-strong:text-zinc-100">
        <Markdown>{message.content}</Markdown>
      </div>

      {/* Citations */}
      {citedSources.length > 0 && (
        <div className="mt-1 space-y-1">
          {citedSources.map(({ citation, source }) => (
            <div
              key={citation.id}
              className="flex items-center gap-2 px-2 py-1 rounded bg-zinc-800/60 border border-zinc-700/30"
            >
              <svg className="w-3 h-3 text-zinc-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <span className="text-[10px] text-zinc-400 truncate">{source.title}</span>
            </div>
          ))}
        </div>
      )}

      {/* Discourse reactions */}
      <DiscourseReactionBar
        reactions={reactions}
        onToggle={(type) => onToggleReaction(message.id, type)}
      />

      {/* Temperature bar */}
      {reactions.length > 0 && <TemperatureBar reactions={reactions} />}
    </motion.div>
  );
}

function ForkDividerBar({ fork }: { fork: (typeof forks)[0] }) {
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

function HeatMapView({
  flat,
  reactionsMap,
}: {
  flat: Message[];
  reactionsMap: Record<string, DiscourseReaction[]>;
}) {
  return (
    <div className="px-3 py-4 space-y-1">
      <p className="text-[11px] text-zinc-500 font-mono uppercase tracking-wider mb-3">Conversation Heat Map</p>
      {flat.map((msg) => {
        const reactions = reactionsMap[msg.id] || [];
        const temp = computeThreadTemperature(reactions);
        const hue = Math.round((1 - temp) * 220);
        const user = users[msg.userId];
        return (
          <div key={msg.id} className="flex items-center gap-2">
            <div
              className="w-1.5 h-6 rounded-full flex-shrink-0"
              style={{ backgroundColor: `hsl(${hue}, 70%, 50%)` }}
            />
            <div className="flex-1 min-w-0">
              <span className="text-[10px] text-zinc-500">{user.name}:</span>
              <span className="text-[10px] text-zinc-600 ml-1 truncate">
                {msg.content.slice(0, 60)}...
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function V11Page() {
  const flat = useMemo(() => flattenChronological(messages), []);
  const [reactionsMap, setReactionsMap] = useState<Record<string, DiscourseReaction[]>>(defaultReactions);
  const [showHeatMap, setShowHeatMap] = useState(false);

  const toggleReaction = (messageId: string, type: DiscourseReaction["type"]) => {
    setReactionsMap((prev) => {
      const existing = prev[messageId] || [];
      const idx = existing.findIndex((r) => r.type === type);
      let next: DiscourseReaction[];
      if (idx >= 0) {
        // Toggle: increment count
        next = existing.map((r) =>
          r.type === type ? { ...r, count: r.count + 1 } : r
        );
      } else {
        next = [...existing, { type, count: 1 }];
      }
      return { ...prev, [messageId]: next };
    });
  };

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
            <p className="text-[11px] text-zinc-500">Tension Markers</p>
          </div>
          <button
            onClick={() => setShowHeatMap(!showHeatMap)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors ${
              showHeatMap
                ? "bg-red-500/20 text-red-400 border-red-500/30"
                : "bg-zinc-800 text-zinc-400 border-zinc-700"
            }`}
          >
            🌡 Heat Map
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-20 px-1">
        <AnimatePresence mode="wait">
          {showHeatMap ? (
            <motion.div
              key="heatmap"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <HeatMapView flat={flat} reactionsMap={reactionsMap} />
            </motion.div>
          ) : (
            <motion.div
              key="messages"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {flat.map((msg, i) => {
                const showForkDivider = msg.forkId !== lastForkId && msg.forkId;
                const fork = msg.forkId ? forks.find((f) => f.id === msg.forkId) : undefined;
                const showName = msg.userId !== lastUserId || !!showForkDivider;
                lastForkId = msg.forkId;
                lastUserId = msg.userId;

                return (
                  <div key={msg.id}>
                    {showForkDivider && fork && <ForkDividerBar fork={fork} />}
                    <TensionMessage
                      message={msg}
                      index={i}
                      showName={showName}
                      reactions={reactionsMap[msg.id] || []}
                      onToggleReaction={toggleReaction}
                    />
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Composer */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-zinc-900/95 backdrop-blur border-t border-zinc-800">
        <div className="max-w-lg mx-auto flex items-center gap-2 px-3 py-2">
          <div className="flex-1 bg-zinc-800 rounded-full px-4 py-2 text-sm text-zinc-500">Message</div>
          <button className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </div>
    </div>
  );
}
