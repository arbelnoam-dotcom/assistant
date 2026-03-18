/**
 * Seed script — realistic sample data for development.
 * Run with: npx tsx src/db/seed.ts
 */
import { db } from "./index";
import {
  clients,
  contacts,
  engagements,
  deliverables,
  proposals,
  actions,
  interactions,
} from "./schema";

async function seed() {
  console.log("Seeding database...");

  // ─── Clients ──────────────────────────────────────────────────────────────
  const [meridian] = await db
    .insert(clients)
    .values({
      name: "Meridian Financial",
      industry: "Financial Services",
      website: "meridianfinancial.com",
      status: "active",
      tier: "A",
      health: "at_risk",
      arrValue: 120000,
      relationshipStartDate: "2023-01-15",
      ownerNotes: "Long-standing client. CFO is a champion but new CTO is skeptical of consulting spend.",
    })
    .returning();

  const [globalco] = await db
    .insert(clients)
    .values({
      name: "GlobalCo",
      industry: "Manufacturing",
      website: "globalco.com",
      status: "active",
      tier: "A",
      health: "healthy",
      arrValue: 85000,
      relationshipStartDate: "2022-06-01",
    })
    .returning();

  const [apextech] = await db
    .insert(clients)
    .values({
      name: "Apex Technologies",
      industry: "SaaS",
      status: "active",
      tier: "B",
      health: "healthy",
      arrValue: 48000,
      relationshipStartDate: "2024-03-01",
    })
    .returning();

  const [acmecorp] = await db
    .insert(clients)
    .values({
      name: "Acme Corp",
      industry: "Retail",
      status: "prospect",
      tier: "B",
      health: "healthy",
    })
    .returning();

  const [northstar] = await db
    .insert(clients)
    .values({
      name: "NorthStar Ventures",
      industry: "Venture Capital",
      status: "prospect",
      tier: "A",
      health: "healthy",
    })
    .returning();

  const [betalabs] = await db
    .insert(clients)
    .values({
      name: "Beta Labs",
      industry: "Biotech",
      status: "prospect",
      tier: "C",
      health: "healthy",
    })
    .returning();

  console.log("✓ Clients created");

  // ─── Contacts ─────────────────────────────────────────────────────────────
  const [sarahChen] = await db
    .insert(contacts)
    .values({
      clientId: meridian.id,
      firstName: "Sarah",
      lastName: "Chen",
      email: "sarah.chen@meridianfinancial.com",
      role: "Chief Financial Officer",
      seniority: "champion",
      relationshipStrength: 5,
      desiredContactFrequencyDays: 21,
      lastContactDate: "2026-01-28",
    })
    .returning();

  const [jamesHawkins] = await db
    .insert(contacts)
    .values({
      clientId: meridian.id,
      firstName: "James",
      lastName: "Hawkins",
      email: "j.hawkins@meridianfinancial.com",
      role: "Chief Technology Officer",
      seniority: "decision_maker",
      relationshipStrength: 2,
      desiredContactFrequencyDays: 30,
      lastContactDate: "2026-02-10",
    })
    .returning();

  const [marcusLee] = await db
    .insert(contacts)
    .values({
      clientId: globalco.id,
      firstName: "Marcus",
      lastName: "Lee",
      email: "m.lee@globalco.com",
      role: "VP Operations",
      seniority: "decision_maker",
      relationshipStrength: 4,
      desiredContactFrequencyDays: 30,
      lastContactDate: "2026-03-05",
    })
    .returning();

  const [priyaKumar] = await db
    .insert(contacts)
    .values({
      clientId: acmecorp.id,
      firstName: "Priya",
      lastName: "Kumar",
      email: "priya@acmecorp.com",
      role: "CEO",
      seniority: "decision_maker",
      relationshipStrength: 3,
      desiredContactFrequencyDays: 14,
      lastContactDate: "2026-03-06",
    })
    .returning();

  const [tomWright] = await db
    .insert(contacts)
    .values({
      clientId: northstar.id,
      firstName: "Tom",
      lastName: "Wright",
      email: "tom@northstarvc.com",
      role: "Managing Partner",
      seniority: "decision_maker",
      relationshipStrength: 3,
      desiredContactFrequencyDays: 21,
      lastContactDate: "2026-03-01",
    })
    .returning();

  console.log("✓ Contacts created");

  // ─── Engagements ──────────────────────────────────────────────────────────
  const [meridianAudit] = await db
    .insert(engagements)
    .values({
      clientId: meridian.id,
      title: "Q1 Operational Audit",
      description: "Comprehensive audit of finance operations and tech stack",
      type: "project",
      status: "active",
      health: "red",
      value: 55000,
      startDate: "2026-01-15",
      endDate: "2026-03-28",
      billingType: "fixed",
      healthNote: "Scope creep on tech audit component. James Hawkins is not cooperating with data requests.",
    })
    .returning();

  const [globalcoRetainer] = await db
    .insert(engagements)
    .values({
      clientId: globalco.id,
      title: "Operations Excellence Retainer",
      description: "Monthly advisory retainer for operations improvement",
      type: "retainer",
      status: "active",
      health: "green",
      value: 8000,
      startDate: "2022-06-01",
      billingType: "monthly",
    })
    .returning();

  const [apexStrategy] = await db
    .insert(engagements)
    .values({
      clientId: apextech.id,
      title: "Go-to-Market Strategy",
      description: "Enterprise GTM strategy for Series B expansion",
      type: "project",
      status: "active",
      health: "yellow",
      value: 48000,
      startDate: "2026-02-01",
      endDate: "2026-05-30",
      billingType: "fixed",
    })
    .returning();

  console.log("✓ Engagements created");

  // ─── Deliverables ─────────────────────────────────────────────────────────
  await db.insert(deliverables).values([
    {
      engagementId: meridianAudit.id,
      title: "Finance Process Assessment",
      status: "complete",
      dueDate: "2026-02-15",
      completedDate: "2026-02-14",
    },
    {
      engagementId: meridianAudit.id,
      title: "Tech Stack Audit Report",
      status: "in_progress",
      dueDate: "2026-03-21",
    },
    {
      engagementId: meridianAudit.id,
      title: "Final Recommendations Deck",
      status: "not_started",
      dueDate: "2026-03-28",
    },
    {
      engagementId: apexStrategy.id,
      title: "ICP Analysis",
      status: "complete",
      dueDate: "2026-02-20",
      completedDate: "2026-02-19",
    },
    {
      engagementId: apexStrategy.id,
      title: "Competitive Landscape",
      status: "in_progress",
      dueDate: "2026-03-25",
    },
    {
      engagementId: apexStrategy.id,
      title: "Enterprise Sales Playbook",
      status: "not_started",
      dueDate: "2026-04-30",
    },
  ]);

  console.log("✓ Deliverables created");

  // ─── Proposals ────────────────────────────────────────────────────────────
  const today = new Date();
  const sentAcme = new Date(today);
  sentAcme.setDate(sentAcme.getDate() - 12);

  const sentNorthstar = new Date(today);
  sentNorthstar.setDate(sentNorthstar.getDate() - 3);

  const sentBeta = new Date(today);
  sentBeta.setDate(sentBeta.getDate() - 3);

  await db.insert(proposals).values([
    {
      clientId: acmecorp.id,
      contactId: priyaKumar.id,
      title: "Digital Operations Transformation",
      description: "End-to-end ops transformation over 6 months",
      value: 45000,
      stage: "sent",
      probability: 30,
      sentDate: sentAcme.toISOString().split("T")[0],
      staleDays: 12,
    },
    {
      clientId: northstar.id,
      contactId: tomWright.id,
      title: "Portfolio Operations Advisory",
      description: "Ongoing advisory for portfolio companies",
      value: 62000,
      stage: "negotiating",
      probability: 70,
      sentDate: sentNorthstar.toISOString().split("T")[0],
      staleDays: 0,
    },
    {
      clientId: betalabs.id,
      title: "Commercialization Strategy",
      description: "Go-to-market strategy for Series A product launch",
      value: 35000,
      stage: "sent",
      probability: 30,
      sentDate: sentBeta.toISOString().split("T")[0],
      staleDays: 3,
    },
  ]);

  console.log("✓ Proposals created");

  // ─── Actions ──────────────────────────────────────────────────────────────
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const inThreeDays = new Date();
  inThreeDays.setDate(inThreeDays.getDate() + 3);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  await db.insert(actions).values([
    {
      type: "proposal_action",
      title: "Follow up with Acme Corp — proposal gone quiet",
      description: "Send a check-in email to Priya. Ask about timeline.",
      status: "open",
      priority: 1,
      dueDate: yesterday.toISOString().split("T")[0],
      clientId: acmecorp.id,
      contactId: priyaKumar.id,
      aiSuggestion: "Proposal worth $45K has been silent for 12 days — at risk of going cold.",
      priorityScore: 78,
    },
    {
      type: "deliverable",
      title: "Complete Meridian Tech Stack Audit Report",
      description: "Final report draft needed before Friday review",
      status: "in_progress",
      priority: 1,
      dueDate: "2026-03-21",
      clientId: meridian.id,
      engagementId: meridianAudit.id,
      aiSuggestion: "Due in 3 days. Engagement is at risk (red health).",
      priorityScore: 71,
    },
    {
      type: "relationship",
      title: "Check in with Sarah Chen",
      description: "Sarah is our champion at Meridian. Haven't spoken in 49 days.",
      status: "open",
      priority: 2,
      clientId: meridian.id,
      contactId: sarahChen.id,
      aiSuggestion: "No contact in 49 days (key contact / champion).",
      priorityScore: 58,
    },
    {
      type: "deliverable",
      title: "Write Final Recommendations Deck for Meridian",
      status: "open",
      priority: 2,
      dueDate: "2026-03-28",
      clientId: meridian.id,
      engagementId: meridianAudit.id,
      energyLevel: "deep",
      aiSuggestion: "Due in 10 days. Engagement is at risk.",
      priorityScore: 52,
    },
    {
      type: "proposal_action",
      title: "Schedule call with Tom Wright to close NorthStar deal",
      status: "open",
      priority: 2,
      dueDate: inThreeDays.toISOString().split("T")[0],
      clientId: northstar.id,
      contactId: tomWright.id,
      aiSuggestion: "Deal in negotiating stage. $62K at stake. Close it.",
      priorityScore: 65,
    },
    {
      type: "strategic",
      title: "Write Q2 service offering positioning",
      description: "Update website and pitch deck with new AI advisory offering",
      status: "open",
      priority: 3,
      energyLevel: "deep",
      aiSuggestion: "",
      priorityScore: 8,
    },
    {
      type: "internal",
      title: "Review and approve March invoices",
      status: "open",
      priority: 3,
      dueDate: tomorrow.toISOString().split("T")[0],
      energyLevel: "shallow",
      priorityScore: 15,
    },
    {
      type: "deliverable",
      title: "Apex: Complete competitive landscape analysis",
      status: "in_progress",
      priority: 2,
      dueDate: "2026-03-25",
      clientId: apextech.id,
      engagementId: apexStrategy.id,
      energyLevel: "deep",
      aiSuggestion: "Due in 7 days.",
      priorityScore: 38,
    },
  ]);

  console.log("✓ Actions created");

  // ─── Interactions ─────────────────────────────────────────────────────────
  await db.insert(interactions).values([
    {
      type: "call",
      date: new Date("2026-01-28"),
      durationMinutes: 45,
      summary: "Q1 audit kickoff call. Sarah is aligned. James was distant.",
      nextSteps: "Send data request to James by Feb 1",
      clientId: meridian.id,
      contactId: sarahChen.id,
      engagementId: meridianAudit.id,
    },
    {
      type: "email",
      date: new Date("2026-02-10"),
      summary: "Data request follow-up to James. He responded that the team is swamped.",
      nextSteps: "Escalate to Sarah if no response by Feb 17",
      clientId: meridian.id,
      contactId: jamesHawkins.id,
    },
    {
      type: "meeting",
      date: new Date("2026-03-05"),
      durationMinutes: 30,
      summary: "Monthly ops review with Marcus. Good progress on efficiency targets.",
      nextSteps: "Share April roadmap draft",
      clientId: globalco.id,
      contactId: marcusLee.id,
      engagementId: globalcoRetainer.id,
    },
    {
      type: "call",
      date: new Date("2026-03-06"),
      durationMinutes: 20,
      summary: "Discovery call with Priya at Acme. Very interested in our ops work.",
      nextSteps: "Send proposal by end of week",
      clientId: acmecorp.id,
      contactId: priyaKumar.id,
    },
  ]);

  console.log("✓ Interactions created");
  console.log("\nSeed complete! 🌱");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
