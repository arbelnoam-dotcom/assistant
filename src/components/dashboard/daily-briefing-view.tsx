"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HealthDot } from "@/components/dashboard/health-dot";
import { formatCurrency } from "@/lib/utils";
import { AlertCircle, TrendingUp, Users, Inbox, ArrowRight, RefreshCw } from "lucide-react";

interface ThingItem {
  actionId: number;
  title: string;
  rationale: string;
  cta: string;
}

interface PipelineItem {
  proposalId: number;
  clientName: string;
  value: number;
  stage: string;
  staleDays: number;
}

interface ClientHealthItem {
  clientId: number;
  name: string;
  health: string;
}

interface RelationshipNudge {
  contactId: number;
  name: string;
  clientName: string;
  daysSinceContact: number;
}

interface Props {
  briefing: {
    threeThings: ThingItem[];
    pipelinePulse: PipelineItem[];
    clientHealth: ClientHealthItem[];
    relationshipNudges: RelationshipNudge[];
    inboxCount: number;
  } | null;
  pipeline: { proposals: any[]; weightedValue: number } | null;
  coldContacts: any[];
  today: string;
}

const stageLabels: Record<string, string> = {
  drafting: "Drafting",
  sent: "Sent",
  follow_up: "Follow-up",
  negotiating: "Negotiating",
  closed_won: "Won",
  closed_lost: "Lost",
};

export function DailyBriefingView({ briefing, pipeline, coldContacts, today }: Props) {
  if (!briefing) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">No briefing generated yet.</p>
        <p className="text-sm text-muted-foreground">
          Connect your database and run the seed script to get started.
        </p>
      </div>
    );
  }

  const atRiskClients = briefing.clientHealth.filter(
    (c) => c.health === "at_risk" || c.health === "churned"
  );
  const totalOpen = pipeline?.proposals.length ?? 0;
  const totalWeighted = pipeline?.weightedValue ?? 0;
  const staleProposals = briefing.pipelinePulse.filter((p) => p.staleDays > 7);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="text-sm text-muted-foreground">{today}</p>
        <h1 className="text-2xl font-bold tracking-tight mt-1">Good morning.</h1>
        <p className="text-muted-foreground mt-1">Here&apos;s what matters today.</p>
      </div>

      {/* 3 Things */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Your 3 Things
          </h2>
        </div>
        {briefing.threeThings.length === 0 ? (
          <p className="text-sm text-muted-foreground">No high-priority actions right now.</p>
        ) : (
          <div className="space-y-3">
            {briefing.threeThings.map((item, i) => (
              <Card key={item.actionId} className="border-l-4 border-l-amber-400">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-3">
                      <span className="text-2xl font-bold text-amber-400 leading-none mt-0.5">
                        {i + 1}
                      </span>
                      <div>
                        <p className="font-semibold text-sm">{item.title}</p>
                        {item.rationale && (
                          <p className="text-xs text-muted-foreground mt-0.5">{item.rationale}</p>
                        )}
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="shrink-0">
                      {item.cta}
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pipeline Pulse */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Pipeline Pulse
              </h2>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold">{formatCurrency(totalWeighted)} weighted</p>
              <p className="text-xs text-muted-foreground">{totalOpen} open deals</p>
            </div>
          </div>
          <Card>
            <CardContent className="p-0">
              {briefing.pipelinePulse.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">No open proposals.</p>
              ) : (
                <ul className="divide-y">
                  {briefing.pipelinePulse.map((p) => (
                    <li key={p.proposalId} className="px-4 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{p.clientName}</p>
                        <p className="text-xs text-muted-foreground">
                          {stageLabels[p.stage] ?? p.stage}
                          {p.staleDays > 0 && ` · ${p.staleDays}d`}
                        </p>
                      </div>
                      <div className="text-right flex items-center gap-2">
                        <span className="text-sm font-semibold">{formatCurrency(p.value)}</span>
                        {p.staleDays > 7 && (
                          <Badge variant="red" className="text-xs">stale</Badge>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Client Health */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Client Health
            </h2>
            {atRiskClients.length > 0 && (
              <Badge variant="red">{atRiskClients.length} at risk</Badge>
            )}
          </div>
          <Card>
            <CardContent className="p-0">
              {briefing.clientHealth.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">No active clients.</p>
              ) : (
                <ul className="divide-y">
                  {briefing.clientHealth.map((c) => (
                    <li key={c.clientId} className="px-4 py-3 flex items-center justify-between">
                      <p className="text-sm font-medium">{c.name}</p>
                      <HealthDot health={c.health as any} showLabel />
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Relationship Nudges */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-4 w-4 text-emerald-500" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Relationships Going Cold
            </h2>
          </div>
          <Card>
            <CardContent className="p-0">
              {briefing.relationshipNudges.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">All relationships are healthy.</p>
              ) : (
                <ul className="divide-y">
                  {briefing.relationshipNudges.map((n) => (
                    <li key={n.contactId} className="px-4 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{n.name}</p>
                        <p className="text-xs text-muted-foreground">{n.clientName}</p>
                      </div>
                      <div className="text-right flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {n.daysSinceContact >= 999 ? "Never" : `${n.daysSinceContact}d ago`}
                        </span>
                        <Button variant="ghost" size="sm">
                          Reach out
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Inbox */}
        {briefing.inboxCount > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Inbox className="h-4 w-4 text-purple-500" />
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Inbox
              </h2>
            </div>
            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <p className="text-sm">
                  <span className="font-semibold">{briefing.inboxCount}</span> threads need a response
                </p>
                <Button variant="outline" size="sm">View all</Button>
              </CardContent>
            </Card>
          </section>
        )}
      </div>
    </div>
  );
}
