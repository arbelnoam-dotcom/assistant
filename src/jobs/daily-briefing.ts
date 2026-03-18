import { db } from "@/db";
import { actions, proposals, clients, contacts, dailyBriefings } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { computePriorityScores } from "@/lib/scoring/priority-engine";

/**
 * Daily Briefing Generation Job
 * Designed to run via Trigger.dev at 6am each day.
 *
 * Usage with Trigger.dev:
 *
 * import { task } from "@trigger.dev/sdk/v3";
 * export const dailyBriefingTask = task({
 *   id: "daily-briefing",
 *   run: generateDailyBriefing,
 * });
 */
export async function generateDailyBriefing() {
  const today = new Date().toISOString().split("T")[0];

  // 1. Score all open actions
  const openActions = await db.query.actions.findMany({
    where: sql`${actions.status} IN ('open', 'in_progress')`,
    with: {
      client: true,
      engagement: true,
      proposal: true,
      contact: true,
    },
  });

  const scored = computePriorityScores(openActions as any);

  // 2. Persist updated scores
  for (const action of scored) {
    await db
      .update(actions)
      .set({
        priorityScore: action.priorityScore,
        aiSuggestion: action.aiSuggestion,
        updatedAt: new Date(),
      })
      .where(eq(actions.id, action.id));
  }

  // 3. Top 3 actions
  const topThree = scored.slice(0, 3).map((a) => ({
    actionId: a.id,
    title: a.title,
    rationale: a.aiSuggestion ?? "",
    cta:
      a.type === "proposal_action"
        ? "Follow up"
        : a.type === "relationship"
        ? "Reach out"
        : "Complete",
  }));

  // 4. Pipeline pulse — open proposals with staleness
  const openProposals = await db.query.proposals.findMany({
    where: sql`${proposals.stage} NOT IN ('closed_won', 'closed_lost')`,
    with: { client: true },
  });

  // Increment stale days for proposals with no recent activity
  for (const proposal of openProposals) {
    if (proposal.stage === "sent" || proposal.stage === "follow_up") {
      await db
        .update(proposals)
        .set({ staleDays: (proposal.staleDays ?? 0) + 1, updatedAt: new Date() })
        .where(eq(proposals.id, proposal.id));
    }
  }

  const pipelinePulse = openProposals
    .sort((a, b) => (b.staleDays ?? 0) - (a.staleDays ?? 0))
    .slice(0, 5)
    .map((p) => ({
      proposalId: p.id,
      clientName: (p.client as any)?.name ?? "Unknown",
      value: p.value ?? 0,
      stage: p.stage,
      staleDays: p.staleDays ?? 0,
    }));

  // 5. Client health
  const activeClients = await db.query.clients.findMany({
    where: eq(clients.status, "active"),
  });
  const clientHealth = activeClients.map((c) => ({
    clientId: c.id,
    name: c.name,
    health: c.health,
  }));

  // 6. Relationship nudges
  const allContacts = await db.query.contacts.findMany({
    with: { client: true },
  });
  const nudges = allContacts
    .filter((c) => {
      if (!c.lastContactDate) return true;
      const daysSince = Math.floor(
        (Date.now() - new Date(c.lastContactDate).getTime()) / 86400000
      );
      return daysSince > (c.desiredContactFrequencyDays ?? 30);
    })
    .slice(0, 5)
    .map((c) => {
      const lastContact = c.lastContactDate ? new Date(c.lastContactDate) : null;
      const daysSince = lastContact
        ? Math.floor((Date.now() - lastContact.getTime()) / 86400000)
        : 999;
      return {
        contactId: c.id,
        name: `${c.firstName} ${c.lastName}`,
        clientName: (c.client as any)?.name ?? "Unknown",
        daysSinceContact: daysSince,
      };
    });

  const briefingData = {
    date: today,
    threeThings: topThree,
    pipelinePulse,
    clientHealth,
    relationshipNudges: nudges,
    inboxCount: 0,
    generatedAt: new Date(),
  };

  // Upsert
  const existing = await db.query.dailyBriefings.findFirst({
    where: eq(dailyBriefings.date, today),
  });

  if (existing) {
    const [updated] = await db
      .update(dailyBriefings)
      .set(briefingData)
      .where(eq(dailyBriefings.date, today))
      .returning();
    console.log(`[briefing] Updated briefing for ${today}`);
    return updated;
  } else {
    const [created] = await db.insert(dailyBriefings).values(briefingData).returning();
    console.log(`[briefing] Created briefing for ${today}`);
    return created;
  }
}
