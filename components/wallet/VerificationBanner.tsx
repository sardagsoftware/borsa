"use client";

import { useAccount } from "wagmi";
import { useEffect, useState } from "react";
import { AlertTriangle, Shield, Wallet } from "lucide-react";

interface VerificationBannerProps {
  showWhenNotVerified?: boolean;
  requiredForFeature?: string;
}

export default function VerificationBanner({ 
  showWhenNotVerified = true, 
  requiredForFeature = "live trading"
}: VerificationBannerProps) {
  const { address, isConnected } = useAccount();
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isConnected) {
      setIsVerified(false);
      setIsLoading(false);
      return;
    }

    // Check verification status
    fetch('/api/siwe/status')
      .then(res => res.json())
      .then(data => {
        setIsVerified(data.verified && data.address?.toLowerCase() === address?.toLowerCase());
        setIsLoading(false);
      })
      .catch(() => {
        setIsVerified(false);
        setIsLoading(false);
      });
  }, [isConnected, address]);

  if (isLoading) {
    return null; // Don't show anything while loading
  }

  if (!isConnected) {
    return showWhenNotVerified ? (
      <div className="flex items-center gap-3 rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm">
        <Wallet className="h-5 w-5 text-amber-500" />
        <div>
          <div className="font-medium text-amber-700 dark:text-amber-400">
            Wallet Connection Required
          </div>
          <div className="text-amber-600 dark:text-amber-300">
            Connect your wallet to enable {requiredForFeature} features
          </div>
        </div>
      </div>
    ) : null;
  }

  if (!isVerified) {
    return showWhenNotVerified ? (
      <div className="flex items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm">
        <AlertTriangle className="h-5 w-5 text-red-500" />
        <div>
          <div className="font-medium text-red-700 dark:text-red-400">
            Wallet Verification Required
          </div>
          <div className="text-red-600 dark:text-red-300">
            Please sign the verification message to enable {requiredForFeature}
          </div>
        </div>
      </div>
    ) : null;
  }

  // Verified - show success banner briefly
  return (
    <div className="flex items-center gap-3 rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm">
      <Shield className="h-5 w-5 text-green-500" />
      <div>
        <div className="font-medium text-green-700 dark:text-green-400">
          Wallet Verified
        </div>
        <div className="text-green-600 dark:text-green-300">
          {requiredForFeature} features are now enabled
        </div>
      </div>
    </div>
  );
}
