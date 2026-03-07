import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const [messagesResult, threadsResult, ghostsResult, typingResult] = await Promise.all([
      sql`SELECT * FROM messages ORDER BY created_at ASC`,
      sql`SELECT * FROM threads ORDER BY created_at ASC`,
      sql`SELECT * FROM ghosts WHERE dismissed = false`,
      sql`SELECT user_id FROM typing_status WHERE updated_at > now() - interval '5 seconds'`,
    ]);

    return NextResponse.json({
      messages: messagesResult.rows,
      threads: threadsResult.rows,
      ghosts: ghostsResult.rows,
      typing: typingResult.rows.map((r) => r.user_id),
    });
  } catch (error) {
    console.error("State fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch state" }, { status: 500 });
  }
}
