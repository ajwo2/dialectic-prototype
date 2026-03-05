import { Message, MessageNode } from "./types";

export function buildTree(messages: Message[]): MessageNode[] {
  const nodeMap = new Map<string, MessageNode>();
  const roots: MessageNode[] = [];

  // Create nodes
  for (const msg of messages) {
    nodeMap.set(msg.id, { ...msg, children: [], depth: 0 });
  }

  // Build tree
  for (const node of nodeMap.values()) {
    if (node.parentId === null) {
      roots.push(node);
    } else {
      const parent = nodeMap.get(node.parentId);
      if (parent) {
        node.depth = parent.depth + 1;
        parent.children.push(node);
      }
    }
  }

  // Sort children by timestamp
  function sortChildren(node: MessageNode) {
    node.children.sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    node.children.forEach(sortChildren);
  }
  roots.forEach(sortChildren);

  return roots;
}

export function countMessages(nodes: MessageNode[]): number {
  let count = 0;
  for (const node of nodes) {
    count += 1 + countMessages(node.children);
  }
  return count;
}

export function flattenTree(nodes: MessageNode[]): MessageNode[] {
  const result: MessageNode[] = [];
  function walk(node: MessageNode) {
    result.push(node);
    node.children.forEach(walk);
  }
  nodes.forEach(walk);
  return result;
}

/** Flatten messages chronologically — useful for flat chat views */
export function flattenChronological(messages: Message[]): Message[] {
  return [...messages].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
}

/** Get the parent message for a given message */
export function getParentMessage(
  messageId: string | null,
  messages: Message[]
): Message | undefined {
  if (!messageId) return undefined;
  return messages.find((m) => m.id === messageId);
}

/** Group messages by day for day dividers */
export function groupByDay(messages: Message[]): Map<string, Message[]> {
  const groups = new Map<string, Message[]>();
  for (const msg of messages) {
    const day = new Date(msg.timestamp).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
    });
    const existing = groups.get(day) || [];
    existing.push(msg);
    groups.set(day, existing);
  }
  return groups;
}

/** Get root thread messages (no forkId) in chronological order */
export function getRootThread(messages: Message[]): Message[] {
  return messages
    .filter((m) => !m.forkId)
    .sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
}

/** Get messages for a specific fork in chronological order */
export function getForkMessages(messages: Message[], forkId: string): Message[] {
  return messages
    .filter((m) => m.forkId === forkId)
    .sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
}
