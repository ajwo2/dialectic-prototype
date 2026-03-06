"use client";

import { AnimatePresence } from "framer-motion";
import type { ChatMessage, BranchThread } from "../lib/types";
import { ReplyPreview } from "./ReplyPreview";

export function Composer({
  inputRef,
  inputValue,
  setInputValue,
  onSubmit,
  replyTo,
  onDismissReply,
  disabled,
  placeholder,
}: {
  inputRef: React.RefObject<HTMLInputElement | null>;
  inputValue: string;
  setInputValue: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  replyTo: ChatMessage | null;
  onDismissReply: () => void;
  disabled: boolean;
  placeholder: string;
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 bg-zinc-900/95 backdrop-blur border-t border-zinc-800">
      <AnimatePresence>
        {replyTo && (
          <ReplyPreview message={replyTo} onDismiss={onDismissReply} />
        )}
      </AnimatePresence>

      <form onSubmit={onSubmit} className="max-w-lg mx-auto flex items-center gap-2 px-3 py-2">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 bg-zinc-800 rounded-full px-4 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus:ring-1 focus:ring-blue-500/50 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || disabled}
          className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 disabled:opacity-30 transition-opacity"
        >
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      </form>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </div>
  );
}
