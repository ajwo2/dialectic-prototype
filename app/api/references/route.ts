import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are a sharp, concise research assistant embedded in a messaging app. The user is composing a message in a debate. Your job is to give a quick gut-check on their point and suggest supporting or challenging sources.

Rules:
- Start with a short, casual verdict (5-10 words max). Examples:
  "Strong point — literature backs you up"
  "Solid, but there's a counterargument"
  "Actually, research says the opposite"
  "Good instinct — here's the evidence"
  "Hmm, this is more nuanced than it seems"
- Then suggest 1-3 REAL, citable sources. Only well-known, canonical works. Do NOT hallucinate.
- Each source needs:
  - "label": short author + year citation
  - "title": full title of the work
  - "url": a real URL — use Google Scholar, DOI links, or publisher URLs. Format DOIs as https://doi.org/... If you don't know the exact DOI, use a Google Scholar search URL like https://scholar.google.com/scholar?q=TITLE+AUTHOR
  - "argument": 1-2 sentences explaining specifically how this source supports, challenges, or adds nuance to the user's point. Write this in second person ("Your point about X is backed by..." or "This challenges your claim because...")
  - "type": academic|book|essay|concept

Respond with valid JSON only. No markdown, no code fences. Format:
{
  "verdict": "Short casual verdict here",
  "sentiment": "support|challenge|nuance",
  "references": [
    {
      "label": "Markus & Kitayama, 1991",
      "title": "Culture and the Self",
      "url": "https://doi.org/10.1037/0033-295X.98.2.224",
      "argument": "Your point about cultural flexibility is backed by their finding that self-construal shifts between independent and interdependent modes depending on context.",
      "type": "academic"
    }
  ]
}

If the draft is too short or vague, return: { "verdict": "", "sentiment": "support", "references": [] }`;

export async function POST(req: NextRequest) {
  try {
    const { draft, context } = await req.json();

    if (!draft || typeof draft !== "string" || draft.trim().length < 20) {
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

    const contextBlock = Array.isArray(context)
      ? context
          .slice(-4)
          .map((m: { role: string; content: string }) => `[${m.role}]: ${m.content}`)
          .join("\n")
      : "";

    const userPrompt = `Recent conversation:\n${contextBlock}\n\nThe user is currently drafting this message:\n"${draft.trim()}"\n\nSuggest 1-3 real, citable references that are relevant to the point they're making.`;

    // Retry up to 2 times on overloaded errors, fallback to Sonnet if Haiku stays down
    const models = ["claude-haiku-4-5-20251001", "claude-haiku-4-5-20251001", "claude-sonnet-4-5-20250514"];
    let response;
    for (let attempt = 0; attempt < models.length; attempt++) {
      try {
        response = await client.messages.create({
          model: models[attempt],
          max_tokens: 512,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: userPrompt }],
        });
        break;
      } catch (err: unknown) {
        const isOverloaded = err instanceof Error && (err.message.includes("overloaded") || err.message.includes("529"));
        if (isOverloaded && attempt < models.length - 1) {
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
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

    // Strip markdown code fences if present
    text = text.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();

    try {
      const parsed = JSON.parse(text);
      return NextResponse.json(parsed);
    } catch {
      console.error("References API JSON parse error. Raw:", text.slice(0, 500));
      return NextResponse.json({ references: [] });
    }
  } catch (error: unknown) {
    console.error("References API error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ references: [], debug: message });
  }
}
