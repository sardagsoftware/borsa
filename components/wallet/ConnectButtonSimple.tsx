'use client';

import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

export default function ConnectButton() {
  const { address, isConnected, isConnecting } = useAccount();
  const { connect, connectors, error, isError } = useConnect();
  const { disconnect } = useDisconnect();
  const [showConnectors, setShowConnectors] = useState(false);

  // Error handling
  useEffect(() => {
    if (isError && error) {
      toast.error(`Connection failed: ${error.message}`);
    }
  }, [isError, error]);

  // Loading state
  if (isConnecting) {
    return (
      <button 
        disabled 
        className="bg-blue-600 text-white px-4 py-2 rounded opacity-50 cursor-not-allowed"
      >
        🔄 Connecting...
      </button>
    );
  }

  // Connected state
  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <div className="text-sm text-binance-text bg-binance-panel px-3 py-1 rounded border">
          {address.slice(0, 6)}...{address.slice(-4)}
        </div>
        <button
          onClick={() => {
            disconnect();
            toast.success('Wallet disconnected');
          }}
          className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  // Disconnected state
  return (
    <div className="relative">
      <button
        onClick={() => setShowConnectors(!showConnectors)}
        className="bg-binance-yellow hover:bg-yellow-500 text-black px-4 py-2 rounded font-medium transition-colors"
      >
        🔗 Connect Wallet
      </button>
      
      {showConnectors && (
        <>
          {/* Backdrop to close dropdown */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowConnectors(false)}
          />
          
          {/* Dropdown menu */}
          <div className="absolute right-0 top-full mt-2 bg-binance-panel border border-gray-600 rounded-lg shadow-xl min-w-48 z-20">
            <div className="p-2">
              <div className="text-xs text-gray-400 px-3 py-2 border-b border-gray-600">
                Choose a wallet to connect
              </div>
              {connectors.map((connector) => (
                <button
                  key={connector.id}
                  onClick={() => {
                    connect({ connector });
                    setShowConnectors(false);
                    toast.loading('Connecting wallet...', { id: 'connect' });
                  }}
                  className="w-full text-left px-3 py-3 hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg text-binance-text transition-colors flex items-center gap-2"
                >
                  <span className="text-lg">
                    {connector.name === 'MetaMask' && '🦊'}
                    {connector.name === 'WalletConnect' && '📱'}
                    {connector.name === 'Coinbase Wallet' && '🔵'}
                    {!['MetaMask', 'WalletConnect', 'Coinbase Wallet'].includes(connector.name) && '💼'}
                  </span>
                  {connector.name}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
