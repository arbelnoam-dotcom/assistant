import { api } from "@/lib/trpc/server";
import { ClientDetailView } from "@/components/dashboard/client-detail-view";
import { notFound } from "next/navigation";

export default async function ClientDetailPage({ params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  if (isNaN(id)) notFound();

  const client = await api.clients.byId.query({ id }).catch(() => null);
  if (!client) notFound();

  return <ClientDetailView client={client} />;
}
