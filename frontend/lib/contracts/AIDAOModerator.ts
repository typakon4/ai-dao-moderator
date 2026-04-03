import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";

export interface Proposal {
  pid: string;
  title: string;
  body: string;
  approved: boolean;
  score: number;
  reason: string;
  finalized: boolean;
  vote_passed: boolean;
}

export interface VoteResult {
  pid: string;
  approved: boolean;
  ai_score: number;
  yes_weight: number;
  no_weight: number;
  total_votes: number;
  vote_passed: boolean;
  finalized: boolean;
  final_result: boolean;
}

export type TransactionReceipt = any;

class AIDAOModerator {
  private contractAddress: `0x${string}`;
  private client: ReturnType<typeof createClient>;

  constructor(contractAddress: string, address?: string | null, studioUrl?: string) {
    this.contractAddress = contractAddress as `0x${string}`;
    const config: any = { chain: studionet };
    if (address) config.account = address as `0x${string}`;
    if (studioUrl) config.endpoint = studioUrl;
    this.client = createClient(config);
  }

  updateAccount(address: string): void {
    this.client = createClient({ chain: studionet, account: address as `0x${string}` });
  }

  async getAllProposals(): Promise<Proposal[]> {
    const result = await this.client.readContract({
      address: this.contractAddress,
      functionName: "get_all_proposals",
      args: [],
    });

    if (!result) return [];
    if (Array.isArray(result)) return result.map((item: any) => this.parseProposal(item));

    if (typeof result === "object") {
      if (Array.isArray((result as any).entries)) {
        return (result as any).entries.map((e: any) => this.parseProposal(e));
      }
      const entries: any[] = [];
      let i = 0;
      while ((result as any)[i] !== undefined) { entries.push((result as any)[i]); i++; }
      if (entries.length > 0) return entries.map((e) => this.parseProposal(e));
    }

    return [];
  }

  private mapToObject(raw: any): any {
    if (raw instanceof Map) {
      const obj: any = {};
      for (const [k, v] of raw.entries()) {
        const key = k instanceof Uint8Array ? new TextDecoder().decode(k) : String(k);
        obj[key] = v instanceof Map ? this.mapToObject(v) : v;
      }
      return obj;
    }
    return raw;
  }

  private parseProposal(raw: any): Proposal {
    raw = this.mapToObject(raw);
    if (Array.isArray(raw)) {
      return { pid: raw[0] ?? "", title: raw[1] ?? "", body: raw[2] ?? "", approved: raw[3] ?? false, score: Number(raw[4]) || 0, reason: raw[5] ?? "", finalized: raw[6] ?? false, vote_passed: raw[7] ?? false };
    }
    return {
      pid: raw.pid ?? "", title: raw.title ?? "", body: raw.body ?? "",
      approved: raw.approved ?? false, score: Number(raw.score) || 0,
      reason: raw.reason ?? "", finalized: raw.finalized ?? false, vote_passed: raw.vote_passed ?? false,
    };
  }

  async getResult(pid: string): Promise<VoteResult> {
    const result = await this.client.readContract({ address: this.contractAddress, functionName: "get_result", args: [pid] });
    return this.parseVoteResult(result);
  }

  private parseVoteResult(raw: any): VoteResult {
    raw = this.mapToObject(raw);
    if (Array.isArray(raw)) {
      return { pid: raw[0] ?? "", approved: raw[1] ?? false, ai_score: Number(raw[2]) || 0, yes_weight: Number(raw[3]) || 0, no_weight: Number(raw[4]) || 0, total_votes: Number(raw[5]) || 0, vote_passed: raw[6] ?? false, finalized: raw[7] ?? false, final_result: raw[8] ?? false };
    }
    return {
      pid: raw.pid ?? "", approved: raw.approved ?? false, ai_score: Number(raw.ai_score) || 0,
      yes_weight: Number(raw.yes_weight) || 0, no_weight: Number(raw.no_weight) || 0,
      total_votes: Number(raw.total_votes) || 0, vote_passed: raw.vote_passed ?? false,
      finalized: raw.finalized ?? false, final_result: raw.final_result ?? false,
    };
  }

  private async waitAndVerify(hash: string): Promise<TransactionReceipt> {
    const receipt = await this.client.waitForTransactionReceipt({
      hash: hash as any,
      status: "ACCEPTED" as any,
      retries: 36,
      interval: 5000,
    });
    // waitForTransactionReceipt resolves on ANY decided state (ACCEPTED, UNDETERMINED,
    // LEADER_TIMEOUT, VALIDATORS_TIMEOUT, CANCELED). Only ACCEPTED means state was saved.
    const statusName: string = (receipt as any)?.statusName ?? (receipt as any)?.status_name ?? "";
    if (statusName && statusName !== "ACCEPTED" && statusName !== "FINALIZED") {
      throw new Error(`Transaction did not succeed (status: ${statusName}). The AI validators may have timed out — please try again.`);
    }
    return receipt;
  }

  async submitProposal(pid: string, title: string, body: string): Promise<TransactionReceipt> {
    const hash = await (this.client as any).writeContract({ address: this.contractAddress, functionName: "submit_proposal", args: [pid, title, body] });
    return this.waitAndVerify(hash as string);
  }

  async vote(pid: string, support: boolean, argument: string): Promise<TransactionReceipt> {
    const hash = await (this.client as any).writeContract({ address: this.contractAddress, functionName: "vote", args: [pid, support, argument] });
    return this.waitAndVerify(hash as string);
  }

  async finalizeVotes(pid: string, minYesWeight: number): Promise<TransactionReceipt> {
    const hash = await (this.client as any).writeContract({ address: this.contractAddress, functionName: "finalize_votes", args: [pid, minYesWeight] });
    return this.waitAndVerify(hash as string);
  }
}

export default AIDAOModerator;
