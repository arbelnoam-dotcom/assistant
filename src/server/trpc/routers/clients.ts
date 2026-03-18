import { z } from "zod";
import { eq, desc, and } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure } from "../index";
import { clients, contacts, engagements, interactions, actions } from "@/db/schema";

const clientCreateSchema = z.object({
  name: z.string().min(1),
  industry: z.string().optional(),
  website: z.string().optional(),
  status: z.enum(["prospect", "active", "past", "churned"]).default("prospect"),
  tier: z.enum(["A", "B", "C"]).default("B"),
  arrValue: z.number().optional(),
  ownerNotes: z.string().optional(),
});

export const clientsRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z.object({
        status: z
          .enum(["prospect", "active", "past", "churned"])
          .optional(),
        health: z.enum(["healthy", "at_risk", "churned"]).optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const conditions = [];
      if (input?.status) conditions.push(eq(clients.status, input.status));
      if (input?.health) conditions.push(eq(clients.health, input.health));
      return ctx.db.query.clients.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        with: {
          contacts: true,
          engagements: { where: eq(engagements.status, "active") },
        },
        orderBy: [desc(clients.updatedAt)],
      });
    }),

  byId: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.query.clients.findFirst({
        where: eq(clients.id, input.id),
        with: {
          contacts: true,
          engagements: {
            with: { deliverables: true },
          },
          interactions: {
            orderBy: [desc(interactions.date)],
            limit: 20,
          },
          actions: {
            where: eq(actions.status, "open"),
            orderBy: [desc(actions.priorityScore)],
          },
          proposals: true,
        },
      });
    }),

  create: protectedProcedure
    .input(clientCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const [client] = await ctx.db.insert(clients).values(input).returning();
      return client;
    }),

  update: protectedProcedure
    .input(clientCreateSchema.partial().extend({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const [updated] = await ctx.db
        .update(clients)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(clients.id, id))
        .returning();
      return updated;
    }),

  updateHealth: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        health: z.enum(["healthy", "at_risk", "churned"]),
        note: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(clients)
        .set({ health: input.health, updatedAt: new Date() })
        .where(eq(clients.id, input.id))
        .returning();
      return updated;
    }),
});
