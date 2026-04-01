"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ThumbsUp, ThumbsDown } from "lucide-react";
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
            <button
              onClick={() => setSupport(true)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border text-sm font-medium transition-all ${
                support === true
                  ? "border-green-500 bg-green-500/10 text-green-400 shadow-[0_0_0_1px_oklch(0.65_0.2_142/0.3)]"
                  : "border-white/10 text-muted-foreground hover:border-green-500/40 hover:text-green-400/70"
              }`}
            >
              <ThumbsUp className="size-4" />
              Support
            </button>
            <button
              onClick={() => setSupport(false)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border text-sm font-medium transition-all ${
                support === false
                  ? "border-red-500 bg-red-500/10 text-red-400 shadow-[0_0_0_1px_oklch(0.65_0.25_25/0.3)]"
                  : "border-white/10 text-muted-foreground hover:border-red-500/40 hover:text-red-400/70"
              }`}
            >
              <ThumbsDown className="size-4" />
              Oppose
            </button>
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
            <button
              onClick={handleVote}
              disabled={loading || support === null || !argument || argTooShort}
              className="px-4 py-2 rounded-lg gradient-purple-pink text-sm font-medium text-white hover:brightness-110 disabled:opacity-50 disabled:hover:brightness-100 transition-all"
            >
              {loading ? "AI is scoring your argument..." : "Cast Vote"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
