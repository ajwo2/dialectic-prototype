"use client";

import { sources, messages } from "@/data/mockDebate";
import { Source, Message } from "@/lib/types";
import { SourceCard } from "@/components/SourceCard";
import { BottomNav } from "@/components/BottomNav";

function getCitingMessages(source: Source): Message[] {
  return messages.filter((m) =>
    m.citations.some((c) => c.sourceId === source.id)
  );
}

export default function SourcesPage() {
  return (
    <div className="flex flex-col min-h-dvh">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-zinc-950/95 backdrop-blur border-b border-zinc-800">
        <div className="px-4 py-3">
          <h1 className="text-lg font-bold text-zinc-100">Sources</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            {sources.length} sources cited in this debate
          </p>
        </div>
      </header>

      {/* Source list */}
      <main className="flex-1 overflow-y-auto pb-20">
        {sources.map((source) => (
          <SourceCard
            key={source.id}
            source={source}
            citingMessages={getCitingMessages(source)}
          />
        ))}
      </main>

      <BottomNav />
    </div>
  );
}
