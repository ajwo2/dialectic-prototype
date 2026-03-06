import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are an AI that detects potential branch points in intellectual conversations. Given the recent messages, suggest 1-2 unexplored directions, assumptions, or undefined terms.

Return ONLY a JSON array of objects with these fields:
- "suggestion": a short question or observation (max 60 chars)
- "category": one of "assumption", "undefined_term", "blind_spot", "logical_gap"

Example: [{"suggestion": "What about East Asian collectivism?", "category": "blind_spot"}]

Be concise. Only suggest genuinely interesting unexplored angles. If nothing stands out, return an empty array [].`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "messages array required" }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ ghosts: [] });
    }

    const client = new Anthropic({ apiKey });

    const conversationText = messages
      .slice(-4)
      .map((m: { role: string; content: string }) => `${m.role === "user" ? "A.J." : "Suz"}: ${m.content}`)
      .join("\n\n");

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 256,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: conversationText }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "[]";

    try {
      const ghosts = JSON.parse(text);
      return NextResponse.json({ ghosts: Array.isArray(ghosts) ? ghosts : [] });
    } catch {
      return NextResponse.json({ ghosts: [] });
    }
  } catch (error: unknown) {
    console.error("Ghost API error:", error);
    return NextResponse.json({ ghosts: [] });
  }
}
