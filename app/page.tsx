"use client";

import { useState, useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import { messages, sources, forks } from "@/data/mockDebate";
import { buildTree } from "@/lib/tree";
import { ThreadTree } from "@/components/ThreadTree";
import { ActionBar } from "@/components/ActionBar";
import { ComposeSheet } from "@/components/ComposeSheet";
import { SummarySheet } from "@/components/SummarySheet";
import { BottomNav } from "@/components/BottomNav";

export default function DebateView() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [replyTo, setReplyTo] = useState<string | undefined>();

  const tree = useMemo(() => buildTree(messages), []);

  return (
    <div className="flex flex-col min-h-dvh" onClick={() => setSelectedId(null)}>
      {/* Header */}
      <header className="sticky top-0 z-20 bg-zinc-950/95 backdrop-blur border-b border-zinc-800">
        <div className="px-4 py-3">
          <h1 className="text-lg font-bold text-zinc-100">Culture &amp; Personality</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            {messages.length} messages &middot; {forks.length} forks &middot; {sources.length} sources
          </p>
        </div>
      </header>

      {/* Thread content */}
      <main className="flex-1 overflow-y-auto pb-32">
        <ThreadTree
          nodes={tree}
          forks={forks}
          sources={sources}
          selectedId={selectedId}
          onSelect={(id) => setSelectedId(id === selectedId ? null : id)}
        />
      </main>

      {/* Action bar for selected message */}
      <AnimatePresence>
        {selectedId && !composeOpen && !summaryOpen && (
          <ActionBar
            onReply={() => {
              setReplyTo(selectedId);
              setComposeOpen(true);
              setSelectedId(null);
            }}
            onFork={() => {
              setReplyTo(selectedId);
              setComposeOpen(true);
              setSelectedId(null);
            }}
            onCite={() => {
              setReplyTo(selectedId);
              setComposeOpen(true);
              setSelectedId(null);
            }}
            onSummarize={() => {
              setSummaryOpen(true);
              setSelectedId(null);
            }}
            onClose={() => setSelectedId(null)}
          />
        )}
      </AnimatePresence>

      {/* Bottom action bar */}
      {!selectedId && !composeOpen && !summaryOpen && (
        <div className="fixed bottom-14 left-0 right-0 z-20 px-4 pb-2">
          <div className="max-w-lg mx-auto flex gap-2">
            <button
              onClick={() => setSummaryOpen(true)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-zinc-800/80 backdrop-blur border border-zinc-700 rounded-xl text-sm text-zinc-300 hover:bg-zinc-700 active:bg-zinc-600 transition-colors"
            >
              <span>✨</span>
              <span>Summarize</span>
            </button>
            <button
              onClick={() => {
                setReplyTo(undefined);
                setComposeOpen(true);
              }}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 rounded-xl text-sm text-white font-medium hover:bg-blue-500 active:bg-blue-400 transition-colors"
            >
              <span>+</span>
              <span>Compose</span>
            </button>
          </div>
        </div>
      )}

      {/* Sheets */}
      <ComposeSheet
        isOpen={composeOpen}
        onClose={() => setComposeOpen(false)}
        replyTo={replyTo}
      />
      <SummarySheet isOpen={summaryOpen} onClose={() => setSummaryOpen(false)} />

      {/* Bottom nav */}
      <BottomNav />
    </div>
  );
}
