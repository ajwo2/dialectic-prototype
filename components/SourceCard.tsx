"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Source, Message } from "@/lib/types";

interface Props {
  source: Source;
  citingMessages: Message[];
}

const typeIcons: Record<string, { icon: string; color: string; bg: string }> = {
  link: { icon: "🔗", color: "text-blue-400", bg: "bg-blue-900/30" },
  paper: { icon: "📄", color: "text-blue-400", bg: "bg-blue-900/30" },
  book: { icon: "📚", color: "text-amber-400", bg: "bg-amber-900/30" },
  quote: { icon: "💬", color: "text-purple-400", bg: "bg-purple-900/30" },
};

export function SourceCard({ source, citingMessages }: Props) {
  const [expanded, setExpanded] = useState(false);
  const style = typeIcons[source.type] || typeIcons.link;

  return (
    <div className="border-b border-zinc-800 last:border-b-0">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-zinc-800/50 active:bg-zinc-800 transition-colors"
      >
        <div className={`flex-shrink-0 w-10 h-10 rounded-lg ${style.bg} flex items-center justify-center mt-0.5`}>
          <span className="text-lg">{style.icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-zinc-200 leading-snug">{source.title}</p>
          <p className="text-xs text-zinc-500 mt-0.5">
            {source.author}{source.year ? ` · ${source.year}` : ""}
          </p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {source.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500"
              >
                {tag}
              </span>
            ))}
            <span className="text-[10px] text-zinc-600">
              Cited {citingMessages.length}x
            </span>
          </div>
        </div>
        <svg
          className={`w-4 h-4 text-zinc-600 mt-1 transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 ml-13">
              {source.description && (
                <p className="text-xs text-zinc-400 mb-3 leading-relaxed ml-[52px]">
                  {source.description}
                </p>
              )}
              {source.url && (
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-400 hover:text-blue-300 mb-3 block truncate ml-[52px]"
                >
                  {source.url}
                </a>
              )}
              <div className="ml-[52px] space-y-2">
                <p className="text-[10px] uppercase tracking-wider text-zinc-600 font-medium">
                  Cited in
                </p>
                {citingMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className="text-xs text-zinc-400 bg-zinc-800/50 rounded-lg p-2 leading-relaxed"
                  >
                    <span className="text-zinc-500 font-medium">
                      {msg.userId === "aj" ? "A.J." : "Marcus"}:
                    </span>{" "}
                    {msg.content.slice(0, 120)}
                    {msg.content.length > 120 ? "..." : ""}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
