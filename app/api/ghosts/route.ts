import { sql } from "@vercel/postgres";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { id, afterMessageId, suggestion, category } = await req.json();

    if (!id || !afterMessageId || !suggestion || !category) {
      return NextResponse.json({ error: "All fields required" }, { status: 400 });
    }

    await sql`
      INSERT INTO ghosts (id, after_message_id, suggestion, category, dismissed)
      VALUES (${id}, ${afterMessageId}, ${suggestion}, ${category}, false)
      ON CONFLICT (id) DO NOTHING
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Ghost persist error:", error);
    return NextResponse.json({ error: "Failed to persist ghost" }, { status: 500 });
  }
}
