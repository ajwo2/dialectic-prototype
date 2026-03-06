import { sql } from "@vercel/postgres";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: threadId } = await params;
    const { id, content, authorId, replyToId } = await req.json();

    if (!content || !authorId) {
      return NextResponse.json({ error: "content and authorId required" }, { status: 400 });
    }

    const messageId = id || `tm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const role = authorId === "aj" ? "user" : "assistant";

    await sql`
      INSERT INTO messages (id, role, author_id, content, reply_to_id, thread_id, created_at)
      VALUES (${messageId}, ${role}, ${authorId}, ${content.trim()}, ${replyToId || null}, ${threadId}, now())
    `;

    return NextResponse.json({ id: messageId, success: true });
  } catch (error) {
    console.error("Thread message create error:", error);
    return NextResponse.json({ error: "Failed to create thread message" }, { status: 500 });
  }
}
