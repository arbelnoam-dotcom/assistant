import { z } from "zod";
import { eq, desc, and } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure } from "../index";
import { interactions, contacts } from "@/db/schema";

const interactionCreateSchema = z.object({
  type: z.enum(["call", "email", "meeting", "message", "note"]).default("note"),
  date: z.string().optional(),
  durationMinutes: z.number().optional(),
  summary: z.string().min(1),
  nextSteps: z.string().optional(),
  clientId: z.number().optional(),
  contactId: z.number().optional(),
  engagementId: z.number().optional(),
  proposalId: z.number().optional(),
});

export const interactionsRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z.object({
        clientId: z.number().optional(),
        contactId: z.number().optional(),
        engagementId: z.number().optional(),
        limit: z.number().default(20),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const conditions = [];
      if (input?.clientId) conditions.push(eq(interactions.clientId, input.clientId));
      if (input?.contactId) conditions.push(eq(interactions.contactId, input.contactId));
      if (input?.engagementId) conditions.push(eq(interactions.engagementId, input.engagementId));
      return ctx.db.query.interactions.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        with: { client: true, contact: true },
        orderBy: [desc(interactions.date)],
        limit: input?.limit ?? 20,
      });
    }),

  create: protectedProcedure
    .input(interactionCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const [interaction] = await ctx.db
        .insert(interactions)
        .values({
          ...input,
          date: input.date ? new Date(input.date) : new Date(),
        })
        .returning();

      // Update the contact's lastContactDate
      if (input.contactId) {
        await ctx.db
          .update(contacts)
          .set({ lastContactDate: new Date().toISOString().split("T")[0], updatedAt: new Date() })
          .where(eq(contacts.id, input.contactId));
      }

      return interaction;
    }),
});
