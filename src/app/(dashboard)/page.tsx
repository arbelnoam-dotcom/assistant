import { api } from "@/lib/trpc/server";
import { DailyBriefingView } from "@/components/dashboard/daily-briefing-view";

export default async function HomePage() {
  // Fetch all data needed for briefing in parallel
  const [briefing, pipeline, coldContacts] = await Promise.all([
    api.briefing.today.query(),
    api.proposals.pipeline.query(),
    api.contacts.coldOnes.query(),
  ]).catch(() => [null, null, []]);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <DailyBriefingView
      briefing={briefing}
      pipeline={pipeline}
      coldContacts={coldContacts as any[]}
      today={today}
    />
  );
}
