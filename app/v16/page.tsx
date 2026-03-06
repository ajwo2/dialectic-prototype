"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Markdown from "react-markdown";
import Link from "next/link";
import { GHOST_CATEGORIES } from "@/lib/interaction-utils";

// ── Data Model ──

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  replyToId?: string;
}

interface GhostBranch {
  id: string;
  afterMessageId: string;
  suggestion: string;
  category: "assumption" | "undefined_term" | "blind_spot" | "logical_gap";
}

interface BranchThread {
  id: string;
  parentMessageId: string;
  highlightedText: string;
  action: "branch" | "challenge" | "define" | "connect";
  messages: ChatMessage[];
  isCollapsed: boolean;
  sourceType: "highlight" | "ghost";
  createdAt: string;
}

interface SelectionToolbar {
  x: number;
  y: number;
  text: string;
  messageId: string;
}

function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

// ── Ghost Branch Pill ──

function GhostBranchPill({
  ghost,
  onMaterialize,
  onDismiss,
}: {
  ghost: GhostBranch;
  onMaterialize: (ghost: GhostBranch) => void;
  onDismiss: (id: string) => void;
}) {
  const [visible, setVisible] = useState(false);
  const cat = GHOST_CATEGORIES[ghost.category];

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 1500 + Math.random() * 1000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, x: 100 }}
      className="flex justify-center my-2"
    >
      <div className="relative group">
        <button
          onClick={() => onMaterialize(ghost)}
          className="ghost-shimmer px-4 py-2 rounded-full border-2 border-dashed border-emerald-700/40 bg-[#0b141a]/80 text-[12px] text-zinc-400 hover:text-zinc-200 hover:border-emerald-600/60 hover:bg-[#1f2c34] transition-all flex items-center gap-2"
        >
          <span className="text-[11px] opacity-70">{cat.emoji}</span>
          <span>{ghost.suggestion}</span>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDismiss(ghost.id); }}
          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#1f2c34] border border-zinc-700 text-zinc-500 text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          ×
        </button>
      </div>
    </motion.div>
  );
}

// ── Floating Toolbar ──

function FloatingToolbar({
  toolbar,
  onAction,
  onClose,
}: {
  toolbar: SelectionToolbar;
  onAction: (action: BranchThread["action"], text: string, messageId: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  const actions: { key: BranchThread["action"]; label: string; icon: string }[] = [
    { key: "branch", label: "Branch", icon: "⑂" },
    { key: "challenge", label: "Challenge", icon: "⚔️" },
    { key: "define", label: "Define", icon: "📖" },
    { key: "connect", label: "Connect", icon: "🔗" },
  ];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.95 }}
      className="fixed z-50 flex gap-0.5 bg-[#1f2c34] border border-zinc-700 rounded-xl shadow-2xl shadow-black/50 p-1"
      style={{
        left: Math.max(8, Math.min(toolbar.x - 120, typeof window !== "undefined" ? window.innerWidth - 280 : 200)),
        top: Math.max(8, toolbar.y - 48),
      }}
    >
      {actions.map((a) => (
        <button
          key={a.key}
          onClick={() => onAction(a.key, toolbar.text, toolbar.messageId)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-zinc-300 hover:bg-[#2a3942] hover:text-zinc-100 transition-colors"
        >
          <span>{a.icon}</span>
          <span>{a.label}</span>
        </button>
      ))}
    </motion.div>
  );
}

// ── Reply Preview (above composer) ──

function ReplyPreview({
  message,
  onDismiss,
}: {
  message: ChatMessage;
  onDismiss: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="border-l-2 border-emerald-500 bg-[#1f2c34]/80 mx-3 mb-1 px-3 py-2 rounded-lg flex items-start justify-between gap-2"
    >
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold text-emerald-400 mb-0.5">
          {message.role === "user" ? "You" : "Suz"}
        </p>
        <p className="text-[12px] text-zinc-400 truncate">{message.content}</p>
      </div>
      <button
        onClick={onDismiss}
        className="text-zinc-500 hover:text-zinc-300 text-[14px] mt-0.5 flex-shrink-0"
      >
        ×
      </button>
    </motion.div>
  );
}

// ── Inline Thread Typing Indicator ──

function ThreadTypingIndicator() {
  return (
    <div className="flex justify-start mt-1">
      <div className="bg-[#1f2c34]/60 rounded-lg px-3 py-1.5 flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-zinc-500"
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
    </div>
  );
}

// ── Branch Thread Inline Component ──

function BranchThreadInline({
  thread,
  onToggle,
  onSendMessage,
  loadingContext,
}: {
  thread: BranchThread;
  onToggle: (threadId: string) => void;
  onSendMessage: (threadId: string, content: string) => void;
  loadingContext: string | null;
}) {
  const [threadInput, setThreadInput] = useState("");
  const threadInputRef = useRef<HTMLInputElement>(null);
  const isThreadLoading = loadingContext === thread.id;

  const actionColors: Record<string, { border: string; bg: string; accent: string }> = {
    branch: { border: "border-emerald-500/40", bg: "bg-emerald-500/5", accent: "text-emerald-400" },
    challenge: { border: "border-red-500/40", bg: "bg-red-500/5", accent: "text-red-400" },
    define: { border: "border-blue-500/40", bg: "bg-blue-500/5", accent: "text-blue-400" },
    connect: { border: "border-amber-500/40", bg: "bg-amber-500/5", accent: "text-amber-400" },
  };
  const actionLabels: Record<string, string> = {
    branch: "Branched from",
    challenge: "Challenge to",
    define: "Defining",
    connect: "Connected to",
  };

  const colors = actionColors[thread.action];
  const lastMsg = thread.messages[thread.messages.length - 1];

  const handleThreadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!threadInput.trim() || isThreadLoading) return;
    onSendMessage(thread.id, threadInput.trim());
    setThreadInput("");
  };

  // Collapsed pill
  if (thread.isCollapsed) {
    return (
      <motion.button
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={() => onToggle(thread.id)}
        className={`flex items-center gap-2 mx-5 my-1.5 px-3 py-1.5 rounded-full border ${colors.border} ${colors.bg} hover:bg-[#1f2c34]/60 transition-colors text-left w-fit max-w-[90%]`}
      >
        <span className={`text-[11px] ${colors.accent}`}>⑂</span>
        <span className="text-[11px] text-zinc-400 truncate">
          &ldquo;{thread.highlightedText.slice(0, 30)}{thread.highlightedText.length > 30 ? "..." : ""}&rdquo;
        </span>
        {thread.messages.length > 0 && (
          <>
            <span className="text-[10px] text-zinc-600">·</span>
            <span className="text-[10px] text-zinc-500">{thread.messages.length} {thread.messages.length === 1 ? "reply" : "replies"}</span>
          </>
        )}
        {lastMsg && (
          <>
            <span className="text-[10px] text-zinc-600">·</span>
            <span className="text-[10px] text-zinc-500 truncate max-w-[120px]">{lastMsg.content.slice(0, 40)}</span>
          </>
        )}
        <svg className="w-3 h-3 text-zinc-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </motion.button>
    );
  }

  // Expanded thread
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className={`mx-5 my-2 rounded-xl border-l-2 ${colors.border} ${colors.bg} overflow-hidden`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 pt-2 pb-1">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`text-[10px] font-mono uppercase tracking-wider ${colors.accent}`}>
            {actionLabels[thread.action]}
          </span>
          <span className="text-[11px] text-zinc-400 italic truncate">
            &ldquo;{thread.highlightedText.slice(0, 40)}{thread.highlightedText.length > 40 ? "..." : ""}&rdquo;
          </span>
        </div>
        <button
          onClick={() => onToggle(thread.id)}
          className="text-zinc-500 hover:text-zinc-300 text-[12px] px-1.5 py-0.5 rounded hover:bg-[#2a3942]/50 transition-colors flex-shrink-0"
        >
          Collapse
        </button>
      </div>

      {/* Thread messages */}
      <div className="px-3 py-1 space-y-1.5">
        {thread.messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-2.5 py-1.5 ${
                msg.role === "user"
                  ? "bg-emerald-800/80 text-white"
                  : "bg-[#1f2c34]/80 text-zinc-200"
              }`}
            >
              {msg.role === "assistant" && (
                <p className="text-[9px] font-semibold text-emerald-400 mb-0.5">Suz</p>
              )}
              <div className="text-[13px] leading-relaxed prose prose-invert max-w-none prose-p:my-0.5">
                <Markdown>{msg.content}</Markdown>
              </div>
              <p className="text-[9px] opacity-40 text-right mt-0.5">{formatTime(msg.timestamp)}</p>
            </div>
          </div>
        ))}

        {isThreadLoading && <ThreadTypingIndicator />}
      </div>

      {/* Thread composer */}
      <form onSubmit={handleThreadSubmit} className="flex items-center gap-2 px-3 py-2 border-t border-zinc-700/30">
        <input
          ref={threadInputRef}
          type="text"
          value={threadInput}
          onChange={(e) => setThreadInput(e.target.value)}
          placeholder="Reply in thread..."
          disabled={isThreadLoading}
          className="flex-1 bg-[#2a3942]/60 rounded-full px-3 py-1.5 text-[12px] text-zinc-100 placeholder:text-zinc-500 outline-none focus:ring-1 focus:ring-emerald-500/30 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!threadInput.trim() || isThreadLoading}
          className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0 disabled:opacity-30 transition-opacity"
        >
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      </form>
    </motion.div>
  );
}

// ── WhatsApp Bubble ──

function WhatsAppBubble({
  message,
  isMe,
  showTail,
  threads,
  allMessages,
  onSwipeReply,
}: {
  message: ChatMessage;
  isMe: boolean;
  showTail: boolean;
  threads: BranchThread[];
  allMessages: ChatMessage[];
  onSwipeReply: (message: ChatMessage) => void;
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

  return (
    <motion.div
      data-message-id={message.id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className={`flex ${isMe ? "justify-end" : "justify-start"} ${showTail ? "mt-2" : "mt-0.5"} px-3 select-text relative`}
    >
      {/* Swipe reply indicator */}
      <AnimatePresence>
        {swipeX > 20 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: Math.min(swipeX / 80, 1), scale: Math.min(0.5 + swipeX / 160, 1) }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-[#2a3942] flex items-center justify-center z-10"
          >
            <svg className="w-3.5 h-3.5 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a4 4 0 014 4v1M3 10l4-4M3 10l4 4" />
            </svg>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className="relative max-w-[80%]"
        style={{ transform: `translateX(${swipeX}px)`, transition: swipeX === 0 ? 'transform 0.2s ease-out' : 'none' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className={`relative rounded-lg px-3 py-1.5 shadow-sm ${
            isMe
              ? "bg-emerald-800 text-white"
              : "bg-[#1f2c34] text-zinc-100"
          }`}
        >
          {/* Reply-to quote block */}
          {replyToMessage && (
            <div className={`mb-1.5 px-2 py-1 rounded-lg border-l-2 ${
              isMe
                ? "bg-emerald-900/50 border-emerald-400/50"
                : "bg-[#2a3942]/50 border-zinc-500/50"
            }`}>
              <p className="text-[10px] font-semibold opacity-70 mb-0.5">
                {replyToMessage.role === "user" ? "You" : "Suz"}
              </p>
              <p className="text-[11px] opacity-70 line-clamp-2">{replyToMessage.content}</p>
            </div>
          )}

          {!isMe && showTail && (
            <p className="text-[11px] font-semibold text-emerald-400 mb-0.5">Suz</p>
          )}

          <div
            className={`text-[14px] leading-relaxed prose max-w-none ${
              isMe
                ? "prose-invert prose-p:my-0.5 prose-strong:text-white"
                : "prose-invert prose-p:my-0.5 prose-strong:text-zinc-100"
            }`}
          >
            <Markdown>{message.content}</Markdown>
          </div>

          <div className="flex items-center justify-end gap-1 mt-0.5">
            <span className="text-[10px] opacity-50">{formatTime(message.timestamp)}</span>
            {isMe && (
              <svg className="w-3.5 h-3.5 text-blue-400 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        </div>

        {/* Thread pills on bubble */}
        {threads.length > 0 && (
          <div className={`flex flex-wrap gap-1 mt-1 ${isMe ? "justify-end" : "justify-start"}`}>
            {threads.map((t) => (
              <span
                key={t.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              >
                ⑂ {t.highlightedText.slice(0, 20)}...
                {t.messages.length > 0 && (
                  <span className="text-zinc-500">({t.messages.length})</span>
                )}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Typing Indicator ──

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex justify-start px-3 mt-2"
    >
      <div className="bg-[#1f2c34] rounded-lg px-4 py-2 flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-zinc-500"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
    </motion.div>
  );
}

// ── Starter Messages ──

const STARTERS: ChatMessage[] = [
  {
    id: "s1",
    role: "assistant",
    content: "I kinda wanted to foster but yes. I was ready in my head. But overall relief.",
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: "s2",
    role: "user",
    content: "I admire your sense of conviction. It takes a lot to be that quick to accept responsibility like that, especially when you're under no obligation.",
    timestamp: new Date(Date.now() - 3600000 * 4.9).toISOString(),
  },
  {
    id: "s3",
    role: "assistant",
    content: "My sense of responsibility is high. Mb bc of Chinese culture.",
    timestamp: new Date(Date.now() - 3600000 * 4.8).toISOString(),
  },
  {
    id: "s4",
    role: "user",
    content: "Have you considered that you might be too quick to ascribe aspects of your personality to Chinese/Asian culture?",
    timestamp: new Date(Date.now() - 3600000 * 4.7).toISOString(),
  },
  {
    id: "s5",
    role: "assistant",
    content: "Ya",
    timestamp: new Date(Date.now() - 3600000 * 4.6).toISOString(),
  },
  {
    id: "s6",
    role: "user",
    content: "Do you know why you do that?",
    timestamp: new Date(Date.now() - 3600000 * 4.5).toISOString(),
  },
  {
    id: "s7",
    role: "assistant",
    content: "Bc it's the root cause. Culture has more influence on personality than ppl would like to believe.",
    timestamp: new Date(Date.now() - 3600000 * 4.4).toISOString(),
  },
  {
    id: "s8",
    role: "user",
    content: "Do you think it's unhelpful?",
    timestamp: new Date(Date.now() - 3600000 * 4.3).toISOString(),
  },
  {
    id: "s9",
    role: "assistant",
    content: "As opposed to?",
    timestamp: new Date(Date.now() - 3600000 * 4.2).toISOString(),
  },
  {
    id: "s10",
    role: "user",
    content: "Yeah. Also, do you ever think the same about American culture's influence on you? You're not exactly wrong but to me it reads as reductive.",
    timestamp: new Date(Date.now() - 3600000 * 4.1).toISOString(),
  },
  {
    id: "s11",
    role: "assistant",
    content: "Yes of course. I think it's bc I'm Chinese American that I think about culture.",
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: "s12",
    role: "user",
    content: "I notice Chinese/Asian American friends default to that explanation more than other bicultural friends. I wonder why that is.",
    timestamp: new Date(Date.now() - 3600000 * 3.9).toISOString(),
  },
  {
    id: "s13",
    role: "user",
    content: "Also in your particular case, it seems that you consider personality traits rooted in culture as fixed — which results in less agency.",
    timestamp: new Date(Date.now() - 3600000 * 3.8).toISOString(),
  },
  {
    id: "s14",
    role: "assistant",
    content: "I don't believe that. Culture is not fixed, society is. I'm p nuanced with thoughts, I also don't believe in positive thinking after reading more about the research findings.",
    timestamp: new Date(Date.now() - 3600000 * 3.7).toISOString(),
  },
  {
    id: "s15",
    role: "user",
    content: "Hmmm, okay. Then maybe it's just the way that you express certain thoughts that seem less nuanced. Do you have an article or essay on positive thinking that I could read to understand your perspective better?",
    timestamp: new Date(Date.now() - 3600000 * 3.6).toISOString(),
  },
  {
    id: "s16",
    role: "assistant",
    content: "Well but isn't ascribing a sense of duty and responsibility to Asian culture, accurate? Western culture adapts individualism? It's not a judgement value. I think Americans can't think in nuance bc of the English language.",
    timestamp: new Date(Date.now() - 3600000 * 3.5).toISOString(),
  },
  {
    id: "s17",
    role: "user",
    content: "Explain that last point?",
    timestamp: new Date(Date.now() - 3600000 * 3.4).toISOString(),
  },
  {
    id: "s18",
    role: "assistant",
    content: "But nothing I said was less nuanced than what you said.",
    timestamp: new Date(Date.now() - 3600000 * 3.3).toISOString(),
  },
  {
    id: "s19",
    role: "user",
    content: "You're right.",
    timestamp: new Date(Date.now() - 3600000 * 3.2).toISOString(),
  },
  {
    id: "s20",
    role: "assistant",
    content: "I'm saying my sense of responsibility comes from my Asian culture which you're saying is reductive. But then, where does personality come from then? If I'm reductive then what is your explanation that is not?",
    timestamp: new Date(Date.now() - 3600000 * 3.1).toISOString(),
  },
  {
    id: "s21",
    role: "user",
    content: "I didn't pose an explanation. I'd have to think about it more. My main point was more that you use that explanation frequently to explain why the way you are, and I was curious as to how you arrived at that conclusion. Generally, if someone gives me a simple, popular explanation for a complicated phenomenon, I'm skeptical — even if I don't have a better explanation.",
    timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: "s22",
    role: "assistant",
    content: "It's text lol. I ain't trying to be precise via text. I don't mind sounding dumb.",
    timestamp: new Date(Date.now() - 3600000 * 2.9).toISOString(),
  },
  {
    id: "s23",
    role: "user",
    content: "I was also thinking of our conversation the other day about not speaking up — which was irl. And I think we had another conversation along these lines, though I'm forgetting the details.",
    timestamp: new Date(Date.now() - 3600000 * 2.8).toISOString(),
  },
  {
    id: "s24",
    role: "assistant",
    content: "Yea, but why does someone need to hold multiple threads to their truth? I think it's fine that some truths fixate on a single source even if it's the sum of its parts.",
    timestamp: new Date(Date.now() - 3600000 * 2.7).toISOString(),
  },
  {
    id: "s25",
    role: "user",
    content: "I don't think you should or shouldn't think a certain way. I respect the way you reason through things which is why I'm asking questions.",
    timestamp: new Date(Date.now() - 3600000 * 2.6).toISOString(),
  },
  {
    id: "s26",
    role: "assistant",
    content: "It's not accurate to say it's the single source but it might hold the biggest influence.",
    timestamp: new Date(Date.now() - 3600000 * 2.5).toISOString(),
  },
  {
    id: "s27",
    role: "user",
    content: "I hear you. I have a personal bias against explaining things with culture and also don't feel it's useful to my life — so that probably has something to do with my reluctance to accept that explanation.",
    timestamp: new Date(Date.now() - 3600000 * 2.4).toISOString(),
  },
  {
    id: "s28",
    role: "user",
    content: "Remind me, have you spent much time in Asia?",
    timestamp: new Date(Date.now() - 3600000 * 2.3).toISOString(),
  },
  {
    id: "s29",
    role: "assistant",
    content: "Why do you have a bias? You're not seeing clearly when you discount or dismiss a big influence to personality. Culture is v helpful in understanding systems. I actually didn't realize it younger but I think it comes from more knowledge.",
    timestamp: new Date(Date.now() - 3600000 * 2.2).toISOString(),
  },
  {
    id: "s30",
    role: "user",
    content: "Hmmm, I'm not saying that I think my reasoning is flawed. I'm pointing out an emotion that will make me more inclined to accept certain explanations over others. About to meet a friend for lunch, will expand later.",
    timestamp: new Date(Date.now() - 3600000 * 2.1).toISOString(),
  },
  {
    id: "s31",
    role: "assistant",
    content: "But why does info have to serve you? What if it's j to understand people and the world? My friend is like that and I think she has a lot of blindspots on a macro level, but on the micro level, it's ok.",
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: "s32",
    role: "assistant",
    content: "lol idk how you meet so many ppl in a week",
    timestamp: new Date(Date.now() - 3600000 * 1.9).toISOString(),
  },
  {
    id: "s33",
    role: "user",
    content: "lol. I even had to cancel something today because I double booked.",
    timestamp: new Date(Date.now() - 3600000 * 1.8).toISOString(),
  },
  {
    id: "s34",
    role: "assistant",
    content: "Who r u meeting? Wth. I'm an introvert compared to u.",
    timestamp: new Date(Date.now() - 3600000 * 1.7).toISOString(),
  },
  {
    id: "s35",
    role: "user",
    content: "uhh missed my stop. ttyl",
    timestamp: new Date(Date.now() - 3600000 * 1.6).toISOString(),
  },
  {
    id: "s36",
    role: "assistant",
    content: "K, answer my q",
    timestamp: new Date(Date.now() - 3600000 * 1.5).toISOString(),
  },
  {
    id: "s37",
    role: "user",
    content: "I was meeting a former co-worker who also left Stepful — on better terms though, since he was the main driver behind all customer acquisition. He's like 3-4 years younger than me but just got a marketing director role at a YC startup. He's also just a cool guy with a lot of integrity and no nonsense. He's killing it.",
    timestamp: new Date(Date.now() - 3600000 * 1.4).toISOString(),
  },
  {
    id: "s38",
    role: "user",
    content: "Aren't you an introvert though? As an INFP?",
    timestamp: new Date(Date.now() - 3600000 * 1.3).toISOString(),
  },
  {
    id: "s39",
    role: "assistant",
    content: "Enfp but infp rn.",
    timestamp: new Date(Date.now() - 3600000 * 1.2).toISOString(),
  },
  {
    id: "s40",
    role: "assistant",
    content: "Integrity, how? That's good, not a lot of ppl have integrity.",
    timestamp: new Date(Date.now() - 3600000 * 1.1).toISOString(),
  },
  {
    id: "s41",
    role: "user",
    content: "I think a lot of people at companies just look out for themselves and are willing to throw others under the bus if it means they can keep their job or get promoted. Also, some people need to put others down for them to shine. He's a strong performer but also looks out for others and will call people on their BS — instead of going behind peoples' backs.",
    timestamp: new Date(Date.now() - 3600000 * 1).toISOString(),
  },
  {
    id: "s42",
    role: "user",
    content: "What does it mean for your MBTI to oscillate? Also, you ignored my question about how much time you've spent in Asia.",
    timestamp: new Date(Date.now() - 3600000 * 0.9).toISOString(),
  },
  {
    id: "s43",
    role: "assistant",
    content: "Summer the longest, but that's not my point about culture. I think it's like the racism thing, you think it's a narrative and that actually extends into culture too.",
    timestamp: new Date(Date.now() - 3600000 * 0.8).toISOString(),
  },
];

// ── Main Page ──

export default function V16Page() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(STARTERS);
  const [inputValue, setInputValue] = useState("");
  const [loadingContext, setLoadingContext] = useState<"main" | string | null>(null);
  const [ghosts, setGhosts] = useState<GhostBranch[]>([]);
  const [dismissedGhosts, setDismissedGhosts] = useState<Set<string>>(new Set());
  const [threads, setThreads] = useState<BranchThread[]>([]);
  const [toolbar, setToolbar] = useState<SelectionToolbar | null>(null);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isMainLoading = loadingContext === "main";
  const activeGhostCount = ghosts.filter((g) => !dismissedGhosts.has(g.id)).length;

  // Auto-scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [chatMessages, loadingContext, threads]);

  // Fetch ghosts
  const fetchGhosts = useCallback(async (msgs: ChatMessage[]) => {
    try {
      const res = await fetch("/api/ghost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: msgs.map((m) => ({ role: m.role, content: m.content })) }),
      });
      const data = await res.json();
      if (data.ghosts?.length > 0) {
        const lastMsgId = msgs[msgs.length - 1].id;
        setGhosts((prev) => [
          ...prev,
          ...data.ghosts.map((g: { suggestion: string; category: string }, i: number) => ({
            id: `g-${Date.now()}-${i}`,
            afterMessageId: lastMsgId,
            suggestion: g.suggestion,
            category: g.category as GhostBranch["category"],
          })),
        ]);
      }
    } catch {}
  }, []);

  // Send main-thread message
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isMainLoading) return;

      const userMsg: ChatMessage = {
        id: `u-${Date.now()}`,
        role: "user",
        content: content.trim(),
        timestamp: new Date().toISOString(),
        ...(replyTo ? { replyToId: replyTo.id } : {}),
      };

      const nextMessages = [...chatMessages, userMsg];
      setChatMessages(nextMessages);
      setInputValue("");
      setReplyTo(null);
      setLoadingContext("main");
      setError(null);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: nextMessages.map((m) => ({ role: m.role, content: m.content })) }),
        });
        const data = await res.json();

        if (data.error) {
          setError(data.error);
          setLoadingContext(null);
          return;
        }

        const assistantMsg: ChatMessage = {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: data.response,
          timestamp: new Date().toISOString(),
        };

        const allMessages = [...nextMessages, assistantMsg];
        setChatMessages(allMessages);
        setLoadingContext(null);
        fetchGhosts(allMessages);
      } catch {
        setError("Failed to connect. Check your API key.");
        setLoadingContext(null);
      }
    },
    [chatMessages, isMainLoading, replyTo, fetchGhosts]
  );

  // Send thread message
  const sendThreadMessage = useCallback(
    async (threadId: string, content: string) => {
      const thread = threads.find((t) => t.id === threadId);
      if (!thread || loadingContext === threadId) return;

      const userMsg: ChatMessage = {
        id: `tu-${Date.now()}`,
        role: "user",
        content: content.trim(),
        timestamp: new Date().toISOString(),
      };

      setThreads((prev) =>
        prev.map((t) =>
          t.id === threadId ? { ...t, messages: [...t.messages, userMsg] } : t
        )
      );
      setLoadingContext(threadId);

      const parentMsgIndex = chatMessages.findIndex((m) => m.id === thread.parentMessageId);
      const contextMessages = chatMessages.slice(0, parentMsgIndex + 1);
      const framingMessage = {
        role: "user" as const,
        content: `[We're exploring a sub-thread about: "${thread.highlightedText}"]`,
      };
      const threadMsgs = [...thread.messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [
              ...contextMessages.map((m) => ({ role: m.role, content: m.content })),
              framingMessage,
              ...threadMsgs,
            ],
          }),
        });

        const data = await res.json();

        if (data.error) {
          setError(data.error);
          setLoadingContext(null);
          return;
        }

        const assistantMsg: ChatMessage = {
          id: `ta-${Date.now()}`,
          role: "assistant",
          content: data.response,
          timestamp: new Date().toISOString(),
        };

        setThreads((prev) =>
          prev.map((t) =>
            t.id === threadId ? { ...t, messages: [...t.messages, assistantMsg] } : t
          )
        );
        setLoadingContext(null);
      } catch {
        setError("Failed to connect.");
        setLoadingContext(null);
      }
    },
    [threads, chatMessages, loadingContext]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  // Materialize ghost → create thread
  const handleMaterializeGhost = (ghost: GhostBranch) => {
    setDismissedGhosts((prev) => new Set(prev).add(ghost.id));

    const newThread: BranchThread = {
      id: `bt-${Date.now()}`,
      parentMessageId: ghost.afterMessageId,
      highlightedText: ghost.suggestion,
      action: "branch",
      messages: [],
      isCollapsed: false,
      sourceType: "ghost",
      createdAt: new Date().toISOString(),
    };
    setThreads((prev) => [...prev, newThread]);

    setTimeout(() => {
      const threadInput = document.querySelector(
        `[data-thread-id="${newThread.id}"] input`
      ) as HTMLInputElement;
      if (threadInput) {
        const nativeSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          "value"
        )?.set;
        nativeSetter?.call(threadInput, ghost.suggestion);
        threadInput.dispatchEvent(new Event("input", { bubbles: true }));
        threadInput.focus();
      }
    }, 100);
  };

  // Text selection
  const handleSelectionChange = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.toString().trim()) return;
    const text = selection.toString().trim();
    if (text.length < 3) return;

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

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
      setToolbar({ x: rect.left + rect.width / 2, y: rect.top, text, messageId });
    }
  }, []);

  useEffect(() => {
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => document.removeEventListener("selectionchange", handleSelectionChange);
  }, [handleSelectionChange]);

  const handleBranchAction = (action: BranchThread["action"], text: string, messageId: string) => {
    const newThread: BranchThread = {
      id: `bt-${Date.now()}`,
      parentMessageId: messageId,
      highlightedText: text,
      action,
      messages: [],
      isCollapsed: false,
      sourceType: "highlight",
      createdAt: new Date().toISOString(),
    };
    setThreads((prev) => [...prev, newThread]);
    setToolbar(null);
    window.getSelection()?.removeAllRanges();

    if (action === "challenge" || action === "define") {
      const prefill = action === "challenge"
        ? `I'd push back on "${text}" because `
        : `When we say "${text}", I think we mean `;

      setTimeout(() => {
        const threadInput = document.querySelector(
          `[data-thread-id="${newThread.id}"] input`
        ) as HTMLInputElement;
        if (threadInput) {
          const nativeSetter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            "value"
          )?.set;
          nativeSetter?.call(threadInput, prefill);
          threadInput.dispatchEvent(new Event("input", { bubbles: true }));
          threadInput.focus();
        }
      }, 100);
    }
  };

  const toggleThread = (threadId: string) => {
    setThreads((prev) =>
      prev.map((t) => (t.id === threadId ? { ...t, isCollapsed: !t.isCollapsed } : t))
    );
  };

  const getGhostsAfter = (messageId: string) =>
    ghosts.filter((g) => g.afterMessageId === messageId && !dismissedGhosts.has(g.id));

  const getThreadsForMessage = (messageId: string) =>
    threads.filter((t) => t.parentMessageId === messageId);

  return (
    <div className="flex flex-col min-h-dvh bg-[#0b141a]">
      {/* Shimmer CSS */}
      <style jsx global>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .ghost-shimmer {
          background-image: linear-gradient(90deg, transparent 0%, rgba(161,161,170,0.05) 40%, rgba(161,161,170,0.1) 50%, rgba(161,161,170,0.05) 60%, transparent 100%);
          background-size: 200% 100%;
          animation: shimmer 3s ease-in-out infinite;
        }
      `}</style>

      {/* WhatsApp pattern bg */}
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30z' fill='%23ffffff' fill-opacity='0.3'/%3E%3C/svg%3E")`,
          backgroundSize: "30px 30px",
        }}
      />

      {/* Header */}
      <header className="sticky top-0 z-20 bg-[#1f2c34] border-b border-zinc-800">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link href="/" className="text-zinc-500">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-[10px] font-bold text-white">
            SZ
          </div>
          <div className="flex-1">
            <h1 className="text-base font-semibold text-zinc-100">Suz</h1>
            <p className="text-[11px] text-emerald-400">
              {isMainLoading ? "typing..." : "online"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {activeGhostCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                👻 {activeGhostCount}
              </span>
            )}
            {threads.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                ⑂ {threads.length}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Messages */}
      <main ref={scrollRef} className="flex-1 overflow-y-auto pb-20 relative z-10">
        {chatMessages.length === 0 && (
          <div className="px-6 py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-600/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">💬</span>
            </div>
            <p className="text-[14px] text-zinc-300 mb-1">Start a conversation with Suz</p>
            <p className="text-[11px] text-zinc-600 max-w-[250px] mx-auto">
              Select text to branch, challenge, or define. Ghost branches appear as the conversation develops.
            </p>
          </div>
        )}

        {chatMessages.length > 0 && (
          <div className="flex justify-center py-3">
            <span className="text-[11px] bg-[#1f2c34] text-zinc-400 px-3 py-1 rounded-lg">Today</span>
          </div>
        )}

        {chatMessages.map((msg, i) => {
          const isMe = msg.role === "user";
          const prev = i > 0 ? chatMessages[i - 1] : null;
          const showTail = !prev || prev.role !== msg.role;
          const messageThreads = getThreadsForMessage(msg.id);
          const messageGhosts = getGhostsAfter(msg.id);

          return (
            <div key={msg.id}>
              <WhatsAppBubble
                message={msg}
                isMe={isMe}
                showTail={showTail}
                threads={messageThreads}
                allMessages={chatMessages}
                onSwipeReply={(m) => {
                  setReplyTo(m);
                  inputRef.current?.focus();
                }}
              />
              {/* Inline branch threads */}
              <AnimatePresence>
                {messageThreads.map((t) => (
                  <div key={t.id} data-thread-id={t.id}>
                    <BranchThreadInline
                      thread={t}
                      onToggle={toggleThread}
                      onSendMessage={sendThreadMessage}
                      loadingContext={loadingContext === t.id ? t.id : null}
                    />
                  </div>
                ))}
              </AnimatePresence>
              {/* Ghost branches */}
              <AnimatePresence>
                {messageGhosts.map((ghost) => (
                  <GhostBranchPill
                    key={ghost.id}
                    ghost={ghost}
                    onMaterialize={handleMaterializeGhost}
                    onDismiss={(id) => setDismissedGhosts((prev) => new Set(prev).add(id))}
                  />
                ))}
              </AnimatePresence>
            </div>
          );
        })}

        <AnimatePresence>{isMainLoading && <TypingIndicator />}</AnimatePresence>

        {error && (
          <div className="mx-5 my-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-[12px] text-red-400">
            {error}
          </div>
        )}
      </main>

      {/* Floating toolbar */}
      <AnimatePresence>
        {toolbar && (
          <FloatingToolbar
            toolbar={toolbar}
            onAction={handleBranchAction}
            onClose={() => setToolbar(null)}
          />
        )}
      </AnimatePresence>

      {/* Composer */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-[#1f2c34] border-t border-zinc-800">
        {/* Reply preview */}
        <AnimatePresence>
          {replyTo && (
            <ReplyPreview
              message={replyTo}
              onDismiss={() => setReplyTo(null)}
            />
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="max-w-lg mx-auto flex items-center gap-2 px-3 py-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={replyTo ? `Reply to ${replyTo.role === "user" ? "yourself" : "Suz"}...` : "Message"}
            disabled={isMainLoading}
            className="flex-1 bg-[#2a3942] rounded-full px-4 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus:ring-1 focus:ring-emerald-500/50 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isMainLoading}
            className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0 disabled:opacity-30 transition-opacity"
          >
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </form>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </div>
    </div>
  );
}
