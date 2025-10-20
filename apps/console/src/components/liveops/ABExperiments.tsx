/**
 * A/B Experiments Component
 * Displays active A/B tests and their performance
 *
 * A11y: Table semantics, ARIA labels, semantic structure
 */

'use client';

interface Experiment {
  id: string;
  name: string;
  description: string;
  status: 'running' | 'paused' | 'completed';
  start_date: string;
  variants: Array<{
    name: string;
    allocation: number;
    conversion_rate?: number;
  }>;
  sample_size: number;
  confidence_level?: number;
}

export default function ABExperiments({ experiments }: { experiments: Experiment[] }) {
  if (!experiments || experiments.length === 0) {
    return (
      <div className="p-8 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
        <div className="text-4xl mb-4">🧪</div>
        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          No Active Experiments
        </h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Create a new A/B test to optimize game features
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {experiments.map((experiment) => (
        <div
          key={experiment.id}
          className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {experiment.name}
                </h4>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                    experiment.status
                  )}`}
                >
                  {experiment.status}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {experiment.description}
              </p>
              <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-500">
                <span>Started: {new Date(experiment.start_date).toLocaleDateString()}</span>
                <span>Sample: {experiment.sample_size.toLocaleString()} users</span>
                {experiment.confidence_level && (
                  <span>Confidence: {(experiment.confidence_level * 100).toFixed(0)}%</span>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2">
              {experiment.status === 'running' && (
                <button className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded transition">
                  Pause
                </button>
              )}
              <button className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded transition">
                Details
              </button>
            </div>
          </div>

          {/* Variants Comparison */}
          <div className="space-y-3">
            {experiment.variants.map((variant, i) => {
              const isWinning =
                variant.conversion_rate &&
                variant.conversion_rate ===
                  Math.max(...experiment.variants.map((v) => v.conversion_rate || 0));

              return (
                <div
                  key={i}
                  className={`p-4 rounded-lg border-2 transition ${
                    isWinning
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {variant.name}
                      </span>
                      {isWinning && (
                        <span className="px-2 py-0.5 bg-green-500 text-white text-[10px] font-bold rounded">
                          WINNING
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {variant.allocation}% allocation
                    </span>
                  </div>

                  {/* Allocation Bar */}
                  <div className="mb-2">
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          isWinning ? 'bg-green-500' : 'bg-blue-500'
                        } transition-all`}
                        style={{ width: `${variant.allocation}%` }}
                        role="progressbar"
                        aria-valuenow={variant.allocation}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${variant.name} allocation`}
                      />
                    </div>
                  </div>

                  {/* Conversion Rate */}
                  {variant.conversion_rate !== undefined && (
                    <div className="text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Conversion:</span>
                      <span className="ml-2 font-bold text-gray-900 dark:text-gray-100">
                        {(variant.conversion_rate * 100).toFixed(2)}%
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Statistical Significance */}
          {experiment.confidence_level && experiment.confidence_level >= 0.95 && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>✓ Statistically Significant:</strong> Results are {(experiment.confidence_level * 100).toFixed(0)}% confident.
                Safe to roll out winning variant.
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * Get status color
 */
function getStatusColor(status: string): string {
  switch (status) {
    case 'running':
      return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
    case 'paused':
      return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300';
    case 'completed':
      return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
    default:
      return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
  }
}
