"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ActionTypeBadge } from "@/components/dashboard/action-type-badge";
import { formatCurrency, daysUntil } from "@/lib/utils";
import { CheckSquare, Plus, Search, ChevronDown, ChevronRight } from "lucide-react";

interface Action {
  id: number;
  type: string;
  title: string;
  description: string | null;
  status: string;
  priority: number | null;
  dueDate: string | null;
  priorityScore: number | null;
  aiSuggestion: string | null;
  client?: { name: string } | null;
  engagement?: { title: string } | null;
  proposal?: { title: string; value: number | null } | null;
  contact?: { firstName: string; lastName: string } | null;
}

interface Queue {
  today: Action[];
  thisWeek: Action[];
  waiting: Action[];
  backlog: Action[];
}

const priorityDot: Record<number, string> = {
  1: "bg-red-500",
  2: "bg-amber-500",
  3: "bg-blue-400",
  4: "bg-gray-300",
};

export function ActionQueueView({ queue }: { queue: Queue }) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggle = (section: string) =>
    setCollapsed((prev) => ({ ...prev, [section]: !prev[section] }));

  const total = queue.today.length + queue.thisWeek.length + queue.waiting.length + queue.backlog.length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Action Queue</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {queue.today.length} due today · {total} total open
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Search className="h-4 w-4" />
            Search
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4" />
            Quick Add
          </Button>
        </div>
      </div>

      {/* Sections */}
      <QueueSection
        title="Today"
        items={queue.today}
        collapsed={collapsed["today"]}
        onToggle={() => toggle("today")}
        emptyMessage="Nothing due today."
        accent="border-l-red-400"
      />
      <QueueSection
        title="This Week"
        items={queue.thisWeek}
        collapsed={collapsed["thisWeek"]}
        onToggle={() => toggle("thisWeek")}
        emptyMessage="Nothing due this week."
        accent="border-l-amber-400"
      />
      <QueueSection
        title="Waiting"
        items={queue.waiting}
        collapsed={collapsed["waiting"]}
        onToggle={() => toggle("waiting")}
        emptyMessage="No waiting items."
        accent="border-l-gray-300"
      />
      <QueueSection
        title="Backlog"
        items={queue.backlog}
        collapsed={collapsed["backlog"]}
        onToggle={() => toggle("backlog")}
        emptyMessage="Backlog is clear."
        accent="border-l-gray-200"
      />
    </div>
  );
}

function QueueSection({
  title,
  items,
  collapsed,
  onToggle,
  emptyMessage,
  accent,
}: {
  title: string;
  items: Action[];
  collapsed?: boolean;
  onToggle: () => void;
  emptyMessage: string;
  accent: string;
}) {
  return (
    <section>
      <button
        onClick={onToggle}
        className="flex items-center gap-2 mb-3 w-full text-left"
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </h2>
        <Badge variant="outline" className="text-xs">
          {items.length}
        </Badge>
      </button>

      {!collapsed && (
        <div className="space-y-2">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground pl-6">{emptyMessage}</p>
          ) : (
            items.map((action) => (
              <ActionRow key={action.id} action={action} accent={accent} />
            ))
          )}
        </div>
      )}
    </section>
  );
}

function ActionRow({ action, accent }: { action: Action; accent: string }) {
  const days = daysUntil(action.dueDate);
  const isOverdue = days !== null && days < 0;
  const isDueToday = days === 0;

  return (
    <Card className={`border-l-4 ${accent} hover:border-primary/40 transition-colors`}>
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          {/* Priority dot */}
          <div className="mt-1.5">
            <div
              className={`h-2 w-2 rounded-full ${priorityDot[action.priority ?? 3] ?? "bg-gray-300"}`}
            />
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className="text-sm font-medium leading-snug">{action.title}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <ActionTypeBadge type={action.type as any} />
                  {action.client && (
                    <span className="text-xs text-muted-foreground">{action.client.name}</span>
                  )}
                  {action.engagement && (
                    <span className="text-xs text-muted-foreground">
                      · {action.engagement.title}
                    </span>
                  )}
                  {action.proposal && (
                    <span className="text-xs text-muted-foreground">
                      · {formatCurrency(action.proposal.value ?? 0)} proposal
                    </span>
                  )}
                </div>
                {action.aiSuggestion && (
                  <p className="text-xs text-muted-foreground mt-1">{action.aiSuggestion}</p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {action.dueDate && (
                  <span
                    className={`text-xs ${
                      isOverdue
                        ? "text-red-600 font-semibold"
                        : isDueToday
                        ? "text-amber-600 font-semibold"
                        : "text-muted-foreground"
                    }`}
                  >
                    {isOverdue
                      ? `${Math.abs(days!)}d overdue`
                      : isDueToday
                      ? "Today"
                      : `${days}d`}
                  </span>
                )}
                <Badge variant="outline" className="text-xs">
                  {Math.round(action.priorityScore ?? 0)}
                </Badge>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                  <CheckSquare className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
