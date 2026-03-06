"use client";

import { motion } from "framer-motion";
import type { UserId } from "../hooks/useIdentity";

export function IdentityPicker({ onPick }: { onPick: (id: UserId) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 bg-zinc-950/98 flex items-center justify-center"
    >
      <div className="text-center space-y-8 px-6">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100 mb-2">
            Who are you?
          </h1>
          <p className="text-sm text-zinc-500">
            Pick your identity to start chatting
          </p>
        </div>

        <div className="flex gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onPick("aj")}
            className="flex flex-col items-center gap-3 px-8 py-6 rounded-2xl bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 transition-colors"
          >
            <div className="w-14 h-14 rounded-full bg-blue-500 flex items-center justify-center text-lg font-bold text-white">
              P1
            </div>
            <span className="text-base font-medium text-zinc-100">Player 1</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onPick("suz")}
            className="flex flex-col items-center gap-3 px-8 py-6 rounded-2xl bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/20 transition-colors"
          >
            <div className="w-14 h-14 rounded-full bg-purple-500 flex items-center justify-center text-lg font-bold text-white">
              P2
            </div>
            <span className="text-base font-medium text-zinc-100">Player 2</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
