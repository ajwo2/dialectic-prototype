"use client";

import { AnimatePresence } from "framer-motion";
import { useChat } from "./hooks/useChat";
import { useThreads } from "./hooks/useThreads";
import { useGhosts } from "./hooks/useGhosts";
import { useTextSelection } from "./hooks/useTextSelection";
import { useDebugLog } from "./hooks/useDebugLog";
import type { BranchThread, GhostBranch } from "./lib/types";
import { ChatShell } from "./components/ChatShell";
import { FloatingToolbar } from "./components/FloatingToolbar";
import { Composer } from "./components/Composer";

export default function V15Page() {
  useDebugLog();

  const chat = useChat();
  const threadState = useThreads(
    chat.chatMessages,
    chat.loadingContext,
    chat.setLoadingContext,
    chat.setError,
  );
  const ghostState = useGhosts();
  const selection = useTextSelection(chat.chatMessages, threadState.threads);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (threadState.currentFocusedThreadId) {
      threadState.sendThreadMessage(threadState.currentFocusedThreadId, chat.inputValue);
      chat.setInputValue("");
    } else {
      chat.sendMessage(chat.inputValue).then((allMessages) => {
        if (allMessages) {
          ghostState.fetchGhosts(allMessages);
        }
      });
    }
  };

  const handleBranchAction = (
    action: BranchThread["action"],
    text: string,
    messageId: string,
    highlightStart: number,
    highlightEnd: number,
  ) => {
    const parentThreadId = selection.toolbar?.threadId ?? threadState.currentFocusedThreadId;
    threadState.createThread(action, text, messageId, highlightStart, highlightEnd, parentThreadId);
    selection.closeToolbar();
    window.getSelection()?.removeAllRanges();

    // Pre-fill composer for challenge/define
    if (action === "challenge" || action === "define") {
      const prefill =
        action === "challenge"
          ? `I'd push back on "${text}" because `
          : `When we say "${text}", I think we mean `;
      setTimeout(() => {
        chat.setInputValue(prefill);
        chat.inputRef.current?.focus();
      }, 100);
    }
  };

  const handleMaterializeGhost = (ghost: GhostBranch) => {
    ghostState.dismissGhost(ghost.id);
    threadState.createThread(
      "branch",
      ghost.suggestion,
      ghost.afterMessageId,
      -1, // ghosts don't have text offsets
      -1,
      threadState.currentFocusedThreadId,
      "ghost",
    );

    setTimeout(() => {
      chat.setInputValue(ghost.suggestion);
      chat.inputRef.current?.focus();
    }, 100);
  };

  const handleSelectThreadFromNav = (threadId: string) => {
    threadState.setFocusStack(threadState.buildFocusPath(threadId));
    threadState.setShowThreadNav(false);
  };

  const composerPlaceholder = chat.replyTo
    ? `Reply to ${chat.replyTo.role === "user" ? "yourself" : "Suz"}...`
    : threadState.currentFocusedThread
      ? "Reply in thread..."
      : "iMessage";

  const composerDisabled = threadState.currentFocusedThread
    ? chat.loadingContext === threadState.currentFocusedThreadId
    : chat.isMainLoading;

  return (
    <div className="flex flex-col min-h-dvh bg-zinc-950">
      <ChatShell
        chatMessages={chat.chatMessages}
        threads={threadState.threads}
        focusStack={threadState.focusStack}
        currentFocusedThreadId={threadState.currentFocusedThreadId}
        currentFocusedThread={threadState.currentFocusedThread}
        isMainLoading={chat.isMainLoading}
        loadingContext={chat.loadingContext}
        activeGhostCount={ghostState.activeGhostCount}
        showThreadNav={threadState.showThreadNav}
        threadNavFilter={threadState.threadNavFilter}
        replyTo={chat.replyTo}
        getThreadsForMessage={threadState.getThreadsForMessage}
        getGhostsAfter={ghostState.getGhostsAfter}
        onFocusThread={threadState.focusThread}
        onNavigateBreadcrumb={threadState.navigateBreadcrumb}
        onSwipeReply={(m) => {
          chat.setReplyTo(m);
          chat.inputRef.current?.focus();
        }}
        onMaterializeGhost={handleMaterializeGhost}
        onDismissGhost={ghostState.dismissGhost}
        onSetShowThreadNav={threadState.setShowThreadNav}
        onSetThreadNavFilter={threadState.setThreadNavFilter}
        onSelectThreadFromNav={handleSelectThreadFromNav}
        onCloseToolbar={selection.closeToolbar}
      />

      {/* Error display */}
      {chat.error && (
        <div className="fixed bottom-20 left-3 right-3 z-30 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-[12px] text-red-400">
          {chat.error}
        </div>
      )}

      {/* Floating toolbar */}
      <AnimatePresence>
        {selection.toolbar && (
          <FloatingToolbar
            toolbar={selection.toolbar}
            onAction={handleBranchAction}
            onClose={selection.closeToolbar}
          />
        )}
      </AnimatePresence>

      {/* Composer */}
      <Composer
        inputRef={chat.inputRef}
        inputValue={chat.inputValue}
        setInputValue={chat.setInputValue}
        onSubmit={handleSubmit}
        replyTo={chat.replyTo}
        onDismissReply={() => chat.setReplyTo(null)}
        disabled={composerDisabled}
        placeholder={composerPlaceholder}
      />
    </div>
  );
}
