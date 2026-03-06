"use client";

import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import type { BranchThread, SelectionToolbar } from "../lib/types";

export function FloatingToolbar({
  toolbar,
  onAction,
  onClose,
}: {
  toolbar: SelectionToolbar;
  onAction: (action: BranchThread["action"], text: string, messageId: string, highlightStart: number, highlightEnd: number) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  const actions: { key: BranchThread["action"]; label: string; icon: string }[] = [
    { key: "branch", label: "Branch", icon: "⑂" },
    { key: "challenge", label: "Challenge", icon: "⚔️" },
    { key: "define", label: "Define", icon: "📖" },
    { key: "connect", label: "Connect", icon: "🔗" },
  ];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.95 }}
      className="fixed z-50 flex gap-0.5 bg-zinc-800 border border-zinc-700 rounded-xl shadow-2xl shadow-black/50 p-1"
      style={{
        left: Math.max(8, Math.min(toolbar.x - 120, typeof window !== "undefined" ? window.innerWidth - 280 : 200)),
        top: Math.max(8, toolbar.y - 48),
      }}
    >
      {actions.map((a) => (
        <button
          key={a.key}
          onClick={() => onAction(a.key, toolbar.text, toolbar.messageId, toolbar.highlightStart, toolbar.highlightEnd)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 transition-colors"
        >
          <span>{a.icon}</span>
          <span>{a.label}</span>
        </button>
      ))}
    </motion.div>
  );
}
