import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure } from "../index";
import { engagements, deliverables } from "@/db/schema";

const engagementCreateSchema = z.object({
  clientId: z.number(),
  title: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(["project", "retainer", "advisory"]).default("project"),
  status: z.enum(["scoping", "active", "on_hold", "complete", "cancelled"]).default("active"),
  value: z.number().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  billingType: z.string().optional(),
  hoursBudgeted: z.number().optional(),
});

const deliverableCreateSchema = z.object({
  engagementId: z.number(),
  title: z.string().min(1),
  description: z.string().optional(),
  dueDate: z.string().optional(),
});

export const engagementsRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({ clientId: z.number().optional(), status: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      return ctx.db.query.engagements.findMany({
        where: input?.clientId ? eq(engagements.clientId, input.clientId) : undefined,
        with: { client: true, deliverables: true },
        orderBy: [desc(engagements.updatedAt)],
      });
    }),

  byId: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.query.engagements.findFirst({
        where: eq(engagements.id, input.id),
        with: {
          client: true,
          deliverables: { orderBy: [desc(deliverables.dueDate)] },
          actions: true,
          interactions: { orderBy: [desc(deliverables.dueDate)] },
        },
      });
    }),

  create: protectedProcedure
    .input(engagementCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const [engagement] = await ctx.db.insert(engagements).values(input).returning();
      return engagement;
    }),

  updateHealth: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        health: z.enum(["green", "yellow", "red"]),
        note: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(engagements)
        .set({ health: input.health, healthNote: input.note, updatedAt: new Date() })
        .where(eq(engagements.id, input.id))
        .returning();
      return updated;
    }),

  createDeliverable: protectedProcedure
    .input(deliverableCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const [deliverable] = await ctx.db.insert(deliverables).values(input).returning();
      return deliverable;
    }),

  updateDeliverable: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["not_started", "in_progress", "in_review", "complete"]).optional(),
        ownerNotes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const completedDate =
        data.status === "complete" ? new Date().toISOString().split("T")[0] : undefined;
      const [updated] = await ctx.db
        .update(deliverables)
        .set({ ...data, completedDate, updatedAt: new Date() })
        .where(eq(deliverables.id, id))
        .returning();
      return updated;
    }),
});
