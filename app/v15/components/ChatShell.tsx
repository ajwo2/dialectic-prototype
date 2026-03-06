"use client";

import { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import type { ChatMessage, BranchThread, GhostBranch } from "../lib/types";
import { MessageBubble } from "./MessageBubble";
import { BranchThreadPill } from "./BranchThreadPill";
import { GhostBranchPill } from "./GhostBranchPill";
import { TypingIndicator } from "./TypingIndicator";
import { ThreadBreadcrumb } from "./ThreadBreadcrumb";
import { ThreadNavigator } from "./ThreadNavigator";

export function ChatShell({
  chatMessages,
  threads,
  focusStack,
  currentFocusedThreadId,
  currentFocusedThread,
  isMainLoading,
  loadingContext,
  activeGhostCount,
  typingUsers,
  showThreadNav,
  threadNavFilter,
  replyTo,
  currentUserId,
  displayNameFor,
  onSwitchIdentity,
  getThreadsForMessage,
  getGhostsAfter,
  onFocusThread,
  onNavigateBreadcrumb,
  onSwipeReply,
  onMaterializeGhost,
  onDismissGhost,
  onSetShowThreadNav,
  onSetThreadNavFilter,
  onSelectThreadFromNav,
  onToggleThreadClosed,
  onCloseToolbar,
}: {
  chatMessages: ChatMessage[];
  threads: BranchThread[];
  focusStack: string[];
  currentFocusedThreadId: string | null;
  currentFocusedThread: BranchThread | null;
  isMainLoading: boolean;
  loadingContext: "main" | string | null;
  activeGhostCount: number;
  typingUsers: string[];
  showThreadNav: boolean;
  threadNavFilter: BranchThread["action"] | "all";
  replyTo: ChatMessage | null;
  currentUserId: string;
  displayNameFor: (authorId: string) => string;
  onSwitchIdentity: () => void;
  getThreadsForMessage: (messageId: string, parentThreadId: string | null) => BranchThread[];
  getGhostsAfter: (messageId: string) => GhostBranch[];
  onFocusThread: (threadId: string) => void;
  onNavigateBreadcrumb: (depth: number) => void;
  onSwipeReply: (message: ChatMessage) => void;
  onMaterializeGhost: (ghost: GhostBranch) => void;
  onDismissGhost: (id: string) => void;
  onSetShowThreadNav: (show: boolean) => void;
  onSetThreadNavFilter: (f: BranchThread["action"] | "all") => void;
  onSelectThreadFromNav: (threadId: string) => void;
  onToggleThreadClosed?: (threadId: string, closed: boolean) => void;
  onCloseToolbar: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, [chatMessages, loadingContext, threads]);

  const currentDisplayName = displayNameFor(currentUserId);
  const otherUserId = currentUserId === "aj" ? "suz" : "aj";
  const otherDisplayName = displayNameFor(otherUserId);

  return (
    <>
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

      {/* Header */}
      <header className="sticky top-0 z-20 bg-zinc-950/95 backdrop-blur border-b border-zinc-800">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link href="/" className="text-zinc-500">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="flex-1">
            <h1 className="text-base font-semibold text-zinc-100">
              {currentDisplayName} & {otherDisplayName}
            </h1>
            {typingUsers.includes(otherUserId) ? (
              <p className="text-[11px] text-green-400">
                {otherDisplayName} is typing...
              </p>
            ) : (
              <p className="text-[11px] text-zinc-500">
                Chatting as <span className="text-zinc-300">{currentDisplayName}</span>
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {activeGhostCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30">
                👻 {activeGhostCount}
              </span>
            )}
            {threads.length > 0 && (
              <button
                onClick={() => { onSetShowThreadNav(true); onCloseToolbar(); }}
                className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30 active:scale-95 transition-all"
              >
                ⑂ {threads.filter((t) => !t.closed).length}
              </button>
            )}
            <button
              onClick={onSwitchIdentity}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white active:scale-95 transition-all"
              style={{ backgroundColor: currentUserId === "aj" ? "#3b82f6" : "#a855f7" }}
              title={`Switch to ${otherDisplayName}`}
            >
              {currentUserId === "aj" ? "AJ" : "SZ"}
            </button>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <AnimatePresence>
        {focusStack.length > 0 && (
          <ThreadBreadcrumb
            focusStack={focusStack}
            threads={threads}
            onNavigate={onNavigateBreadcrumb}
          />
        )}
      </AnimatePresence>

      {/* Messages */}
      <main ref={scrollRef} className="flex-1 overflow-y-auto px-3 pb-24">
        <AnimatePresence mode="wait">
          {currentFocusedThread ? (
            /* Focused Thread View */
            <motion.div
              key={currentFocusedThreadId}
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -60 }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              data-thread-id={currentFocusedThreadId}
            >
              <div className="px-3 py-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-mono uppercase tracking-wider ${
                    { branch: "text-amber-400", challenge: "text-red-400", define: "text-blue-400", connect: "text-green-400" }[currentFocusedThread.action]
                  }`}>
                    {{ branch: "Branched from", challenge: "Challenge to", define: "Defining", connect: "Connected to" }[currentFocusedThread.action]}
                  </span>
                  {onToggleThreadClosed && (
                    <button
                      onClick={() => onToggleThreadClosed(currentFocusedThread.id, !currentFocusedThread.closed)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors ${
                        currentFocusedThread.closed
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30"
                          : "bg-zinc-700/60 text-zinc-400 border border-zinc-600/50 hover:bg-zinc-700"
                      }`}
                    >
                      {currentFocusedThread.closed ? "Reopen" : "Close"}
                    </button>
                  )}
                </div>
                <p className="text-[15px] leading-relaxed text-zinc-300 italic">
                  &ldquo;{currentFocusedThread.highlightedText}&rdquo;
                </p>
              </div>

              {currentFocusedThread.messages.map((msg, i) => {
                const isMe = msg.authorId === currentUserId;
                const prev = i > 0 ? currentFocusedThread.messages[i - 1] : null;
                const showTail = !prev || prev.authorId !== msg.authorId;
                const isLast = i === currentFocusedThread.messages.length - 1 && loadingContext !== currentFocusedThreadId;
                const childThreads = getThreadsForMessage(msg.id, currentFocusedThreadId);

                return (
                  <div key={msg.id}>
                    <MessageBubble
                      message={msg}
                      isMe={isMe}
                      showTail={showTail}
                      isLast={isLast && isMe}
                      threads={childThreads}
                      allMessages={currentFocusedThread.messages}
                      onSwipeReply={onSwipeReply}
                      onFocusThread={onFocusThread}
                      displayNameFor={displayNameFor}
                    />
                    <AnimatePresence>
                      {childThreads.map((t) => (
                        <BranchThreadPill key={t.id} thread={t} onFocus={onFocusThread} />
                      ))}
                    </AnimatePresence>
                  </div>
                );
              })}

              <AnimatePresence>
                {loadingContext === currentFocusedThreadId && <TypingIndicator />}
              </AnimatePresence>

              {currentFocusedThread.messages.length === 0 && (
                <div className="px-6 py-8 text-center">
                  <p className="text-[13px] text-zinc-400">Start exploring this thread</p>
                  <p className="text-[11px] text-zinc-600 mt-1">
                    Type below to continue the conversation. You can highlight text to branch deeper.
                  </p>
                </div>
              )}
            </motion.div>
          ) : (
            /* Main Thread View */
            <motion.div
              key="main"
              initial={{ opacity: 0, x: -60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 60 }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
            >
              <div className="flex items-center justify-center py-3">
                <span className="text-[11px] font-medium text-zinc-500 bg-zinc-950 px-3">Today</span>
              </div>

              {chatMessages.length === 0 && (
                <div className="px-6 py-12 text-center">
                  <p className="text-[14px] text-zinc-400 mb-1">No messages yet</p>
                  <p className="text-[11px] text-zinc-600">
                    Select text to branch, challenge, or define. Ghost branches appear as the conversation develops.
                  </p>
                </div>
              )}

              {chatMessages.map((msg, i) => {
                const isMe = msg.authorId === currentUserId;
                const prev = i > 0 ? chatMessages[i - 1] : null;
                const showTail = !prev || prev.authorId !== msg.authorId;
                const isLast = i === chatMessages.length - 1 && !isMainLoading;
                const messageThreads = getThreadsForMessage(msg.id, null);
                const messageGhosts = getGhostsAfter(msg.id);

                return (
                  <div key={msg.id}>
                    <MessageBubble
                      message={msg}
                      isMe={isMe}
                      showTail={showTail}
                      isLast={isLast && isMe}
                      threads={messageThreads}
                      allMessages={chatMessages}
                      onSwipeReply={onSwipeReply}
                      onFocusThread={onFocusThread}
                      displayNameFor={displayNameFor}
                    />
                    <AnimatePresence>
                      {messageThreads.map((t) => (
                        <BranchThreadPill key={t.id} thread={t} onFocus={onFocusThread} />
                      ))}
                    </AnimatePresence>
                    <AnimatePresence>
                      {messageGhosts.map((ghost) => (
                        <GhostBranchPill
                          key={ghost.id}
                          ghost={ghost}
                          onMaterialize={onMaterializeGhost}
                          onDismiss={onDismissGhost}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                );
              })}

              <AnimatePresence>{isMainLoading && <TypingIndicator />}</AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Thread Navigator */}
      <AnimatePresence>
        {showThreadNav && (
          <ThreadNavigator
            threads={threads}
            chatMessages={chatMessages}
            onSelectThread={onSelectThreadFromNav}
            onClose={() => onSetShowThreadNav(false)}
            filter={threadNavFilter}
            onFilterChange={onSetThreadNavFilter}
            onToggleClosed={onToggleThreadClosed}
          />
        )}
      </AnimatePresence>
    </>
  );
}
