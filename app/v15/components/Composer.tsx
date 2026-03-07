"use client";

import { AnimatePresence } from "framer-motion";
import type { ChatMessage, MessageAttachment } from "../lib/types";
import type { Reference, ReferenceResult } from "../hooks/useReferences";
import { ReplyPreview } from "./ReplyPreview";
import { ReferenceTray } from "./ReferenceTray";

export function Composer({
  inputRef,
  inputValue,
  setInputValue,
  onSubmit,
  replyTo,
  onDismissReply,
  disabled,
  placeholder,
  referenceResult,
  onAttachReference,
  onDismissReferences,
  pendingAttachments,
  onRemoveAttachment,
  aiEnabled,
  onToggleAi,
}: {
  inputRef: React.RefObject<HTMLInputElement | null>;
  inputValue: string;
  setInputValue: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  replyTo: ChatMessage | null;
  onDismissReply: () => void;
  disabled: boolean;
  placeholder: string;
  referenceResult: ReferenceResult | null;
  onAttachReference: (ref: Reference) => void;
  onDismissReferences: () => void;
  pendingAttachments: MessageAttachment[];
  onRemoveAttachment: (id: string) => void;
  aiEnabled: boolean;
  onToggleAi: () => void;
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 bg-zinc-900/95 backdrop-blur border-t border-zinc-800">
      <AnimatePresence>
        {replyTo && (
          <ReplyPreview message={replyTo} onDismiss={onDismissReply} />
        )}
      </AnimatePresence>

      <ReferenceTray
        result={referenceResult}
        onAttach={onAttachReference}
        onDismiss={onDismissReferences}
      />

      {/* Pending attachment chips */}
      {pendingAttachments.length > 0 && (
        <div className="px-3 pt-1.5 pb-0.5 flex flex-wrap gap-1.5">
          {pendingAttachments.map((att) => (
            <span
              key={att.id}
              className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 border border-blue-500/30 px-2 py-0.5 text-[11px] text-blue-300"
            >
              📎 {att.label}
              <button
                onClick={() => onRemoveAttachment(att.id)}
                className="text-blue-400/60 hover:text-blue-300 ml-0.5"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}

      <form onSubmit={onSubmit} className="max-w-lg mx-auto flex items-center gap-2 px-3 py-2">
        <div className="flex-1 flex items-center bg-zinc-800 rounded-full px-1 focus-within:ring-1 focus-within:ring-blue-500/50">
          {/* AI toggle button inside the input bubble */}
          <button
            type="button"
            onClick={onToggleAi}
            className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
              aiEnabled
                ? "bg-blue-500/20 text-blue-400"
                : "bg-transparent text-zinc-600 hover:text-zinc-400"
            }`}
            title={aiEnabled ? "AI references on" : "AI references off"}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a4 4 0 0 1 4 4c0 1.5-.8 2.8-2 3.4V11h3a3 3 0 0 1 3 3v1" />
              <path d="M6 11h3V9.4A4 4 0 0 1 12 2" />
              <path d="M6 14a3 3 0 0 1 3-3" />
              <circle cx="12" cy="18" r="3" />
              <path d="M9 18H4" />
              <path d="M20 18h-5" />
            </svg>
          </button>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className="flex-1 bg-transparent px-2 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none disabled:opacity-50"
          />
        </div>
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
