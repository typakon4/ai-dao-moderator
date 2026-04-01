"use client";

import { useWallet } from "@/lib/genlayer/WalletProvider";
import { switchToGenLayerNetwork } from "@/lib/genlayer/client";
import { error } from "@/lib/utils/toast";
import { X } from "lucide-react";

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function AccountPanel() {
  const {
    address,
    isConnected,
    isLoading,
    isMetaMaskInstalled,
    isOnCorrectNetwork,
    connectWallet,
    disconnectWallet,
    switchWalletAccount,
  } = useWallet();

  const handleSwitchNetwork = async () => {
    try {
      await switchToGenLayerNetwork();
    } catch (err: any) {
      error("Failed to switch network", { description: err.message });
    }
  };

  if (isLoading) {
    return (
      <div className="h-9 w-32 rounded-full bg-white/5 animate-pulse" />
    );
  }

  if (!isMetaMaskInstalled) {
    return (
      <a
        href="https://metamask.io/download/"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20 transition-colors"
      >
        Install MetaMask
      </a>
    );
  }

  if (!isConnected) {
    return (
      <button
        onClick={connectWallet}
        className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium bg-accent text-white hover:bg-accent/80 transition-colors"
      >
        Connect Wallet
      </button>
    );
  }

  if (!isOnCorrectNetwork) {
    return (
      <button
        onClick={handleSwitchNetwork}
        className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 hover:bg-yellow-500/20 transition-colors"
      >
        <span className="size-2 rounded-full bg-yellow-400" />
        Wrong Network
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={switchWalletAccount}
        className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
        title="Switch account"
      >
        <span className="size-2 rounded-full bg-green-400" />
        {shortenAddress(address!)}
      </button>
      <button
        onClick={disconnectWallet}
        className="inline-flex items-center rounded-full px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
        title="Disconnect"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
