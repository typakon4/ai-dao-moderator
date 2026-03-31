"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { Navbar } from "@/components/Navbar";
import { useProposals, useSubmitProposal, useVote } from "@/lib/hooks/useDAOModerator";
import { ProposalCard } from "@/components/ProposalCard";
import { SubmitProposalModal } from "@/components/SubmitProposalModal";
import { VoteModal } from "@/components/VoteModal";
import { toast } from "sonner";
import type { Proposal } from "@/lib/contracts/AIDAOModerator";

export default function HomePage() {
  const { address } = useAccount();
  const [submitOpen, setSubmitOpen] = useState(false);
  const [voteProposal, setVoteProposal] = useState<Proposal | null>(null);

  const { data: proposals, isLoading } = useProposals();
  const submitMutation = useSubmitProposal(address);
  const voteMutation = useVote(address);

  const handleSubmit = async (pid: string, title: string, body: string) => {
    await submitMutation.mutateAsync({ pid, title, body });
    toast.success("Proposal submitted! AI is evaluating...");
  };

  const handleVote = async (pid: string, support: boolean, argument: string) => {
    await voteMutation.mutateAsync({ pid, support, argument });
    toast.success("Vote cast! AI scored your argument.");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 pt-20 pb-12 text-center animate-fade-in">
        <h1 className="text-4xl md:text-6xl font-bold">AI DAO Moderator</h1>
        <p className="mt-4 text-muted-foreground text-lg max-w-2xl mx-auto">
          Governance where AI filters noise and rewards quality thinking. Built on GenLayer.
        </p>
        <button
          onClick={() => setSubmitOpen(true)}
          className="mt-8 px-6 py-3 rounded-lg bg-accent text-accent-foreground font-semibold hover:opacity-90 transition"
        >
          + Submit Proposal
        </button>
      </section>

      {/* Proposals */}
      <main className="flex-grow max-w-5xl mx-auto w-full px-4 pb-16">
        {isLoading && (
          <p className="text-center text-muted-foreground animate-pulse py-12">Loading proposals...</p>
        )}
        {!isLoading && (!proposals || proposals.length === 0) && (
          <p className="text-center text-muted-foreground py-12">No proposals yet. Be the first!</p>
        )}
        {!isLoading && proposals && proposals.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {proposals.map((p: Proposal) => (
              <ProposalCard key={p.pid} proposal={p} onVote={setVoteProposal} />
            ))}
          </div>
        )}
      </main>

      {/* How it works */}
      <section className="border-t border-white/10 py-16">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8 text-center">How it Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card p-6">
              <div className="text-3xl mb-3">📝</div>
              <div className="text-accent font-bold mb-2">1. Submit Proposal</div>
              <p className="text-sm text-muted-foreground">AI reviews your proposal against the DAO constitution. Spam and off-mission ideas are filtered before reaching a vote.</p>
            </div>
            <div className="glass-card p-6">
              <div className="text-3xl mb-3">🗳️</div>
              <div className="text-accent font-bold mb-2">2. Vote with Argument</div>
              <p className="text-sm text-muted-foreground">Cast your vote with a written argument. AI scores the quality of your reasoning 1-10. Better arguments carry more weight.</p>
            </div>
            <div className="glass-card p-6">
              <div className="text-3xl mb-3">📊</div>
              <div className="text-accent font-bold mb-2">3. Results</div>
              <p className="text-sm text-muted-foreground">Weighted vote tallies determine outcomes. Quality thinking wins — not just token holdings.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-4">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-center gap-6 text-sm text-muted-foreground">
          <a href="https://genlayer.com" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">Powered by GenLayer</a>
          <a href="https://studio.genlayer.com" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">Studio</a>
          <a href="https://docs.genlayer.com" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">Docs</a>
        </div>
      </footer>

      <SubmitProposalModal open={submitOpen} onClose={() => setSubmitOpen(false)} onSubmit={handleSubmit} />
      <VoteModal proposal={voteProposal} open={!!voteProposal} onClose={() => setVoteProposal(null)} onVote={handleVote} />
    </div>
  );
}
