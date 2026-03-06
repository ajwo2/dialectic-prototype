import { sql } from "@vercel/postgres";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { id, content, authorId, replyToId, threadId } = await req.json();

    if (!content || !authorId) {
      return NextResponse.json({ error: "content and authorId required" }, { status: 400 });
    }

    const messageId = id || `m-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const role = authorId === "aj" ? "user" : "assistant";

    await sql`
      INSERT INTO messages (id, role, author_id, content, reply_to_id, thread_id, created_at)
      VALUES (${messageId}, ${role}, ${authorId}, ${content.trim()}, ${replyToId || null}, ${threadId || null}, now())
    `;

    return NextResponse.json({ id: messageId, success: true });
  } catch (error) {
    console.error("Message create error:", error);
    return NextResponse.json({ error: "Failed to create message" }, { status: 500 });
  }
}
