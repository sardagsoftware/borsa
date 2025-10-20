/**
 * Season Summary Card Component
 * Displays high-level season information and progress
 *
 * A11y: Semantic HTML, ARIA labels, progress indicators
 */

interface Season {
  id: string;
  title: string;
  tagline: string;
  start_date: string;
  end_date: string;
  current_week: number;
  total_weeks: number;
  status: 'active' | 'upcoming' | 'ended';
  player_participation: number;
  total_events: number;
  completed_events: number;
}

export default function SeasonSummaryCard({ season }: { season: Season | null }) {
  if (!season) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
      </div>
    );
  }

  const progressPercent = (season.completed_events / season.total_events) * 100;
  const weekProgress = (season.current_week / season.total_weeks) * 100;

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-lydian-gold/10 to-transparent rounded-lg border-2 border-lydian-gold/30">
      <div className="p-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {season.title}
              </h2>
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(
                  season.status
                )}`}
              >
                {season.status.toUpperCase()}
              </span>
            </div>
            <p className="text-lg text-gray-600 dark:text-gray-400 italic">
              {season.tagline}
            </p>
          </div>

          {/* Season Progress Badge */}
          <div className="text-center">
            <div className="text-4xl font-bold text-lydian-gold">
              {season.current_week}/{season.total_weeks}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 uppercase">
              Weeks
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Start Date</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {new Date(season.start_date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
              })}
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">End Date</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {new Date(season.end_date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
              })}
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Participation</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {(season.player_participation * 100).toFixed(1)}%
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Events</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {season.completed_events} / {season.total_events}
            </div>
          </div>
        </div>

        {/* Progress Bars */}
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-700 dark:text-gray-300">Week Progress</span>
              <span className="font-semibold text-lydian-gold">{weekProgress.toFixed(0)}%</span>
            </div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-lydian-gold to-lydian-gold/70 transition-all duration-500"
                style={{ width: `${weekProgress}%` }}
                role="progressbar"
                aria-valuenow={weekProgress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Week progress"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-700 dark:text-gray-300">Event Completion</span>
              <span className="font-semibold text-green-600 dark:text-green-400">
                {progressPercent.toFixed(0)}%
              </span>
            </div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
                role="progressbar"
                aria-valuenow={progressPercent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Event completion progress"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Corner */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-lydian-gold/5 rounded-bl-full" aria-hidden="true" />
    </div>
  );
}

/**
 * Get status color classes
 */
function getStatusColor(status: string): string {
  switch (status) {
    case 'active':
      return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
    case 'upcoming':
      return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
    case 'ended':
      return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
    default:
      return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
  }
}
