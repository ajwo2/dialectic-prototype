"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Markdown from "react-markdown";
import Link from "next/link";
import { messages, users, sources, forks } from "@/data/mockDebate";
import { flattenChronological, getParentMessage } from "@/lib/tree";
import { Message, Source, Citation } from "@/lib/types";

function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatFullDate(ts: string) {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function DiscordMessage({
  message,
  showHeader,
  index,
}: {
  message: Message;
  showHeader: boolean;
  index: number;
}) {
  const user = users[message.userId];
  const isAJ = message.userId === "aj";
  const parentMsg = getParentMessage(message.parentId, messages);
  const fork = message.forkId ? forks.find((f) => f.id === message.forkId) : undefined;
  const citedSources = message.citations
    .map((c) => ({ citation: c, source: sources.find((s) => s.id === c.sourceId)! }))
    .filter((c) => c.source);

  const showReplyRef = parentMsg && parentMsg.userId !== message.userId;

  const [hovering, setHovering] = useState(false);
  const [reactions, setReactions] = useState<Record<string, number>>({});

  const addReaction = (emoji: string) => {
    setReactions((prev) => ({
      ...prev,
      [emoji]: (prev[emoji] || 0) + 1,
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.01 }}
      className={`relative group px-4 py-0.5 hover:bg-zinc-800/30 ${showHeader ? "mt-3" : ""}`}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onClick={() => setHovering(!hovering)}
    >
      {/* Reply reference */}
      {showReplyRef && parentMsg && (
        <div className="flex items-center gap-1.5 ml-12 mb-0.5">
          <div className="w-4 border-l-2 border-t-2 border-zinc-600 h-3 rounded-tl -mt-1 ml-1" />
          <div className={`w-3.5 h-3.5 rounded-full ${users[parentMsg.userId]?.color} flex items-center justify-center text-[7px] font-bold text-white`}>
            {users[parentMsg.userId]?.avatar}
          </div>
          <span className="text-[11px] font-medium text-zinc-400 hover:text-zinc-200 cursor-pointer">
            {users[parentMsg.userId]?.name}
          </span>
          <span className="text-[11px] text-zinc-600 truncate max-w-[200px]">
            {parentMsg.content.slice(0, 50)}{parentMsg.content.length > 50 ? "..." : ""}
          </span>
        </div>
      )}

      <div className="flex gap-3">
        {/* Avatar — only on header rows */}
        {showHeader ? (
          <div className={`w-10 h-10 rounded-full ${user.color} flex items-center justify-center text-xs font-bold text-white flex-shrink-0`}>
            {user.avatar}
          </div>
        ) : (
          <div className="w-10 flex-shrink-0 flex items-center justify-center">
            {hovering && (
              <span className="text-[9px] text-zinc-600">{formatTime(message.timestamp)}</span>
            )}
          </div>
        )}

        <div className="flex-1 min-w-0">
          {/* Username + timestamp header */}
          {showHeader && (
            <div className="flex items-baseline gap-2 mb-0.5">
              <span className={`font-semibold text-sm ${isAJ ? "text-blue-400" : "text-purple-400"}`}>
                {user.name}
              </span>
              <span className="text-[10px] text-zinc-600">{formatFullDate(message.timestamp)} {formatTime(message.timestamp)}</span>
              {fork && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500 border border-zinc-700/50">
                  #{fork.title.toLowerCase().replace(/\s+/g, "-")}
                </span>
              )}
            </div>
          )}

          {/* Message text */}
          <div className="text-[14px] leading-relaxed text-zinc-300 prose prose-invert prose-sm max-w-none prose-p:my-0.5 prose-blockquote:border-zinc-600 prose-strong:text-zinc-100 prose-code:bg-zinc-800 prose-code:px-1 prose-code:rounded">
            <Markdown>{message.content}</Markdown>
          </div>

          {/* Citations as code blocks */}
          {citedSources.length > 0 && (
            <div className="mt-1.5 space-y-1">
              {citedSources.map(({ citation, source }) => (
                <div key={citation.id} className="rounded-md bg-zinc-800/80 border-l-[3px] border-blue-500/50 overflow-hidden">
                  {citation.quote && (
                    <div className="px-3 py-1.5 bg-zinc-800/50 border-b border-zinc-700/30">
                      <p className="text-[12px] text-zinc-400 italic font-mono leading-snug">{citation.quote}</p>
                    </div>
                  )}
                  <div className="px-3 py-1.5">
                    <p className="text-[12px] font-medium text-zinc-300">{source.title}</p>
                    <p className="text-[11px] text-zinc-500">{source.author}{source.year ? ` (${source.year})` : ""}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Reaction pills */}
          {Object.keys(reactions).length > 0 && (
            <div className="flex gap-1 mt-1">
              {Object.entries(reactions).map(([emoji, count]) => (
                <button
                  key={emoji}
                  onClick={() => addReaction(emoji)}
                  className="text-[12px] px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700/50 hover:border-zinc-600 flex items-center gap-1"
                >
                  <span>{emoji}</span>
                  <span className="text-zinc-400">{count}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Hover action icons */}
        <AnimatePresence>
          {hovering && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute right-2 -top-3 flex bg-zinc-800 border border-zinc-700 rounded-md shadow-lg overflow-hidden"
            >
              {[
                { icon: "😀", label: "React", action: () => addReaction("👍") },
                { icon: "↩", label: "Reply" },
                { icon: "⑂", label: "Fork" },
                { icon: "📌", label: "Pin" },
              ].map((a) => (
                <button
                  key={a.label}
                  onClick={(e) => { e.stopPropagation(); a.action?.(); }}
                  className="px-2 py-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 text-sm transition-colors"
                  title={a.label}
                >
                  {a.icon}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function ChannelHeader({ fork }: { fork: typeof forks[0] }) {
  const colorMap: Record<string, string> = {
    "border-amber-400": "text-amber-400",
    "border-rose-400": "text-rose-400",
    "border-emerald-400": "text-emerald-400",
  };
  const c = colorMap[fork.color] || "text-zinc-400";

  return (
    <div className="flex items-center gap-2 px-4 py-2 mt-4 mb-1 border-t border-zinc-800/50">
      <span className={`text-sm font-semibold ${c}`}>
        # {fork.title.toLowerCase().replace(/\s+/g, "-")}
      </span>
      {fork.description && <span className="text-[11px] text-zinc-600">— {fork.description}</span>}
    </div>
  );
}

function ScrollToBottomFAB({ onClick, show }: { onClick: () => void; show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          onClick={onClick}
          className="fixed bottom-16 right-4 z-30 w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 shadow-lg flex items-center justify-center"
        >
          <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </motion.button>
      )}
    </AnimatePresence>
  );
}

export default function V7Page() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const flat = useMemo(() => flattenChronological(messages), []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 200);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToBottom = () => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  };

  let lastForkId: string | undefined = undefined;
  let lastUserId: string | undefined = undefined;
  let lastTimestamp: number | undefined = undefined;

  return (
    <div className="flex flex-col min-h-dvh bg-[#313338]">
      {/* Discord-style header */}
      <header className="sticky top-0 z-20 bg-[#313338] border-b border-[#1e1f22] shadow-sm">
        <div className="flex items-center gap-3 px-4 py-2.5 max-w-lg mx-auto">
          <Link href="/" className="text-zinc-500">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <span className="text-zinc-500 text-lg">#</span>
          <div className="flex-1">
            <h1 className="text-sm font-semibold text-zinc-100">culture-and-personality</h1>
          </div>
          <div className="flex items-center gap-2 text-zinc-500">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        </div>
      </header>

      {/* Messages */}
      <main ref={scrollRef} className="flex-1 overflow-y-auto pb-20">
        {/* Welcome */}
        <div className="px-4 py-6 border-b border-zinc-700/30">
          <div className="w-16 h-16 rounded-full bg-zinc-700/50 flex items-center justify-center text-2xl mb-3">
            #
          </div>
          <h2 className="text-xl font-bold text-zinc-100 mb-1">Welcome to #culture-and-personality</h2>
          <p className="text-sm text-zinc-500">This is the start of the debate between A.J. and Marcus about culture, personality, and cognition.</p>
        </div>

        {flat.map((msg, i) => {
          const fork = msg.forkId ? forks.find((f) => f.id === msg.forkId) : undefined;
          const showChannelHeader = msg.forkId !== lastForkId && fork;
          const timeDiff = lastTimestamp
            ? new Date(msg.timestamp).getTime() - lastTimestamp
            : Infinity;
          const showHeader =
            msg.userId !== lastUserId ||
            timeDiff > 5 * 60 * 1000 ||
            showChannelHeader ||
            i === 0;

          lastForkId = msg.forkId;
          lastUserId = msg.userId;
          lastTimestamp = new Date(msg.timestamp).getTime();

          return (
            <div key={msg.id}>
              {showChannelHeader && fork && <ChannelHeader fork={fork} />}
              <DiscordMessage
                message={msg}
                showHeader={!!showHeader}
                index={i}
              />
            </div>
          );
        })}
      </main>

      <ScrollToBottomFAB onClick={scrollToBottom} show={showScrollBtn} />

      {/* Discord-style composer */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-[#313338] px-4 pb-2">
        <div className="max-w-lg mx-auto">
          <div className="bg-[#383a40] rounded-lg flex items-center px-3 py-2.5">
            <button className="text-zinc-500 mr-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <span className="flex-1 text-sm text-zinc-500">Message #culture-and-personality</span>
            <div className="flex items-center gap-2 text-zinc-500">
              <span className="text-lg">😀</span>
            </div>
          </div>
        </div>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </div>
    </div>
  );
}
