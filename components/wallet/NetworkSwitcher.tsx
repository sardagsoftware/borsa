"use client";

import { useSwitchChain, useChainId } from "wagmi";
import { ENABLED_CHAIN_IDS, CHAINS, type ChainId } from "@/lib/wallet/chains";
import { toast } from "react-hot-toast";
import { Network } from "lucide-react";

export default function NetworkSwitcher() {
  const { switchChain, isPending } = useSwitchChain();
  const chainId = useChainId();

  const handleSwitchChain = async (targetChainId: ChainId) => {
    if (targetChainId === chainId) return;

    try {
      await switchChain({ chainId: targetChainId });
      toast.success(`Ağ değiştirildi: ${CHAINS[targetChainId].name}`);
    } catch (error: unknown) {
      const message = error && typeof error === 'object' && 'message' in error 
        ? String(error.message) 
        : 'Ağ değiştirme başarısız';
      toast.error(message);
    }
  };

  return (
    <div className="inline-flex items-center gap-2">
      <Network className="h-4 w-4 text-muted-foreground" />
      <div className="inline-flex items-center gap-1 rounded-md border border-border bg-card">
        {ENABLED_CHAIN_IDS.map((id) => {
          const chain = CHAINS[id];
          const isActive = chainId === id;
          const isDisabled = isPending;

          return (
            <button
              key={id}
              onClick={() => handleSwitchChain(id)}
              disabled={isDisabled}
              className={`
                px-3 py-1.5 text-xs font-medium transition-colors
                ${isActive 
                  ? 'bg-primary text-primary-foreground' 
                  : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                }
                ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                first:rounded-l-md last:rounded-r-md
              `}
              title={`Switch to ${chain.name}`}
            >
              {chain.symbol}
            </button>
          );
        })}
      </div>
    </div>
  );
}
