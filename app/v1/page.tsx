"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Markdown from "react-markdown";
import Link from "next/link";
import { messages, users, sources, forks } from "@/data/mockDebate";
import { flattenChronological, getParentMessage } from "@/lib/tree";
import { Message, Source, Citation } from "@/lib/types";

function formatDay(timestamp: string) {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });
}

function formatTime(timestamp: string) {
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
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
          {source.type === "paper" || source.type === "link" ? (
            <svg className="w-3 h-3 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          ) : (
            <svg className="w-3 h-3 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium leading-tight truncate">{source.title}</p>
          <p className="text-[10px] opacity-50">{source.author}{source.year ? ` · ${source.year}` : ""}</p>
        </div>
      </div>
    </div>
  );
}

function IMBubble({
  message,
  isMe,
  showTail,
  isLast,
  index,
}: {
  message: Message;
  isMe: boolean;
  showTail: boolean;
  isLast: boolean;
  index: number;
}) {
  const parentMsg = getParentMessage(message.parentId, messages);
  const fork = message.forkId ? forks.find((f) => f.id === message.forkId) : undefined;
  const citedSources = message.citations
    .map((c) => ({ citation: c, source: sources.find((s) => s.id === c.sourceId)! }))
    .filter((c) => c.source);

  // Show quoted reply if replying to a different user (fork or reply context)
  const showQuotedReply =
    parentMsg && fork && parentMsg.userId !== message.userId;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        type: "spring",
        damping: 25,
        stiffness: 250,
        delay: index * 0.02,
      }}
      className={`flex ${isMe ? "justify-end" : "justify-start"} ${showTail ? "mt-2" : "mt-0.5"}`}
    >
      <div className={`relative max-w-[75%] ${isMe ? "items-end" : "items-start"}`}>
        {/* Bubble */}
        <div
          className={`relative rounded-2xl px-3 py-2 ${
            isMe
              ? "bg-blue-500 text-white rounded-br-md"
              : "bg-zinc-800 text-zinc-100 rounded-bl-md"
          } ${showTail ? "" : isMe ? "rounded-br-2xl" : "rounded-bl-2xl"}`}
        >
          {/* Quoted reply header */}
          {showQuotedReply && parentMsg && (
            <div
              className={`mb-1.5 px-2 py-1 rounded-lg text-[11px] leading-snug ${
                isMe
                  ? "bg-blue-600/60 border-l-2 border-blue-300/50"
                  : "bg-zinc-700/80 border-l-2 border-zinc-500/50"
              }`}
            >
              <span className="font-semibold opacity-80">
                {users[parentMsg.userId]?.name}
              </span>
              <p className="opacity-70 line-clamp-2 mt-0.5">
                {parentMsg.content.slice(0, 80)}
                {parentMsg.content.length > 80 ? "..." : ""}
              </p>
            </div>
          )}

          {/* Fork badge */}
          {fork && !showQuotedReply && (
            <div
              className={`inline-flex items-center gap-1 mb-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                isMe ? "bg-blue-600/60" : "bg-zinc-700/80"
              }`}
            >
              <span>⑂</span>
              <span className="opacity-80">{fork.title}</span>
            </div>
          )}

          {/* Message content */}
          <div
            className={`text-[15px] leading-relaxed prose max-w-none ${
              isMe
                ? "prose-invert prose-p:my-0.5 prose-blockquote:border-blue-300/50 prose-strong:text-white"
                : "prose-invert prose-p:my-0.5 prose-blockquote:border-zinc-500 prose-strong:text-zinc-100"
            }`}
          >
            <Markdown>{message.content}</Markdown>
          </div>

          {/* Citations inside bubble */}
          {citedSources.length > 0 && (
            <div className="mt-1 space-y-1">
              {citedSources.map(({ citation, source }) => (
                <CitationPreview key={citation.id} citation={citation} source={source} />
              ))}
            </div>
          )}
        </div>

        {/* Read receipt + time for sent messages */}
        {isMe && isLast && (
          <div className="flex items-center justify-end gap-1 mt-0.5 pr-1">
            <span className="text-[10px] text-zinc-500">Read</span>
            <span className="text-[10px] text-zinc-600">{formatTime(message.timestamp)}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function DayDivider({ day }: { day: string }) {
  return (
    <div className="flex items-center justify-center py-3">
      <span className="text-[11px] font-medium text-zinc-500 bg-zinc-950 px-3">
        {day}
      </span>
    </div>
  );
}

function ScrollToBottomButton({ onClick, show }: { onClick: () => void; show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={onClick}
          className="fixed bottom-20 right-4 z-30 w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 shadow-lg flex items-center justify-center"
        >
          <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </motion.button>
      )}
    </AnimatePresence>
  );
}

export default function V1Page() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const flat = useMemo(() => flattenChronological(messages), []);

  // Group by day
  const grouped = useMemo(() => {
    const groups: { day: string; messages: Message[] }[] = [];
    let currentDay = "";
    for (const msg of flat) {
      const day = formatDay(msg.timestamp);
      if (day !== currentDay) {
        currentDay = day;
        groups.push({ day, messages: [] });
      }
      groups[groups.length - 1].messages.push(msg);
    }
    return groups;
  }, [flat]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      setShowScrollBtn(distFromBottom > 200);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToBottom = () => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  };

  let globalIndex = 0;

  return (
    <div className="flex flex-col min-h-dvh bg-zinc-950">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-zinc-950/95 backdrop-blur border-b border-zinc-800">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link href="/" className="text-zinc-500">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="flex-1">
            <h1 className="text-base font-semibold text-zinc-100">Culture & Personality</h1>
            <p className="text-[11px] text-zinc-500">A.J. & Marcus</p>
          </div>
          <div className="flex -space-x-2">
            <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-[10px] font-bold text-white border-2 border-zinc-950">
              AJ
            </div>
            <div className="w-7 h-7 rounded-full bg-purple-500 flex items-center justify-center text-[10px] font-bold text-white border-2 border-zinc-950">
              MR
            </div>
          </div>
        </div>
      </header>

      {/* Messages */}
      <main ref={scrollRef} className="flex-1 overflow-y-auto px-3 pb-24">
        {grouped.map((group) => (
          <div key={group.day}>
            <DayDivider day={group.day} />
            {group.messages.map((msg, i) => {
              const isMe = msg.userId === "aj";
              const prevMsg = i > 0 ? group.messages[i - 1] : null;
              const showTail = !prevMsg || prevMsg.userId !== msg.userId;
              const isLast = globalIndex === flat.length - 1;
              const idx = globalIndex++;
              return (
                <IMBubble
                  key={msg.id}
                  message={msg}
                  isMe={isMe}
                  showTail={showTail}
                  isLast={isLast}
                  index={idx}
                />
              );
            })}
          </div>
        ))}
      </main>

      {/* Scroll to bottom */}
      <ScrollToBottomButton onClick={scrollToBottom} show={showScrollBtn} />

      {/* Composer bar */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-zinc-900/95 backdrop-blur border-t border-zinc-800">
        <div className="max-w-lg mx-auto flex items-center gap-2 px-3 py-2">
          <div className="flex-1 bg-zinc-800 rounded-full px-4 py-2 text-sm text-zinc-500">
            iMessage
          </div>
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
