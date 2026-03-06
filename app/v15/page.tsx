"use client";

import { AnimatePresence } from "framer-motion";
import { useIdentity } from "./hooks/useIdentity";
import { useChat } from "./hooks/useChat";
import { useThreadNav } from "./hooks/useThreads";
import { useTextSelection } from "./hooks/useTextSelection";
import { useDebugLog } from "./hooks/useDebugLog";
import type { BranchThread, GhostBranch } from "./lib/types";
import { ChatShell } from "./components/ChatShell";
import { FloatingToolbar } from "./components/FloatingToolbar";
import { Composer } from "./components/Composer";
import { IdentityPicker } from "./components/IdentityPicker";
import { BUILD_VERSION, BUILD_TIMESTAMP } from "./lib/constants";

export default function V15Page() {
  useDebugLog();

  const { userId, identity, loaded, pickIdentity, switchIdentity, displayNameFor } = useIdentity();
  const chat = useChat(userId);
  const threadNav = useThreadNav(chat.threads);
  const selection = useTextSelection(chat.chatMessages, chat.threads);

  // Show identity picker if not yet selected
  if (!loaded) return null;
  if (!userId || !identity) {
    return <IdentityPicker onPick={pickIdentity} />;
  }

  // Show loading state while fetching initial data
  if (!chat.initialized) {
    return (
      <div className="flex flex-col min-h-dvh bg-zinc-950 items-center justify-center">
        <div className="text-zinc-500 text-sm">Loading conversation...</div>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (threadNav.currentFocusedThreadId) {
      chat.postThreadMessage(threadNav.currentFocusedThreadId, chat.inputValue);
      chat.setInputValue("");
    } else {
      chat.postMessage(chat.inputValue).then((allMessages) => {
        if (allMessages) {
          chat.fetchGhosts(allMessages);
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
    const parentThreadId = selection.toolbar?.threadId ?? threadNav.currentFocusedThreadId;
    chat.createThread(action, text, messageId, highlightStart, highlightEnd, parentThreadId).then((newThread) => {
      if (newThread) {
        threadNav.setFocusStack((prev) => [...prev, newThread.id]);
      }
    });
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
    chat.dismissGhost(ghost.id);
    chat.createThread(
      "branch",
      ghost.suggestion,
      ghost.afterMessageId,
      -1,
      -1,
      threadNav.currentFocusedThreadId,
      "ghost",
    ).then((newThread) => {
      if (newThread) {
        threadNav.setFocusStack((prev) => [...prev, newThread.id]);
      }
    });

    setTimeout(() => {
      chat.setInputValue(ghost.suggestion);
      chat.inputRef.current?.focus();
    }, 100);
  };

  const handleSelectThreadFromNav = (threadId: string) => {
    threadNav.setFocusStack(threadNav.buildFocusPath(threadId));
    threadNav.setShowThreadNav(false);
  };

  const composerPlaceholder = chat.replyTo
    ? `Reply to ${displayNameFor(chat.replyTo.authorId)}...`
    : threadNav.currentFocusedThread
      ? "Reply in thread..."
      : `Message as ${identity.displayName}`;

  return (
    <div className="flex flex-col min-h-dvh bg-zinc-950">
      <ChatShell
        chatMessages={chat.chatMessages}
        threads={chat.threads}
        focusStack={threadNav.focusStack}
        currentFocusedThreadId={threadNav.currentFocusedThreadId}
        currentFocusedThread={threadNav.currentFocusedThread}
        isMainLoading={chat.isMainLoading}
        loadingContext={chat.loadingContext}
        activeGhostCount={chat.activeGhostCount}
        showThreadNav={threadNav.showThreadNav}
        threadNavFilter={threadNav.threadNavFilter}
        replyTo={chat.replyTo}
        currentUserId={userId}
        displayNameFor={displayNameFor}
        onSwitchIdentity={switchIdentity}
        getThreadsForMessage={threadNav.getThreadsForMessage}
        getGhostsAfter={chat.getGhostsAfter}
        onFocusThread={threadNav.focusThread}
        onNavigateBreadcrumb={threadNav.navigateBreadcrumb}
        onSwipeReply={(m) => {
          chat.setReplyTo(m);
          chat.inputRef.current?.focus();
        }}
        onMaterializeGhost={handleMaterializeGhost}
        onDismissGhost={chat.dismissGhost}
        onSetShowThreadNav={threadNav.setShowThreadNav}
        onSetThreadNavFilter={threadNav.setThreadNavFilter}
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

      {/* Build watermark */}
      <div className="fixed bottom-14 right-2 z-10 text-[9px] text-zinc-700 font-mono pointer-events-none select-none">
        {BUILD_VERSION} · {BUILD_TIMESTAMP}
      </div>

      {/* Composer */}
      <Composer
        inputRef={chat.inputRef}
        inputValue={chat.inputValue}
        setInputValue={chat.setInputValue}
        onSubmit={handleSubmit}
        replyTo={chat.replyTo}
        onDismissReply={() => chat.setReplyTo(null)}
        disabled={false}
        placeholder={composerPlaceholder}
      />
    </div>
  );
}
