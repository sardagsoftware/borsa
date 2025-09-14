'use client';

import { useAccount, useConnect } from 'wagmi';

export default function WalletDebug() {
  const { address, isConnected, isConnecting, chain } = useAccount();
  const { connectors, error, isError } = useConnect();

  console.log('WalletDebug - Current state:', {
    address,
    isConnected,
    isConnecting,
    chain: chain?.name,
    connectorsCount: connectors.length,
    connectorNames: connectors.map(c => c.name)
  });

  return (
    <div className="bg-binance-panel p-4 rounded-lg border border-gray-600 mb-4">
      <h3 className="text-binance-yellow font-bold mb-2">🔍 Wallet Debug Info</h3>
      <div className="space-y-2 text-sm text-binance-text">
        <p><strong>Connected:</strong> {isConnected ? '✅ Yes' : '❌ No'}</p>
        <p><strong>Connecting:</strong> {isConnecting ? '🔄 Yes' : '⏸️ No'}</p>
        <p><strong>Address:</strong> {address || 'None'}</p>
        <p><strong>Chain:</strong> {chain?.name || 'None'}</p>
        <p><strong>Available Connectors:</strong> {connectors.length}</p>
        <div className="ml-4">
          {connectors.map((connector) => (
            <p key={connector.id}>• {connector.name} (ID: {connector.id})</p>
          ))}
        </div>
        {isError && error && (
          <p className="text-binance-red"><strong>Error:</strong> {error.message}</p>
        )}
      </div>
    </div>
  );
}
