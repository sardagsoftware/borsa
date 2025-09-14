'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useAccount, useBalance, useConnect, useDisconnect } from 'wagmi';
import { SUPPORTED_CHAINS } from './config';

interface WalletContextType {
  // Connection State
  isConnected: boolean;
  address: string | undefined;
  chainId: number | undefined;
  connector: any;
  
  // Balance & Assets
  balance: string;
  balanceSymbol: string;
  balanceLoading: boolean;
  
  // Connection Methods
  connect: (connectorId?: string) => void;
  disconnect: () => void;
  switchChain: (chainId: number) => void;
  
  // Chain Info
  currentChain: any;
  supportedChains: typeof SUPPORTED_CHAINS;
  
  // Transaction State
  pendingTx: string | null;
  setPendingTx: (txHash: string | null) => void;
  
  // Wallet Features
  isWalletModalOpen: boolean;
  setWalletModalOpen: (open: boolean) => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const { address, isConnected, chainId, connector } = useAccount();
  const { connect: wagmiConnect, connectors } = useConnect();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  
  const [pendingTx, setPendingTx] = useState<string | null>(null);
  const [isWalletModalOpen, setWalletModalOpen] = useState(false);
  
  // Get balance for current chain
  const { data: balanceData, isLoading: balanceLoading } = useBalance({
    address: address,
    chainId: chainId,
  });
  
  // Get current chain info
  const currentChain = chainId ? Object.values(SUPPORTED_CHAINS).find(chain => chain.id === chainId) : null;
  
  const connect = (connectorId?: string) => {
    const targetConnector = connectorId 
      ? connectors.find(c => c.id === connectorId) 
      : connectors[0];
      
    if (targetConnector) {
      wagmiConnect({ connector: targetConnector });
    }
  };
  
  const disconnect = () => {
    wagmiDisconnect();
    setPendingTx(null);
  };
  
  const switchChain = async (targetChainId: number) => {
    if (!window.ethereum) return;
    
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      });
    } catch (error: any) {
      // Chain doesn't exist, add it
      if (error.code === 4902) {
        const chainConfig = Object.values(SUPPORTED_CHAINS).find(chain => chain.id === targetChainId);
        if (chainConfig) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: `0x${targetChainId.toString(16)}`,
              chainName: chainConfig.name,
              rpcUrls: chainConfig.rpcUrls.default.http,
              blockExplorerUrls: [chainConfig.blockExplorers?.default?.url],
              nativeCurrency: {
                name: chainConfig.nativeCurrency.name,
                symbol: chainConfig.nativeCurrency.symbol,
                decimals: chainConfig.nativeCurrency.decimals,
              },
            }],
          });
        }
      }
    }
  };
  
  // Auto-open wallet modal on first visit
  useEffect(() => {
    if (!isConnected && !localStorage.getItem('wallet-connect-attempted')) {
      setWalletModalOpen(true);
      localStorage.setItem('wallet-connect-attempted', 'true');
    }
  }, [isConnected]);
  
  const contextValue: WalletContextType = {
    // Connection State
    isConnected,
    address,
    chainId,
    connector,
    
    // Balance & Assets
    balance: balanceData ? balanceData.formatted : '0',
    balanceSymbol: balanceData ? balanceData.symbol : 'ETH',
    balanceLoading,
    
    // Connection Methods
    connect,
    disconnect,
    switchChain,
    
    // Chain Info
    currentChain,
    supportedChains: SUPPORTED_CHAINS,
    
    // Transaction State
    pendingTx,
    setPendingTx,
    
    // Wallet Features
    isWalletModalOpen,
    setWalletModalOpen,
  };
  
  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}

// SIWE (Sign-In with Ethereum) Integration
export async function signInWithEthereum(address: string, chainId: number, provider: any) {
  const domain = window.location.host;
  const origin = window.location.origin;
  const statement = 'Sign in to AILYDIAN AI Lens Trader with your Ethereum account.';
  
  const message = `${domain} wants you to sign in with your Ethereum account:
${address}

${statement}

URI: ${origin}
Version: 1
Chain ID: ${chainId}
Nonce: ${Math.random().toString(36).substring(2, 15)}
Issued At: ${new Date().toISOString()}`;

  try {
    const signature = await provider.request({
      method: 'personal_sign',
      params: [message, address],
    });
    
    return {
      message,
      signature,
      address,
      chainId,
    };
  } catch (error) {
    console.error('SIWE signing failed:', error);
    throw error;
  }
}

// Multi-chain transaction helper
export async function executeMultiChainTransaction(
  transactions: Array<{
    chainId: number;
    to: string;
    data: string;
    value?: string;
  }>,
  signer: any
) {
  const results = [];
  
  for (const tx of transactions) {
    try {
      // Switch to target chain if needed
      await signer.switchChain?.(tx.chainId);
      
      const txResponse = await signer.sendTransaction({
        to: tx.to,
        data: tx.data,
        value: tx.value || '0',
      });
      
      results.push({
        chainId: tx.chainId,
        hash: txResponse.hash,
        status: 'pending',
      });
      
      // Wait for confirmation
      const receipt = await txResponse.wait();
      results[results.length - 1].status = receipt.status === 1 ? 'success' : 'failed';
      
    } catch (error) {
      results.push({
        chainId: tx.chainId,
        hash: null,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
  
  return results;
}
