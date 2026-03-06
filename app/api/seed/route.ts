import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";

const SEED_MESSAGES = [
  { id: "s1", role: "assistant", author_id: "suz", content: "I kinda wanted to foster but yes. I was ready in my head. But overall relief." },
  { id: "s2", role: "user", author_id: "aj", content: "I admire your sense of conviction. It takes a lot to be that quick to accept responsibility like that, especially when you're under no obligation." },
  { id: "s3", role: "assistant", author_id: "suz", content: "My sense of responsibility is high. Mb bc of Chinese culture." },
  { id: "s4", role: "user", author_id: "aj", content: "Have you considered that you might be too quick to ascribe aspects of your personality to Chinese/Asian culture?" },
  { id: "s5", role: "assistant", author_id: "suz", content: "Ya" },
  { id: "s6", role: "user", author_id: "aj", content: "Do you know why you do that?" },
  { id: "s7", role: "assistant", author_id: "suz", content: "Bc it's the root cause. Culture has more influence on personality than ppl would like to believe." },
  { id: "s8", role: "user", author_id: "aj", content: "Do you think it's unhelpful?" },
  { id: "s9", role: "assistant", author_id: "suz", content: "As opposed to?" },
  { id: "s10", role: "user", author_id: "aj", content: "Yeah. Also, do you ever think the same about American culture's influence on you? You're not exactly wrong but to me it reads as reductive." },
  { id: "s11", role: "assistant", author_id: "suz", content: "Yes of course. I think it's bc I'm Chinese American that I think about culture." },
  { id: "s12", role: "user", author_id: "aj", content: "I notice Chinese/Asian American friends default to that explanation more than other bicultural friends. I wonder why that is." },
  { id: "s13", role: "user", author_id: "aj", content: "Also in your particular case, it seems that you consider personality traits rooted in culture as fixed — which results in less agency." },
  { id: "s14", role: "assistant", author_id: "suz", content: "I don't believe that. Culture is not fixed, society is. I'm p nuanced with thoughts, I also don't believe in positive thinking after reading more about the research findings." },
  { id: "s15", role: "user", author_id: "aj", content: "Hmmm, okay. Then maybe it's just the way that you express certain thoughts that seem less nuanced. Do you have an article or essay on positive thinking that I could read to understand your perspective better?" },
  { id: "s16", role: "assistant", author_id: "suz", content: "Well but isn't ascribing a sense of duty and responsibility to Asian culture, accurate? Western culture adapts individualism? It's not a judgement value. I think Americans can't think in nuance bc of the English language." },
  { id: "s17", role: "user", author_id: "aj", content: "Explain that last point?" },
  { id: "s18", role: "assistant", author_id: "suz", content: "But nothing I said was less nuanced than what you said." },
  { id: "s19", role: "user", author_id: "aj", content: "You're right." },
  { id: "s20", role: "assistant", author_id: "suz", content: "I'm saying my sense of responsibility comes from my Asian culture which you're saying is reductive. But then, where does personality come from then? If I'm reductive then what is your explanation that is not?" },
  { id: "s21", role: "user", author_id: "aj", content: "I didn't pose an explanation. I'd have to think about it more. My main point was more that you use that explanation frequently to explain why the way you are, and I was curious as to how you arrived at that conclusion. Generally, if someone gives me a simple, popular explanation for a complicated phenomenon, I'm skeptical — even if I don't have a better explanation." },
  { id: "s22", role: "assistant", author_id: "suz", content: "It's text lol. I ain't trying to be precise via text. I don't mind sounding dumb." },
  { id: "s23", role: "user", author_id: "aj", content: "I was also thinking of our conversation the other day about not speaking up — which was irl. And I think we had another conversation along these lines, though I'm forgetting the details." },
  { id: "s24", role: "assistant", author_id: "suz", content: "Yea, but why does someone need to hold multiple threads to their truth? I think it's fine that some truths fixate on a single source even if it's the sum of its parts." },
  { id: "s25", role: "user", author_id: "aj", content: "I don't think you should or shouldn't think a certain way. I respect the way you reason through things which is why I'm asking questions." },
  { id: "s26", role: "assistant", author_id: "suz", content: "It's not accurate to say it's the single source but it might hold the biggest influence." },
  { id: "s27", role: "user", author_id: "aj", content: "I hear you. I have a personal bias against explaining things with culture and also don't feel it's useful to my life — so that probably has something to do with my reluctance to accept that explanation." },
  { id: "s28", role: "user", author_id: "aj", content: "Remind me, have you spent much time in Asia?" },
  { id: "s29", role: "assistant", author_id: "suz", content: "Why do you have a bias? You're not seeing clearly when you discount or dismiss a big influence to personality. Culture is v helpful in understanding systems. I actually didn't realize it younger but I think it comes from more knowledge." },
  { id: "s30", role: "user", author_id: "aj", content: "Hmmm, I'm not saying that I think my reasoning is flawed. I'm pointing out an emotion that will make me more inclined to accept certain explanations over others. About to meet a friend for lunch, will expand later." },
  { id: "s31", role: "assistant", author_id: "suz", content: "But why does info have to serve you? What if it's j to understand people and the world? My friend is like that and I think she has a lot of blindspots on a macro level, but on the micro level, it's ok." },
  { id: "s32", role: "assistant", author_id: "suz", content: "lol idk how you meet so many ppl in a week" },
  { id: "s33", role: "user", author_id: "aj", content: "lol. I even had to cancel something today because I double booked." },
  { id: "s34", role: "assistant", author_id: "suz", content: "Who r u meeting? Wth. I'm an introvert compared to u." },
  { id: "s35", role: "user", author_id: "aj", content: "uhh missed my stop. ttyl" },
  { id: "s36", role: "assistant", author_id: "suz", content: "K, answer my q" },
  { id: "s37", role: "user", author_id: "aj", content: "I was meeting a former co-worker who also left Stepful — on better terms though, since he was the main driver behind all customer acquisition. He's like 3-4 years younger than me but just got a marketing director role at a YC startup. He's also just a cool guy with a lot of integrity and no nonsense. He's killing it." },
  { id: "s38", role: "user", author_id: "aj", content: "Aren't you an introvert though? As an INFP?" },
  { id: "s39", role: "assistant", author_id: "suz", content: "Enfp but infp rn." },
  { id: "s40", role: "assistant", author_id: "suz", content: "Integrity, how? That's good, not a lot of ppl have integrity." },
  { id: "s41", role: "user", author_id: "aj", content: "I think a lot of people at companies just look out for themselves and are willing to throw others under the bus if it means they can keep their job or get promoted. Also, some people need to put others down for them to shine. He's a strong performer but also looks out for others and will call people on their BS — instead of going behind peoples' backs." },
  { id: "s42", role: "user", author_id: "aj", content: "What does it mean for your MBTI to oscillate? Also, you ignored my question about how much time you've spent in Asia." },
  { id: "s43", role: "assistant", author_id: "suz", content: "Summer the longest, but that's not my point about culture. I think it's like the racism thing, you think it's a narrative and that actually extends into culture too." },
];

export async function POST() {
  try {
    // Check if already seeded
    const existing = await sql`SELECT COUNT(*) as count FROM messages WHERE id LIKE 's%'`;
    if (Number(existing.rows[0].count) >= 43) {
      return NextResponse.json({ message: "Already seeded", count: 43 });
    }

    // Insert seed messages with ordered timestamps
    const baseTime = new Date("2026-03-06T10:00:00Z");
    for (let i = 0; i < SEED_MESSAGES.length; i++) {
      const msg = SEED_MESSAGES[i];
      const createdAt = new Date(baseTime.getTime() + i * 60000); // 1 minute apart
      await sql`
        INSERT INTO messages (id, role, author_id, content, reply_to_id, thread_id, created_at)
        VALUES (${msg.id}, ${msg.role}, ${msg.author_id}, ${msg.content}, NULL, NULL, ${createdAt.toISOString()})
        ON CONFLICT (id) DO NOTHING
      `;
    }

    return NextResponse.json({ message: "Seeded successfully", count: SEED_MESSAGES.length });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: "Seed failed", details: String(error) }, { status: 500 });
  }
}
