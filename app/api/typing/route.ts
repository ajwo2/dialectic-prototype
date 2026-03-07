import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    await sql`
      INSERT INTO typing_status (user_id, updated_at)
      VALUES (${userId}, now())
      ON CONFLICT (user_id) DO UPDATE SET updated_at = now()
    `;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Typing status error:", error);
    return NextResponse.json({ error: "Failed to update typing status" }, { status: 500 });
  }
}
