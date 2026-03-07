"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { Reference, ReferenceResult } from "../hooks/useReferences";

const SENTIMENT_STYLES = {
  support: { icon: "✓", color: "text-emerald-400" },
  challenge: { icon: "⚡", color: "text-amber-400" },
  nuance: { icon: "~", color: "text-blue-400" },
};

export function ReferenceTray({
  result,
  onAttach,
  onDismiss,
}: {
  result: ReferenceResult | null;
  onAttach: (ref: Reference) => void;
  onDismiss: () => void;
}) {
  if (!result || result.references.length === 0) return null;

  const style = SENTIMENT_STYLES[result.sentiment] || SENTIMENT_STYLES.support;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="overflow-hidden"
      >
        <div className="px-3 pt-2 pb-1.5">
          {/* Verdict line */}
          <div className="flex items-center justify-between mb-1.5">
            <span className={`text-xs font-medium ${style.color}`}>
              {style.icon} {result.verdict}
            </span>
            <button
              onClick={onDismiss}
              className="text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors px-1"
            >
              ✕
            </button>
          </div>

          {/* Source pills */}
          <div className="flex flex-wrap gap-1.5">
            {result.references.map((ref) => (
              <button
                key={ref.id}
                onClick={() => onAttach(ref)}
                className="inline-flex items-center gap-1 rounded-full bg-zinc-800/70 border border-zinc-700/50 px-2.5 py-1 hover:border-blue-500/50 hover:bg-zinc-700/70 transition-colors active:scale-95"
              >
                <span className="text-[11px] text-blue-400">+</span>
                <span className="text-[11px] font-medium text-zinc-300">
                  {ref.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
