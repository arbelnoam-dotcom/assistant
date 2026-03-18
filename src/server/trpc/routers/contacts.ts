import { z } from "zod";
import { eq, desc, and, sql } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure } from "../index";
import { contacts } from "@/db/schema";

const contactCreateSchema = z.object({
  clientId: z.number(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  role: z.string().optional(),
  seniority: z.enum(["champion", "decision_maker", "influencer", "user"]).optional(),
  relationshipStrength: z.number().min(1).max(5).default(3),
  desiredContactFrequencyDays: z.number().default(30),
  notes: z.string().optional(),
});

export const contactsRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({ clientId: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      return ctx.db.query.contacts.findMany({
        where: input?.clientId ? eq(contacts.clientId, input.clientId) : undefined,
        with: { client: true },
        orderBy: [desc(contacts.updatedAt)],
      });
    }),

  coldOnes: protectedProcedure.query(async ({ ctx }) => {
    // Contacts whose last contact date is past their desired frequency
    const all = await ctx.db.query.contacts.findMany({
      with: { client: true },
    });
    return all
      .filter((c) => {
        if (!c.lastContactDate) return true;
        const last = new Date(c.lastContactDate);
        const daysSince = Math.floor((Date.now() - last.getTime()) / 86400000);
        return daysSince > (c.desiredContactFrequencyDays ?? 30);
      })
      .sort((a, b) => {
        const daysA = a.lastContactDate
          ? Math.floor((Date.now() - new Date(a.lastContactDate).getTime()) / 86400000)
          : 9999;
        const daysB = b.lastContactDate
          ? Math.floor((Date.now() - new Date(b.lastContactDate).getTime()) / 86400000)
          : 9999;
        return daysB - daysA;
      });
  }),

  create: protectedProcedure
    .input(contactCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const [contact] = await ctx.db.insert(contacts).values(input).returning();
      return contact;
    }),

  update: protectedProcedure
    .input(contactCreateSchema.partial().extend({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const [updated] = await ctx.db
        .update(contacts)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(contacts.id, id))
        .returning();
      return updated;
    }),
});
