import type { BranchThread } from "./types";

export const BUILD_VERSION = "v15.2.0";
export const BUILD_TIMESTAMP = "2026-03-06 14:38";

export const ACTION_HIGHLIGHT_COLORS: Record<BranchThread["action"], { bg: string; pill: string }> = {
  branch: {
    bg: "bg-amber-400/30 underline decoration-amber-400/60 decoration-2 underline-offset-2",
    pill: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  challenge: {
    bg: "bg-red-400/30 underline decoration-red-400/60 decoration-2 underline-offset-2",
    pill: "bg-red-500/10 text-red-400 border-red-500/20",
  },
  define: {
    bg: "bg-blue-300/30 underline decoration-blue-300/60 decoration-2 underline-offset-2",
    pill: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
  connect: {
    bg: "bg-green-400/30 underline decoration-green-400/60 decoration-2 underline-offset-2",
    pill: "bg-green-500/10 text-green-400 border-green-500/20",
  },
};

export const GHOST_CATEGORIES: Record<string, { emoji: string; label: string }> = {
  assumption: { emoji: "🔍", label: "Unexamined assumption" },
  undefined_term: { emoji: "📖", label: "Undefined term" },
  blind_spot: { emoji: "👁", label: "Cultural blind spot" },
  logical_gap: { emoji: "🔗", label: "Logical gap" },
};
