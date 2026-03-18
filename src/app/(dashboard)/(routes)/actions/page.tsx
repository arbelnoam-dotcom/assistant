import { api } from "@/lib/trpc/server";
import { ActionQueueView } from "@/components/dashboard/action-queue-view";

export default async function ActionsPage() {
  const queue = await api.actions.queue.query().catch(() => ({
    today: [],
    thisWeek: [],
    waiting: [],
    backlog: [],
  }));
  return <ActionQueueView queue={queue} />;
}
