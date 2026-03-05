"use client";

import { Source } from "@/lib/types";

interface Props {
  source: Source;
  quote?: string;
}

export function BookCitation({ source, quote }: Props) {
  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-800/80 overflow-hidden">
      {quote && (
        <div className="px-3 py-2 border-b border-zinc-700 bg-zinc-800/50">
          <p className="text-xs text-zinc-400 italic leading-relaxed">&ldquo;{quote}&rdquo;</p>
        </div>
      )}
      <div className="px-3 py-2 flex items-start gap-2">
        <div className="flex-shrink-0 w-8 h-8 rounded bg-amber-900/30 flex items-center justify-center mt-0.5">
          {source.type === "book" ? (
            <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-zinc-200 leading-snug">{source.title}</p>
          <p className="text-xs text-zinc-500 mt-0.5">
            {source.author}{source.year ? ` · ${source.year}` : ""}
          </p>
        </div>
      </div>
    </div>
  );
}
