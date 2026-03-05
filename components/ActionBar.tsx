"use client";

import { motion } from "framer-motion";

interface Props {
  onReply: () => void;
  onFork: () => void;
  onCite: () => void;
  onSummarize: () => void;
  onClose: () => void;
}

export function ActionBar({ onReply, onFork, onCite, onSummarize, onClose }: Props) {
  const actions = [
    { label: "Reply", icon: "↩", action: onReply },
    { label: "Fork", icon: "⑂", action: onFork },
    { label: "Cite", icon: "📎", action: onCite },
    { label: "Summarize", icon: "✨", action: onSummarize },
  ];

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 20, opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed bottom-20 left-4 right-4 z-40"
    >
      <div className="bg-zinc-800 border border-zinc-700 rounded-xl shadow-2xl shadow-black/50 p-2 flex gap-1">
        {actions.map((a) => (
          <button
            key={a.label}
            onClick={(e) => {
              e.stopPropagation();
              a.action();
            }}
            className="flex-1 flex flex-col items-center gap-1 py-2 px-3 rounded-lg hover:bg-zinc-700 active:bg-zinc-600 transition-colors"
          >
            <span className="text-lg">{a.icon}</span>
            <span className="text-xs text-zinc-400">{a.label}</span>
          </button>
        ))}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="flex flex-col items-center justify-center px-3 rounded-lg hover:bg-zinc-700 active:bg-zinc-600 transition-colors"
        >
          <span className="text-xs text-zinc-500">✕</span>
        </button>
      </div>
    </motion.div>
  );
}
