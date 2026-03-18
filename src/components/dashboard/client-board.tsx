"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HealthDot } from "@/components/dashboard/health-dot";
import { formatCurrency } from "@/lib/utils";
import { Building2, Users, ChevronRight, Plus } from "lucide-react";

interface ClientWithRelations {
  id: number;
  name: string;
  industry: string | null;
  status: string;
  tier: string;
  health: string;
  arrValue: number | null;
  contacts: { id: number; firstName: string; lastName: string }[];
  engagements: { id: number; title: string; health: string; status: string }[];
}

const statusOrder = ["active", "prospect", "past", "churned"];
const tierLabel: Record<string, string> = { A: "Tier A", B: "Tier B", C: "Tier C" };

export function ClientBoard({ clients }: { clients: ClientWithRelations[] }) {
  const grouped = statusOrder.reduce<Record<string, ClientWithRelations[]>>((acc, status) => {
    acc[status] = clients.filter((c) => c.status === status);
    return acc;
  }, {});

  const statusLabels: Record<string, string> = {
    active: "Active",
    prospect: "Prospects",
    past: "Past Clients",
    churned: "Churned",
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {clients.filter((c) => c.status === "active").length} active ·{" "}
            {clients.filter((c) => c.status === "prospect").length} prospects
          </p>
        </div>
        <Button size="sm">
          <Plus className="h-4 w-4" />
          Add Client
        </Button>
      </div>

      {statusOrder.map((status) => {
        const group = grouped[status];
        if (group.length === 0) return null;
        return (
          <section key={status}>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
              {statusLabels[status]} ({group.length})
            </h2>
            <div className="grid grid-cols-1 gap-3">
              {group.map((client) => (
                <ClientCard key={client.id} client={client} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function ClientCard({ client }: { client: ClientWithRelations }) {
  const activeEngagements = client.engagements.filter((e) => e.status === "active");
  const atRiskEngagements = activeEngagements.filter(
    (e) => e.health === "red" || e.health === "yellow"
  );

  return (
    <Link href={`/clients/${client.id}`}>
      <Card className="hover:border-primary/50 transition-colors cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm">{client.name}</p>
                  <HealthDot health={client.health as any} />
                  <Badge variant="outline" className="text-xs">
                    {tierLabel[client.tier] ?? client.tier}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  {client.industry && (
                    <p className="text-xs text-muted-foreground">{client.industry}</p>
                  )}
                  {client.arrValue ? (
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(client.arrValue)}/yr
                    </p>
                  ) : null}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="h-3 w-3" />
                    {client.contacts.length}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {activeEngagements.length > 0 && (
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">
                    {activeEngagements.length} active engagement
                    {activeEngagements.length !== 1 ? "s" : ""}
                  </p>
                  {atRiskEngagements.length > 0 && (
                    <Badge variant="yellow" className="text-xs">
                      {atRiskEngagements.length} at risk
                    </Badge>
                  )}
                </div>
              )}
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
