import { db } from "@/db";
import { actions } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { computePriorityScores } from "@/lib/scoring/priority-engine";

/**
 * Nightly Priority Rescoring Job
 * Recomputes priority scores for all open actions.
 * Runs at 2am via Trigger.dev.
 *
 * import { task } from "@trigger.dev/sdk/v3";
 * export const priorityRescoreTask = task({
 *   id: "priority-rescore",
 *   run: rescoreAllActions,
 * });
 */
export async function rescoreAllActions() {
  const openActions = await db.query.actions.findMany({
    where: sql`${actions.status} IN ('open', 'in_progress', 'waiting')`,
    with: {
      client: true,
      engagement: true,
      proposal: true,
      contact: true,
    },
  });

  const scored = computePriorityScores(openActions as any);
  let updated = 0;

  for (const action of scored) {
    await db
      .update(actions)
      .set({
        priorityScore: action.priorityScore,
        aiSuggestion: action.aiSuggestion,
        updatedAt: new Date(),
      })
      .where(eq(actions.id, action.id));
    updated++;
  }

  console.log(`[rescore] Updated ${updated} action scores`);
  return { updated };
}
