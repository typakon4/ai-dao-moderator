"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Proposal } from "@/lib/contracts/AIDAOModerator";

interface VoteModalProps {
  proposal: Proposal | null;
  open: boolean;
  onClose: () => void;
  onVote: (pid: string, support: boolean, argument: string) => Promise<void>;
}

export function VoteModal({ proposal, open, onClose, onVote }: VoteModalProps) {
  const [support, setSupport] = useState<boolean | null>(null);
  const [argument, setArgument] = useState("");
  const [loading, setLoading] = useState(false);

  const argTooShort = argument.length > 0 && argument.length < 10;

  const handleVote = async () => {
    if (support === null || !proposal || !argument || argTooShort) return;
    setLoading(true);
    try {
      await onVote(proposal.pid, support, argument);
      setSupport(null); setArgument("");
    } finally {
      setLoading(false);
    }
  };

  if (!proposal) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-background border-white/10">
        <DialogHeader>
          <DialogTitle>Vote: {proposal.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-3">
            {[true, false].map((val) => (
              <button
                key={String(val)}
                onClick={() => setSupport(val)}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition ${support === val ? "border-accent text-accent" : "border-white/10 text-muted-foreground"}`}
              >
                {val ? "👍 Support" : "👎 Oppose"}
              </button>
            ))}
          </div>
          <textarea
            className="w-full min-h-[120px] rounded-lg border border-white/10 bg-transparent p-3 text-sm resize-none focus:outline-none focus:border-accent"
            placeholder="Explain your reasoning (min 10 characters)..."
            value={argument}
            onChange={(e) => setArgument(e.target.value)}
            disabled={loading}
          />
          {argTooShort && <p className="text-red-400 text-sm">Argument must be at least 10 characters</p>}
          <div className="flex gap-3 justify-end">
            <button onClick={onClose} disabled={loading} className="px-4 py-2 rounded-lg border border-white/10 text-sm font-medium text-muted-foreground hover:border-white/20 transition">Cancel</button>
            <button onClick={handleVote} disabled={loading || support === null || !argument || argTooShort} className="px-4 py-2 rounded-lg bg-accent text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-50 transition">
              {loading ? "AI is scoring your argument..." : "Cast Vote"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
