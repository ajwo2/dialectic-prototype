import { sql } from "@vercel/postgres";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: ghostId } = await params;

    await sql`
      UPDATE ghosts SET dismissed = true WHERE id = ${ghostId}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Ghost dismiss error:", error);
    return NextResponse.json({ error: "Failed to dismiss ghost" }, { status: 500 });
  }
}
