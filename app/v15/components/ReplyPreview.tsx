"use client";

import { motion } from "framer-motion";
import type { ChatMessage } from "../lib/types";

export function ReplyPreview({
  message,
  onDismiss,
}: {
  message: ChatMessage;
  onDismiss: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="border-l-2 border-blue-500 bg-zinc-800/80 mx-3 mb-1 px-3 py-2 rounded-lg flex items-start justify-between gap-2"
    >
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold text-blue-400 mb-0.5">
          {message.authorId === "aj" ? "A.J." : "Suz"}
        </p>
        <p className="text-[12px] text-zinc-400 truncate">{message.content}</p>
      </div>
      <button
        onClick={onDismiss}
        className="text-zinc-500 hover:text-zinc-300 text-[14px] mt-0.5 flex-shrink-0"
      >
        ×
      </button>
    </motion.div>
  );
}
