import { sql } from "@vercel/postgres";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: threadId } = await params;
    const { closed } = await req.json();

    if (typeof closed !== "boolean") {
      return NextResponse.json({ error: "closed (boolean) required" }, { status: 400 });
    }

    await sql`UPDATE threads SET closed = ${closed} WHERE id = ${threadId}`;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Thread close/reopen error:", error);
    return NextResponse.json({ error: "Failed to update thread" }, { status: 500 });
  }
}
