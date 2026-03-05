"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const prototypes = [
  {
    id: "v1",
    name: "Pure iMessage",
    color: "from-blue-500/20 to-blue-600/10",
    accent: "bg-blue-500",
    hypothesis:
      "The closer to stock iMessage, the more immediately intuitive the UX.",
    features: ["Left/right bubbles", "Bubble tails", "Read receipts", "Day dividers"],
    emoji: "💬",
  },
  {
    id: "v2",
    name: "iMessage + Branching",
    color: "from-indigo-500/20 to-indigo-600/10",
    accent: "bg-indigo-500",
    hypothesis:
      "iMessage bubbles + explicit visual branching gives the best of both worlds.",
    features: ["iMessage bubbles", "Fork dividers", "Collapsible forks", "Quote replies"],
    emoji: "🌿",
  },
  {
    id: "v3",
    name: "Signal / Telegram",
    color: "from-purple-500/20 to-purple-600/10",
    accent: "bg-purple-500",
    hypothesis:
      "A denser, more utilitarian layout lets you see more of the debate.",
    features: ["Color bands", "Tight spacing", "Emoji reactions", "Context menu"],
    emoji: "⚡",
  },
  {
    id: "v4",
    name: "Conversation Cards",
    color: "from-amber-500/20 to-amber-600/10",
    accent: "bg-amber-500",
    hypothesis:
      "Treating each message as a card gives more room for rich content.",
    features: ["Full-width cards", "Rich embeds", "Always-visible actions", "Spring animations"],
    emoji: "🃏",
  },
  {
    id: "v5",
    name: "Split Screen Debate",
    color: "from-emerald-500/20 to-emerald-600/10",
    accent: "bg-emerald-500",
    hypothesis:
      "A side-by-side layout makes the back-and-forth visceral.",
    features: ["Split columns", "Connector lines", "Footnote citations", "Time-aligned"],
    emoji: "⚔️",
  },
  {
    id: "v6",
    name: "WhatsApp + Threads",
    color: "from-green-500/20 to-green-600/10",
    accent: "bg-green-500",
    hypothesis:
      "WhatsApp's UX is the global standard — optimize for familiarity.",
    features: ["Green/white bubbles", "Swipe-to-reply", "Thread navigation", "Typing indicator"],
    emoji: "📱",
  },
  {
    id: "v7",
    name: "Discord Channel",
    color: "from-violet-500/20 to-violet-600/10",
    accent: "bg-violet-500",
    hypothesis:
      "Discord's dense, server-like layout is built for group discussion.",
    features: ["Dark theme", "No bubbles", "Emoji counts", "Channel sections"],
    emoji: "🎮",
  },
  {
    id: "v8",
    name: "Minimal / Arc",
    color: "from-zinc-400/20 to-zinc-500/10",
    accent: "bg-zinc-400",
    hypothesis:
      "Extreme minimalism focuses attention on the arguments themselves.",
    features: ["No avatars", "Serif typography", "Footnote links", "Scroll progress"],
    emoji: "✦",
  },
];

export default function GalleryPage() {
  return (
    <div className="min-h-dvh pb-8">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-zinc-950/95 backdrop-blur border-b border-zinc-800">
        <div className="px-4 py-4">
          <h1 className="text-xl font-bold text-zinc-100">Dialectic Prototypes</h1>
          <p className="text-xs text-zinc-500 mt-1">
            8 messaging UX variants &middot; Same data, different presentations
          </p>
        </div>
      </header>

      {/* Grid */}
      <div className="px-4 py-4 space-y-3">
        {prototypes.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, type: "spring", damping: 25, stiffness: 200 }}
          >
            <Link href={`/${p.id}`}>
              <div
                className={`relative overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-br ${p.color} p-4 active:scale-[0.98] transition-transform`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl mt-0.5">{p.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-2 h-2 rounded-full ${p.accent}`} />
                      <span className="text-xs font-mono text-zinc-500 uppercase">
                        {p.id}
                      </span>
                    </div>
                    <h2 className="text-base font-semibold text-zinc-100 mb-1">
                      {p.name}
                    </h2>
                    <p className="text-xs text-zinc-400 leading-relaxed mb-2">
                      {p.hypothesis}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {p.features.map((f) => (
                        <span
                          key={f}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800/80 text-zinc-400 border border-zinc-700/50"
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                  <svg
                    className="w-5 h-5 text-zinc-600 flex-shrink-0 mt-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-4 text-center">
        <p className="text-xs text-zinc-600">
          33 messages &middot; 3 forks &middot; 8 sources
        </p>
        <p className="text-xs text-zinc-700 mt-1">
          All prototypes share the same mock debate data
        </p>
      </div>
    </div>
  );
}
