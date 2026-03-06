import { Claim, ClaimLink, GhostBranch, DiscourseReaction, Message, Source } from "./types";

/** Get all claims for a specific message */
export function getClaimsForMessage(messageId: string, claims: Claim[]): Claim[] {
  return claims.filter((c) => c.messageId === messageId);
}

/** Get ghost branches that appear after a specific message */
export function getGhostBranchesAfter(messageId: string, ghostBranches: GhostBranch[]): GhostBranch[] {
  return ghostBranches.filter((g) => g.afterMessageId === messageId);
}

/** Compute thread temperature from discourse reactions (0 = cool, 1 = hot) */
export function computeThreadTemperature(reactions: DiscourseReaction[]): number {
  const tension = reactions
    .filter((r) => r.type === "tension")
    .reduce((sum, r) => sum + r.count, 0);
  const agreement = reactions
    .filter((r) => r.type === "agreement")
    .reduce((sum, r) => sum + r.count, 0);
  const total = tension + agreement;
  if (total === 0) return 0.5; // neutral when no tension or agreement data
  return tension / total;
}

/** Get all messages that cite a specific source */
export function getMessagesBySource(sourceId: string, messages: Message[]): Message[] {
  return messages.filter((m) => m.citations.some((c) => c.sourceId === sourceId));
}

/** Find pairs of messages that cite the same source */
export function findSharedSourcePairs(
  messages: Message[],
  sources: Source[]
): { sourceId: string; messageIds: string[] }[] {
  const result: { sourceId: string; messageIds: string[] }[] = [];
  for (const source of sources) {
    const citing = messages.filter((m) =>
      m.citations.some((c) => c.sourceId === source.id)
    );
    if (citing.length >= 2) {
      result.push({
        sourceId: source.id,
        messageIds: citing.map((m) => m.id),
      });
    }
  }
  return result;
}

/** Get links for a specific claim */
export function getLinksForClaim(claimId: string, links: ClaimLink[]): ClaimLink[] {
  return links.filter((l) => l.fromClaimId === claimId || l.toClaimId === claimId);
}

/** Reaction type metadata */
export const DISCOURSE_REACTIONS: { type: DiscourseReaction["type"]; emoji: string; label: string; color: string }[] = [
  { type: "tension", emoji: "⚡", label: "Tension", color: "text-red-400 bg-red-500/15 border-red-500/30" },
  { type: "agreement", emoji: "🤝", label: "Agreement", color: "text-green-400 bg-green-500/15 border-green-500/30" },
  { type: "evidence", emoji: "❓", label: "Needs Evidence", color: "text-yellow-400 bg-yellow-500/15 border-yellow-500/30" },
  { type: "reframe", emoji: "🔄", label: "Reframe", color: "text-blue-400 bg-blue-500/15 border-blue-500/30" },
  { type: "key_point", emoji: "🎯", label: "Key Point", color: "text-purple-400 bg-purple-500/15 border-purple-500/30" },
  { type: "tangent", emoji: "🌊", label: "Tangent", color: "text-cyan-400 bg-cyan-500/15 border-cyan-500/30" },
];

/** Ghost branch category icons */
export const GHOST_CATEGORIES: Record<GhostBranch["category"], { emoji: string; label: string }> = {
  assumption: { emoji: "🔍", label: "Unexamined assumption" },
  undefined_term: { emoji: "📖", label: "Undefined term" },
  blind_spot: { emoji: "👁", label: "Cultural blind spot" },
  logical_gap: { emoji: "🔗", label: "Logical gap" },
};
