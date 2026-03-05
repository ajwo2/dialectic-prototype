export interface User {
  id: string;
  name: string;
  avatar: string; // emoji or initials
  color: string; // tailwind color class
}

export interface Citation {
  id: string;
  sourceId: string;
  quote?: string; // optional pull-quote from the source
}

export interface Source {
  id: string;
  type: "link" | "book" | "paper" | "quote";
  title: string;
  author: string;
  url?: string;
  year?: number;
  description?: string;
  tags: string[];
}

export interface Message {
  id: string;
  parentId: string | null; // null = root-level message
  forkId?: string; // which fork this message belongs to
  userId: string;
  content: string; // markdown
  citations: Citation[];
  timestamp: string; // ISO string
}

export interface Fork {
  id: string;
  parentMessageId: string; // message this fork branches from
  title: string;
  color: string; // tailwind accent color
  description?: string;
}

export interface MessageNode extends Message {
  children: MessageNode[];
  depth: number;
}
