import { User, Source, Message, Fork } from "@/lib/types";

export const users: Record<string, User> = {
  aj: {
    id: "aj",
    name: "A.J.",
    avatar: "AJ",
    color: "bg-blue-500",
  },
  marcus: {
    id: "marcus",
    name: "Marcus",
    avatar: "MR",
    color: "bg-purple-500",
  },
};

export const sources: Source[] = [
  {
    id: "s1",
    type: "paper",
    title: "Universal Features of Personality Traits from the Observer's Perspective",
    author: "McCrae & Terracciano",
    year: 2005,
    url: "https://doi.org/10.1037/0022-3514.88.3.547",
    description:
      "Cross-cultural study of Big Five personality traits across 50 cultures, finding both universal structure and cultural variation in mean trait levels.",
    tags: ["Big Five", "cross-cultural", "personality"],
  },
  {
    id: "s2",
    type: "book",
    title: "Mind in Society: The Development of Higher Psychological Processes",
    author: "Lev Vygotsky",
    year: 1978,
    description:
      "Foundational text on sociocultural theory — argues that cognitive development is fundamentally shaped by social interaction and cultural tools.",
    tags: ["sociocultural theory", "development", "cognition"],
  },
  {
    id: "s3",
    type: "book",
    title: "The Ecology of Human Development",
    author: "Urie Bronfenbrenner",
    year: 1979,
    description:
      "Ecological systems theory — nested environmental systems (micro, meso, exo, macro, chrono) that shape human development.",
    tags: ["ecological systems", "development", "environment"],
  },
  {
    id: "s4",
    type: "link",
    title: "Culture and Cognitive Science",
    author: "Stanford Encyclopedia of Philosophy",
    url: "https://plato.stanford.edu/entries/culture-cogsci/",
    description:
      "Comprehensive overview of how culture interfaces with cognition, perception, and reasoning.",
    tags: ["philosophy", "cognition", "culture"],
  },
  {
    id: "s5",
    type: "paper",
    title: "Culture and the Self: Implications for Cognition, Emotion, and Motivation",
    author: "Markus & Kitayama",
    year: 1991,
    url: "https://doi.org/10.1037/0033-295X.98.2.224",
    description:
      "Landmark paper on independent vs. interdependent self-construals and how they shape psychological processes.",
    tags: ["self-construal", "individualism", "collectivism"],
  },
  {
    id: "s6",
    type: "paper",
    title: "Beyond Western, Educated, Industrial, Rich, and Democratic (WEIRD) Psychology",
    author: "Henrich, Heine & Norenzayan",
    year: 2010,
    url: "https://doi.org/10.1017/S0140525X0999152X",
    description:
      "Argues that most psychology research draws from WEIRD populations and may not generalize globally.",
    tags: ["WEIRD", "methodology", "generalizability"],
  },
  {
    id: "s7",
    type: "book",
    title: "The Geography of Thought",
    author: "Richard Nisbett",
    year: 2003,
    description:
      "How Asians and Westerners think differently — and why. Examines holistic vs. analytic cognitive styles.",
    tags: ["cognition", "East-West", "thinking styles"],
  },
  {
    id: "s8",
    type: "quote",
    title: "The fish doesn't know it's in water",
    author: "David Foster Wallace",
    description:
      "From 'This Is Water' — used as metaphor for how culture is invisible to those embedded in it.",
    tags: ["metaphor", "culture", "awareness"],
  },
];

export const forks: Fork[] = [
  {
    id: "f1",
    parentMessageId: "m4",
    title: "Individualism vs Collectivism",
    color: "border-amber-400",
    description: "Is this framework too simplistic?",
  },
  {
    id: "f2",
    parentMessageId: "m6",
    title: "Asia as a monolith",
    color: "border-rose-400",
    description: "The problem with treating 4.5 billion people as one category",
  },
  {
    id: "f3",
    parentMessageId: "m8",
    title: "Is culture 'real'?",
    color: "border-emerald-400",
    description: "Ontological status of culture as a causal force",
  },
];

export const messages: Message[] = [
  // ── Root thread: Culture & Personality ──
  {
    id: "m1",
    parentId: null,
    userId: "aj",
    content:
      "I've been thinking about how much personality is shaped by culture versus biology. The Big Five model claims to be universal, but the cross-cultural evidence is more nuanced than people realize.",
    citations: [{ id: "c1", sourceId: "s1" }],
    timestamp: "2025-03-01T10:00:00Z",
  },
  {
    id: "m2",
    parentId: "m1",
    userId: "marcus",
    content:
      'Agreed — McCrae & Terracciano found the *structure* of the Big Five is universal, but the **mean levels** vary massively across cultures. Like, neuroticism scores in Japan vs. the US are just wildly different.\n\nBut is that culture, or is it response style? Japanese respondents tend toward midpoint responses.',
    citations: [{ id: "c2", sourceId: "s1" }],
    timestamp: "2025-03-01T10:15:00Z",
  },
  {
    id: "m3",
    parentId: "m2",
    userId: "aj",
    content:
      "That's the methodological trap, right? You can't disentangle the cultural influence on the *trait itself* from the cultural influence on *how you report the trait*.\n\nVygotsky would say the tools we use to express personality — language, social norms — ARE the personality in a meaningful sense. You can't strip away the cultural layer and find some 'pure' trait underneath.",
    citations: [
      { id: "c3", sourceId: "s2", quote: "Every function in the child's cultural development appears twice: first, on the social level, and later, on the individual level" },
    ],
    timestamp: "2025-03-01T10:32:00Z",
  },
  {
    id: "m4",
    parentId: "m3",
    userId: "marcus",
    content:
      "Ok but that's a strong claim. Are you saying there's NO biological substrate to personality?\n\nI think the truth is somewhere in between — Bronfenbrenner's nested systems model makes more sense to me. Biology is the core, but it's wrapped in layers of family, community, culture, historical moment.",
    citations: [{ id: "c4", sourceId: "s3" }],
    timestamp: "2025-03-01T10:45:00Z",
  },
  {
    id: "m5",
    parentId: "m4",
    userId: "aj",
    content:
      "Not saying NO biology — just that the biology/culture split is a false binary. They're co-constitutive. Your genes influence which cultural niches you seek out, and your cultural environment literally shapes gene expression (epigenetics).\n\nThe interesting question isn't \"how much is nature vs. nurture\" — it's \"how do they interweave?\"",
    citations: [],
    timestamp: "2025-03-01T11:00:00Z",
  },
  {
    id: "m6",
    parentId: "m5",
    userId: "marcus",
    content:
      "Fair. But I want to push back on how carelessly people throw around \"collectivist cultures\" — as if all of East Asia thinks the same way. Japan, Korea, and China have VERY different social structures.\n\nThe Stanford Encyclopedia piece on this is actually really good.",
    citations: [{ id: "c5", sourceId: "s4" }],
    timestamp: "2025-03-01T11:20:00Z",
  },
  {
    id: "m7",
    parentId: "m6",
    userId: "aj",
    content:
      "100%. And it's not just cross-national — within China alone you have massive variation. Urban Shanghai vs. rural Guizhou might as well be different planets in terms of social norms.",
    citations: [],
    timestamp: "2025-03-01T11:35:00Z",
  },
  {
    id: "m8",
    parentId: "m7",
    userId: "marcus",
    content:
      "Which raises the meta-question: is \"culture\" even a coherent unit of analysis? Or is it just a convenient label we slap on a messy bundle of practices, beliefs, and institutions?\n\n> \"The fish doesn't know it's in water\"\n\nMaybe the fish also doesn't know what \"water\" actually is.",
    citations: [{ id: "c6", sourceId: "s8" }],
    timestamp: "2025-03-01T11:50:00Z",
  },
  {
    id: "m9",
    parentId: "m8",
    userId: "aj",
    content:
      "Ha — I love that extension of the metaphor. Yeah, I think \"culture\" as a reified thing is problematic. It's more like a process. An ongoing negotiation of meaning between people.\n\nBut even saying that — we still need *some* way to talk about shared patterns of behavior and meaning-making at the group level. Otherwise we're just left with 8 billion individuals and no generalizable knowledge.",
    citations: [],
    timestamp: "2025-03-01T12:05:00Z",
  },
  {
    id: "m10",
    parentId: "m9",
    userId: "marcus",
    content:
      "Yeah, the WEIRD paper really crystallized this for me. Most of what we \"know\" about psychology is really just what we know about Western undergrads. That's a massive blind spot.",
    citations: [{ id: "c7", sourceId: "s6" }],
    timestamp: "2025-03-01T12:20:00Z",
  },
  {
    id: "m11",
    parentId: "m10",
    userId: "aj",
    content:
      "And the irony is that the WEIRD paper itself was written by Western academics using Western frameworks to critique Western bias. The whole discourse is still happening inside the fishbowl.",
    citations: [],
    timestamp: "2025-03-01T12:35:00Z",
  },
  {
    id: "m12",
    parentId: "m11",
    userId: "marcus",
    content:
      "Turtles all the way down 🐢\n\nOk I think we've opened up at least three threads worth exploring deeper:\n1. The individualism/collectivism framework — is it useful or reductive?\n2. The \"Asia as monolith\" problem\n3. Whether culture is ontologically \"real\" or just a useful fiction\n\nShould we fork these out?",
    citations: [],
    timestamp: "2025-03-01T12:50:00Z",
  },

  // ── Fork 1: Individualism vs Collectivism ──
  {
    id: "m13",
    parentId: "m4",
    forkId: "f1",
    userId: "aj",
    content:
      "Starting this fork on the I/C dimension. Markus & Kitayama's 1991 paper is the landmark here — they argued for fundamentally different self-construals: **independent** (Western) vs. **interdependent** (East Asian).\n\nBut even they acknowledged it's a spectrum, not a binary.",
    citations: [
      {
        id: "c8",
        sourceId: "s5",
        quote: "People in different cultures have strikingly different construals of the self, of others, and of the interdependence of the two",
      },
    ],
    timestamp: "2025-03-01T13:00:00Z",
  },
  {
    id: "m14",
    parentId: "m13",
    forkId: "f1",
    userId: "marcus",
    content:
      "Right, and the spectrum point is key. Even within the US, you see huge variation — Southern honor culture, Black church communities, immigrant enclaves — all more \"collectivist\" than the stereotypical American rugged individualist.\n\nThe framework collapses when you zoom in.",
    citations: [],
    timestamp: "2025-03-01T13:15:00Z",
  },
  {
    id: "m15",
    parentId: "m14",
    forkId: "f1",
    userId: "aj",
    content:
      "So maybe the useful version isn't \"this culture IS collectivist\" but rather \"in this context, these people are drawing more on collectivist norms.\" It's a tool, not a label.",
    citations: [],
    timestamp: "2025-03-01T13:30:00Z",
  },
  {
    id: "m16",
    parentId: "m15",
    forkId: "f1",
    userId: "marcus",
    content:
      "I like that reframe. Context-dependent rather than essentialist. Like code-switching but for self-construal.\n\nThe WEIRD paper supports this too — they found that even within Western countries, working-class populations show more interdependent self-construals than middle-class ones.",
    citations: [{ id: "c9", sourceId: "s6" }],
    timestamp: "2025-03-01T13:45:00Z",
  },
  {
    id: "m17",
    parentId: "m16",
    forkId: "f1",
    userId: "aj",
    content:
      "Class as culture. That's a whole other rabbit hole. But yeah — the I/C framework is useful as a **lens**, dangerous as a **category**.",
    citations: [],
    timestamp: "2025-03-01T14:00:00Z",
  },

  // ── Sub-thread: Western bias in psychology ──
  {
    id: "m18",
    parentId: "m14",
    forkId: "f1",
    userId: "marcus",
    content:
      "Side thread: this connects to the broader problem of Western bias in psych. The entire field's methodological toolkit was developed in a WEIRD context. Factor analysis, self-report scales, lab experiments — all assume a particular kind of subject.",
    citations: [{ id: "c10", sourceId: "s6" }],
    timestamp: "2025-03-01T14:10:00Z",
  },
  {
    id: "m19",
    parentId: "m18",
    forkId: "f1",
    userId: "aj",
    content:
      "And even when researchers TRY to do cross-cultural work, they usually just translate a Western instrument and administer it in a new context. That's not cross-cultural psychology — that's just testing whether other people can answer your questions.",
    citations: [],
    timestamp: "2025-03-01T14:25:00Z",
  },
  {
    id: "m20",
    parentId: "m19",
    forkId: "f1",
    userId: "marcus",
    content:
      "\"Testing whether other people can answer your questions\" — that's a great way to put it. The construct validity problem is real. Does \"agreeableness\" even mean the same thing in a culture where social harmony is the default rather than a personality trait?",
    citations: [],
    timestamp: "2025-03-01T14:40:00Z",
  },

  // ── Fork 2: Asia as a monolith ──
  {
    id: "m21",
    parentId: "m6",
    forkId: "f2",
    userId: "marcus",
    content:
      "Let me elaborate on the \"Asia as monolith\" problem. Nisbett's *Geography of Thought* is fascinating but also guilty of this. He compares \"East\" vs. \"West\" as if these are two things.\n\nChina's Confucian hierarchy ≠ Japan's group harmony ≠ India's caste system ≠ Philippines' communal interdependence.",
    citations: [{ id: "c11", sourceId: "s7" }],
    timestamp: "2025-03-01T15:00:00Z",
  },
  {
    id: "m22",
    parentId: "m21",
    forkId: "f2",
    userId: "aj",
    content:
      "And even within Confucian cultures — Korean *jeong* (deep emotional bonding), Japanese *amae* (dependent love), and Chinese *guanxi* (relational networks) are genuinely different psychological constructs, not just different words for the same thing.",
    citations: [],
    timestamp: "2025-03-01T15:15:00Z",
  },
  {
    id: "m23",
    parentId: "m22",
    forkId: "f2",
    userId: "marcus",
    content:
      "This is where indigenous psychology becomes important. Instead of exporting Western constructs, you start from local concepts and build theory from there.\n\nThe challenge is: how do you then compare across cultures if everyone's using different constructs?",
    citations: [],
    timestamp: "2025-03-01T15:30:00Z",
  },
  {
    id: "m24",
    parentId: "m23",
    forkId: "f2",
    userId: "aj",
    content:
      "Maybe you don't. Maybe the obsession with cross-cultural comparison is itself a Western impulse — the need to taxonomize and rank everything.\n\nOr maybe you need a meta-framework that can hold multiple indigenous psychologies without reducing them to a common denominator.",
    citations: [{ id: "c12", sourceId: "s4" }],
    timestamp: "2025-03-01T15:45:00Z",
  },

  // ── Fork 3: Is culture 'real'? ──
  {
    id: "m25",
    parentId: "m8",
    forkId: "f3",
    userId: "aj",
    content:
      "Forking the ontology question. So: is culture a \"real\" thing that causes behavior, or is it an emergent pattern we observe after the fact?\n\nI lean toward: it's real in the way that a traffic jam is real. No individual car intends to create a traffic jam, but the jam has causal power — it makes you late, it raises your cortisol, it changes your route.",
    citations: [],
    timestamp: "2025-03-01T16:00:00Z",
  },
  {
    id: "m26",
    parentId: "m25",
    forkId: "f3",
    userId: "marcus",
    content:
      "That's a good analogy. Emergent but causally real. Like — \"American individualism\" isn't a thing in any individual American's brain, but it shapes institutions, policies, child-rearing practices, and through those, actual individual behavior.",
    citations: [],
    timestamp: "2025-03-01T16:15:00Z",
  },
  {
    id: "m27",
    parentId: "m26",
    forkId: "f3",
    userId: "aj",
    content:
      "Exactly. And this is where Bronfenbrenner is really useful — culture operates at the macrosystem level, but its effects cascade down through exo, meso, and micro systems until they're shaping face-to-face interactions.",
    citations: [
      {
        id: "c13",
        sourceId: "s3",
        quote: "The ecology of human development involves the scientific study of the progressive, mutual accommodation between an active, growing human being and the changing properties of the immediate settings in which the developing person lives",
      },
    ],
    timestamp: "2025-03-01T16:30:00Z",
  },
  {
    id: "m28",
    parentId: "m27",
    forkId: "f3",
    userId: "marcus",
    content:
      "So culture is real but not a \"thing\" — it's a set of nested processes. I can work with that.\n\nBut then here's the provocation: if culture is just processes, can it actually *explain* anything? Or is it just describing the same thing at a different level?",
    citations: [],
    timestamp: "2025-03-01T16:45:00Z",
  },
  {
    id: "m29",
    parentId: "m28",
    forkId: "f3",
    userId: "aj",
    content:
      "That's the reductionism question. And I think the answer is yes, it can explain — because emergent properties have genuine causal power that can't be reduced to lower levels.\n\nYou can't predict traffic jams from the physics of individual cars. You need the emergent level of analysis.",
    citations: [],
    timestamp: "2025-03-01T17:00:00Z",
  },
  {
    id: "m30",
    parentId: "m29",
    forkId: "f3",
    userId: "marcus",
    content:
      "Ok I'm mostly convinced. But I think we need to be precise about WHAT LEVEL of culture we're talking about. National culture? Ethnic culture? Professional culture? Internet subculture?\n\nEach one is a different kind of emergent process with different causal mechanisms.",
    citations: [],
    timestamp: "2025-03-01T17:15:00Z",
  },
  {
    id: "m31",
    parentId: "m30",
    forkId: "f3",
    userId: "aj",
    content:
      "Completely agree. And this is where the \"collection of narratives\" idea might help — culture isn't a single thing but a layered, sometimes contradictory set of stories that people tell themselves and each other about how to be a person.",
    citations: [],
    timestamp: "2025-03-01T17:30:00Z",
  },

  // ── Sub-thread: Collection of narratives ──
  {
    id: "m32",
    parentId: "m31",
    forkId: "f3",
    userId: "marcus",
    content:
      "\"Collection of narratives\" — I want to pull on this thread. So you're saying culture is basically shared storytelling? Not values, not practices, but *narratives*?",
    citations: [],
    timestamp: "2025-03-01T17:45:00Z",
  },
  {
    id: "m33",
    parentId: "m32",
    forkId: "f3",
    userId: "aj",
    content:
      "Narratives that encode values and generate practices. The story of the \"self-made man\" isn't just a story — it produces real behavior (entrepreneurship, resistance to social safety nets, specific parenting styles).\n\nCulture is narratives all the way down. And personality is how you inhabit those narratives — which ones you internalize, resist, remix.",
    citations: [],
    timestamp: "2025-03-01T18:00:00Z",
  },
];
