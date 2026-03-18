import { api } from "@/lib/trpc/server";
import { ProposalPipelineView } from "@/components/dashboard/proposal-pipeline-view";

export default async function ProposalsPage() {
  const pipeline = await api.proposals.pipeline.query().catch(() => ({
    proposals: [],
    weightedValue: 0,
  }));
  return <ProposalPipelineView pipeline={pipeline} />;
}
