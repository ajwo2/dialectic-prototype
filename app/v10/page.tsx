"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Markdown from "react-markdown";
import Link from "next/link";
import { messages, users, sources, forks } from "@/data/mockDebate";
import { claims, claimLinks } from "@/data/mockInteractionData";
import { flattenChronological } from "@/lib/tree";
import { Message, Source, Citation, Claim } from "@/lib/types";
import { getClaimsForMessage, getLinksForClaim } from "@/lib/interaction-utils";

function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function ClaimChip({
  claim,
  onTap,
  isExpanded,
}: {
  claim: Claim;
  onTap: () => void;
  isExpanded: boolean;
}) {
  const links = getLinksForClaim(claim.id, claimLinks);
  return (
    <div>
      <motion.button
        layoutId={`claim-${claim.id}`}
        onClick={onTap}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all ${
          claim.contested
            ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
            : "bg-zinc-800 text-zinc-300 border-zinc-700"
        } ${isExpanded ? "ring-1 ring-amber-400/50" : ""}`}
      >
        {claim.contested && <span className="text-[9px]">⚡</span>}
        <span className="truncate max-w-[200px]">{claim.text}</span>
        {links.length > 0 && (
          <span className="text-[9px] bg-zinc-700/80 px-1 py-0.5 rounded-full">{links.length}</span>
        )}
      </motion.button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex gap-1.5 mt-2 pl-1">
              {["Agree", "Challenge", "Evidence?", "Branch"].map((action) => (
                <button
                  key={action}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-700 hover:text-zinc-200 transition-colors"
                >
                  {action === "Agree" && "👍 "}
                  {action === "Challenge" && "⚔️ "}
                  {action === "Evidence?" && "📎 "}
                  {action === "Branch" && "⑂ "}
                  {action}
                </button>
              ))}
            </div>
            {links.length > 0 && (
              <div className="mt-2 pl-1 space-y-1">
                {links.map((link) => {
                  const otherClaimId = link.fromClaimId === claim.id ? link.toClaimId : link.fromClaimId;
                  const otherClaim = claims.find((c) => c.id === otherClaimId);
                  if (!otherClaim) return null;
                  const typeLabel = link.type === "supports" ? "↗ Supports" : link.type === "contradicts" ? "↯ Contradicts" : "↻ Refines";
                  const typeColor = link.type === "supports" ? "text-green-400" : link.type === "contradicts" ? "text-red-400" : "text-blue-400";
                  return (
                    <div key={link.id} className="flex items-center gap-1.5 text-[10px]">
                      <span className={typeColor}>{typeLabel}</span>
                      <span className="text-zinc-500 truncate">{otherClaim.text}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RichCitationEmbed({ citation, source }: { citation: Citation; source: Source }) {
  const typeIcon = source.type === "paper" || source.type === "link" ? "🔗" : source.type === "book" ? "📚" : "💬";
  return (
    <div className="mt-2 rounded-xl border border-zinc-700/50 bg-zinc-800/60 overflow-hidden">
      {citation.quote && (
        <div className="px-3 py-2 bg-zinc-800/80 border-b border-zinc-700/30">
          <p className="text-xs italic text-zinc-400 leading-relaxed">&ldquo;{citation.quote}&rdquo;</p>
        </div>
      )}
      <div className="px-3 py-2.5 flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-zinc-700/50 flex items-center justify-center text-lg flex-shrink-0">
          {typeIcon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-zinc-200 leading-snug">{source.title}</p>
          <p className="text-[11px] text-zinc-500 mt-0.5">{source.author}{source.year ? ` · ${source.year}` : ""}</p>
        </div>
      </div>
    </div>
  );
}

function ClaimCard({
  message,
  index,
}: {
  message: Message;
  index: number;
}) {
  const user = users[message.userId];
  const fork = message.forkId ? forks.find((f) => f.id === message.forkId) : undefined;
  const citedSources = message.citations
    .map((c) => ({ citation: c, source: sources.find((s) => s.id === c.sourceId)! }))
    .filter((c) => c.source);
  const messageClaims = getClaimsForMessage(message.id, claims);
  const [expandedClaimId, setExpandedClaimId] = useState<string | null>(null);

  const forkBorderColor = fork
    ? fork.color.replace("border-", "border-l-")
    : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 200, delay: index * 0.02 }}
      className={`mx-3 mb-2 rounded-2xl border border-zinc-800/80 bg-zinc-900/80 shadow-sm shadow-black/20 overflow-hidden ${
        fork ? `border-l-[3px] ${forkBorderColor}` : ""
      }`}
    >
      {/* Claim chips at top */}
      {messageClaims.length > 0 && (
        <div className="px-3 pt-3 pb-1 flex flex-wrap gap-1.5">
          {messageClaims.map((claim) => (
            <ClaimChip
              key={claim.id}
              claim={claim}
              isExpanded={expandedClaimId === claim.id}
              onTap={() => setExpandedClaimId(expandedClaimId === claim.id ? null : claim.id)}
            />
          ))}
        </div>
      )}

      {/* Author row */}
      <div className="flex items-center gap-2.5 px-3 pt-2 pb-1">
        <div className={`w-7 h-7 rounded-full ${user.color} flex items-center justify-center text-[10px] font-bold text-white`}>
          {user.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold text-zinc-200">{user.name}</span>
          {fork && <span className="text-[10px] text-zinc-500 ml-2">in {fork.title}</span>}
        </div>
        <span className="text-[10px] text-zinc-600">{formatTime(message.timestamp)}</span>
      </div>

      {/* Content */}
      <div className="px-3 pb-2">
        <div className="text-[14px] leading-relaxed text-zinc-300 prose prose-invert prose-sm max-w-none prose-p:my-1 prose-blockquote:border-zinc-600 prose-strong:text-zinc-100 prose-blockquote:my-2">
          <Markdown>{message.content}</Markdown>
        </div>
        {citedSources.map(({ citation, source }) => (
          <RichCitationEmbed key={citation.id} citation={citation} source={source} />
        ))}
      </div>

      {/* Action row */}
      <div className="flex items-center border-t border-zinc-800/50 px-1">
        <button className="flex-1 flex items-center justify-center gap-1.5 py-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 rounded-lg transition-colors text-xs">
          <span>↩</span> Reply
        </button>
        <button className="flex-1 flex items-center justify-center gap-1.5 py-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 rounded-lg transition-colors text-xs">
          <span>⑂</span> Fork
        </button>
        <button className="flex-1 flex items-center justify-center gap-1.5 py-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 rounded-lg transition-colors text-xs">
          <span>🏷</span> Claims
        </button>
      </div>
    </motion.div>
  );
}

function ClaimsMap() {
  const contested = claims.filter((c) => c.contested);
  const uncontested = claims.filter((c) => !c.contested);

  return (
    <div className="px-3 py-4">
      <p className="text-[11px] text-zinc-500 font-mono uppercase tracking-wider mb-3">Claims Map</p>

      <div className="space-y-4">
        <div>
          <p className="text-[10px] text-red-400 font-semibold mb-2">⚡ Contested ({contested.length})</p>
          <div className="space-y-1.5">
            {contested.map((claim) => {
              const links = getLinksForClaim(claim.id, claimLinks);
              const msg = messages.find((m) => m.id === claim.messageId);
              const user = msg ? users[msg.userId] : null;
              return (
                <div key={claim.id} className="px-3 py-2 rounded-xl bg-amber-500/5 border border-amber-500/20">
                  <div className="flex items-start gap-2">
                    {user && (
                      <div className={`w-4 h-4 rounded-full ${user.color} flex items-center justify-center text-[7px] font-bold text-white flex-shrink-0 mt-0.5`}>
                        {user.avatar}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] text-zinc-200">{claim.text}</p>
                      {links.length > 0 && (
                        <div className="mt-1 space-y-0.5">
                          {links.map((link) => {
                            const otherClaimId = link.fromClaimId === claim.id ? link.toClaimId : link.fromClaimId;
                            const other = claims.find((c) => c.id === otherClaimId);
                            const arrow = link.type === "supports" ? "↗" : link.type === "contradicts" ? "↯" : "↻";
                            return (
                              <p key={link.id} className="text-[10px] text-zinc-500">
                                {arrow} {other?.text}
                              </p>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <p className="text-[10px] text-green-400 font-semibold mb-2">🤝 Agreed ({uncontested.length})</p>
          <div className="space-y-1">
            {uncontested.map((claim) => (
              <div key={claim.id} className="px-3 py-1.5 rounded-lg bg-zinc-800/50 border border-zinc-700/30">
                <p className="text-[11px] text-zinc-400">{claim.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function V10Page() {
  const flat = useMemo(() => flattenChronological(messages), []);
  const [showClaimsMap, setShowClaimsMap] = useState(false);

  return (
    <div className="flex flex-col min-h-dvh bg-zinc-950">
      <header className="sticky top-0 z-20 bg-zinc-950/95 backdrop-blur border-b border-zinc-800">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link href="/" className="text-zinc-500">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="flex-1">
            <h1 className="text-base font-semibold text-zinc-100">Culture & Personality</h1>
            <p className="text-[11px] text-zinc-500">Claim Chips</p>
          </div>
          <button
            onClick={() => setShowClaimsMap(!showClaimsMap)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors ${
              showClaimsMap
                ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                : "bg-zinc-800 text-zinc-400 border-zinc-700"
            }`}
          >
            🗺 Claims
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pt-3 pb-20">
        <AnimatePresence mode="wait">
          {showClaimsMap ? (
            <motion.div
              key="map"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ClaimsMap />
            </motion.div>
          ) : (
            <motion.div
              key="cards"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {flat.map((msg, i) => (
                <ClaimCard key={msg.id} message={msg} index={i} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Composer */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-zinc-900/95 backdrop-blur border-t border-zinc-800">
        <div className="max-w-lg mx-auto flex items-center gap-2 px-3 py-2">
          <div className="flex-1 bg-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-500">
            Add to the conversation...
          </div>
          <button className="px-4 py-2.5 bg-blue-600 rounded-xl text-sm font-medium text-white">
            Send
          </button>
        </div>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </div>
    </div>
  );
}
