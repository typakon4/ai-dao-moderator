"use client";

import { useState } from "react";
import { useWallet } from "@/lib/genlayer/WalletProvider";
import { Navbar } from "@/components/Navbar";
import { useProposals, useSubmitProposal, useVote } from "@/lib/hooks/useDAOModerator";
import { ProposalCard } from "@/components/ProposalCard";
import { SubmitProposalModal } from "@/components/SubmitProposalModal";
import { VoteModal } from "@/components/VoteModal";
import { toast } from "sonner";
import { FileText, MessageSquare, BarChart3 } from "lucide-react";
import type { Proposal } from "@/lib/contracts/AIDAOModerator";

export default function HomePage() {
  const { address, isConnected, connectWallet } = useWallet();
  const [submitOpen, setSubmitOpen] = useState(false);
  const [voteProposal, setVoteProposal] = useState<Proposal | null>(null);

  const { data: proposals, isLoading } = useProposals();
  const submitMutation = useSubmitProposal(address);
  const voteMutation = useVote(address);

  const handleSubmit = async (pid: string, title: string, body: string) => {
    setSubmitOpen(false);
    const toastId = toast.loading("AI is evaluating your proposal...");
    try {
      await submitMutation.mutateAsync({ pid, title, body });
      toast.success("Proposal submitted! AI has evaluated it.", { id: toastId });
    } catch (err: any) {
      toast.error("Submission failed", { id: toastId, description: err?.message ?? "Please try again." });
    }
  };

  const handleVote = async (pid: string, support: boolean, argument: string) => {
    setVoteProposal(null);
    const toastId = toast.loading("AI is scoring your argument...");
    try {
      await voteMutation.mutateAsync({ pid, support, argument });
      toast.success("Vote cast! AI scored your argument.", { id: toastId });
    } catch (err: any) {
      toast.error("Vote failed", { id: toastId, description: err?.message ?? "Please try again." });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 pt-20 pb-12 text-center animate-fade-in">
        <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-[oklch(0.65_0.22_300)] to-[oklch(0.78_0.18_330)] bg-clip-text text-transparent">AI DAO Moderator</h1>
        <p className="mt-4 text-muted-foreground text-lg max-w-2xl mx-auto">
          Governance where AI filters noise and rewards quality thinking. Built on GenLayer.
        </p>
        <button
          onClick={() => isConnected ? setSubmitOpen(true) : connectWallet()}
          className="mt-8 px-6 py-3 rounded-lg gradient-purple-pink text-white font-semibold hover:brightness-110 hover:-translate-y-0.5 transition-all shadow-[0_2px_8px_oklch(0.65_0.22_300/0.3)]"
        >
          {isConnected ? "+ Submit Proposal" : "Connect Wallet to Submit"}
        </button>
      </section>

      {/* Proposals */}
      <main className="flex-grow max-w-5xl mx-auto w-full px-4 pb-16">
        {!process.env.NEXT_PUBLIC_CONTRACT_ADDRESS && (
          <p className="text-center text-yellow-400 text-sm py-2 mb-4">⚠️ Contract address not set in .env.local</p>
        )}

        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="brand-card p-5 flex flex-col gap-3 animate-pulse">
                <div className="h-5 bg-white/10 rounded w-3/4" />
                <div className="h-4 bg-white/5 rounded w-full" />
                <div className="h-4 bg-white/5 rounded w-2/3" />
                <div className="h-2 bg-white/10 rounded-full w-full mt-1" />
                <div className="h-6 w-20 bg-white/10 rounded-full" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && (!proposals || proposals.length === 0) && (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <div className="size-16 rounded-2xl bg-accent/10 flex items-center justify-center">
              <FileText className="size-8 text-accent/50" />
            </div>
            <div>
              <p className="text-lg font-semibold">No proposals yet</p>
              <p className="text-sm text-muted-foreground mt-1">Be the first to submit a proposal for the DAO.</p>
            </div>
            <button
              onClick={() => isConnected ? setSubmitOpen(true) : connectWallet()}
              className="mt-1 px-5 py-2.5 rounded-lg gradient-purple-pink text-white text-sm font-semibold hover:brightness-110 hover:-translate-y-0.5 transition-all shadow-[0_2px_8px_oklch(0.65_0.22_300/0.3)]"
            >
              {isConnected ? "+ Submit First Proposal" : "Connect Wallet to Submit"}
            </button>
          </div>
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
              <div className="mb-3 size-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <FileText className="size-5 text-accent" />
              </div>
              <div className="text-accent font-bold mb-2">1. Submit Proposal</div>
              <p className="text-sm text-muted-foreground">AI reviews your proposal against the DAO constitution. Spam and off-mission ideas are filtered before reaching a vote.</p>
            </div>
            <div className="glass-card p-6">
              <div className="mb-3 size-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <MessageSquare className="size-5 text-accent" />
              </div>
              <div className="text-accent font-bold mb-2">2. Vote with Argument</div>
              <p className="text-sm text-muted-foreground">Cast your vote with a written argument. AI scores the quality of your reasoning 1-10. Better arguments carry more weight.</p>
            </div>
            <div className="glass-card p-6">
              <div className="mb-3 size-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <BarChart3 className="size-5 text-accent" />
              </div>
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
