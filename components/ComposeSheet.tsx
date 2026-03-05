"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Markdown from "react-markdown";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  replyTo?: string;
}

export function ComposeSheet({ isOpen, onClose, replyTo }: Props) {
  const [content, setContent] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [showCiteForm, setShowCiteForm] = useState(false);

  const insertMarkdown = (prefix: string, suffix: string = "") => {
    const textarea = document.getElementById("compose-textarea") as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.substring(start, end);
    const newContent =
      content.substring(0, start) + prefix + selected + suffix + content.substring(end);
    setContent(newContent);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-900 border-t border-zinc-700 rounded-t-2xl max-h-[85vh] flex flex-col"
          >
            {/* Handle */}
            <div className="flex justify-center pt-2 pb-1">
              <div className="w-10 h-1 rounded-full bg-zinc-700" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800">
              <button onClick={onClose} className="text-sm text-zinc-500">
                Cancel
              </button>
              <span className="text-sm font-medium text-zinc-300">
                {replyTo ? "Reply" : "New Message"}
              </span>
              <button
                onClick={() => {
                  setContent("");
                  onClose();
                }}
                className="text-sm font-semibold text-blue-400"
              >
                Send
              </button>
            </div>

            {/* Formatting toolbar */}
            <div className="flex items-center gap-1 px-3 py-2 border-b border-zinc-800 overflow-x-auto">
              <ToolbarButton label="B" onClick={() => insertMarkdown("**", "**")} bold />
              <ToolbarButton label="I" onClick={() => insertMarkdown("*", "*")} italic />
              <ToolbarButton label=">" onClick={() => insertMarkdown("> ")} />
              <ToolbarButton label="Link" onClick={() => insertMarkdown("[", "](url)")} />
              <ToolbarButton label="Code" onClick={() => insertMarkdown("`", "`")} />
              <div className="w-px h-5 bg-zinc-700 mx-1" />
              <button
                onClick={() => setShowCiteForm(!showCiteForm)}
                className={`text-xs px-2.5 py-1.5 rounded-md transition-colors ${
                  showCiteForm
                    ? "bg-blue-900/50 text-blue-400"
                    : "text-zinc-400 hover:bg-zinc-800"
                }`}
              >
                + Cite
              </button>
              <button
                onClick={() => setShowPreview(!showPreview)}
                className={`text-xs px-2.5 py-1.5 rounded-md transition-colors ${
                  showPreview
                    ? "bg-blue-900/50 text-blue-400"
                    : "text-zinc-400 hover:bg-zinc-800"
                }`}
              >
                Preview
              </button>
            </div>

            {/* Citation form */}
            <AnimatePresence>
              {showCiteForm && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-b border-zinc-800 overflow-hidden"
                >
                  <div className="p-3 space-y-2">
                    <input
                      type="text"
                      placeholder="Source title or URL..."
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
                    />
                    <input
                      type="text"
                      placeholder="Author..."
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Pull quote (optional)..."
                        className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
                      />
                      <button
                        onClick={() => setShowCiteForm(false)}
                        className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-500"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Content area */}
            <div className="flex-1 overflow-y-auto">
              {showPreview ? (
                <div className="p-4 prose prose-invert prose-sm max-w-none text-zinc-300">
                  {content ? (
                    <Markdown>{content}</Markdown>
                  ) : (
                    <p className="text-zinc-600 italic">Nothing to preview</p>
                  )}
                </div>
              ) : (
                <textarea
                  id="compose-textarea"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your message... (Markdown supported)"
                  className="w-full h-48 bg-transparent px-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none resize-none"
                  autoFocus
                />
              )}
            </div>

            {/* Safe area spacer */}
            <div className="h-safe-area-inset-bottom" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function ToolbarButton({
  label,
  onClick,
  bold,
  italic,
}: {
  label: string;
  onClick: () => void;
  bold?: boolean;
  italic?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-xs px-2.5 py-1.5 rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors ${
        bold ? "font-bold" : ""
      } ${italic ? "italic" : ""}`}
    >
      {label}
    </button>
  );
}
