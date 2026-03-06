CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL,
  author_id TEXT NOT NULL,
  content TEXT NOT NULL,
  reply_to_id TEXT,
  thread_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS threads (
  id TEXT PRIMARY KEY,
  parent_message_id TEXT NOT NULL,
  parent_thread_id TEXT,
  highlighted_text TEXT NOT NULL,
  highlight_start INT NOT NULL,
  highlight_end INT NOT NULL,
  action TEXT NOT NULL,
  source_type TEXT DEFAULT 'highlight',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ghosts (
  id TEXT PRIMARY KEY,
  after_message_id TEXT NOT NULL,
  suggestion TEXT NOT NULL,
  category TEXT NOT NULL,
  dismissed BOOLEAN DEFAULT false
);
