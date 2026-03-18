"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, daysSince } from "@/lib/utils";
import { Plus, TrendingUp, AlertTriangle } from "lucide-react";

const STAGES = [
  { key: "drafting", label: "Drafting", probability: 10 },
  { key: "sent", label: "Sent", probability: 30 },
  { key: "follow_up", label: "Follow-up", probability: 40 },
  { key: "negotiating", label: "Negotiating", probability: 70 },
];

interface Proposal {
  id: number;
  title: string;
  value: number | null;
  stage: string;
  staleDays: number | null;
  sentDate: string | null;
  followUpDate: string | null;
  probability: number | null;
  client: { id: number; name: string } | null;
  contact?: { firstName: string; lastName: string } | null;
}

interface Props {
  pipeline: { proposals: Proposal[]; weightedValue: number };
}

export function ProposalPipelineView({ pipeline }: Props) {
  const { proposals, weightedValue } = pipeline;

  const totalOpen = proposals.reduce((sum, p) => sum + (p.value ?? 0), 0);
  const staleCount = proposals.filter((p) => (p.staleDays ?? 0) > 7).length;

  const byStage = STAGES.reduce<Record<string, Proposal[]>>((acc, s) => {
    acc[s.key] = proposals.filter((p) => p.stage === s.key);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pipeline</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {proposals.length} open deals · {formatCurrency(totalOpen)} total ·{" "}
            {formatCurrency(weightedValue)} weighted
          </p>
        </div>
        <div className="flex items-center gap-2">
          {staleCount > 0 && (
            <Badge variant="red" className="gap-1">
              <AlertTriangle className="h-3 w-3" />
              {staleCount} stale
            </Badge>
          )}
          <Button size="sm">
            <Plus className="h-4 w-4" />
            New Proposal
          </Button>
        </div>
      </div>

      {/* Pipeline summary bar */}
      <div className="grid grid-cols-4 gap-3">
        {STAGES.map((stage) => {
          const stageProposals = byStage[stage.key] ?? [];
          const stageValue = stageProposals.reduce((s, p) => s + (p.value ?? 0), 0);
          return (
            <Card key={stage.key}>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  {stage.label}
                </p>
                <p className="text-xl font-bold mt-1">{stageProposals.length}</p>
                <p className="text-sm text-muted-foreground">{formatCurrency(stageValue)}</p>
                <p className="text-xs text-muted-foreground mt-1">{stage.probability}% typical close</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Kanban columns */}
      <div className="grid grid-cols-4 gap-4">
        {STAGES.map((stage) => (
          <div key={stage.key}>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-2">
              {stage.label}
              <Badge variant="outline" className="text-xs">
                {(byStage[stage.key] ?? []).length}
              </Badge>
            </h3>
            <div className="space-y-2">
              {(byStage[stage.key] ?? []).map((proposal) => (
                <ProposalCard key={proposal.id} proposal={proposal} />
              ))}
              {(byStage[stage.key] ?? []).length === 0 && (
                <div className="border-2 border-dashed rounded-lg h-20 flex items-center justify-center">
                  <p className="text-xs text-muted-foreground">Empty</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProposalCard({ proposal }: { proposal: Proposal }) {
  const isStale = (proposal.staleDays ?? 0) > 7;
  const isVeryStale = (proposal.staleDays ?? 0) > 14;
  const daysSinceSent = daysSince(proposal.sentDate);

  return (
    <Card
      className={`cursor-pointer hover:border-primary/50 transition-colors ${
        isVeryStale ? "border-red-200 bg-red-50/30" : isStale ? "border-amber-200 bg-amber-50/30" : ""
      }`}
    >
      <CardContent className="p-3">
        <p className="text-sm font-semibold leading-snug">{proposal.client?.name ?? "Unknown"}</p>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">{proposal.title}</p>
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm font-bold">{formatCurrency(proposal.value ?? 0)}</span>
          {isStale && (
            <Badge variant={isVeryStale ? "red" : "yellow"} className="text-xs">
              {proposal.staleDays}d stale
            </Badge>
          )}
        </div>
        {proposal.contact && (
          <p className="text-xs text-muted-foreground mt-1">
            {proposal.contact.firstName} {proposal.contact.lastName}
          </p>
        )}
        {daysSinceSent !== null && (
          <p className="text-xs text-muted-foreground mt-0.5">Sent {daysSinceSent}d ago</p>
        )}
        <div className="flex gap-1 mt-2">
          <Button variant="ghost" size="sm" className="h-6 text-xs px-2">
            Log contact
          </Button>
          <Button variant="ghost" size="sm" className="h-6 text-xs px-2">
            Advance
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
