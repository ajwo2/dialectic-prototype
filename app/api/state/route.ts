import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const [messagesResult, threadsResult, ghostsResult] = await Promise.all([
      sql`SELECT * FROM messages ORDER BY created_at ASC`,
      sql`SELECT * FROM threads ORDER BY created_at ASC`,
      sql`SELECT * FROM ghosts WHERE dismissed = false`,
    ]);

    return NextResponse.json({
      messages: messagesResult.rows,
      threads: threadsResult.rows,
      ghosts: ghostsResult.rows,
    });
  } catch (error) {
    console.error("State fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch state" }, { status: 500 });
  }
}
