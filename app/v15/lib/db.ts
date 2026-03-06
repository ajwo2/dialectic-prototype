import { sql } from "@vercel/postgres";

export { sql };

export interface DbMessage {
  id: string;
  role: string;
  author_id: string;
  content: string;
  reply_to_id: string | null;
  thread_id: string | null;
  created_at: string;
}

export interface DbThread {
  id: string;
  parent_message_id: string;
  parent_thread_id: string | null;
  highlighted_text: string;
  highlight_start: number;
  highlight_end: number;
  action: string;
  source_type: string;
  created_at: string;
}

export interface DbGhost {
  id: string;
  after_message_id: string;
  suggestion: string;
  category: string;
  dismissed: boolean;
}
