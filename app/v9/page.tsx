"use client";

import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Markdown from "react-markdown";
import Link from "next/link";
import { messages, users, sources, forks } from "@/data/mockDebate";
import { flattenChronological } from "@/lib/tree";
import { Message, Source } from "@/lib/types";

function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

interface HighlightBranch {
  id: string;
  messageId: string;
  text: string;
  action: "branch" | "challenge" | "define" | "connect";
  response?: string;
}

interface SelectionToolbar {
  x: number;
  y: number;
  text: string;
  messageId: string;
}

function FloatingToolbar({
  toolbar,
  onAction,
  onClose,
}: {
  toolbar: SelectionToolbar;
  onAction: (action: "branch" | "challenge" | "define" | "connect", text: string, messageId: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  const actions = [
    { key: "branch" as const, label: "Branch", icon: "⑂" },
    { key: "challenge" as const, label: "Challenge", icon: "⚔️" },
    { key: "define" as const, label: "Define", icon: "📖" },
    { key: "connect" as const, label: "Connect", icon: "🔗" },
  ];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.95 }}
      className="fixed z-50 flex gap-0.5 bg-zinc-800 border border-zinc-700 rounded-xl shadow-2xl shadow-black/50 p-1"
      style={{
        left: Math.max(8, Math.min(toolbar.x - 120, window.innerWidth - 260)),
        top: Math.max(8, toolbar.y - 48),
      }}
    >
      {actions.map((action) => (
        <button
          key={action.key}
          onClick={() => onAction(action.key, toolbar.text, toolbar.messageId)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 transition-colors"
        >
          <span>{action.icon}</span>
          <span>{action.label}</span>
        </button>
      ))}
    </motion.div>
  );
}

function BranchThread({ branch }: { branch: HighlightBranch }) {
  const actionLabels = {
    branch: "Branched from",
    challenge: "Challenge to",
    define: "Defining",
    connect: "Connected to",
  };
  const actionColors = {
    branch: "border-amber-500/30 bg-amber-500/5",
    challenge: "border-red-500/30 bg-red-500/5",
    define: "border-blue-500/30 bg-blue-500/5",
    connect: "border-green-500/30 bg-green-500/5",
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      className={`mx-4 my-2 px-4 py-3 rounded-xl border ${actionColors[branch.action]}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
          {actionLabels[branch.action]}
        </span>
      </div>
      <p className="text-[13px] font-serif text-zinc-300 italic border-l-2 border-zinc-600 pl-3 mb-2">
        &ldquo;{branch.text}&rdquo;
      </p>
      {branch.response && (
        <p className="text-[14px] font-serif text-zinc-200 leading-relaxed">{branch.response}</p>
      )}
      {!branch.response && (
        <div className="bg-zinc-800/60 rounded-lg px-3 py-2">
          <p className="text-[12px] text-zinc-500 italic">
            {branch.action === "challenge"
              ? `I'd push back on "${branch.text}" because...`
              : branch.action === "define"
              ? `When we say "${branch.text}", we mean...`
              : "Continue this thread..."}
          </p>
        </div>
      )}
    </motion.div>
  );
}

function MinimalMessage({
  message,
  index,
  isEven,
  footnoteNums,
  onFootnoteClick,
  branches,
  messageRef,
}: {
  message: Message;
  index: number;
  isEven: boolean;
  footnoteNums: { num: number; sourceId: string }[];
  onFootnoteClick: (num: number) => void;
  branches: HighlightBranch[];
  messageRef: (el: HTMLDivElement | null) => void;
}) {
  const user = users[message.userId];
  const prefix = message.userId === "aj" ? "AJ" : "M";

  // Find highlight spans (text that has branches)
  const highlightedTexts = branches.map((b) => b.text);

  return (
    <div>
      <motion.div
        ref={messageRef}
        data-message-id={message.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: index * 0.015 }}
        className={`px-5 py-4 ${isEven ? "bg-zinc-900/50" : "bg-zinc-950"} select-text`}
      >
        <div className="max-w-prose mx-auto">
          <span className="text-[13px] font-mono text-zinc-600 tracking-wide">{prefix}:</span>
          <div className="mt-1 text-[16px] leading-[1.75] text-zinc-200 font-serif prose prose-invert prose-lg max-w-none prose-p:my-2 prose-blockquote:border-zinc-600 prose-blockquote:italic prose-blockquote:text-zinc-400 prose-strong:text-zinc-100 prose-em:text-zinc-300">
            <Markdown>{message.content}</Markdown>
          </div>

          {/* Footnote markers */}
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

          {/* Existing branch indicators */}
          {branches.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {branches.map((b) => (
                <span
                  key={b.id}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-zinc-800/80 text-zinc-400 border border-zinc-700/50"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500/70" />
                  {b.text.slice(0, 30)}{b.text.length > 30 ? "..." : ""}
                </span>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Branch threads inline */}
      {branches.map((b) => (
        <BranchThread key={b.id} branch={b} />
      ))}
    </div>
  );
}

function ForkTypographicDivider({ fork }: { fork: (typeof forks)[0] }) {
  return (
    <div className="py-6 px-5">
      <div className="max-w-prose mx-auto flex items-center gap-4">
        <div className="flex-1 h-px bg-zinc-800" />
        <span className="text-[13px] font-serif italic text-zinc-500">{fork.title}</span>
        <div className="flex-1 h-px bg-zinc-800" />
      </div>
      {fork.description && (
        <p className="text-center text-[12px] text-zinc-600 mt-1 font-serif italic">{fork.description}</p>
      )}
    </div>
  );
}

function ScrollProgress({ progress }: { progress: number }) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-transparent">
      <motion.div className="h-full bg-zinc-600" style={{ width: `${progress * 100}%` }} />
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
                    <p className="text-[12px] text-zinc-500 font-serif italic mt-1">&ldquo;{fn.quote}&rdquo;</p>
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

export default function V9Page() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [highlightedFootnote, setHighlightedFootnote] = useState<number | null>(null);
  const [toolbar, setToolbar] = useState<SelectionToolbar | null>(null);
  const [branches, setBranches] = useState<HighlightBranch[]>([]);

  const flat = useMemo(() => flattenChronological(messages), []);

  const allFootnotes = useMemo(() => {
    const fns: { num: number; source: Source; quote?: string }[] = [];
    let counter = 1;
    for (const msg of flat) {
      for (const c of msg.citations) {
        const source = sources.find((s) => s.id === c.sourceId);
        if (source) fns.push({ num: counter++, source, quote: c.quote });
      }
    }
    return fns;
  }, [flat]);

  const msgFootnotes = useMemo(() => {
    const map = new Map<string, { num: number; sourceId: string }[]>();
    let counter = 1;
    for (const msg of flat) {
      const nums: { num: number; sourceId: string }[] = [];
      for (const c of msg.citations) {
        const source = sources.find((s) => s.id === c.sourceId);
        if (source) nums.push({ num: counter++, sourceId: c.sourceId });
      }
      if (nums.length > 0) map.set(msg.id, nums);
    }
    return map;
  }, [flat]);

  // Handle text selection
  const handleSelectionChange = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.toString().trim()) {
      return;
    }

    const text = selection.toString().trim();
    if (text.length < 3) return;

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    // Find which message this selection belongs to
    let node: Node | null = range.startContainer;
    let messageId: string | null = null;
    while (node) {
      if (node instanceof HTMLElement && node.dataset.messageId) {
        messageId = node.dataset.messageId;
        break;
      }
      node = node.parentNode;
    }

    if (messageId) {
      setToolbar({
        x: rect.left + rect.width / 2,
        y: rect.top,
        text,
        messageId,
      });
    }
  }, []);

  useEffect(() => {
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => document.removeEventListener("selectionchange", handleSelectionChange);
  }, [handleSelectionChange]);

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
    document.getElementById(`fn-${num}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => setHighlightedFootnote(null), 3000);
  };

  const handleAction = (action: "branch" | "challenge" | "define" | "connect", text: string, messageId: string) => {
    const newBranch: HighlightBranch = {
      id: `hb-${Date.now()}`,
      messageId,
      text,
      action,
    };
    setBranches((prev) => [...prev, newBranch]);
    setToolbar(null);
    window.getSelection()?.removeAllRanges();
  };

  let lastForkId: string | undefined = undefined;

  return (
    <div className="flex flex-col min-h-dvh bg-zinc-950">
      <ScrollProgress progress={scrollProgress} />

      <header className="sticky top-0.5 z-20 bg-zinc-950/95 backdrop-blur">
        <div className="flex items-center justify-between px-5 py-3">
          <Link href="/" className="text-zinc-600 hover:text-zinc-400 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-[13px] font-mono text-zinc-500 tracking-wider uppercase">
            Highlight to Branch
          </h1>
          {branches.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30">
              ⑂ {branches.length}
            </span>
          )}
          {branches.length === 0 && <div className="w-5" />}
        </div>
      </header>

      {/* Selection hint */}
      {branches.length === 0 && (
        <div className="px-5 py-3 text-center">
          <p className="text-[11px] text-zinc-600 font-serif italic">
            Select any text to branch, challenge, define, or connect
          </p>
        </div>
      )}

      <main ref={scrollRef} className="flex-1 overflow-y-auto">
        {flat.map((msg, i) => {
          const fork = msg.forkId ? forks.find((f) => f.id === msg.forkId) : undefined;
          const showForkDivider = msg.forkId !== lastForkId && fork;
          lastForkId = msg.forkId;
          const messageBranches = branches.filter((b) => b.messageId === msg.id);

          return (
            <div key={msg.id}>
              {showForkDivider && fork && <ForkTypographicDivider fork={fork} />}
              <MinimalMessage
                message={msg}
                index={i}
                isEven={i % 2 === 0}
                footnoteNums={msgFootnotes.get(msg.id) || []}
                onFootnoteClick={scrollToFootnote}
                branches={messageBranches}
                messageRef={() => {}}
              />
            </div>
          );
        })}

        <FootnoteSection footnotes={allFootnotes} highlightedNum={highlightedFootnote} />
        <div className="h-16" />
      </main>

      {/* Floating toolbar */}
      <AnimatePresence>
        {toolbar && (
          <FloatingToolbar
            toolbar={toolbar}
            onAction={handleAction}
            onClose={() => setToolbar(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
