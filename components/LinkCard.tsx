"use client";

import { Source } from "@/lib/types";

interface Props {
  source: Source;
  quote?: string;
}

export function LinkCard({ source, quote }: Props) {
  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-800/80 overflow-hidden">
      {quote && (
        <div className="px-3 py-2 border-b border-zinc-700 bg-zinc-800/50">
          <p className="text-xs text-zinc-400 italic leading-relaxed">&ldquo;{quote}&rdquo;</p>
        </div>
      )}
      <div className="px-3 py-2 flex items-start gap-2">
        <div className="flex-shrink-0 w-8 h-8 rounded bg-blue-900/30 flex items-center justify-center mt-0.5">
          {source.type === "paper" ? (
            <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-zinc-200 leading-snug truncate">{source.title}</p>
          <p className="text-xs text-zinc-500 mt-0.5">
            {source.author}{source.year ? ` · ${source.year}` : ""}
          </p>
        </div>
      </div>
    </div>
  );
}
