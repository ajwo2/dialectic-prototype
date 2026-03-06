import { sql } from "@vercel/postgres";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { id, parentMessageId, parentThreadId, highlightedText, highlightStart, highlightEnd, action, sourceType } = await req.json();

    if (!parentMessageId || !highlightedText || !action) {
      return NextResponse.json({ error: "parentMessageId, highlightedText, and action required" }, { status: 400 });
    }

    const threadId = id || `bt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    await sql`
      INSERT INTO threads (id, parent_message_id, parent_thread_id, highlighted_text, highlight_start, highlight_end, action, source_type, created_at)
      VALUES (${threadId}, ${parentMessageId}, ${parentThreadId || null}, ${highlightedText}, ${highlightStart ?? 0}, ${highlightEnd ?? 0}, ${action}, ${sourceType || "highlight"}, now())
    `;

    return NextResponse.json({ id: threadId, success: true });
  } catch (error) {
    console.error("Thread create error:", error);
    return NextResponse.json({ error: "Failed to create thread" }, { status: 500 });
  }
}
