import {
  pgTable,
  text,
  integer,
  real,
  boolean,
  timestamp,
  date,
  serial,
  pgEnum,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const clientStatusEnum = pgEnum("client_status", [
  "prospect",
  "active",
  "past",
  "churned",
]);
export const clientTierEnum = pgEnum("client_tier", ["A", "B", "C"]);
export const clientHealthEnum = pgEnum("client_health", [
  "healthy",
  "at_risk",
  "churned",
]);

export const contactSeniorityEnum = pgEnum("contact_seniority", [
  "champion",
  "decision_maker",
  "influencer",
  "user",
]);

export const engagementTypeEnum = pgEnum("engagement_type", [
  "project",
  "retainer",
  "advisory",
]);
export const engagementStatusEnum = pgEnum("engagement_status", [
  "scoping",
  "active",
  "on_hold",
  "complete",
  "cancelled",
]);
export const engagementHealthEnum = pgEnum("engagement_health", [
  "green",
  "yellow",
  "red",
]);

export const deliverableStatusEnum = pgEnum("deliverable_status", [
  "not_started",
  "in_progress",
  "in_review",
  "complete",
]);

export const proposalStageEnum = pgEnum("proposal_stage", [
  "drafting",
  "sent",
  "follow_up",
  "negotiating",
  "closed_won",
  "closed_lost",
]);

export const actionTypeEnum = pgEnum("action_type", [
  "deliverable",
  "proposal_action",
  "relationship",
  "internal",
  "strategic",
  "capture",
]);
export const actionStatusEnum = pgEnum("action_status", [
  "open",
  "in_progress",
  "waiting",
  "done",
  "cancelled",
]);
export const energyLevelEnum = pgEnum("energy_level", [
  "deep",
  "shallow",
  "async",
]);

export const interactionTypeEnum = pgEnum("interaction_type", [
  "call",
  "email",
  "meeting",
  "message",
  "note",
]);

export const emailThreadStatusEnum = pgEnum("email_thread_status", [
  "needs_response",
  "waiting",
  "archived",
  "actioned",
]);

export const weeklyPlanStatusEnum = pgEnum("weekly_plan_status", [
  "draft",
  "active",
  "reviewed",
]);

// ─── Tables ───────────────────────────────────────────────────────────────────

export const clients = pgTable(
  "clients",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    industry: text("industry"),
    website: text("website"),
    status: clientStatusEnum("status").notNull().default("prospect"),
    tier: clientTierEnum("tier").notNull().default("B"),
    health: clientHealthEnum("health").notNull().default("healthy"),
    arrValue: integer("arr_value").default(0),
    relationshipStartDate: date("relationship_start_date"),
    primaryContactId: integer("primary_contact_id"),
    ownerNotes: text("owner_notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [index("clients_status_idx").on(t.status), index("clients_health_idx").on(t.health)]
);

export const contacts = pgTable(
  "contacts",
  {
    id: serial("id").primaryKey(),
    clientId: integer("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    email: text("email"),
    phone: text("phone"),
    role: text("role"),
    seniority: contactSeniorityEnum("seniority"),
    relationshipStrength: integer("relationship_strength").default(3),
    desiredContactFrequencyDays: integer("desired_contact_frequency_days").default(30),
    lastContactDate: date("last_contact_date"),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [index("contacts_client_idx").on(t.clientId), index("contacts_email_idx").on(t.email)]
);

export const engagements = pgTable(
  "engagements",
  {
    id: serial("id").primaryKey(),
    clientId: integer("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    type: engagementTypeEnum("type").notNull().default("project"),
    status: engagementStatusEnum("status").notNull().default("active"),
    health: engagementHealthEnum("health").notNull().default("green"),
    value: integer("value").default(0),
    startDate: date("start_date"),
    endDate: date("end_date"),
    billingType: text("billing_type").default("fixed"),
    hoursBudgeted: integer("hours_budgeted"),
    hoursLogged: integer("hours_logged").default(0),
    healthNote: text("health_note"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [index("engagements_client_idx").on(t.clientId), index("engagements_status_idx").on(t.status)]
);

export const deliverables = pgTable(
  "deliverables",
  {
    id: serial("id").primaryKey(),
    engagementId: integer("engagement_id")
      .notNull()
      .references(() => engagements.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    status: deliverableStatusEnum("status").notNull().default("not_started"),
    dueDate: date("due_date"),
    completedDate: date("completed_date"),
    ownerNotes: text("owner_notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [index("deliverables_engagement_idx").on(t.engagementId), index("deliverables_status_idx").on(t.status)]
);

export const proposals = pgTable(
  "proposals",
  {
    id: serial("id").primaryKey(),
    clientId: integer("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    contactId: integer("contact_id").references(() => contacts.id),
    title: text("title").notNull(),
    description: text("description"),
    value: integer("value").default(0),
    stage: proposalStageEnum("stage").notNull().default("drafting"),
    probability: integer("probability").default(20),
    sentDate: date("sent_date"),
    followUpDate: date("follow_up_date"),
    closeDate: date("close_date"),
    lostReason: text("lost_reason"),
    linkedEngagementId: integer("linked_engagement_id").references(() => engagements.id),
    documentUrl: text("document_url"),
    staleDays: integer("stale_days").default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [index("proposals_client_idx").on(t.clientId), index("proposals_stage_idx").on(t.stage)]
);

export const actions = pgTable(
  "actions",
  {
    id: serial("id").primaryKey(),
    type: actionTypeEnum("type").notNull().default("capture"),
    title: text("title").notNull(),
    description: text("description"),
    status: actionStatusEnum("status").notNull().default("open"),
    priority: integer("priority").default(3),
    dueDate: date("due_date"),
    completedDate: date("completed_date"),
    energyLevel: energyLevelEnum("energy_level").default("shallow"),
    // context links
    clientId: integer("client_id").references(() => clients.id),
    engagementId: integer("engagement_id").references(() => engagements.id),
    deliverableId: integer("deliverable_id").references(() => deliverables.id),
    proposalId: integer("proposal_id").references(() => proposals.id),
    contactId: integer("contact_id").references(() => contacts.id),
    // AI computed
    priorityScore: real("priority_score").default(0),
    staleSince: date("stale_since"),
    aiSuggestion: text("ai_suggestion"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("actions_status_idx").on(t.status),
    index("actions_type_idx").on(t.type),
    index("actions_client_idx").on(t.clientId),
    index("actions_due_date_idx").on(t.dueDate),
    index("actions_priority_score_idx").on(t.priorityScore),
  ]
);

export const interactions = pgTable(
  "interactions",
  {
    id: serial("id").primaryKey(),
    type: interactionTypeEnum("type").notNull().default("note"),
    date: timestamp("date").notNull().defaultNow(),
    durationMinutes: integer("duration_minutes"),
    summary: text("summary").notNull(),
    nextSteps: text("next_steps"),
    clientId: integer("client_id").references(() => clients.id),
    contactId: integer("contact_id").references(() => contacts.id),
    engagementId: integer("engagement_id").references(() => engagements.id),
    proposalId: integer("proposal_id").references(() => proposals.id),
    calendarEventId: text("calendar_event_id"),
    emailThreadId: text("email_thread_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("interactions_client_idx").on(t.clientId),
    index("interactions_contact_idx").on(t.contactId),
    index("interactions_date_idx").on(t.date),
  ]
);

export const weeklyPlans = pgTable("weekly_plans", {
  id: serial("id").primaryKey(),
  weekStartDate: date("week_start_date").notNull(),
  status: weeklyPlanStatusEnum("status").notNull().default("draft"),
  mustDos: jsonb("must_dos").$type<number[]>().default([]),
  reviewNotes: text("review_notes"),
  wins: text("wins"),
  misses: text("misses"),
  revenueAtWeekStart: integer("revenue_at_week_start").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const emailThreads = pgTable(
  "email_threads",
  {
    id: serial("id").primaryKey(),
    externalId: text("external_id").notNull().unique(),
    subject: text("subject").notNull(),
    participants: jsonb("participants").$type<string[]>().default([]),
    lastMessageDate: timestamp("last_message_date"),
    messageCount: integer("message_count").default(1),
    status: emailThreadStatusEnum("status").notNull().default("needs_response"),
    linkedContactId: integer("linked_contact_id").references(() => contacts.id),
    linkedClientId: integer("linked_client_id").references(() => clients.id),
    summary: text("summary"),
    actionId: integer("action_id").references(() => actions.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [index("email_threads_status_idx").on(t.status)]
);

export const calendarEvents = pgTable("calendar_events", {
  id: serial("id").primaryKey(),
  externalId: text("external_id").notNull().unique(),
  title: text("title").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  attendees: jsonb("attendees").$type<string[]>().default([]),
  linkedClientId: integer("linked_client_id").references(() => clients.id),
  linkedEngagementId: integer("linked_engagement_id").references(() => engagements.id),
  prepActionId: integer("prep_action_id").references(() => actions.id),
  debriefInteractionId: integer("debrief_interaction_id").references(() => interactions.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const dailyBriefings = pgTable("daily_briefings", {
  id: serial("id").primaryKey(),
  date: date("date").notNull().unique(),
  threeThings: jsonb("three_things")
    .$type<
      Array<{ actionId: number; title: string; rationale: string; cta: string }>
    >()
    .default([]),
  pipelinePulse: jsonb("pipeline_pulse")
    .$type<
      Array<{
        proposalId: number;
        clientName: string;
        value: number;
        stage: string;
        staleDays: number;
      }>
    >()
    .default([]),
  clientHealth: jsonb("client_health")
    .$type<Array<{ clientId: number; name: string; health: string }>>()
    .default([]),
  relationshipNudges: jsonb("relationship_nudges")
    .$type<
      Array<{
        contactId: number;
        name: string;
        clientName: string;
        daysSinceContact: number;
      }>
    >()
    .default([]),
  inboxCount: integer("inbox_count").default(0),
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
});

// ─── Relations ────────────────────────────────────────────────────────────────

export const clientsRelations = relations(clients, ({ many, one }) => ({
  contacts: many(contacts),
  engagements: many(engagements),
  proposals: many(proposals),
  actions: many(actions),
  interactions: many(interactions),
  primaryContact: one(contacts, {
    fields: [clients.primaryContactId],
    references: [contacts.id],
  }),
}));

export const contactsRelations = relations(contacts, ({ one, many }) => ({
  client: one(clients, { fields: [contacts.clientId], references: [clients.id] }),
  interactions: many(interactions),
  proposals: many(proposals),
  emailThreads: many(emailThreads),
}));

export const engagementsRelations = relations(engagements, ({ one, many }) => ({
  client: one(clients, { fields: [engagements.clientId], references: [clients.id] }),
  deliverables: many(deliverables),
  actions: many(actions),
  interactions: many(interactions),
}));

export const deliverablesRelations = relations(deliverables, ({ one, many }) => ({
  engagement: one(engagements, {
    fields: [deliverables.engagementId],
    references: [engagements.id],
  }),
  actions: many(actions),
}));

export const proposalsRelations = relations(proposals, ({ one, many }) => ({
  client: one(clients, { fields: [proposals.clientId], references: [clients.id] }),
  contact: one(contacts, { fields: [proposals.contactId], references: [contacts.id] }),
  linkedEngagement: one(engagements, {
    fields: [proposals.linkedEngagementId],
    references: [engagements.id],
  }),
  actions: many(actions),
  interactions: many(interactions),
}));

export const actionsRelations = relations(actions, ({ one }) => ({
  client: one(clients, { fields: [actions.clientId], references: [clients.id] }),
  engagement: one(engagements, { fields: [actions.engagementId], references: [engagements.id] }),
  deliverable: one(deliverables, { fields: [actions.deliverableId], references: [deliverables.id] }),
  proposal: one(proposals, { fields: [actions.proposalId], references: [proposals.id] }),
  contact: one(contacts, { fields: [actions.contactId], references: [contacts.id] }),
}));

export const interactionsRelations = relations(interactions, ({ one }) => ({
  client: one(clients, { fields: [interactions.clientId], references: [clients.id] }),
  contact: one(contacts, { fields: [interactions.contactId], references: [contacts.id] }),
  engagement: one(engagements, { fields: [interactions.engagementId], references: [engagements.id] }),
  proposal: one(proposals, { fields: [interactions.proposalId], references: [proposals.id] }),
}));

export const emailThreadsRelations = relations(emailThreads, ({ one }) => ({
  linkedContact: one(contacts, {
    fields: [emailThreads.linkedContactId],
    references: [contacts.id],
  }),
  linkedClient: one(clients, {
    fields: [emailThreads.linkedClientId],
    references: [clients.id],
  }),
  action: one(actions, { fields: [emailThreads.actionId], references: [actions.id] }),
}));

// ─── Type exports ─────────────────────────────────────────────────────────────

export type Client = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;
export type Contact = typeof contacts.$inferSelect;
export type NewContact = typeof contacts.$inferInsert;
export type Engagement = typeof engagements.$inferSelect;
export type NewEngagement = typeof engagements.$inferInsert;
export type Deliverable = typeof deliverables.$inferSelect;
export type NewDeliverable = typeof deliverables.$inferInsert;
export type Proposal = typeof proposals.$inferSelect;
export type NewProposal = typeof proposals.$inferInsert;
export type Action = typeof actions.$inferSelect;
export type NewAction = typeof actions.$inferInsert;
export type Interaction = typeof interactions.$inferSelect;
export type NewInteraction = typeof interactions.$inferInsert;
export type WeeklyPlan = typeof weeklyPlans.$inferSelect;
export type DailyBriefing = typeof dailyBriefings.$inferSelect;
