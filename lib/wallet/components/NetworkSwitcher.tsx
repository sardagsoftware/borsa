'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '../context';
import { ENABLED_CHAINS as SUPPORTED_CHAINS } from '../config';
import { useTranslations } from 'next-intl';

export default function NetworkSwitcher() {
  const t = useTranslations();
  const { chainId, switchChain, currentChain } = useWallet();
  const [isOpen, setIsOpen] = useState(false);
  const [switching, setSwitching] = useState<number | null>(null);

  const handleSwitchChain = async (targetChainId: number) => {
    try {
      setSwitching(targetChainId);
      await switchChain(targetChainId);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to switch chain:', error);
    } finally {
      setSwitching(null);
    }
  };

  const getNetworkIcon = (chainId: number) => {
    const icons: Record<number, string> = {
      1: '🔗', // Ethereum
      137: '🔷', // Polygon
      56: '🟨', // BSC
      42161: '🔵', // Arbitrum
      10: '🔴', // Optimism
    };
    return icons[chainId] || '⚡';
  };

  const getNetworkColor = (chainId: number) => {
    const colors: Record<number, string> = {
      1: 'text-blue-400',
      137: 'text-purple-400',
      56: 'text-yellow-400',
      42161: 'text-blue-300',
      10: 'text-red-400',
    };
    return colors[chainId] || 'text-gray-400';
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.network-switcher')) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className="network-switcher relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-binance-panel border border-gray-600 
                  rounded-lg px-3 py-2 hover:bg-binance-dark transition-colors"
      >
        {currentChain ? (
          <>
            <span className="text-lg">{getNetworkIcon(currentChain.id)}</span>
            <span className={`text-sm font-medium ${getNetworkColor(currentChain.id)}`}>
              {currentChain.symbol}
            </span>
          </>
        ) : (
          <>
            <span className="text-lg">⚡</span>
            <span className="text-sm text-gray-400">{t('wallet.selectNetwork')}</span>
          </>
        )}
        <svg 
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full mt-1 right-0 bg-binance-panel border border-gray-600 
                      rounded-lg shadow-xl z-50 min-w-[200px]">
          <div className="p-2">
            <div className="text-xs text-gray-400 px-2 py-1 mb-1">
              {t('wallet.availableNetworks')}
            </div>
            
            {Object.values(SUPPORTED_CHAINS).map((network) => (
              <button
                key={network.id}
                onClick={() => handleSwitchChain(network.id)}
                disabled={switching === network.id}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left
                          hover:bg-binance-dark transition-colors
                          ${chainId === network.id ? 'bg-binance-dark border border-binance-yellow' : ''}
                          ${switching === network.id ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span className="text-lg">{getNetworkIcon(network.id)}</span>
                <div className="flex-1">
                  <div className={`text-sm font-medium ${getNetworkColor(network.id)}`}>
                    {network.name}
                  </div>
                  <div className="text-xs text-gray-400">
                    {network.nativeCurrency.symbol}
                  </div>
                </div>
                
                {chainId === network.id && (
                  <div className="w-2 h-2 bg-binance-green rounded-full"></div>
                )}
                
                {switching === network.id && (
                  <div className="w-4 h-4 border-2 border-binance-yellow border-t-transparent 
                                rounded-full animate-spin"></div>
                )}
              </button>
            ))}
          </div>

          {/* Gas Price Indicators */}
          <div className="border-t border-gray-700 p-2">
            <div className="text-xs text-gray-400 px-2 py-1">
              {t('wallet.gasPrices')}
            </div>
            <div className="grid grid-cols-3 gap-1 text-xs">
              <div className="text-center">
                <div className="text-green-400">⚡ {t('common.slow')}</div>
                <div className="text-gray-400">~30s</div>
              </div>
              <div className="text-center">
                <div className="text-yellow-400">⚡ {t('common.standard')}</div>
                <div className="text-gray-400">~15s</div>
              </div>
              <div className="text-center">
                <div className="text-red-400">⚡ {t('common.fast')}</div>
                <div className="text-gray-400">~5s</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
