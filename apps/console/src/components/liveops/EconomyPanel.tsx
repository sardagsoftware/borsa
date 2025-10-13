/**
 * Economy Panel Component
 * Controls for economy rebalancing and currency management
 *
 * A11y: Form semantics, ARIA labels, keyboard navigation
 * RBAC: Requires economy.admin scope
 */

'use client';

import { useState } from 'react';

export default function EconomyPanel() {
  const [rewardMultiplier, setRewardMultiplier] = useState(1.0);
  const [vendorDiscount, setVendorDiscount] = useState(0);
  const [isDeploying, setIsDeploying] = useState(false);

  const handleDeploy = async () => {
    setIsDeploying(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsDeploying(false);
    alert('Economy patch deployed successfully!');
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="space-y-6">
        {/* Current Economy Status */}
        <div className="p-4 bg-gray-50 dark:bg-gray-750 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase mb-3">
            Current Status
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-600 dark:text-gray-400">Inflation Index</div>
              <div className="text-lg font-bold text-gray-900 dark:text-gray-100">1.02</div>
            </div>
            <div>
              <div className="text-gray-600 dark:text-gray-400">Earn/Spend Ratio</div>
              <div className="text-lg font-bold text-gray-900 dark:text-gray-100">0.95</div>
            </div>
          </div>
        </div>

        {/* Reward Multiplier Control */}
        <div>
          <label
            htmlFor="reward-multiplier"
            className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
          >
            Reward Multiplier: {rewardMultiplier.toFixed(1)}x
          </label>
          <input
            id="reward-multiplier"
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            value={rewardMultiplier}
            onChange={(e) => setRewardMultiplier(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-lydian-gold"
            aria-label="Reward multiplier slider"
            aria-valuemin={0.5}
            aria-valuemax={2.0}
            aria-valuenow={rewardMultiplier}
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-500 mt-1">
            <span>0.5x</span>
            <span>1.0x (default)</span>
            <span>2.0x</span>
          </div>
        </div>

        {/* Vendor Discount Control */}
        <div>
          <label
            htmlFor="vendor-discount"
            className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
          >
            Vendor Discount: {vendorDiscount}%
          </label>
          <input
            id="vendor-discount"
            type="range"
            min="0"
            max="50"
            step="5"
            value={vendorDiscount}
            onChange={(e) => setVendorDiscount(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-lydian-gold"
            aria-label="Vendor discount slider"
            aria-valuemin={0}
            aria-valuemax={50}
            aria-valuenow={vendorDiscount}
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-500 mt-1">
            <span>0% (no discount)</span>
            <span>25%</span>
            <span>50% (max)</span>
          </div>
        </div>

        {/* Currency Adjustment Presets */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Quick Presets
          </h4>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => {
                setRewardMultiplier(1.2);
                setVendorDiscount(10);
              }}
              className="px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-sm font-medium text-gray-700 dark:text-gray-300 transition"
            >
              Generous
            </button>
            <button
              onClick={() => {
                setRewardMultiplier(1.0);
                setVendorDiscount(0);
              }}
              className="px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-sm font-medium text-gray-700 dark:text-gray-300 transition"
            >
              Balanced
            </button>
            <button
              onClick={() => {
                setRewardMultiplier(0.8);
                setVendorDiscount(0);
              }}
              className="px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-sm font-medium text-gray-700 dark:text-gray-300 transition"
            >
              Challenging
            </button>
          </div>
        </div>

        {/* Deploy Button */}
        <button
          onClick={handleDeploy}
          disabled={isDeploying}
          className="w-full px-4 py-3 bg-lydian-gold hover:bg-lydian-gold/90 disabled:bg-gray-400 text-gray-900 rounded-lg font-semibold transition"
          aria-label="Deploy economy changes"
        >
          {isDeploying ? 'Deploying...' : 'Deploy Changes'}
        </button>

        {/* Warning Notice */}
        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
          <p className="text-xs text-red-800 dark:text-red-200">
            <strong>⚠️ Warning:</strong> Economy changes affect all active players immediately.
            Use Canary rollout for gradual deployment.
          </p>
        </div>
      </div>
    </div>
  );
}
