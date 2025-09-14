'use client';

import { useState } from 'react';
import { useConnect, useDisconnect } from 'wagmi';
import { useWallet } from '../context';
import { useTranslations } from 'next-intl';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WalletModal({ isOpen, onClose }: WalletModalProps) {
  const t = useTranslations();
  const { connectors, connect, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const { isConnected, address, currentChain } = useWallet();
  const [isConnecting, setIsConnecting] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConnect = async (connector: any) => {
    try {
      setIsConnecting(connector.id);
      await connect({ connector });
      onClose();
    } catch (err) {
      console.error('Connection failed:', err);
    } finally {
      setIsConnecting(null);
    }
  };

  const handleDisconnect = async () => {
    await disconnect();
    onClose();
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-binance-panel border border-gray-700 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-binance-text">
            💳 {t('wallet.connect')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        {isConnected ? (
          // Connected State
          <div className="space-y-4">
            <div className="bg-binance-dark p-4 rounded-lg">
              <div className="text-sm text-gray-400 mb-1">{t('wallet.address')}</div>
              <div className="text-binance-text font-mono">
                {address ? formatAddress(address) : 'N/A'}
              </div>
            </div>

            {currentChain && (
              <div className="bg-binance-dark p-4 rounded-lg">
                <div className="text-sm text-gray-400 mb-1">{t('wallet.network')}</div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-binance-green rounded-full"></div>
                  <span className="text-binance-text">{currentChain.name}</span>
                </div>
              </div>
            )}

            <button
              onClick={handleDisconnect}
              className="w-full btn-secondary py-3 text-center"
            >
              🔌 {t('wallet.disconnect')}
            </button>
          </div>
        ) : (
          // Connection Options
          <div className="space-y-3">
            <p className="text-gray-300 text-sm mb-4">
              {t('wallet.connectDescription')}
            </p>

            {connectors.map((connector) => (
              <button
                key={connector.id}
                onClick={() => handleConnect(connector)}
                disabled={isPending || isConnecting === connector.id}
                className="w-full p-4 border border-gray-600 rounded-lg hover:bg-binance-dark 
                          transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  {getConnectorIcon(connector.id)}
                  <span className="text-binance-text font-medium">
                    {getConnectorName(connector.id)}
                  </span>
                </div>
                
                {isConnecting === connector.id ? (
                  <div className="animate-spin w-4 h-4 border-2 border-binance-yellow 
                                border-t-transparent rounded-full"></div>
                ) : (
                  <span className="text-gray-400">→</span>
                )}
              </button>
            ))}

            {error && (
              <div className="mt-4 p-3 bg-binance-red bg-opacity-20 border border-binance-red 
                            rounded-lg text-binance-red text-sm">
                ❌ {error.message}
              </div>
            )}

            <div className="mt-6 text-xs text-gray-400 text-center">
              <p>{t('wallet.secureConnection')}</p>
              <p className="mt-1">{t('wallet.noPrivateKeys')}</p>
            </div>
          </div>
        )}

        {/* Supported Networks */}
        <div className="mt-6 pt-4 border-t border-gray-700">
          <div className="text-sm text-gray-400 mb-2">{t('wallet.supportedNetworks')}</div>
          <div className="flex flex-wrap gap-2">
            {[
              { name: 'Ethereum', icon: '🔗' },
              { name: 'Polygon', icon: '🔷' },
              { name: 'BSC', icon: '🟨' },
              { name: 'Arbitrum', icon: '🔵' },
              { name: 'Optimism', icon: '🔴' },
            ].map((network) => (
              <span
                key={network.name}
                className="text-xs bg-binance-dark px-2 py-1 rounded flex items-center gap-1"
              >
                {network.icon} {network.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function getConnectorIcon(connectorId: string) {
  const icons: Record<string, string> = {
    'metaMask': '🦊',
    'walletConnect': '🔗',
    'coinbaseWallet': '🔵',
    'injected': '💳',
    'safe': '🛡️',
  };
  
  return <span className="text-lg">{icons[connectorId] || '💳'}</span>;
}

function getConnectorName(connectorId: string) {
  const names: Record<string, string> = {
    'metaMask': 'MetaMask',
    'walletConnect': 'WalletConnect',
    'coinbaseWallet': 'Coinbase Wallet',
    'injected': 'Browser Wallet',
    'safe': 'Safe Wallet',
  };
  
  return names[connectorId] || connectorId;
}
