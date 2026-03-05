"use client";

import { MessageNode, Fork, Source } from "@/lib/types";
import { users } from "@/data/mockDebate";
import Markdown from "react-markdown";
import { LinkCard } from "./LinkCard";
import { BookCitation } from "./BookCitation";

interface Props {
  node: MessageNode;
  forks: Fork[];
  sources: Source[];
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export function MessageBubble({ node, forks, sources, isSelected, onSelect }: Props) {
  const user = users[node.userId];
  const fork = forks.find((f) => f.id === node.forkId);
  const citedSources = node.citations.map((c) => ({
    citation: c,
    source: sources.find((s) => s.id === c.sourceId)!,
  })).filter((c) => c.source);

  const time = new Date(node.timestamp);
  const timeStr = time.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div
      className={`relative transition-colors duration-150 ${
        isSelected ? "bg-zinc-800/50" : ""
      }`}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(node.id);
      }}
    >
      <div className="flex gap-3 py-3 px-4">
        {/* Avatar */}
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-full ${user.color} flex items-center justify-center text-xs font-bold text-white mt-0.5`}
        >
          {user.avatar}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="font-semibold text-sm text-zinc-100">{user.name}</span>
            <span className="text-xs text-zinc-500">{timeStr}</span>
            {fork && (
              <span
                className={`text-xs px-1.5 py-0.5 rounded border ${fork.color} text-zinc-300 bg-zinc-800/50`}
              >
                {fork.title}
              </span>
            )}
          </div>

          {/* Markdown content */}
          <div className="text-sm text-zinc-300 prose prose-invert prose-sm max-w-none prose-p:my-1 prose-blockquote:my-2 prose-blockquote:border-zinc-600 prose-strong:text-zinc-100">
            <Markdown>{node.content}</Markdown>
          </div>

          {/* Citations */}
          {citedSources.length > 0 && (
            <div className="mt-2 space-y-2">
              {citedSources.map(({ citation, source }) =>
                source.type === "link" || source.type === "paper" ? (
                  <LinkCard key={citation.id} source={source} quote={citation.quote} />
                ) : (
                  <BookCitation key={citation.id} source={source} quote={citation.quote} />
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
