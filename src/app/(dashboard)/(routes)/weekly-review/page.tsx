import { api } from "@/lib/trpc/server";
import { WeeklyReviewView } from "@/components/dashboard/weekly-review-view";

export default async function WeeklyReviewPage() {
  const [queue, pipeline, coldContacts] = await Promise.all([
    api.actions.queue.query().catch(() => ({ today: [], thisWeek: [], waiting: [], backlog: [] })),
    api.proposals.pipeline.query().catch(() => ({ proposals: [], weightedValue: 0 })),
    api.contacts.coldOnes.query().catch(() => []),
  ]);

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Monday
  const weekStartStr = weekStart.toLocaleDateString("en-US", { month: "long", day: "numeric" });

  return (
    <WeeklyReviewView
      queue={queue}
      pipeline={pipeline}
      coldContacts={coldContacts as any[]}
      weekStart={weekStartStr}
    />
  );
}
