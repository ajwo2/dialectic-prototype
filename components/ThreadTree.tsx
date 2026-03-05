"use client";

import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageNode, Fork, Source } from "@/lib/types";
import { MessageBubble } from "./MessageBubble";
import { ThreadConnector } from "./ThreadConnector";
import { CollapseToggle } from "./CollapseToggle";
import { ForkHeader } from "./ForkHeader";
import { countMessages } from "@/lib/tree";

interface Props {
  nodes: MessageNode[];
  forks: Fork[];
  sources: Source[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  parentForkId?: string;
}

export function ThreadTree({ nodes, forks, sources, selectedId, onSelect, parentForkId }: Props) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggleCollapse = useCallback((id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  return (
    <div>
      {nodes.map((node, index) => {
        const isCollapsed = collapsed.has(node.id);
        const hasChildren = node.children.length > 0;
        const isLast = index === nodes.length - 1;

        // Check if this message starts a new fork
        const nodeFork = node.forkId ? forks.find((f) => f.id === node.forkId) : undefined;
        const isNewFork = nodeFork && nodeFork.id !== parentForkId;

        // Separate children into same-fork replies and fork children
        const directReplies = node.children.filter((c) => !c.forkId || c.forkId === node.forkId);
        const forkChildren = node.children.filter((c) => c.forkId && c.forkId !== node.forkId);

        // Group fork children by fork
        const forkGroups = new Map<string, MessageNode[]>();
        for (const child of forkChildren) {
          const existing = forkGroups.get(child.forkId!) || [];
          existing.push(child);
          forkGroups.set(child.forkId!, existing);
        }

        return (
          <div key={node.id}>
            {/* Fork header if entering a new fork */}
            {isNewFork && (
              <div style={{ paddingLeft: node.depth * 20 }}>
                <ForkHeader
                  fork={nodeFork}
                  messageCount={countMessages([node])}
                />
              </div>
            )}

            {/* Message with connector */}
            <div className="relative">
              <ThreadConnector depth={node.depth} hasChildren={hasChildren} isLast={isLast} />
              <div style={{ paddingLeft: node.depth * 20 }}>
                <MessageBubble
                  node={node}
                  forks={forks}
                  sources={sources}
                  isSelected={selectedId === node.id}
                  onSelect={onSelect}
                />

                {/* Collapse toggle */}
                {hasChildren && (
                  <div className="px-4 pb-1">
                    <CollapseToggle
                      isCollapsed={isCollapsed}
                      onToggle={() => toggleCollapse(node.id)}
                      childCount={countMessages(node.children)}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Direct reply children */}
            <AnimatePresence>
              {!isCollapsed && directReplies.length > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <ThreadTree
                    nodes={directReplies}
                    forks={forks}
                    sources={sources}
                    selectedId={selectedId}
                    onSelect={onSelect}
                    parentForkId={node.forkId}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Fork branches */}
            <AnimatePresence>
              {!isCollapsed &&
                Array.from(forkGroups.entries()).map(([forkId, children]) => (
                  <motion.div
                    key={forkId}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <ThreadTree
                      nodes={children}
                      forks={forks}
                      sources={sources}
                      selectedId={selectedId}
                      onSelect={onSelect}
                      parentForkId={forkId}
                    />
                  </motion.div>
                ))}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
