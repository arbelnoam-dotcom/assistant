import { db } from "@/db";
import { proposals, actions } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

/**
 * Staleness Detector Job
 * Detects proposals that have gone cold and creates follow-up actions.
 * Runs daily via Trigger.dev.
 *
 * import { task } from "@trigger.dev/sdk/v3";
 * export const stalenessDetectorTask = task({
 *   id: "staleness-detector",
 *   run: detectStaleness,
 * });
 */
export async function detectStaleness() {
  const openProposals = await db.query.proposals.findMany({
    where: sql`${proposals.stage} IN ('sent', 'follow_up')`,
    with: { client: true },
  });

  let actionsCreated = 0;

  for (const proposal of openProposals) {
    const staleDays = proposal.staleDays ?? 0;

    // At 7 days stale: create a follow-up action if none exists
    if (staleDays === 7) {
      const existingAction = await db.query.actions.findFirst({
        where: sql`${actions.proposalId} = ${proposal.id} AND ${actions.status} IN ('open', 'in_progress')`,
      });

      if (!existingAction) {
        await db.insert(actions).values({
          type: "proposal_action",
          title: `Follow up on proposal: ${proposal.title}`,
          description: `Proposal for ${(proposal.client as any)?.name} has been in "${proposal.stage}" for ${staleDays} days with no activity.`,
          status: "open",
          priority: 2,
          proposalId: proposal.id,
          clientId: proposal.clientId,
          aiSuggestion: `Proposal worth $${(proposal.value ?? 0).toLocaleString()} — silent for ${staleDays} days.`,
        });
        actionsCreated++;
        console.log(`[staleness] Created follow-up action for proposal ${proposal.id}`);
      }
    }

    // At 14 days: escalate to priority 1 (urgent)
    if (staleDays === 14) {
      await db
        .update(actions)
        .set({ priority: 1, updatedAt: new Date() })
        .where(sql`${actions.proposalId} = ${proposal.id} AND ${actions.status} IN ('open', 'in_progress')`);
    }
  }

  console.log(`[staleness] Processed ${openProposals.length} proposals, created ${actionsCreated} actions`);
  return { processed: openProposals.length, actionsCreated };
}
