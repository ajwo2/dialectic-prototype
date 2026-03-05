"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import Markdown from "react-markdown";
import Link from "next/link";
import { messages, users, sources, forks } from "@/data/mockDebate";
import { flattenChronological } from "@/lib/tree";
import { Message, Source } from "@/lib/types";

function MinimalMessage({
  message,
  index,
  isEven,
  footnoteNums,
  onFootnoteClick,
}: {
  message: Message;
  index: number;
  isEven: boolean;
  footnoteNums: { num: number; sourceId: string }[];
  onFootnoteClick: (num: number) => void;
}) {
  const user = users[message.userId];
  const prefix = message.userId === "aj" ? "AJ" : "M";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.015 }}
      className={`px-5 py-4 ${isEven ? "bg-zinc-900/50" : "bg-zinc-950"}`}
    >
      <div className="max-w-prose mx-auto">
        {/* Initials prefix */}
        <span className="text-[13px] font-mono text-zinc-600 tracking-wide">{prefix}:</span>

        {/* Content — serif typography */}
        <div className="mt-1 text-[16px] leading-[1.75] text-zinc-200 font-serif prose prose-invert prose-lg max-w-none prose-p:my-2 prose-blockquote:border-zinc-600 prose-blockquote:italic prose-blockquote:text-zinc-400 prose-strong:text-zinc-100 prose-em:text-zinc-300">
          <Markdown>{message.content}</Markdown>
        </div>

        {/* Inline footnote markers */}
        {footnoteNums.length > 0 && (
          <span className="ml-1">
            {footnoteNums.map((fn) => (
              <button
                key={fn.num}
                onClick={() => onFootnoteClick(fn.num)}
                className="text-[12px] text-zinc-500 hover:text-zinc-300 font-mono transition-colors"
              >
                [{fn.num}]
              </button>
            ))}
          </span>
        )}
      </div>
    </motion.div>
  );
}

function ForkTypographicDivider({ fork }: { fork: typeof forks[0] }) {
  return (
    <div className="py-6 px-5">
      <div className="max-w-prose mx-auto flex items-center gap-4">
        <div className="flex-1 h-px bg-zinc-800" />
        <span className="text-[13px] font-serif italic text-zinc-500">
          {fork.title}
        </span>
        <div className="flex-1 h-px bg-zinc-800" />
      </div>
      {fork.description && (
        <p className="text-center text-[12px] text-zinc-600 mt-1 font-serif italic">
          {fork.description}
        </p>
      )}
    </div>
  );
}

function ScrollProgress({ progress }: { progress: number }) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-transparent">
      <motion.div
        className="h-full bg-zinc-600"
        style={{ width: `${progress * 100}%` }}
      />
    </div>
  );
}

function FootnoteSection({
  footnotes,
  highlightedNum,
}: {
  footnotes: { num: number; source: Source; quote?: string }[];
  highlightedNum: number | null;
}) {
  if (footnotes.length === 0) return null;

  return (
    <div className="px-5 py-8 border-t border-zinc-800">
      <div className="max-w-prose mx-auto">
        <h3 className="text-[13px] font-mono text-zinc-600 tracking-wider uppercase mb-4">Sources</h3>
        <div className="space-y-3">
          {footnotes.map((fn) => (
            <div
              key={fn.num}
              id={`fn-${fn.num}`}
              className={`transition-colors ${highlightedNum === fn.num ? "bg-zinc-800/50 -mx-3 px-3 py-2 rounded-lg" : ""}`}
            >
              <div className="flex gap-2">
                <span className="text-[12px] font-mono text-zinc-600 flex-shrink-0">[{fn.num}]</span>
                <div>
                  <p className="text-[13px] text-zinc-300 font-serif">{fn.source.title}</p>
                  <p className="text-[12px] text-zinc-500 font-serif">
                    {fn.source.author}{fn.source.year ? `, ${fn.source.year}` : ""}
                  </p>
                  {fn.quote && (
                    <p className="text-[12px] text-zinc-500 font-serif italic mt-1">
                      &ldquo;{fn.quote}&rdquo;
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function V8Page() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [highlightedFootnote, setHighlightedFootnote] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const flat = useMemo(() => flattenChronological(messages), []);

  // Build footnotes
  const allFootnotes = useMemo(() => {
    const fns: { num: number; source: Source; quote?: string }[] = [];
    let counter = 1;
    for (const msg of flat) {
      for (const c of msg.citations) {
        const source = sources.find((s) => s.id === c.sourceId);
        if (source) {
          fns.push({ num: counter++, source, quote: c.quote });
        }
      }
    }
    return fns;
  }, [flat]);

  // Map message -> footnote numbers
  const msgFootnotes = useMemo(() => {
    const map = new Map<string, { num: number; sourceId: string }[]>();
    let counter = 1;
    for (const msg of flat) {
      const nums: { num: number; sourceId: string }[] = [];
      for (const c of msg.citations) {
        const source = sources.find((s) => s.id === c.sourceId);
        if (source) {
          nums.push({ num: counter++, sourceId: c.sourceId });
        }
      }
      if (nums.length > 0) map.set(msg.id, nums);
    }
    return map;
  }, [flat]);

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

  const scrollToFootnote = (num: number) => {
    setHighlightedFootnote(num);
    const el = document.getElementById(`fn-${num}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => setHighlightedFootnote(null), 3000);
  };

  let lastForkId: string | undefined = undefined;

  return (
    <div className="flex flex-col min-h-dvh bg-zinc-950">
      <ScrollProgress progress={scrollProgress} />

      {/* Minimal header */}
      <header className="sticky top-0.5 z-20 bg-zinc-950/95 backdrop-blur">
        <div className="flex items-center justify-between px-5 py-3">
          <Link href="/" className="text-zinc-600 hover:text-zinc-400 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-[13px] font-mono text-zinc-500 tracking-wider uppercase">
            Culture & Personality
          </h1>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Hamburger menu */}
        {menuOpen && (
          <div className="absolute right-4 top-12 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl py-1 w-48 z-30">
            <button
              onClick={() => {
                setMenuOpen(false);
                document.getElementById("fn-1")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="block w-full text-left px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            >
              Sources ({allFootnotes.length})
            </button>
            {forks.map((f) => (
              <button
                key={f.id}
                onClick={() => setMenuOpen(false)}
                className="block w-full text-left px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
              >
                ⑂ {f.title}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Content */}
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
                footnoteNums={msgFootnotes.get(msg.id) || []}
                onFootnoteClick={scrollToFootnote}
              />
            </div>
          );
        })}

        {/* Footnote section at bottom */}
        <FootnoteSection footnotes={allFootnotes} highlightedNum={highlightedFootnote} />

        {/* End spacer */}
        <div className="h-16" />
      </main>
    </div>
  );
}
