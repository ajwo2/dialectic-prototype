import { Claim, ClaimLink, GhostBranch, DiscourseReaction } from "@/lib/types";

// Re-export everything from mockDebate for convenience
export { users, sources, messages, forks } from "./mockDebate";

// ── Claims extracted from messages ──

export const claims: Claim[] = [
  { id: "c1", messageId: "m1", text: "The Big Five model claims to be universal", contested: true },
  { id: "c2", messageId: "m2", text: "Neuroticism scores vary massively across cultures", contested: false },
  { id: "c3", messageId: "m2", text: "Japanese respondents tend toward midpoint responses", contested: false },
  { id: "c4", messageId: "m3", text: "You can't strip away the cultural layer to find a pure trait", contested: true },
  { id: "c5", messageId: "m3", text: "The tools we use to express personality ARE the personality", contested: true },
  { id: "c6", messageId: "m4", text: "Biology is the core, wrapped in layers of environment", contested: true },
  { id: "c7", messageId: "m5", text: "Biology and culture are co-constitutive", contested: false },
  { id: "c8", messageId: "m5", text: "Cultural environment shapes gene expression", contested: false },
  { id: "c9", messageId: "m6", text: "People carelessly lump East Asia as one culture", contested: false },
  { id: "c10", messageId: "m8", text: "Culture may not be a coherent unit of analysis", contested: true },
  { id: "c11", messageId: "m9", text: "Culture is a process, not a thing", contested: true },
  { id: "c12", messageId: "m10", text: "Most psychology knowledge is only about Western undergrads", contested: false },
  { id: "c13", messageId: "m13", text: "Independent vs interdependent self-construals differ fundamentally", contested: true },
  { id: "c14", messageId: "m14", text: "The I/C framework collapses when you zoom in", contested: true },
  { id: "c15", messageId: "m25", text: "Culture is real like a traffic jam is real", contested: true },
];

// ── Claim connections ──

export const claimLinks: ClaimLink[] = [
  { id: "cl1", fromClaimId: "c4", toClaimId: "c6", type: "contradicts" },
  { id: "cl2", fromClaimId: "c5", toClaimId: "c7", type: "supports" },
  { id: "cl3", fromClaimId: "c1", toClaimId: "c12", type: "contradicts" },
  { id: "cl4", fromClaimId: "c10", toClaimId: "c11", type: "refines" },
  { id: "cl5", fromClaimId: "c13", toClaimId: "c14", type: "contradicts" },
  { id: "cl6", fromClaimId: "c9", toClaimId: "c14", type: "supports" },
];

// ── Ghost branches (AI-suggested unexplored directions) ──

export const ghostBranches: GhostBranch[] = [
  {
    id: "g1",
    afterMessageId: "m2",
    suggestion: "What about East Asian collectivism?",
    category: "blind_spot",
  },
  {
    id: "g2",
    afterMessageId: "m3",
    suggestion: "Define 'personality' here",
    category: "undefined_term",
  },
  {
    id: "g3",
    afterMessageId: "m5",
    suggestion: "Is epigenetics well-established enough to cite here?",
    category: "assumption",
  },
  {
    id: "g4",
    afterMessageId: "m7",
    suggestion: "Urban/rural divide exists in every country, not just China",
    category: "blind_spot",
  },
  {
    id: "g5",
    afterMessageId: "m9",
    suggestion: "Can you have generalizable knowledge without reification?",
    category: "logical_gap",
  },
  {
    id: "g6",
    afterMessageId: "m11",
    suggestion: "What would a non-Western critique of WEIRD look like?",
    category: "blind_spot",
  },
  {
    id: "g7",
    afterMessageId: "m14",
    suggestion: "Define 'collectivist' — who decides the boundary?",
    category: "undefined_term",
  },
  {
    id: "g8",
    afterMessageId: "m28",
    suggestion: "Process vs thing is a false binary too",
    category: "logical_gap",
  },
];

// ── Default discourse reactions per message ──

export const defaultReactions: Record<string, DiscourseReaction[]> = {
  m1: [
    { type: "key_point", count: 2 },
    { type: "agreement", count: 1 },
  ],
  m2: [
    { type: "evidence", count: 1 },
    { type: "tension", count: 1 },
  ],
  m3: [
    { type: "key_point", count: 3 },
    { type: "tension", count: 2 },
    { type: "reframe", count: 1 },
  ],
  m4: [
    { type: "tension", count: 3 },
    { type: "evidence", count: 1 },
  ],
  m5: [
    { type: "reframe", count: 2 },
    { type: "agreement", count: 2 },
  ],
  m6: [
    { type: "key_point", count: 1 },
    { type: "tension", count: 1 },
  ],
  m7: [
    { type: "agreement", count: 3 },
  ],
  m8: [
    { type: "key_point", count: 2 },
    { type: "reframe", count: 2 },
    { type: "tension", count: 1 },
  ],
  m9: [
    { type: "agreement", count: 2 },
    { type: "tangent", count: 1 },
  ],
  m10: [
    { type: "key_point", count: 2 },
    { type: "evidence", count: 2 },
  ],
  m11: [
    { type: "tension", count: 2 },
    { type: "reframe", count: 1 },
  ],
  m12: [
    { type: "agreement", count: 3 },
    { type: "tangent", count: 1 },
  ],
  m13: [
    { type: "key_point", count: 2 },
    { type: "evidence", count: 1 },
  ],
  m14: [
    { type: "tension", count: 2 },
    { type: "key_point", count: 1 },
  ],
  m25: [
    { type: "reframe", count: 3 },
    { type: "key_point", count: 2 },
  ],
};
