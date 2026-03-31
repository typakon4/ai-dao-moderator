"use client";

import type { Proposal } from "@/lib/contracts/AIDAOModerator";
import { useResult } from "@/lib/hooks/useDAOModerator";

interface ProposalCardProps {
  proposal: Proposal;
  onVote: (proposal: Proposal) => void;
}

export function ProposalCard({ proposal, onVote }: ProposalCardProps) {
  const { data: result } = useResult(proposal.pid);

  const truncatedBody = proposal.body.length > 120 ? proposal.body.slice(0, 120) + "..." : proposal.body;
  const totalWeight = (result?.yes_weight ?? 0) + (result?.no_weight ?? 0);
  const yesPercent = totalWeight > 0 ? ((result?.yes_weight ?? 0) / totalWeight) * 100 : 0;
  const noPercent = totalWeight > 0 ? ((result?.no_weight ?? 0) / totalWeight) * 100 : 0;

  return (
    <div className="glass-card p-5 flex flex-col gap-3">
      <h3 className="font-bold text-lg">{proposal.title}</h3>
      <p className="text-sm text-muted-foreground">{truncatedBody}</p>

      <div>
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
          <span>AI Score</span>
          <span className="text-accent font-semibold">{proposal.score}/100</span>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${Math.min(proposal.score, 100)}%` }} />
        </div>
      </div>

      {proposal.reason && <p className="text-xs italic text-muted-foreground">{proposal.reason}</p>}

      <div>
        {proposal.approved ? (
          <span className="inline-block px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-400 font-medium">✅ Approved</span>
        ) : (
          <span className="inline-block px-2 py-1 text-xs rounded-full bg-red-500/20 text-red-400 font-medium">❌ Rejected</span>
        )}
      </div>

      {proposal.approved && !proposal.finalized && result && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="flex-1">
              <span className="text-xs text-muted-foreground">Yes</span>
              <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${yesPercent}%` }} />
              </div>
            </div>
            <div className="flex-1">
              <span className="text-xs text-muted-foreground">No</span>
              <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-red-500 rounded-full transition-all" style={{ width: `${noPercent}%` }} />
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Yes: {result.yes_weight} | No: {result.no_weight} | Votes: {result.total_votes}</p>
          <button
            onClick={() => onVote(proposal)}
            className="w-full py-2 text-sm font-semibold rounded-lg border border-accent text-accent hover:bg-accent hover:text-accent-foreground transition"
          >
            Vote
          </button>
        </div>
      )}

      {proposal.finalized && (
        <div className="mt-2">
          {proposal.vote_passed
            ? <span className="text-sm text-green-400 font-semibold">🏁 Final: Passed</span>
            : <span className="text-sm text-muted-foreground font-semibold">🏁 Final: Failed</span>
          }
        </div>
      )}
    </div>
  );
}
