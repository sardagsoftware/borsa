"use client";

import { useAccount, useConnect, useDisconnect, useChainId, useSignMessage } from "wagmi";
import { useEffect, useState, useCallback } from "react";
import { CHAINS, type ChainId } from "@/lib/wallet/chains";
import { toast } from "react-hot-toast";
import { Wallet, Power, Shield, ShieldCheck } from "lucide-react";

interface ConnectorInfo {
  name: string;
  desc: string;
}

export default function ConnectButton() {
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { signMessage } = useSignMessage();
  const [siweStatus, setSiweStatus] = useState<'idle' | 'signing' | 'verified' | 'failed'>('idle');
  const [showConnectors, setShowConnectors] = useState(false);

  const handleSIWE = useCallback(async () => {
    if (!address || !chainId) return;
    
    setSiweStatus('signing');
    
    try {
      // Get nonce
      const nonce = await fetch('/api/siwe/nonce').then(r => r.text());
      
      // Create SIWE message
      const domain = window.location.hostname;
      const statement = process.env.NEXT_PUBLIC_SIWE_STMT || "Ailydian Trader'a güvenli giriş";
      const uri = window.location.origin;
      const version = "1";
      const issuedAt = new Date().toISOString();

      const message = [
        `${domain} wants you to sign in with your Ethereum account:`,
        address,
        '',
        statement,
        '',
        `URI: ${uri}`,
        `Version: ${version}`,
        `Chain ID: ${chainId}`,
        `Nonce: ${nonce}`,
        `Issued At: ${issuedAt}`
      ].join('\n');

      // Sign message
      const signature = await signMessage({ message });

      // Verify with server
      const response = await fetch('/api/siwe/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, signature, address })
      });

      const result = await response.json();
      
      if (result.ok) {
        setSiweStatus('verified');
        toast.success('Wallet bağlandı ve doğrulandı! 🎉');
      } else {
        setSiweStatus('failed');
        toast.error('Doğrulama başarısız: ' + (result.error || 'Bilinmeyen hata'));
      }
    } catch (error: unknown) {
      setSiweStatus('failed');
      if (error && typeof error === 'object' && 'name' in error && error.name === 'UserRejectedRequestError') {
        toast.error('İmza iptal edildi');
      } else {
        const message = error && typeof error === 'object' && 'message' in error 
          ? String(error.message) 
          : 'Bilinmeyen hata';
        toast.error('İmzalama hatası: ' + message);
      }
    }
  }, [address, chainId, signMessage]);

  // Check SIWE status on mount and connection changes
  useEffect(() => {
    if (!isConnected || !address) {
      setSiweStatus('idle');
      return;
    }

    // Check if already verified
    fetch('/api/siwe/status')
      .then(res => res.json())
      .then(data => {
        if (data.verified && data.address?.toLowerCase() === address.toLowerCase()) {
          setSiweStatus('verified');
        } else {
          // Need to sign
          handleSIWE();
        }
      })
      .catch(() => setSiweStatus('idle'));
  }, [isConnected, address, handleSIWE]);

  const handleDisconnect = () => {
    disconnect();
    setSiweStatus('idle');
    // Clear cookies client-side
    document.cookie = 'x-sid=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    document.cookie = 'x-wallet-address=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    toast.success('Wallet bağlantısı kesildi');
  };

  if (isConnected && address) {
    const chainData = CHAINS[chainId as ChainId];
    const statusIcon = {
      'verified': <ShieldCheck className="h-4 w-4 text-binance-green" />,
      'signing': <Shield className="h-4 w-4 text-binance-yellow animate-pulse" />,
      'failed': <Shield className="h-4 w-4 text-binance-red" />,
      'idle': <Shield className="h-4 w-4 text-muted-foreground" />
    }[siweStatus];

    const statusText = {
      'verified': 'Verified',
      'signing': 'Signing...',
      'failed': 'Failed',
      'idle': 'Connecting...'
    }[siweStatus];

    return (
      <div className="flex items-center gap-2">
        <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm">
          <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs font-medium">
            {chainData?.symbol || 'Unknown'}
            <span className={`h-2 w-2 rounded-full ${siweStatus === 'verified' ? 'bg-binance-green' : 'bg-binance-yellow'}`} />
          </span>
          
          <span className="font-mono text-xs">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
          
          <div className="flex items-center gap-1">
            {statusIcon}
            <span className={`text-xs ${
              siweStatus === 'verified' ? 'text-binance-green' : 
              siweStatus === 'signing' ? 'text-binance-yellow' : 
              siweStatus === 'failed' ? 'text-binance-red' : 
              'text-muted-foreground'
            }`}>
              {statusText}
            </span>
          </div>
        </div>

        <button
          onClick={handleDisconnect}
          className="inline-flex items-center gap-1 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive hover:bg-destructive/20 transition-colors"
          title="Disconnect wallet"
        >
          <Power className="h-3 w-3" />
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowConnectors(!showConnectors)}
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        <Wallet className="h-4 w-4" />
        {isPending ? 'Connecting...' : 'Connect Wallet'}
      </button>

      {showConnectors && (
        <div className="absolute right-0 top-full mt-2 w-64 rounded-lg border border-border bg-card p-2 shadow-lg z-50">
          <div className="space-y-1">
            {connectors.map((connector) => {
              const getConnectorInfo = (connector: { id: string; name: string }): ConnectorInfo => {
                switch (connector.id) {
                  case 'walletConnect':
                    return { name: 'WalletConnect', desc: 'Trust Wallet, MetaMask Mobile, etc.' };
                  case 'coinbaseWallet':
                    return { name: 'Coinbase Wallet', desc: 'Coinbase Wallet extension & mobile' };
                  case 'injected':
                    return { name: 'Browser Wallet', desc: 'MetaMask, Binance Wallet, etc.' };
                  default:
                    return { name: connector.name, desc: 'Web3 wallet' };
                }
              };

              const info = getConnectorInfo(connector);
              
              return (
                <button
                  key={connector.uid}
                  onClick={() => {
                    connect({ connector });
                    setShowConnectors(false);
                  }}
                  disabled={isPending}
                  className="w-full rounded-md border border-border bg-muted/50 px-3 py-3 text-left text-sm hover:bg-muted transition-colors disabled:opacity-50"
                >
                  <div className="font-medium">{info.name}</div>
                  <div className="text-xs text-muted-foreground">{info.desc}</div>
                </button>
              );
            })}
          </div>
          
          <div className="mt-3 border-t border-border pt-3">
            <div className="text-xs text-muted-foreground">
              <div className="flex items-center gap-1 mb-1">
                <Shield className="h-3 w-3" />
                <strong>Güvenlik:</strong>
              </div>
              <p>Ailydian kimseye private key/seed phrase istemez. Wallet&apos;ınız tamamen sizin kontrolünüzdedir.</p>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {showConnectors && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowConnectors(false)}
        />
      )}
    </div>
  );
}
