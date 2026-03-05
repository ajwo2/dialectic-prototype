"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Markdown from "react-markdown";
import Link from "next/link";
import { messages, users, sources, forks } from "@/data/mockDebate";
import { getRootThread, getForkMessages, getParentMessage, buildTree, countMessages } from "@/lib/tree";
import { Message, Source, Citation } from "@/lib/types";

function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function formatDay(ts: string) {
  return new Date(ts).toLocaleDateString("en-US", { month: "long", day: "numeric" });
}

const QUICK_REACTIONS = ["😂", "❤️", "👍", "😮", "😢", "🙏"];

function WhatsAppBubble({
  message,
  isMe,
  showTail,
  index,
  onViewReplies,
  replyCount,
}: {
  message: Message;
  isMe: boolean;
  showTail: boolean;
  index: number;
  onViewReplies?: () => void;
  replyCount: number;
}) {
  const user = users[message.userId];
  const parentMsg = getParentMessage(message.parentId, messages);
  const citedSources = message.citations
    .map((c) => ({ citation: c, source: sources.find((s) => s.id === c.sourceId)! }))
    .filter((c) => c.source);
  const showQuotedReply = parentMsg && parentMsg.userId !== message.userId;
  const [showReactionBar, setShowReactionBar] = useState(false);
  const [reaction, setReaction] = useState<string | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", damping: 30, stiffness: 300, delay: index * 0.015 }}
      className={`flex ${isMe ? "justify-end" : "justify-start"} ${showTail ? "mt-2" : "mt-0.5"} px-3`}
    >
      <div
        className="relative max-w-[80%]"
        onContextMenu={(e) => { e.preventDefault(); setShowReactionBar(!showReactionBar); }}
      >
        {/* Reaction bar */}
        <AnimatePresence>
          {showReactionBar && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              className="absolute -top-10 left-0 right-0 flex justify-center z-10"
            >
              <div className="flex gap-1 bg-zinc-800 rounded-full px-2 py-1 shadow-xl border border-zinc-700">
                {QUICK_REACTIONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => { setReaction(r); setShowReactionBar(false); }}
                    className="text-lg hover:scale-125 transition-transform px-0.5"
                  >
                    {r}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bubble */}
        <div
          className={`relative rounded-lg px-3 py-1.5 shadow-sm ${
            isMe
              ? "bg-emerald-800 text-white"
              : "bg-zinc-800 text-zinc-100"
          }`}
        >
          {/* Sender name for received messages */}
          {!isMe && showTail && (
            <p className="text-[11px] font-semibold text-purple-400 mb-0.5">{user.name}</p>
          )}

          {/* Quoted reply (swipe-right visual) */}
          {showQuotedReply && parentMsg && (
            <div className={`mb-1 px-2 py-1 rounded border-l-[3px] ${isMe ? "bg-emerald-900/60 border-emerald-500/50" : "bg-zinc-700/60 border-zinc-500/50"}`}>
              <span className="text-[10px] font-semibold text-emerald-300">{users[parentMsg.userId]?.name}</span>
              <p className="text-[11px] opacity-70 line-clamp-1">{parentMsg.content.slice(0, 60)}</p>
            </div>
          )}

          {/* Content */}
          <div className={`text-[14px] leading-relaxed prose max-w-none ${isMe ? "prose-invert prose-p:my-0.5 prose-strong:text-white" : "prose-invert prose-p:my-0.5 prose-strong:text-zinc-100"}`}>
            <Markdown>{message.content}</Markdown>
          </div>

          {/* Citations */}
          {citedSources.length > 0 && (
            <div className="mt-1 space-y-1">
              {citedSources.map(({ citation, source }) => (
                <div key={citation.id} className={`rounded px-2 py-1 text-[11px] ${isMe ? "bg-emerald-900/40" : "bg-zinc-700/40"}`}>
                  <span className="opacity-70">📎 {source.title}</span>
                </div>
              ))}
            </div>
          )}

          {/* Time + checkmarks */}
          <div className="flex items-center justify-end gap-1 mt-0.5">
            <span className="text-[10px] opacity-50">{formatTime(message.timestamp)}</span>
            {isMe && (
              <svg className="w-3.5 h-3.5 text-blue-400 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        </div>

        {/* Reaction */}
        {reaction && (
          <div className={`flex ${isMe ? "justify-start" : "justify-end"} -mt-2 px-2`}>
            <span className="text-sm bg-zinc-800 rounded-full px-1 border border-zinc-700">{reaction}</span>
          </div>
        )}

        {/* Thread indicator */}
        {replyCount > 0 && onViewReplies && (
          <button
            onClick={onViewReplies}
            className="mt-1 text-[11px] text-emerald-400 font-medium"
          >
            View {replyCount} replies &rarr;
          </button>
        )}
      </div>
    </motion.div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start px-3 mt-2">
      <div className="bg-zinc-800 rounded-lg px-4 py-2 flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-zinc-500"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
    </div>
  );
}

function ThreadView({ forkId, onBack }: { forkId: string; onBack: () => void }) {
  const fork = forks.find((f) => f.id === forkId)!;
  const forkMsgs = useMemo(() => getForkMessages(messages, forkId), [forkId]);

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="fixed inset-0 z-40 bg-zinc-950 flex flex-col"
    >
      <header className="sticky top-0 z-20 bg-zinc-950/95 backdrop-blur border-b border-zinc-800">
        <div className="flex items-center gap-3 px-4 py-3 max-w-lg mx-auto">
          <button onClick={onBack} className="text-zinc-500">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="text-sm font-semibold text-zinc-100">{fork.title}</h1>
            <p className="text-[11px] text-zinc-500">{forkMsgs.length} messages</p>
          </div>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto pb-20 max-w-lg mx-auto w-full">
        {forkMsgs.map((msg, i) => {
          const isMe = msg.userId === "aj";
          const prev = i > 0 ? forkMsgs[i - 1] : null;
          return (
            <WhatsAppBubble
              key={msg.id}
              message={msg}
              isMe={isMe}
              showTail={!prev || prev.userId !== msg.userId}
              index={i}
              replyCount={0}
            />
          );
        })}
      </main>
    </motion.div>
  );
}

export default function V6Page() {
  const [threadView, setThreadView] = useState<string | null>(null);

  const rootThread = useMemo(() => getRootThread(messages), []);

  // Calculate reply counts for root messages that have forks
  const forkReplyCount = useMemo(() => {
    const map = new Map<string, { forkId: string; count: number }>();
    for (const fork of forks) {
      const count = getForkMessages(messages, fork.id).length;
      map.set(fork.parentMessageId, { forkId: fork.id, count });
    }
    return map;
  }, []);

  return (
    <div className="flex flex-col min-h-dvh bg-[#0b141a]">
      {/* WhatsApp-style pattern background */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30z' fill='%23ffffff' fill-opacity='0.3'/%3E%3C/svg%3E")`,
          backgroundSize: "30px 30px",
        }}
      />

      <header className="sticky top-0 z-20 bg-[#1f2c34] border-b border-zinc-800">
        <div className="flex items-center gap-3 px-4 py-3 max-w-lg mx-auto">
          <Link href="/" className="text-zinc-500">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="w-8 h-8 rounded-full bg-zinc-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h1 className="text-base font-semibold text-zinc-100">Culture & Personality</h1>
            <p className="text-[11px] text-emerald-400">online</p>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-20 relative z-10">
        {/* Day divider */}
        <div className="flex justify-center py-3">
          <span className="text-[11px] bg-[#1f2c34] text-zinc-400 px-3 py-1 rounded-lg">March 1</span>
        </div>

        {rootThread.map((msg, i) => {
          const isMe = msg.userId === "aj";
          const prev = i > 0 ? rootThread[i - 1] : null;
          const showTail = !prev || prev.userId !== msg.userId;
          const forkInfo = forkReplyCount.get(msg.id);

          return (
            <WhatsAppBubble
              key={msg.id}
              message={msg}
              isMe={isMe}
              showTail={showTail}
              index={i}
              replyCount={forkInfo?.count || 0}
              onViewReplies={forkInfo ? () => setThreadView(forkInfo.forkId) : undefined}
            />
          );
        })}

        <TypingIndicator />
      </main>

      {/* Thread view overlay */}
      <AnimatePresence>
        {threadView && (
          <ThreadView forkId={threadView} onBack={() => setThreadView(null)} />
        )}
      </AnimatePresence>

      {/* Composer */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-[#1f2c34] border-t border-zinc-800">
        <div className="max-w-lg mx-auto flex items-center gap-2 px-3 py-2">
          <button className="text-zinc-500">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          <div className="flex-1 bg-[#2a3942] rounded-full px-4 py-2 text-sm text-zinc-500">
            Message
          </div>
          {/* Voice message button */}
          <button className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </button>
        </div>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </div>
    </div>
  );
}
