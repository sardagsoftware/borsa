/**
 * Controls Bar Component
 * Deployment controls: Canary, GA rollout, Rollback
 *
 * A11y: Button semantics, ARIA labels, confirmation dialogs
 * RBAC: Requires liveops.admin scope
 */

'use client';

import { useState } from 'react';

export default function ControlsBar() {
  const [deploymentStage, setDeploymentStage] = useState<'canary' | 'ga' | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [showConfirm, setShowConfirm] = useState<'canary' | 'ga' | 'rollback' | null>(null);

  const handleDeploy = async (stage: 'canary' | 'ga') => {
    setIsDeploying(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setDeploymentStage(stage);
    setIsDeploying(false);
    setShowConfirm(null);
    alert(`Deployed to ${stage === 'canary' ? 'Canary (5%)' : 'GA (100%)'}!`);
  };

  const handleRollback = async () => {
    setIsDeploying(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setDeploymentStage(null);
    setIsDeploying(false);
    setShowConfirm(null);
    alert('Rollback completed successfully!');
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="space-y-6">
        {/* Current Deployment Status */}
        <div className="p-4 bg-gray-50 dark:bg-gray-750 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase mb-2">
            Current Deployment
          </h4>
          <div className="flex items-center gap-3">
            <span className="text-2xl">
              {deploymentStage === 'canary' ? '🟡' : deploymentStage === 'ga' ? '🟢' : '⚪'}
            </span>
            <div>
              <div className="font-semibold text-gray-900 dark:text-gray-100">
                {deploymentStage === 'canary'
                  ? 'Canary (5%)'
                  : deploymentStage === 'ga'
                  ? 'General Availability (100%)'
                  : 'No Active Deployment'}
              </div>
              {deploymentStage && (
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Deployed {new Date().toLocaleString()}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Deployment Controls */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Canary Deployment */}
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="mb-3">
              <h5 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                🟡 Canary Deployment
              </h5>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Deploy to 5% of users for testing
              </p>
            </div>
            <button
              onClick={() => setShowConfirm('canary')}
              disabled={isDeploying || deploymentStage === 'ga'}
              className="w-full px-4 py-2 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-400 text-white rounded font-medium transition"
            >
              {deploymentStage === 'canary' ? 'Already in Canary' : 'Deploy Canary'}
            </button>
          </div>

          {/* GA Deployment */}
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="mb-3">
              <h5 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                🟢 General Availability
              </h5>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Deploy to 100% of users
              </p>
            </div>
            <button
              onClick={() => setShowConfirm('ga')}
              disabled={isDeploying || deploymentStage === 'ga'}
              className="w-full px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded font-medium transition"
            >
              {deploymentStage === 'ga' ? 'Already in GA' : 'Deploy GA'}
            </button>
          </div>
        </div>

        {/* Rollback Button */}
        {deploymentStage && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setShowConfirm('rollback')}
              disabled={isDeploying}
              className="w-full px-4 py-3 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white rounded-lg font-semibold transition"
            >
              ⚠️ Rollback Deployment
            </button>
          </div>
        )}

        {/* Confirmation Dialog */}
        {showConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" role="dialog" aria-modal="true">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4 border-2 border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                Confirm{' '}
                {showConfirm === 'canary'
                  ? 'Canary Deployment'
                  : showConfirm === 'ga'
                  ? 'GA Deployment'
                  : 'Rollback'}
              </h3>

              <p className="text-gray-700 dark:text-gray-300 mb-6">
                {showConfirm === 'canary' && (
                  <>
                    Deploy to <strong>5% of users</strong> for testing. Monitor KPIs before
                    promoting to GA.
                  </>
                )}
                {showConfirm === 'ga' && (
                  <>
                    Deploy to <strong>100% of all users</strong>. This action will affect your
                    entire player base immediately.
                  </>
                )}
                {showConfirm === 'rollback' && (
                  <>
                    Rollback the current deployment and <strong>revert all changes</strong>. This
                    is an emergency action.
                  </>
                )}
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(null)}
                  disabled={isDeploying}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 rounded font-medium transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (showConfirm === 'rollback') {
                      handleRollback();
                    } else {
                      handleDeploy(showConfirm);
                    }
                  }}
                  disabled={isDeploying}
                  className={`flex-1 px-4 py-2 rounded font-medium transition ${
                    showConfirm === 'rollback'
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : showConfirm === 'canary'
                      ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                      : 'bg-green-500 hover:bg-green-600 text-white'
                  } disabled:bg-gray-400`}
                >
                  {isDeploying ? 'Processing...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Info Notice */}
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
          <p className="text-xs text-blue-800 dark:text-blue-200">
            <strong>Best Practice:</strong> Always deploy to Canary first, monitor KPIs for 24
            hours, then promote to GA if metrics are healthy.
          </p>
        </div>
      </div>
    </div>
  );
}
