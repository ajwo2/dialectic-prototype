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
