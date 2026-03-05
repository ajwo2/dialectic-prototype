"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import Markdown from "react-markdown";
import Link from "next/link";
import { messages, users, sources, forks } from "@/data/mockDebate";
import { flattenChronological } from "@/lib/tree";
import { Message, Source } from "@/lib/types";

function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function FootnoteMarker({ num, onClick }: { num: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-zinc-700 text-[9px] font-bold text-zinc-300 ml-1 hover:bg-zinc-600 transition-colors align-super"
    >
      {num}
    </button>
  );
}

function SplitMessage({
  message,
  side,
  index,
  footnotes,
}: {
  message: Message;
  side: "left" | "right";
  index: number;
  footnotes: { num: number; source: Source; quote?: string }[];
}) {
  const user = users[message.userId];
  const fork = message.forkId ? forks.find((f) => f.id === message.forkId) : undefined;
  const [expandedFootnote, setExpandedFootnote] = useState<number | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0, x: side === "left" ? -10 : 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 200, delay: index * 0.025 }}
      className="mb-3"
    >
      {/* Name + time */}
      <div className={`flex items-center gap-1.5 mb-1 ${side === "right" ? "flex-row-reverse" : ""}`}>
        <div className={`w-5 h-5 rounded-full ${user.color} flex items-center justify-center text-[8px] font-bold text-white`}>
          {user.avatar}
        </div>
        <span className="text-[10px] text-zinc-500">{formatTime(message.timestamp)}</span>
      </div>

      {/* Fork tag */}
      {fork && (
        <div className={`mb-1 ${side === "right" ? "text-right" : ""}`}>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500 border border-zinc-700/50">
            ⑂ {fork.title}
          </span>
        </div>
      )}

      {/* Content */}
      <div className={`text-[13px] leading-relaxed text-zinc-300 prose prose-invert prose-sm max-w-none prose-p:my-0.5 prose-strong:text-zinc-100 ${side === "right" ? "text-right" : ""}`}>
        <Markdown>{message.content}</Markdown>
      </div>

      {/* Footnote markers */}
      {footnotes.length > 0 && (
        <div className={`mt-1 flex gap-1 ${side === "right" ? "justify-end" : ""}`}>
          {footnotes.map((fn) => (
            <FootnoteMarker
              key={fn.num}
              num={fn.num}
              onClick={() => setExpandedFootnote(expandedFootnote === fn.num ? null : fn.num)}
            />
          ))}
        </div>
      )}

      {/* Expanded footnote */}
      {expandedFootnote !== null && (
        <div className={`mt-1.5 p-2 rounded-lg bg-zinc-800/60 border border-zinc-700/30 ${side === "right" ? "text-right" : ""}`}>
          {footnotes
            .filter((fn) => fn.num === expandedFootnote)
            .map((fn) => (
              <div key={fn.num}>
                {fn.quote && (
                  <p className="text-[11px] italic text-zinc-400 mb-1">&ldquo;{fn.quote}&rdquo;</p>
                )}
                <p className="text-[11px] font-medium text-zinc-300">{fn.source.title}</p>
                <p className="text-[10px] text-zinc-500">{fn.source.author}{fn.source.year ? ` · ${fn.source.year}` : ""}</p>
              </div>
            ))}
        </div>
      )}
    </motion.div>
  );
}

function ForkBand({ fork }: { fork: typeof forks[0] }) {
  const colorMap: Record<string, string> = {
    "border-amber-400": "from-amber-500/10 to-amber-500/5 border-amber-500/20",
    "border-rose-400": "from-rose-500/10 to-rose-500/5 border-rose-500/20",
    "border-emerald-400": "from-emerald-500/10 to-emerald-500/5 border-emerald-500/20",
  };
  const c = colorMap[fork.color] || "from-zinc-700/10 to-zinc-700/5 border-zinc-700/20";
  return (
    <div className={`col-span-2 py-2 px-3 my-2 bg-gradient-to-r ${c} border-y rounded-lg`}>
      <div className="flex items-center justify-center gap-2">
        <span className="text-[11px] font-semibold text-zinc-400">⑂ {fork.title}</span>
        {fork.description && <span className="text-[10px] text-zinc-600">— {fork.description}</span>}
      </div>
    </div>
  );
}

function ConnectorLine() {
  return (
    <div className="col-span-2 flex justify-center -my-1">
      <div className="w-px h-4 bg-zinc-700/40" />
    </div>
  );
}

export default function V5Page() {
  const flat = useMemo(() => flattenChronological(messages), []);

  // Build footnotes map
  let footnoteCounter = 1;
  const footnotesMap = useMemo(() => {
    const map = new Map<string, { num: number; source: Source; quote?: string }[]>();
    let counter = 1;
    for (const msg of flat) {
      const fns: { num: number; source: Source; quote?: string }[] = [];
      for (const c of msg.citations) {
        const source = sources.find((s) => s.id === c.sourceId);
        if (source) {
          fns.push({ num: counter++, source, quote: c.quote });
        }
      }
      if (fns.length > 0) map.set(msg.id, fns);
    }
    return map;
  }, [flat]);

  // Track fork transitions
  let lastForkId: string | undefined = undefined;

  return (
    <div className="flex flex-col min-h-dvh bg-zinc-950">
      <header className="sticky top-0 z-20 bg-zinc-950/95 backdrop-blur border-b border-zinc-800">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link href="/" className="text-zinc-500">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="flex-1 text-center">
            <h1 className="text-base font-semibold text-zinc-100">Culture & Personality</h1>
            <p className="text-[11px] text-zinc-500">Split Screen Debate</p>
          </div>
          <div className="w-5" />
        </div>
        {/* Column headers */}
        <div className="grid grid-cols-2 gap-2 px-3 pb-2">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-[7px] font-bold text-white">AJ</div>
            <span className="text-[10px] font-semibold text-blue-400">A.J.</span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20">
            <div className="w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center text-[7px] font-bold text-white">MR</div>
            <span className="text-[10px] font-semibold text-purple-400">Marcus</span>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-20">
        <div className="grid grid-cols-2 gap-x-2 px-2 py-3">
          {flat.map((msg, i) => {
            const isAJ = msg.userId === "aj";
            const footnotes = footnotesMap.get(msg.id) || [];
            const fork = msg.forkId ? forks.find((f) => f.id === msg.forkId) : undefined;
            const showForkBand = msg.forkId !== lastForkId && fork;
            lastForkId = msg.forkId;

            return (
              <div key={msg.id} className="contents">
                {showForkBand && fork && <ForkBand fork={fork} />}
                {/* Empty cell for opposing column */}
                {isAJ ? (
                  <>
                    <div className="px-1">
                      <SplitMessage message={msg} side="left" index={i} footnotes={footnotes} />
                    </div>
                    <div /> {/* empty right */}
                  </>
                ) : (
                  <>
                    <div /> {/* empty left */}
                    <div className="px-1">
                      <SplitMessage message={msg} side="right" index={i} footnotes={footnotes} />
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </main>

      {/* Composer */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-zinc-900/95 backdrop-blur border-t border-zinc-800">
        <div className="max-w-lg mx-auto px-3 py-2">
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-zinc-800 rounded-xl px-4 py-2 text-sm text-zinc-500">
              Add to debate...
            </div>
            <button className="px-3 py-2 bg-blue-600 rounded-xl text-sm font-medium text-white">
              Send
            </button>
          </div>
        </div>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </div>
    </div>
  );
}
