"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Markdown from "react-markdown";
import Link from "next/link";
import { messages, users, sources, forks } from "@/data/mockDebate";
import { claims, defaultReactions } from "@/data/mockInteractionData";
import { flattenChronological } from "@/lib/tree";
import { Message, Source, Citation, Claim, DiscourseReaction } from "@/lib/types";
import {
  getClaimsForMessage,
  computeThreadTemperature,
  DISCOURSE_REACTIONS,
  getLinksForClaim,
} from "@/lib/interaction-utils";
import { claimLinks } from "@/data/mockInteractionData";

function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

// ── Claim Chips (from V10) ──

function ClaimChip({ claim, isExpanded, onTap }: { claim: Claim; isExpanded: boolean; onTap: () => void }) {
  return (
    <button
      onClick={onTap}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border transition-all ${
        claim.contested
          ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
          : "bg-zinc-800 text-zinc-300 border-zinc-700"
      } ${isExpanded ? "ring-1 ring-amber-400/50" : ""}`}
    >
      {claim.contested && <span className="text-[8px]">⚡</span>}
      <span className="truncate max-w-[160px]">{claim.text}</span>
    </button>
  );
}

// ── Discourse Reactions (from V11) ──

function CompactReactionBar({
  reactions,
  onToggle,
}: {
  reactions: DiscourseReaction[];
  onToggle: (type: DiscourseReaction["type"]) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {DISCOURSE_REACTIONS.map((dr) => {
        const existing = reactions.find((r) => r.type === dr.type);
        const count = existing?.count || 0;
        const isActive = count > 0;
        return (
          <button
            key={dr.type}
            onClick={() => onToggle(dr.type)}
            className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] border transition-all ${
              isActive
                ? dr.color
                : "text-zinc-600 bg-zinc-800/30 border-zinc-700/20 hover:bg-zinc-800/60"
            }`}
          >
            <span className="text-[9px]">{dr.emoji}</span>
            {isActive && <span>{count}</span>}
          </button>
        );
      })}
    </div>
  );
}

// ── Temperature indicator ──

function TempDot({ reactions }: { reactions: DiscourseReaction[] }) {
  const temp = computeThreadTemperature(reactions);
  const hue = Math.round((1 - temp) * 220);
  return (
    <span
      className="inline-block w-2 h-2 rounded-full flex-shrink-0"
      style={{ backgroundColor: `hsl(${hue}, 70%, 50%)` }}
    />
  );
}

// ── Floating Selection Toolbar (from V9) ──

interface SelectionToolbar {
  x: number;
  y: number;
  text: string;
  messageId: string;
}

function FloatingToolbar({
  toolbar,
  onAction,
  onClose,
}: {
  toolbar: SelectionToolbar;
  onAction: (action: string, text: string, messageId: string) => void;
  onClose: () => void;
}) {
  const actions = [
    { key: "branch", label: "Branch", icon: "⑂" },
    { key: "challenge", label: "Challenge", icon: "⚔️" },
    { key: "define", label: "Define", icon: "📖" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.95 }}
      className="fixed z-50 flex gap-0.5 bg-zinc-800 border border-zinc-700 rounded-xl shadow-2xl shadow-black/50 p-1"
      style={{
        left: Math.max(8, Math.min(toolbar.x - 90, typeof window !== "undefined" ? window.innerWidth - 200 : 200)),
        top: Math.max(8, toolbar.y - 48),
      }}
    >
      {actions.map((action) => (
        <button
          key={action.key}
          onClick={() => onAction(action.key, toolbar.text, toolbar.messageId)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-medium text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 transition-colors"
        >
          <span>{action.icon}</span>
          <span>{action.label}</span>
        </button>
      ))}
    </motion.div>
  );
}

// ── Rich Citation Embed ──

function RichCitationEmbed({ citation, source }: { citation: Citation; source: Source }) {
  const typeIcon = source.type === "paper" || source.type === "link" ? "🔗" : source.type === "book" ? "📚" : "💬";
  return (
    <div className="mt-2 rounded-xl border border-zinc-700/50 bg-zinc-800/60 overflow-hidden">
      {citation.quote && (
        <div className="px-3 py-2 bg-zinc-800/80 border-b border-zinc-700/30">
          <p className="text-xs italic text-zinc-400 leading-relaxed">&ldquo;{citation.quote}&rdquo;</p>
        </div>
      )}
      <div className="px-3 py-2 flex items-start gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-zinc-700/50 flex items-center justify-center text-base flex-shrink-0">
          {typeIcon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-zinc-200 leading-snug">{source.title}</p>
          <p className="text-[10px] text-zinc-500 mt-0.5">{source.author}{source.year ? ` · ${source.year}` : ""}</p>
        </div>
      </div>
    </div>
  );
}

// ── Canvas Card (combines all three interaction models) ──

function CanvasCard({
  message,
  index,
  reactions,
  onToggleReaction,
  expandedClaimId,
  onToggleClaim,
  branches,
}: {
  message: Message;
  index: number;
  reactions: DiscourseReaction[];
  onToggleReaction: (messageId: string, type: DiscourseReaction["type"]) => void;
  expandedClaimId: string | null;
  onToggleClaim: (claimId: string) => void;
  branches: { text: string; action: string }[];
}) {
  const user = users[message.userId];
  const fork = message.forkId ? forks.find((f) => f.id === message.forkId) : undefined;
  const citedSources = message.citations
    .map((c) => ({ citation: c, source: sources.find((s) => s.id === c.sourceId)! }))
    .filter((c) => c.source);
  const messageClaims = getClaimsForMessage(message.id, claims);

  const forkBorderColor = fork ? fork.color.replace("border-", "border-l-") : "";

  return (
    <motion.div
      data-message-id={message.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 200, delay: index * 0.02 }}
      className={`mx-3 mb-2 rounded-2xl border border-zinc-800/80 bg-zinc-900/80 shadow-sm shadow-black/20 overflow-hidden select-text ${
        fork ? `border-l-[3px] ${forkBorderColor}` : ""
      }`}
    >
      {/* Claim chips at top */}
      {messageClaims.length > 0 && (
        <div className="px-3 pt-2.5 pb-1 flex flex-wrap gap-1">
          {messageClaims.map((claim) => (
            <ClaimChip
              key={claim.id}
              claim={claim}
              isExpanded={expandedClaimId === claim.id}
              onTap={() => onToggleClaim(claim.id)}
            />
          ))}
        </div>
      )}

      {/* Expanded claim detail */}
      <AnimatePresence>
        {expandedClaimId && messageClaims.some((c) => c.id === expandedClaimId) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden px-3 pb-1"
          >
            {(() => {
              const claim = messageClaims.find((c) => c.id === expandedClaimId);
              if (!claim) return null;
              const links = getLinksForClaim(claim.id, claimLinks);
              return (
                <div className="py-1.5 space-y-1">
                  <div className="flex gap-1">
                    {["Agree", "Challenge", "Branch"].map((a) => (
                      <button key={a} className="px-2 py-0.5 rounded text-[9px] bg-zinc-800 text-zinc-500 border border-zinc-700 hover:text-zinc-300 transition-colors">
                        {a}
                      </button>
                    ))}
                  </div>
                  {links.map((link) => {
                    const otherId = link.fromClaimId === claim.id ? link.toClaimId : link.fromClaimId;
                    const other = claims.find((c) => c.id === otherId);
                    const arrow = link.type === "supports" ? "↗" : link.type === "contradicts" ? "↯" : "↻";
                    const color = link.type === "supports" ? "text-green-500" : link.type === "contradicts" ? "text-red-500" : "text-blue-500";
                    return (
                      <p key={link.id} className={`text-[9px] ${color}`}>
                        {arrow} {other?.text}
                      </p>
                    );
                  })}
                </div>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Author row */}
      <div className="flex items-center gap-2.5 px-3 pt-2 pb-1">
        <div className={`w-7 h-7 rounded-full ${user.color} flex items-center justify-center text-[10px] font-bold text-white`}>
          {user.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold text-zinc-200">{user.name}</span>
          {fork && <span className="text-[10px] text-zinc-500 ml-2">in {fork.title}</span>}
        </div>
        <TempDot reactions={reactions} />
        <span className="text-[10px] text-zinc-600">{formatTime(message.timestamp)}</span>
      </div>

      {/* Content — highlight-to-branch enabled via select-text */}
      <div className="px-3 pb-2">
        <div className="text-[14px] leading-relaxed text-zinc-300 prose prose-invert prose-sm max-w-none prose-p:my-1 prose-blockquote:border-zinc-600 prose-strong:text-zinc-100">
          <Markdown>{message.content}</Markdown>
        </div>
        {citedSources.map(({ citation, source }) => (
          <RichCitationEmbed key={citation.id} citation={citation} source={source} />
        ))}
      </div>

      {/* Branch badges */}
      {branches.length > 0 && (
        <div className="px-3 pb-2 flex flex-wrap gap-1">
          {branches.map((b, i) => (
            <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20">
              ⑂ {b.text.slice(0, 25)}...
            </span>
          ))}
        </div>
      )}

      {/* Discourse reactions row */}
      <div className="px-3 pb-2">
        <CompactReactionBar
          reactions={reactions}
          onToggle={(type) => onToggleReaction(message.id, type)}
        />
      </div>
    </motion.div>
  );
}

// ── Mini-map ──

function MiniMap({
  flat,
  reactionsMap,
  onJump,
}: {
  flat: Message[];
  reactionsMap: Record<string, DiscourseReaction[]>;
  onJump: (messageId: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed bottom-20 right-3 z-30 w-12 bg-zinc-900/95 border border-zinc-800 rounded-xl shadow-2xl shadow-black/50 p-1.5 max-h-[50vh] overflow-hidden"
    >
      <div className="space-y-0.5">
        {flat.map((msg) => {
          const reactions = reactionsMap[msg.id] || [];
          const temp = computeThreadTemperature(reactions);
          const hue = Math.round((1 - temp) * 220);
          const isAJ = msg.userId === "aj";
          return (
            <button
              key={msg.id}
              onClick={() => onJump(msg.id)}
              className="block w-full rounded-sm hover:ring-1 hover:ring-zinc-600 transition-all"
              style={{
                height: "4px",
                backgroundColor: reactions.length > 0
                  ? `hsl(${hue}, 70%, 50%)`
                  : isAJ
                  ? "#3b82f6"
                  : "#a855f7",
                opacity: reactions.length > 0 ? 1 : 0.4,
              }}
            />
          );
        })}
      </div>
    </motion.div>
  );
}

// ── Debate Dashboard (pull-down) ──

function DebateDashboard({
  flat,
  reactionsMap,
  branchCount,
}: {
  flat: Message[];
  reactionsMap: Record<string, DiscourseReaction[]>;
  branchCount: number;
}) {
  const totalClaims = claims.length;
  const contestedClaims = claims.filter((c) => c.contested).length;

  // Aggregate tension score
  const allReactions = Object.values(reactionsMap).flat();
  const totalTension = allReactions.filter((r) => r.type === "tension").reduce((s, r) => s + r.count, 0);
  const totalAgreement = allReactions.filter((r) => r.type === "agreement").reduce((s, r) => s + r.count, 0);
  const tensionScore = totalTension + totalAgreement > 0
    ? Math.round((totalTension / (totalTension + totalAgreement)) * 100)
    : 50;

  const citedSourceCount = new Set(
    flat.flatMap((m) => m.citations.map((c) => c.sourceId))
  ).size;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden border-b border-zinc-800"
    >
      <div className="px-4 py-3 grid grid-cols-4 gap-2">
        {[
          { label: "Claims", value: `${totalClaims}`, sub: `${contestedClaims} contested`, color: "text-amber-400" },
          { label: "Branches", value: `${forks.length + branchCount}`, sub: `${branchCount} new`, color: "text-purple-400" },
          { label: "Tension", value: `${tensionScore}%`, sub: tensionScore > 50 ? "heated" : "calm", color: tensionScore > 50 ? "text-red-400" : "text-green-400" },
          { label: "Sources", value: `${citedSourceCount}/${sources.length}`, sub: "coverage", color: "text-blue-400" },
        ].map((stat) => (
          <div key={stat.label} className="text-center">
            <p className={`text-[16px] font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-[9px] text-zinc-500 font-mono uppercase">{stat.label}</p>
            <p className="text-[8px] text-zinc-600">{stat.sub}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ── Main Page ──

export default function V14Page() {
  const flat = useMemo(() => flattenChronological(messages), []);
  const [reactionsMap, setReactionsMap] = useState<Record<string, DiscourseReaction[]>>(defaultReactions);
  const [expandedClaimId, setExpandedClaimId] = useState<string | null>(null);
  const [toolbar, setToolbar] = useState<SelectionToolbar | null>(null);
  const [highlightBranches, setHighlightBranches] = useState<Record<string, { text: string; action: string }[]>>({});
  const [showDashboard, setShowDashboard] = useState(false);
  const [showMiniMap, setShowMiniMap] = useState(true);

  const branchCount = Object.values(highlightBranches).flat().length;

  const toggleReaction = (messageId: string, type: DiscourseReaction["type"]) => {
    setReactionsMap((prev) => {
      const existing = prev[messageId] || [];
      const idx = existing.findIndex((r) => r.type === type);
      let next: DiscourseReaction[];
      if (idx >= 0) {
        next = existing.map((r) => (r.type === type ? { ...r, count: r.count + 1 } : r));
      } else {
        next = [...existing, { type, count: 1 }];
      }
      return { ...prev, [messageId]: next };
    });
  };

  const handleSelectionChange = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.toString().trim()) return;
    const text = selection.toString().trim();
    if (text.length < 3) return;

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    let node: Node | null = range.startContainer;
    let messageId: string | null = null;
    while (node) {
      if (node instanceof HTMLElement && node.dataset.messageId) {
        messageId = node.dataset.messageId;
        break;
      }
      node = node.parentNode;
    }

    if (messageId) {
      setToolbar({ x: rect.left + rect.width / 2, y: rect.top, text, messageId });
    }
  }, []);

  useEffect(() => {
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => document.removeEventListener("selectionchange", handleSelectionChange);
  }, [handleSelectionChange]);

  const handleBranchAction = (action: string, text: string, messageId: string) => {
    setHighlightBranches((prev) => ({
      ...prev,
      [messageId]: [...(prev[messageId] || []), { text, action }],
    }));
    setToolbar(null);
    window.getSelection()?.removeAllRanges();
  };

  const jumpToMessage = (messageId: string) => {
    const el = document.querySelector(`[data-message-id="${messageId}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

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
            <p className="text-[11px] text-zinc-500">Dialectic Canvas</p>
          </div>
          <button
            onClick={() => setShowDashboard(!showDashboard)}
            className={`px-2 py-1 rounded-lg text-[10px] font-medium border transition-colors ${
              showDashboard
                ? "bg-purple-500/20 text-purple-400 border-purple-500/30"
                : "bg-zinc-800 text-zinc-400 border-zinc-700"
            }`}
          >
            📊 Dashboard
          </button>
          <button
            onClick={() => setShowMiniMap(!showMiniMap)}
            className={`px-2 py-1 rounded-lg text-[10px] font-medium border transition-colors ${
              showMiniMap
                ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                : "bg-zinc-800 text-zinc-400 border-zinc-700"
            }`}
          >
            🗺
          </button>
        </div>

        <AnimatePresence>
          {showDashboard && (
            <DebateDashboard flat={flat} reactionsMap={reactionsMap} branchCount={branchCount} />
          )}
        </AnimatePresence>
      </header>

      <main className="flex-1 overflow-y-auto pt-3 pb-20">
        {flat.map((msg, i) => (
          <CanvasCard
            key={msg.id}
            message={msg}
            index={i}
            reactions={reactionsMap[msg.id] || []}
            onToggleReaction={toggleReaction}
            expandedClaimId={expandedClaimId}
            onToggleClaim={(id) => setExpandedClaimId(expandedClaimId === id ? null : id)}
            branches={highlightBranches[msg.id] || []}
          />
        ))}
      </main>

      {/* Mini-map */}
      <AnimatePresence>
        {showMiniMap && (
          <MiniMap flat={flat} reactionsMap={reactionsMap} onJump={jumpToMessage} />
        )}
      </AnimatePresence>

      {/* Floating toolbar */}
      <AnimatePresence>
        {toolbar && (
          <FloatingToolbar
            toolbar={toolbar}
            onAction={handleBranchAction}
            onClose={() => setToolbar(null)}
          />
        )}
      </AnimatePresence>

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
