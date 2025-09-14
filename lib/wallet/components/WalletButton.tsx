'use client';

import { useWallet } from '../context';
import { useTranslations } from 'next-intl';

export default function WalletButton() {
  const t = useTranslations();
  const { 
    isConnected, 
    address, 
    balance, 
    balanceSymbol, 
    currentChain,
    setWalletModalOpen 
  } = useWallet();

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
  };

  const formatBalance = (bal: string) => {
    const num = parseFloat(bal);
    if (num > 1000) return `${(num / 1000).toFixed(1)}K`;
    if (num > 1) return num.toFixed(2);
    return num.toFixed(4);
  };

  if (!isConnected) {
    return (
      <button
        onClick={() => setWalletModalOpen(true)}
        className="btn-primary px-4 py-2 text-sm font-medium"
      >
        💳 {t('wallet.connect')}
      </button>
    );
  }

  return (
    <button
      onClick={() => setWalletModalOpen(true)}
      className="bg-binance-panel border border-gray-600 rounded-lg p-3 hover:bg-binance-dark 
                transition-colors min-w-[140px]"
    >
      <div className="flex items-center justify-between gap-2">
        {/* Network Indicator */}
        <div className="flex items-center gap-1">
          {currentChain && (
            <div className="w-2 h-2 bg-binance-green rounded-full"></div>
          )}
          <span className="text-xs text-gray-400">
            {currentChain?.symbol || 'ETH'}
          </span>
        </div>
        
        {/* Balance */}
        <div className="text-xs text-right">
          <div className="text-binance-text font-medium">
            {formatBalance(balance)} {balanceSymbol}
          </div>
          <div className="text-gray-400 font-mono">
            {address ? formatAddress(address) : ''}
          </div>
        </div>
      </div>
    </button>
  );
}
