export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  authorId: string;
  content: string;
  timestamp: string;
  replyToId?: string;
  threadId?: string | null;
}

export interface GhostBranch {
  id: string;
  afterMessageId: string;
  suggestion: string;
  category: "assumption" | "undefined_term" | "blind_spot" | "logical_gap";
}

export interface BranchThread {
  id: string;
  parentMessageId: string;
  parentThreadId: string | null;
  highlightedText: string;
  highlightStart: number;
  highlightEnd: number;
  action: "branch" | "challenge" | "define" | "connect";
  messages: ChatMessage[];
  isCollapsed: boolean;
  sourceType: "highlight" | "ghost";
  createdAt: string;
}

export interface SelectionToolbar {
  x: number;
  y: number;
  text: string;
  messageId: string;
  threadId: string | null;
  highlightStart: number;
  highlightEnd: number;
}

export interface HighlightRange {
  start: number;
  end: number;
  color: string;
}
