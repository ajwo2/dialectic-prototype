import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `Research assistant. Given a draft message, return 1-3 real citable sources as JSON. No markdown.
Verdict: casual 5-10 word gut-check. Argument: one pithy sentence (<25 words) on the key finding.
{"verdict":"...","sentiment":"support|challenge|nuance","references":[{"label":"Author, Year","title":"Full Title","url":"https://doi.org/...","argument":"pithy finding summary","type":"academic|book|essay|concept"}]}
If too vague: {"verdict":"","sentiment":"support","references":[]}`;

export async function POST(req: NextRequest) {
  try {
    const { draft, context } = await req.json();

    if (!draft || typeof draft !== "string" || draft.trim().length < 10) {
      return NextResponse.json({ references: [] });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY not configured" },
        { status: 500 }
      );
    }

    const client = new Anthropic({ apiKey });

    const ctx = Array.isArray(context)
      ? context.slice(-3).map((m: { role: string; content: string }) => `${m.role}: ${m.content}`).join("\n")
      : "";

    const userPrompt = ctx
      ? `Context:\n${ctx}\n\nDraft: "${draft.trim()}"`
      : `Draft: "${draft.trim()}"`;

    // Single retry on overload
    let response;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        response = await client.messages.create({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 300,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: userPrompt }],
        });
        break;
      } catch (err: unknown) {
        const isOverloaded = err instanceof Error && (err.message.includes("overloaded") || err.message.includes("529"));
        if (isOverloaded && attempt === 0) {
          await new Promise((r) => setTimeout(r, 800));
          continue;
        }
        throw err;
      }
    }

    if (!response) {
      return NextResponse.json({ references: [] });
    }

    let text =
      response.content[0].type === "text" ? response.content[0].text : "";

    text = text.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();

    try {
      const parsed = JSON.parse(text);
      return NextResponse.json(parsed);
    } catch {
      console.error("References API JSON parse error. Raw:", text.slice(0, 300));
      return NextResponse.json({ references: [] });
    }
  } catch (error: unknown) {
    console.error("References API error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ references: [], debug: message });
  }
}
