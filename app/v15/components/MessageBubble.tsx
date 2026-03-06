"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ChatMessage, BranchThread } from "../lib/types";
import { ACTION_HIGHLIGHT_COLORS } from "../lib/constants";
import { formatTime } from "../lib/formatters";
import { buildHighlightRanges } from "../lib/highlights";
import { PlainTextRenderer } from "./PlainTextRenderer";

export function MessageBubble({
  message,
  isMe,
  showTail,
  isLast,
  threads,
  allMessages,
  onSwipeReply,
  onFocusThread,
}: {
  message: ChatMessage;
  isMe: boolean;
  showTail: boolean;
  isLast: boolean;
  threads: BranchThread[];
  allMessages: ChatMessage[];
  onSwipeReply: (message: ChatMessage) => void;
  onFocusThread: (threadId: string) => void;
}) {
  const [swipeX, setSwipeX] = useState(0);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isSwiping = useRef(false);

  const replyToMessage = message.replyToId
    ? allMessages.find((m) => m.id === message.replyToId)
    : null;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isSwiping.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;
    if (!isSwiping.current && Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      isSwiping.current = true;
    }
    if (isSwiping.current && dx > 0) {
      setSwipeX(Math.min(dx, 80));
    }
  };

  const handleTouchEnd = () => {
    if (swipeX > 60) {
      onSwipeReply(message);
    }
    setSwipeX(0);
    isSwiping.current = false;
  };

  // Build highlight ranges from stored offsets
  const highlights = buildHighlightRanges(threads);

  return (
    <motion.div
      data-message-id={message.id}
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", damping: 25, stiffness: 250 }}
      className={`flex ${isMe ? "justify-end" : "justify-start"} ${showTail ? "mt-2" : "mt-0.5"} select-text relative`}
    >
      {/* Swipe reply indicator */}
      <AnimatePresence>
        {swipeX > 20 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: Math.min(swipeX / 80, 1), scale: Math.min(0.5 + swipeX / 160, 1) }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center z-10"
          >
            <svg className="w-3.5 h-3.5 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a4 4 0 014 4v1M3 10l4-4M3 10l4 4" />
            </svg>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className="relative max-w-[80%]"
        style={{ transform: `translateX(${swipeX}px)`, transition: swipeX === 0 ? "transform 0.2s ease-out" : "none" }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className={`relative rounded-2xl px-3 py-2 ${
            isMe
              ? "bg-blue-500 text-white rounded-br-md"
              : "bg-zinc-800 text-zinc-100 rounded-bl-md"
          } ${showTail ? "" : isMe ? "rounded-br-2xl" : "rounded-bl-2xl"}`}
        >
          {/* Reply-to quote block */}
          {replyToMessage && (
            <div className={`mb-1.5 px-2 py-1 rounded-lg border-l-2 ${
              isMe
                ? "bg-blue-600/50 border-blue-300/50"
                : "bg-zinc-700/50 border-zinc-500/50"
            }`}>
              <p className="text-[10px] font-semibold opacity-70 mb-0.5">
                {replyToMessage.role === "user" ? "You" : "Suz"}
              </p>
              <p className="text-[11px] opacity-70 line-clamp-2">{replyToMessage.content}</p>
            </div>
          )}

          {!isMe && showTail && (
            <p className="text-[11px] font-semibold text-purple-400 mb-0.5">Suz</p>
          )}

          <div className="text-[15px] leading-relaxed">
            <PlainTextRenderer
              content={message.content}
              messageId={message.id}
              highlights={highlights}
            />
          </div>
        </div>

        {/* Thread pills on bubble */}
        {threads.length > 0 && (
          <div className={`flex flex-wrap gap-1 mt-1 ${isMe ? "justify-end" : "justify-start"}`}>
            {threads.map((t) => (
              <button
                key={t.id}
                onClick={() => onFocusThread(t.id)}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] border cursor-pointer hover:brightness-125 active:scale-95 transition-all ${ACTION_HIGHLIGHT_COLORS[t.action].pill}`}
              >
                ⑂ {t.highlightedText.slice(0, 20)}...
                {t.messages.length > 0 && (
                  <span className="text-zinc-500">({t.messages.length})</span>
                )}
              </button>
            ))}
          </div>
        )}

        {isMe && isLast && (
          <div className="flex items-center justify-end gap-1 mt-0.5 pr-1">
            <span className="text-[10px] text-zinc-500">Delivered</span>
            <span className="text-[10px] text-zinc-600">{formatTime(message.timestamp)}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
