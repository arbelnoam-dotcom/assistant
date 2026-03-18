import { api } from "@/lib/trpc/server";
import { ClientBoard } from "@/components/dashboard/client-board";

export default async function ClientsPage() {
  const clients = await api.clients.list.query().catch(() => []);
  return <ClientBoard clients={clients} />;
}
