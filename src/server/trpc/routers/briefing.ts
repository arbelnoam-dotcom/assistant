import { z } from "zod";
import { eq, desc, and, sql } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure } from "../index";
import { dailyBriefings, proposals, clients, contacts, actions, engagements } from "@/db/schema";
import { computePriorityScores } from "@/lib/scoring/priority-engine";

export const briefingRouter = createTRPCRouter({
  today: protectedProcedure.query(async ({ ctx }) => {
    const today = new Date().toISOString().split("T")[0];
    const existing = await ctx.db.query.dailyBriefings.findFirst({
      where: eq(dailyBriefings.date, today),
    });
    if (existing) return existing;

    // Generate fresh briefing
    return generateBriefing(ctx.db);
  }),

  generate: protectedProcedure.mutation(async ({ ctx }) => {
    return generateBriefing(ctx.db);
  }),
});

async function generateBriefing(db: any) {
  const today = new Date().toISOString().split("T")[0];

  // Fetch all open actions with context
  const openActions = await db.query.actions.findMany({
    where: sql`${actions.status} IN ('open', 'in_progress')`,
    with: { client: true, engagement: true, proposal: true, contact: true },
  });

  // Score them
  const scored = computePriorityScores(openActions);
  const topThree = scored.slice(0, 3).map((a: any) => ({
    actionId: a.id,
    title: a.title,
    rationale: a.aiSuggestion ?? "High priority item",
    cta: a.type === "proposal_action" ? "Follow up" : a.type === "relationship" ? "Reach out" : "Complete",
  }));

  // Pipeline pulse — stale open proposals
  const openProposals = await db.query.proposals.findMany({
    where: sql`${proposals.stage} NOT IN ('closed_won', 'closed_lost')`,
    with: { client: true },
    orderBy: [desc(proposals.staleDays)],
    limit: 5,
  });
  const pipelinePulse = openProposals.map((p: any) => ({
    proposalId: p.id,
    clientName: p.client?.name ?? "Unknown",
    value: p.value ?? 0,
    stage: p.stage,
    staleDays: p.staleDays ?? 0,
  }));

  // Client health
  const activeClients = await db.query.clients.findMany({
    where: eq(clients.status, "active"),
  });
  const clientHealth = activeClients.map((c: any) => ({
    clientId: c.id,
    name: c.name,
    health: c.health,
  }));

  // Relationship nudges — contacts past desired frequency
  const allContacts = await db.query.contacts.findMany({
    with: { client: true },
  });
  const nudges = allContacts
    .filter((c: any) => {
      if (!c.lastContactDate) return true;
      const lastContact = new Date(c.lastContactDate);
      const daysSince = Math.floor((Date.now() - lastContact.getTime()) / 86400000);
      return daysSince > (c.desiredContactFrequencyDays ?? 30);
    })
    .slice(0, 5)
    .map((c: any) => {
      const lastContact = c.lastContactDate ? new Date(c.lastContactDate) : null;
      const daysSince = lastContact
        ? Math.floor((Date.now() - lastContact.getTime()) / 86400000)
        : 999;
      return {
        contactId: c.id,
        name: `${c.firstName} ${c.lastName}`,
        clientName: c.client?.name ?? "Unknown",
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
  };

  // Upsert the briefing
  const existing = await db.query.dailyBriefings.findFirst({
    where: eq(dailyBriefings.date, today),
  });

  if (existing) {
    const [updated] = await db
      .update(dailyBriefings)
      .set({ ...briefingData, generatedAt: new Date() })
      .where(eq(dailyBriefings.date, today))
      .returning();
    return updated;
  } else {
    const [created] = await db.insert(dailyBriefings).values(briefingData).returning();
    return created;
  }
}
