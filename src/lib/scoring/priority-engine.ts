/**
 * Priority Scoring Engine
 *
 * Scores every open action 0–100. Higher = more urgent.
 * Components:
 *  - Deadline urgency (0–40 pts)
 *  - Revenue proximity (0–25 pts)
 *  - Relationship decay (0–15 pts, for relationship-type actions)
 *  - Engagement health penalty (0–10 pts)
 *  - Explicit priority override (0–10 pts)
 */

interface ScoringContext {
  id: number;
  type: string;
  status: string;
  priority: number | null;
  dueDate: string | null;
  staleSince: string | null;
  client?: {
    health: string;
    tier: string;
    arrValue: number | null;
  } | null;
  engagement?: {
    health: string;
    value: number | null;
  } | null;
  proposal?: {
    value: number | null;
    stage: string;
    staleDays: number | null;
  } | null;
  contact?: {
    lastContactDate: string | null;
    desiredContactFrequencyDays: number | null;
    relationshipStrength: number | null;
    seniority: string | null;
  } | null;
}

function deadlineScore(dueDate: string | null): number {
  if (!dueDate) return 5; // no deadline = low urgency
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  const daysUntil = Math.ceil((due.getTime() - today.getTime()) / 86400000);

  if (daysUntil < 0) return 40; // overdue
  if (daysUntil === 0) return 38; // due today
  if (daysUntil <= 1) return 35;
  if (daysUntil <= 3) return 28;
  if (daysUntil <= 7) return 18;
  if (daysUntil <= 14) return 10;
  if (daysUntil <= 30) return 5;
  return 2;
}

function revenueScore(context: ScoringContext): number {
  // Revenue at stake: proposal value or engagement value
  let revenue = 0;

  if (context.proposal?.value) {
    revenue = context.proposal.value;
    // Extra weight for stale proposals — they're at risk of going cold
    const staleDays = context.proposal.staleDays ?? 0;
    const staleBonus = Math.min(staleDays * 0.5, 10);
    const base = revenueToScore(revenue);
    return Math.min(base + staleBonus, 25);
  }

  if (context.engagement?.value) {
    revenue = context.engagement.value;
  } else if (context.client?.arrValue) {
    revenue = context.client.arrValue;
  }

  return revenueToScore(revenue);
}

function revenueToScore(value: number): number {
  if (value >= 100000) return 25;
  if (value >= 50000) return 20;
  if (value >= 25000) return 15;
  if (value >= 10000) return 10;
  if (value >= 5000) return 6;
  if (value > 0) return 3;
  return 0;
}

function relationshipScore(context: ScoringContext): number {
  if (context.type !== "relationship") return 0;
  if (!context.contact) return 5;

  const lastContact = context.contact.lastContactDate
    ? new Date(context.contact.lastContactDate)
    : null;
  const daysSince = lastContact
    ? Math.floor((Date.now() - lastContact.getTime()) / 86400000)
    : 999;
  const freq = context.contact.desiredContactFrequencyDays ?? 30;
  const overdueFactor = daysSince / freq; // >1 means overdue

  const seniority = context.contact.seniority;
  const seniorityMultiplier =
    seniority === "decision_maker" || seniority === "champion" ? 1.5 : 1.0;

  const base = Math.min(overdueFactor * 6, 12) * seniorityMultiplier;
  return Math.min(Math.round(base), 15);
}

function healthPenalty(context: ScoringContext): number {
  const engHealth = context.engagement?.health;
  const clientHealth = context.client?.health;

  if (engHealth === "red" || clientHealth === "at_risk" || clientHealth === "churned") return 10;
  if (engHealth === "yellow") return 5;
  return 0;
}

function priorityOverrideScore(priority: number | null): number {
  // priority: 1=urgent, 2=high, 3=medium, 4=low
  if (priority === 1) return 10;
  if (priority === 2) return 7;
  if (priority === 3) return 3;
  return 0;
}

function buildSuggestion(context: ScoringContext, score: number): string {
  if (context.type === "proposal_action" && context.proposal) {
    const staleDays = context.proposal.staleDays ?? 0;
    const val = context.proposal.value?.toLocaleString() ?? "0";
    if (staleDays > 10)
      return `Proposal worth $${val} has been silent for ${staleDays} days — at risk of going cold.`;
    if (staleDays > 5)
      return `Follow-up due on $${val} proposal — last contact ${staleDays} days ago.`;
    return `Proposal action on $${val} deal.`;
  }

  if (context.type === "relationship" && context.contact) {
    const last = context.contact.lastContactDate;
    const daysSince = last
      ? Math.floor((Date.now() - new Date(last).getTime()) / 86400000)
      : null;
    const seniority = context.contact.seniority;
    const label = seniority === "champion" || seniority === "decision_maker" ? " (key contact)" : "";
    return daysSince != null
      ? `No contact in ${daysSince} days${label}.`
      : `No contact on record${label}.`;
  }

  if (context.type === "deliverable" && context.dueDate) {
    const today = new Date();
    const due = new Date(context.dueDate);
    const daysUntil = Math.ceil((due.getTime() - today.getTime()) / 86400000);
    if (daysUntil < 0) return `Overdue by ${Math.abs(daysUntil)} days.`;
    if (daysUntil === 0) return "Due today.";
    return `Due in ${daysUntil} day${daysUntil === 1 ? "" : "s"}.`;
  }

  if (context.engagement?.health === "red") return "Linked engagement is at risk.";
  if (context.client?.health === "at_risk") return "Client is at risk.";

  return "";
}

export function computePriorityScore(context: ScoringContext): {
  score: number;
  suggestion: string;
} {
  const score =
    deadlineScore(context.dueDate) +
    revenueScore(context) +
    relationshipScore(context) +
    healthPenalty(context) +
    priorityOverrideScore(context.priority);

  const clampedScore = Math.min(Math.round(score), 100);
  return {
    score: clampedScore,
    suggestion: buildSuggestion(context, clampedScore),
  };
}

export function computePriorityScores(
  actions: ScoringContext[]
): Array<ScoringContext & { priorityScore: number; aiSuggestion: string }> {
  return actions
    .map((action) => {
      const { score, suggestion } = computePriorityScore(action);
      return { ...action, priorityScore: score, aiSuggestion: suggestion };
    })
    .sort((a, b) => b.priorityScore - a.priorityScore);
}
