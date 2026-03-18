import { Badge } from "@/components/ui/badge";

type ActionType = "deliverable" | "proposal_action" | "relationship" | "internal" | "strategic" | "capture";

const config: Record<ActionType, { label: string; variant: "blue" | "purple" | "green" | "yellow" | "red" | "outline" }> = {
  deliverable: { label: "Deliverable", variant: "blue" },
  proposal_action: { label: "Proposal", variant: "purple" },
  relationship: { label: "Relationship", variant: "green" },
  internal: { label: "Internal", variant: "outline" },
  strategic: { label: "Strategic", variant: "yellow" },
  capture: { label: "Inbox", variant: "outline" },
};

export function ActionTypeBadge({ type }: { type: ActionType }) {
  const { label, variant } = config[type] ?? { label: type, variant: "outline" };
  return <Badge variant={variant}>{label}</Badge>;
}
