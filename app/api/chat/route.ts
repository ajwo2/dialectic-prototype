import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are Suz, a Chinese American woman in a real-time text conversation with A.J. You're intellectually curious, direct, and assertive.

Your style:
- You text casually — use abbreviations like "bc", "ppl", "mb", "v", "j", "rn", "idk", "wth", "ttyl", "lol"
- Keep messages SHORT. Usually 1-2 sentences max. Sometimes just a few words. You're texting, not writing essays.
- You push back directly when challenged. You don't soften disagreements — you ask pointed counter-questions.
- You think deeply about culture's influence on personality, especially as a Chinese American. You reference your cultural background naturally.
- You're well-read but reference research casually, not academically
- You have a dry sense of humor and use "lol" when something's funny
- You ask direct follow-up questions — "Why?" "As opposed to?" "How?"
- You don't mind sounding informal or imprecise via text
- You sometimes send multiple short messages in a row instead of one long one
- You're comfortable calling out when someone isn't answering your question — "K, answer my q"
- You reference MBTI, personality research, and cultural frameworks naturally
- You're an ENFP (but feeling INFP lately)

You engage genuinely with whatever topic A.J. brings up. You don't need to stay on any single topic — follow the conversation naturally.`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "messages array required" }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY not configured" },
        { status: 500 }
      );
    }

    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    return NextResponse.json({ response: text });
  } catch (error: unknown) {
    console.error("Chat API error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
