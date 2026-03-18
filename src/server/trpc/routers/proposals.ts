import { z } from "zod";
import { eq, desc, and, lt, sql } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure } from "../index";
import { proposals, actions } from "@/db/schema";

const STAGE_PROBABILITIES: Record<string, number> = {
  drafting: 10,
  sent: 30,
  follow_up: 40,
  negotiating: 70,
  closed_won: 100,
  closed_lost: 0,
};

const proposalCreateSchema = z.object({
  clientId: z.number(),
  contactId: z.number().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  value: z.number().default(0),
  stage: z
    .enum(["drafting", "sent", "follow_up", "negotiating", "closed_won", "closed_lost"])
    .default("drafting"),
  sentDate: z.string().optional(),
  followUpDate: z.string().optional(),
  closeDate: z.string().optional(),
  documentUrl: z.string().optional(),
});

export const proposalsRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z.object({
        stage: z
          .enum(["drafting", "sent", "follow_up", "negotiating", "closed_won", "closed_lost"])
          .optional(),
        clientId: z.number().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const conditions = [];
      if (input?.stage) conditions.push(eq(proposals.stage, input.stage));
      if (input?.clientId) conditions.push(eq(proposals.clientId, input.clientId));
      return ctx.db.query.proposals.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        with: { client: true, contact: true },
        orderBy: [desc(proposals.updatedAt)],
      });
    }),

  pipeline: protectedProcedure.query(async ({ ctx }) => {
    const openProposals = await ctx.db.query.proposals.findMany({
      where: and(
        sql`${proposals.stage} NOT IN ('closed_won', 'closed_lost')`
      ),
      with: { client: true, contact: true },
      orderBy: [desc(proposals.value)],
    });

    const weighted = openProposals.reduce((sum, p) => {
      const prob = STAGE_PROBABILITIES[p.stage] ?? 30;
      return sum + (p.value ?? 0) * (prob / 100);
    }, 0);

    return { proposals: openProposals, weightedValue: Math.round(weighted) };
  }),

  create: protectedProcedure
    .input(proposalCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const prob = STAGE_PROBABILITIES[input.stage] ?? 10;
      const [proposal] = await ctx.db
        .insert(proposals)
        .values({ ...input, probability: prob })
        .returning();
      return proposal;
    }),

  updateStage: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        stage: z.enum([
          "drafting",
          "sent",
          "follow_up",
          "negotiating",
          "closed_won",
          "closed_lost",
        ]),
        lostReason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const prob = STAGE_PROBABILITIES[input.stage] ?? 30;
      const [updated] = await ctx.db
        .update(proposals)
        .set({
          stage: input.stage,
          probability: prob,
          lostReason: input.lostReason,
          staleDays: 0,
          updatedAt: new Date(),
        })
        .where(eq(proposals.id, input.id))
        .returning();
      return updated;
    }),

  staleOnes: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.query.proposals.findMany({
      where: and(
        sql`${proposals.stage} NOT IN ('closed_won', 'closed_lost')`,
        sql`${proposals.staleDays} > 7`
      ),
      with: { client: true },
      orderBy: [desc(proposals.staleDays)],
    });
  }),
});
