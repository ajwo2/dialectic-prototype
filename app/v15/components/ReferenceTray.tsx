"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { Reference, ReferenceResult } from "../hooks/useReferences";

const SENTIMENT_STYLES = {
  support: { icon: "\u2713", color: "text-emerald-400" },
  challenge: { icon: "\u26A1", color: "text-amber-400" },
  nuance: { icon: "~", color: "text-blue-400" },
};

function SkeletonCard() {
  return (
    <div className="rounded-xl bg-zinc-800/60 border border-zinc-700/40 px-3 py-2.5 animate-pulse">
      <div className="h-3 w-3/4 bg-zinc-700/60 rounded mb-2" />
      <div className="h-2.5 w-1/2 bg-zinc-700/40 rounded" />
    </div>
  );
}

export function ReferenceTray({
  result,
  loading,
  onAttach,
  onDismiss,
}: {
  result: ReferenceResult | null;
  loading: boolean;
  onAttach: (ref: Reference) => void;
  onDismiss: () => void;
}) {
  const show = loading || (result && result.references.length > 0);
  if (!show) return null;

  const style = result ? (SENTIMENT_STYLES[result.sentiment] || SENTIMENT_STYLES.support) : null;

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
          <div className="flex items-center justify-between mb-2">
            {loading && !result ? (
              <div className="h-3 w-48 bg-zinc-700/50 rounded animate-pulse" />
            ) : result && style ? (
              <span className={`text-xs font-medium ${style.color}`}>
                {style.icon} {result.verdict}
              </span>
            ) : null}
            <button
              onClick={onDismiss}
              className="text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors px-1"
            >
              {"\u2715"}
            </button>
          </div>

          {/* Reference cards */}
          <div className="flex flex-col gap-1.5">
            {loading && !result ? (
              <>
                <SkeletonCard />
                <SkeletonCard />
              </>
            ) : (
              result?.references.map((ref) => (
                <button
                  key={ref.id}
                  onClick={() => onAttach(ref)}
                  className="w-full text-left rounded-xl bg-zinc-800/60 border border-zinc-700/40 px-3 py-2 hover:border-blue-500/40 hover:bg-zinc-800/80 transition-colors active:scale-[0.98]"
                >
                  <p className="text-[12px] leading-snug text-zinc-300">
                    {ref.argument.length > 160
                      ? ref.argument.slice(0, 157) + "..."
                      : ref.argument}
                    {" "}
                    <span className="text-zinc-500">&mdash; {ref.label}</span>
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[10px] text-blue-400">+ attach</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
