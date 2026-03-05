"use client";

import { forks, messages } from "@/data/mockDebate";
import { BottomNav } from "@/components/BottomNav";
import Link from "next/link";

export default function ForksPage() {
  // Build fork hierarchy
  const forkData = forks.map((fork) => {
    const forkMessages = messages.filter((m) => m.forkId === fork.id);
    const parentMessage = messages.find((m) => m.id === fork.parentMessageId);

    // Find sub-threads within this fork (messages whose children start new discussion threads)
    const subThreads = forkMessages.filter((m) => {
      const children = messages.filter((c) => c.parentId === m.id && c.forkId === fork.id);
      return children.length > 0 && m.parentId && messages.find((p) => p.id === m.parentId)?.forkId === fork.id;
    });

    return {
      fork,
      messageCount: forkMessages.length,
      parentMessage,
      subThreads,
    };
  });

  return (
    <div className="flex flex-col min-h-dvh">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-zinc-950/95 backdrop-blur border-b border-zinc-800">
        <div className="px-4 py-3">
          <h1 className="text-lg font-bold text-zinc-100">Forks</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            {forks.length} debate branches
          </p>
        </div>
      </header>

      {/* Fork tree */}
      <main className="flex-1 overflow-y-auto pb-20">
        {/* Root thread */}
        <div className="px-4 py-3 border-b border-zinc-800">
          <Link href="/" className="block">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center">
                <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-zinc-200">Culture &amp; Personality</p>
                <p className="text-xs text-zinc-500">Root thread &middot; 12 messages</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Forks */}
        {forkData.map(({ fork, messageCount, parentMessage }) => (
          <div key={fork.id} className="border-b border-zinc-800">
            <Link href="/" className="block px-4 py-3">
              <div className="flex items-start gap-3">
                {/* Visual connector */}
                <div className="flex flex-col items-center pt-1">
                  <div className={`w-10 h-10 rounded-lg border-2 ${fork.color} bg-zinc-900 flex items-center justify-center`}>
                    <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-zinc-200">{fork.title}</p>
                  {fork.description && (
                    <p className="text-xs text-zinc-500 mt-0.5">{fork.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-[10px] text-zinc-600">{messageCount} messages</span>
                    {parentMessage && (
                      <span className="text-[10px] text-zinc-600">
                        Forked from: &ldquo;{parentMessage.content.slice(0, 50)}...&rdquo;
                      </span>
                    )}
                  </div>
                </div>

                <svg className="w-4 h-4 text-zinc-700 mt-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          </div>
        ))}

        {/* Legend */}
        <div className="px-4 py-6">
          <p className="text-[10px] uppercase tracking-wider text-zinc-700 font-medium mb-3">
            How forks work
          </p>
          <div className="space-y-2 text-xs text-zinc-500 leading-relaxed">
            <p>
              A <span className="font-medium text-zinc-400">fork</span> branches the conversation into a focused sub-debate. Each fork has its own thread of messages while staying connected to the parent discussion.
            </p>
            <p>
              Tap a message in the debate view and select <span className="font-medium text-zinc-400">Fork</span> to create a new branch.
            </p>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
