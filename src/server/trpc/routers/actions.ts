import { z } from "zod";
import { eq, desc, and, lte, isNull, or, sql } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure } from "../index";
import { actions } from "@/db/schema";

const actionCreateSchema = z.object({
  type: z
    .enum(["deliverable", "proposal_action", "relationship", "internal", "strategic", "capture"])
    .default("capture"),
  title: z.string().min(1),
  description: z.string().optional(),
  priority: z.number().min(1).max(4).default(3),
  dueDate: z.string().optional(),
  energyLevel: z.enum(["deep", "shallow", "async"]).optional(),
  clientId: z.number().optional(),
  engagementId: z.number().optional(),
  deliverableId: z.number().optional(),
  proposalId: z.number().optional(),
  contactId: z.number().optional(),
});

export const actionsRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z.object({
        status: z.enum(["open", "in_progress", "waiting", "done", "cancelled"]).optional(),
        type: z
          .enum(["deliverable", "proposal_action", "relationship", "internal", "strategic", "capture"])
          .optional(),
        clientId: z.number().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const conditions = [];
      if (input?.status) conditions.push(eq(actions.status, input.status));
      if (input?.type) conditions.push(eq(actions.type, input.type));
      if (input?.clientId) conditions.push(eq(actions.clientId, input.clientId));
      return ctx.db.query.actions.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        with: { client: true, engagement: true, proposal: true, contact: true },
        orderBy: [desc(actions.priorityScore)],
      });
    }),

  queue: protectedProcedure.query(async ({ ctx }) => {
    const today = new Date().toISOString().split("T")[0];
    const endOfWeek = new Date();
    endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay()));
    const endOfWeekStr = endOfWeek.toISOString().split("T")[0];

    const openActions = await ctx.db.query.actions.findMany({
      where: and(
        sql`${actions.status} IN ('open', 'in_progress', 'waiting')`
      ),
      with: { client: true, engagement: true, proposal: true, contact: true },
      orderBy: [desc(actions.priorityScore)],
    });

    const todayItems = openActions.filter(
      (a) =>
        a.status !== "waiting" &&
        a.dueDate != null &&
        a.dueDate <= today
    );
    const thisWeekItems = openActions.filter(
      (a) =>
        a.status !== "waiting" &&
        a.dueDate != null &&
        a.dueDate > today &&
        a.dueDate <= endOfWeekStr
    );
    const waitingItems = openActions.filter((a) => a.status === "waiting");
    const backlogItems = openActions.filter(
      (a) =>
        a.status !== "waiting" &&
        (a.dueDate == null || a.dueDate > endOfWeekStr)
    );

    return { today: todayItems, thisWeek: thisWeekItems, waiting: waitingItems, backlog: backlogItems };
  }),

  create: protectedProcedure
    .input(actionCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const [action] = await ctx.db.insert(actions).values(input).returning();
      return action;
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["open", "in_progress", "waiting", "done", "cancelled"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const completedDate =
        input.status === "done" ? new Date().toISOString().split("T")[0] : null;
      const [updated] = await ctx.db
        .update(actions)
        .set({
          status: input.status,
          completedDate: completedDate ?? undefined,
          updatedAt: new Date(),
        })
        .where(eq(actions.id, input.id))
        .returning();
      return updated;
    }),

  updatePriorityScores: protectedProcedure
    .input(z.array(z.object({ id: z.number(), score: z.number(), suggestion: z.string().optional() })))
    .mutation(async ({ ctx, input }) => {
      for (const { id, score, suggestion } of input) {
        await ctx.db
          .update(actions)
          .set({ priorityScore: score, aiSuggestion: suggestion, updatedAt: new Date() })
          .where(eq(actions.id, id));
      }
      return { updated: input.length };
    }),
});
