"use client";

import { Fork } from "@/lib/types";

interface Props {
  fork: Fork;
  messageCount: number;
}

export function ForkHeader({ fork, messageCount }: Props) {
  return (
    <div className={`flex items-center gap-2 px-4 py-2 border-l-2 ${fork.color} bg-zinc-900/50`}>
      <svg className="w-4 h-4 text-zinc-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
      <div className="flex-1 min-w-0">
        <span className="text-sm font-semibold text-zinc-200">{fork.title}</span>
        {fork.description && (
          <span className="text-xs text-zinc-500 ml-2">{fork.description}</span>
        )}
      </div>
      <span className="text-xs text-zinc-600">{messageCount} msgs</span>
    </div>
  );
}
