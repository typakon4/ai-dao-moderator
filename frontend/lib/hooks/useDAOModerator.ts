import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AIDAOModerator from "@/lib/contracts/AIDAOModerator";
import type { TransactionReceipt, Proposal, VoteResult } from "@/lib/contracts/AIDAOModerator";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000";
const STUDIO_URL = process.env.NEXT_PUBLIC_STUDIO_URL;

function getContract(address?: string | null) {
  return new AIDAOModerator(CONTRACT_ADDRESS, address, STUDIO_URL);
}

export function useProposals() {
  return useQuery<Proposal[]>({
    queryKey: ["proposals"],
    queryFn: () => getContract(null).getAllProposals(),
    refetchInterval: 10000,
    staleTime: 5000,
  });
}

export function useResult(pid: string) {
  return useQuery<VoteResult>({
    queryKey: ["result", pid],
    queryFn: () => getContract(null).getResult(pid),
    enabled: !!pid,
  });
}

export function useSubmitProposal(address?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ pid, title, body }: { pid: string; title: string; body: string }): Promise<TransactionReceipt> => {
      return getContract(address).submitProposal(pid, title, body);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["proposals"] }); },
  });
}

export function useVote(address?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ pid, support, argument }: { pid: string; support: boolean; argument: string }): Promise<TransactionReceipt> => {
      return getContract(address).vote(pid, support, argument);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
      queryClient.invalidateQueries({ queryKey: ["result"] });
    },
  });
}
