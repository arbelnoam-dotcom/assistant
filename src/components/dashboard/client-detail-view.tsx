"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HealthDot } from "@/components/dashboard/health-dot";
import { ActionTypeBadge } from "@/components/dashboard/action-type-badge";
import { formatCurrency, daysSince } from "@/lib/utils";
import {
  ArrowLeft,
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  CheckSquare,
  TrendingUp,
} from "lucide-react";

interface Props {
  client: any;
}

const interactionTypeIcons: Record<string, any> = {
  call: Phone,
  email: Mail,
  meeting: Calendar,
  message: MessageSquare,
  note: MessageSquare,
};

const engagementHealthColors: Record<string, string> = {
  green: "border-l-emerald-400",
  yellow: "border-l-amber-400",
  red: "border-l-red-400",
};

const deliverableStatusColors: Record<string, string> = {
  not_started: "text-muted-foreground",
  in_progress: "text-blue-600",
  in_review: "text-amber-600",
  complete: "text-emerald-600",
};

export function ClientDetailView({ client }: Props) {
  const activeEngagements = client.engagements?.filter((e: any) => e.status === "active") ?? [];
  const openActions = client.actions ?? [];
  const recentInteractions = client.interactions ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/clients"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
          >
            <ArrowLeft className="h-3 w-3" />
            All Clients
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{client.name}</h1>
            <HealthDot health={client.health} showLabel />
            <Badge variant="outline">{client.tier} Tier</Badge>
            <Badge
              variant={
                client.status === "active"
                  ? "green"
                  : client.status === "prospect"
                  ? "blue"
                  : "outline"
              }
            >
              {client.status}
            </Badge>
          </div>
          <div className="flex items-center gap-4 mt-1">
            {client.industry && (
              <p className="text-sm text-muted-foreground">{client.industry}</p>
            )}
            {client.arrValue ? (
              <p className="text-sm text-muted-foreground">
                {formatCurrency(client.arrValue)}/yr
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">Log Interaction</Button>
          <Button size="sm">Add Action</Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left column: Engagements + Actions */}
        <div className="col-span-2 space-y-6">
          {/* Active Engagements */}
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
              Active Engagements ({activeEngagements.length})
            </h2>
            {activeEngagements.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active engagements.</p>
            ) : (
              <div className="space-y-3">
                {activeEngagements.map((eng: any) => (
                  <Card
                    key={eng.id}
                    className={`border-l-4 ${engagementHealthColors[eng.health] ?? "border-l-gray-200"}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm">{eng.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {eng.type} · {eng.billingType}
                            {eng.value ? ` · ${formatCurrency(eng.value)}` : ""}
                          </p>
                        </div>
                        <HealthDot health={eng.health} showLabel />
                      </div>
                      {eng.deliverables?.length > 0 && (
                        <div className="mt-3 space-y-1">
                          {eng.deliverables.map((d: any) => (
                            <div key={d.id} className="flex items-center gap-2 text-xs">
                              <CheckSquare className="h-3 w-3 text-muted-foreground" />
                              <span className={deliverableStatusColors[d.status] ?? ""}>
                                {d.title}
                              </span>
                              {d.dueDate && (
                                <span className="text-muted-foreground ml-auto">
                                  Due {d.dueDate}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* Open Actions */}
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
              Open Actions ({openActions.length})
            </h2>
            {openActions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No open actions.</p>
            ) : (
              <div className="space-y-2">
                {openActions.map((action: any) => (
                  <Card key={action.id}>
                    <CardContent className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <ActionTypeBadge type={action.type} />
                        <div>
                          <p className="text-sm font-medium">{action.title}</p>
                          {action.aiSuggestion && (
                            <p className="text-xs text-muted-foreground">{action.aiSuggestion}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {action.dueDate && (
                          <span className="text-xs text-muted-foreground">{action.dueDate}</span>
                        )}
                        <Badge variant="outline" className="text-xs">
                          Score: {Math.round(action.priorityScore ?? 0)}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right column: Contacts + Interactions */}
        <div className="space-y-6">
          {/* Contacts */}
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
              Contacts
            </h2>
            <div className="space-y-2">
              {(client.contacts ?? []).map((contact: any) => {
                const days = daysSince(contact.lastContactDate);
                return (
                  <Card key={contact.id}>
                    <CardContent className="p-3">
                      <p className="text-sm font-medium">
                        {contact.firstName} {contact.lastName}
                      </p>
                      {contact.role && (
                        <p className="text-xs text-muted-foreground">{contact.role}</p>
                      )}
                      {contact.seniority && (
                        <Badge variant="outline" className="text-xs mt-1">
                          {contact.seniority.replace("_", " ")}
                        </Badge>
                      )}
                      {days != null && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Last contact: {days}d ago
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* Interaction Timeline */}
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
              Recent Interactions
            </h2>
            {recentInteractions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No interactions logged.</p>
            ) : (
              <div className="space-y-2">
                {recentInteractions.slice(0, 8).map((interaction: any) => {
                  const Icon = interactionTypeIcons[interaction.type] ?? MessageSquare;
                  return (
                    <div key={interaction.id} className="flex gap-3">
                      <div className="mt-0.5 h-6 w-6 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <Icon className="h-3 w-3 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-xs font-medium">{interaction.summary}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(interaction.date).toLocaleDateString()}
                        </p>
                        {interaction.nextSteps && (
                          <p className="text-xs text-amber-600 mt-0.5">→ {interaction.nextSteps}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Notes */}
      {client.ownerNotes && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            Notes
          </h2>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{client.ownerNotes}</p>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}
