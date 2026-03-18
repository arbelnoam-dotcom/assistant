"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HealthDot } from "@/components/dashboard/health-dot";
import { formatCurrency } from "@/lib/utils";
import { ChevronRight, ChevronLeft, Check } from "lucide-react";

const STEPS = [
  { id: "lookback", label: "Look Back" },
  { id: "pipeline", label: "Pipeline" },
  { id: "relationships", label: "Relationships" },
  { id: "plan", label: "Plan Ahead" },
  { id: "confirm", label: "Confirm" },
];

interface Props {
  queue: { today: any[]; thisWeek: any[]; waiting: any[]; backlog: any[] };
  pipeline: { proposals: any[]; weightedValue: number };
  coldContacts: any[];
  weekStart: string;
}

export function WeeklyReviewView({ queue, pipeline, coldContacts, weekStart }: Props) {
  const [step, setStep] = useState(0);
  const [wins, setWins] = useState("");
  const [misses, setMisses] = useState("");
  const [mustDos, setMustDos] = useState<number[]>([]);

  const current = STEPS[step];
  const allOpen = [...queue.today, ...queue.thisWeek, ...queue.waiting, ...queue.backlog];
  const topActions = allOpen.slice(0, 10);

  const toggleMustDo = (id: number) => {
    setMustDos((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 3 ? [...prev, id] : prev
    );
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Weekly Review</h1>
        <p className="text-muted-foreground text-sm mt-1">Week of {weekStart}</p>
      </div>

      {/* Step progress */}
      <div className="flex items-center gap-1">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-1">
            <button
              onClick={() => setStep(i)}
              className={`h-7 px-3 rounded-full text-xs font-medium transition-colors ${
                i === step
                  ? "bg-primary text-primary-foreground"
                  : i < step
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {i < step ? <Check className="h-3 w-3 inline mr-1" /> : null}
              {s.label}
            </button>
            {i < STEPS.length - 1 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
          </div>
        ))}
      </div>

      {/* Step content */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{current.label}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 0 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                You have{" "}
                <strong>
                  {queue.today.length + queue.thisWeek.length}
                </strong>{" "}
                open actions this week.
              </p>
              <div>
                <label className="text-sm font-medium">Wins this week</label>
                <textarea
                  value={wins}
                  onChange={(e) => setWins(e.target.value)}
                  placeholder="What shipped? What went well?"
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Misses / slipped items</label>
                <textarea
                  value={misses}
                  onChange={(e) => setMisses(e.target.value)}
                  placeholder="What slipped? What needs attention next week?"
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {pipeline.proposals.length} open deals · {formatCurrency(pipeline.weightedValue)} weighted
              </p>
              {pipeline.proposals.length === 0 ? (
                <p className="text-sm text-muted-foreground">No open proposals.</p>
              ) : (
                pipeline.proposals.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="text-sm font-medium">{p.client?.name}</p>
                      <p className="text-xs text-muted-foreground">{p.title}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{formatCurrency(p.value ?? 0)}</p>
                      <p className="text-xs text-muted-foreground">{p.stage}</p>
                      {(p.staleDays ?? 0) > 7 && (
                        <Badge variant="red" className="text-xs">{p.staleDays}d stale</Badge>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {coldContacts.length} relationships need attention.
              </p>
              {coldContacts.length === 0 ? (
                <p className="text-sm text-muted-foreground">All relationships are healthy.</p>
              ) : (
                coldContacts.slice(0, 8).map((c: any) => {
                  const last = c.lastContactDate ? new Date(c.lastContactDate) : null;
                  const days = last
                    ? Math.floor((Date.now() - last.getTime()) / 86400000)
                    : null;
                  return (
                    <div key={c.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="text-sm font-medium">
                          {c.firstName} {c.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">{c.client?.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          {days != null ? `${days}d ago` : "Never contacted"}
                        </p>
                        <Button variant="ghost" size="sm" className="h-6 text-xs">
                          Reach out
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Select your <strong>3 must-dos</strong> for next week. ({mustDos.length}/3 selected)
              </p>
              {topActions.map((action: any) => (
                <button
                  key={action.id}
                  onClick={() => toggleMustDo(action.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    mustDos.includes(action.id)
                      ? "border-primary bg-primary/5"
                      : "hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{action.title}</p>
                      {action.client && (
                        <p className="text-xs text-muted-foreground">{action.client.name}</p>
                      )}
                    </div>
                    {mustDos.includes(action.id) && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted">
                <h3 className="text-sm font-semibold mb-2">This week&apos;s 3 must-dos</h3>
                {mustDos.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No must-dos selected.</p>
                ) : (
                  <ol className="space-y-1">
                    {mustDos.map((id, i) => {
                      const action = topActions.find((a: any) => a.id === id);
                      return (
                        <li key={id} className="text-sm">
                          {i + 1}. {action?.title ?? "Unknown"}
                        </li>
                      );
                    })}
                  </ol>
                )}
              </div>
              {wins && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Wins</p>
                  <p className="text-sm whitespace-pre-wrap">{wins}</p>
                </div>
              )}
              {misses && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Misses</p>
                  <p className="text-sm whitespace-pre-wrap">{misses}</p>
                </div>
              )}
              <Button className="w-full">Save Weekly Plan</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
        <span className="text-xs text-muted-foreground">
          Step {step + 1} of {STEPS.length}
        </span>
        <Button
          size="sm"
          onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
          disabled={step === STEPS.length - 1}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
