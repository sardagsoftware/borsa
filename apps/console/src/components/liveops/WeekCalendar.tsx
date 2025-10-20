/**
 * Week Calendar Component
 * Displays weekly schedule for the season
 *
 * A11y: Keyboard navigation, ARIA labels, semantic HTML
 */

'use client';

interface Week {
  week_number: number;
  start_date: string;
  end_date: string;
  theme: string;
  events_count: number;
  status: 'past' | 'current' | 'upcoming';
}

interface WeekCalendarProps {
  weeks: Week[];
  selectedWeek: number | null;
  onSelectWeek: (week: number | null) => void;
}

export default function WeekCalendar({ weeks, selectedWeek, onSelectWeek }: WeekCalendarProps) {
  if (!weeks || weeks.length === 0) {
    return (
      <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <p className="text-center text-gray-600 dark:text-gray-400">
          No weeks scheduled
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Calendar Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {weeks.map((week) => {
          const isSelected = selectedWeek === week.week_number;
          const isCurrent = week.status === 'current';

          return (
            <button
              key={week.week_number}
              onClick={() => onSelectWeek(isSelected ? null : week.week_number)}
              className={`relative p-4 rounded-lg border-2 transition-all text-left ${
                isSelected
                  ? 'border-lydian-gold bg-lydian-gold/10 ring-2 ring-lydian-gold/30'
                  : isCurrent
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : week.status === 'past'
                  ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 opacity-60'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-lydian-gold/50'
              }`}
              aria-label={`Week ${week.week_number}: ${week.theme}`}
              aria-pressed={isSelected}
              aria-current={isCurrent ? 'date' : undefined}
            >
              {/* Week Number Badge */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                  Week {week.week_number}
                </span>
                {isCurrent && (
                  <span className="px-2 py-0.5 bg-blue-500 text-white text-[10px] font-bold rounded">
                    NOW
                  </span>
                )}
              </div>

              {/* Theme */}
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">
                {week.theme}
              </h4>

              {/* Date Range */}
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                {formatDateRange(week.start_date, week.end_date)}
              </div>

              {/* Events Count */}
              <div className="flex items-center gap-1 text-xs">
                <span className="text-lydian-gold">🎯</span>
                <span className="text-gray-700 dark:text-gray-300">
                  {week.events_count} event{week.events_count !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Status Indicator */}
              {week.status === 'past' && (
                <div className="absolute top-2 right-2">
                  <span className="text-green-500 text-lg" aria-label="Completed">✓</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Week Details */}
      {selectedWeek !== null && (
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border-2 border-lydian-gold">
          {weeks
            .filter((w) => w.week_number === selectedWeek)
            .map((week) => (
              <div key={week.week_number}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                      Week {week.week_number}: {week.theme}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {new Date(week.start_date).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric'
                      })}{' '}
                      -{' '}
                      {new Date(week.end_date).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  <button
                    onClick={() => onSelectWeek(null)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-xl"
                    aria-label="Close week details"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-750 rounded">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Status</div>
                    <div className={`font-semibold capitalize ${getStatusTextColor(week.status)}`}>
                      {week.status}
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-750 rounded">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Events</div>
                    <div className="font-semibold text-gray-900 dark:text-gray-100">
                      {week.events_count} scheduled
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-750 rounded">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Duration</div>
                    <div className="font-semibold text-gray-900 dark:text-gray-100">7 days</div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-6 text-xs text-gray-600 dark:text-gray-400 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="font-semibold">Legend:</div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded" />
          <span>Past</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-500 rounded" />
          <span>Current</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded" />
          <span>Upcoming</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Format date range string
 */
function formatDateRange(start: string, end: string): string {
  const startDate = new Date(start);
  const endDate = new Date(end);

  const startMonth = startDate.toLocaleDateString('en-US', { month: 'short' });
  const endMonth = endDate.toLocaleDateString('en-US', { month: 'short' });

  if (startMonth === endMonth) {
    return `${startMonth} ${startDate.getDate()}-${endDate.getDate()}`;
  }

  return `${startMonth} ${startDate.getDate()} - ${endMonth} ${endDate.getDate()}`;
}

/**
 * Get status text color
 */
function getStatusTextColor(status: string): string {
  switch (status) {
    case 'current':
      return 'text-blue-600 dark:text-blue-400';
    case 'past':
      return 'text-gray-600 dark:text-gray-400';
    case 'upcoming':
      return 'text-green-600 dark:text-green-400';
    default:
      return 'text-gray-600 dark:text-gray-400';
  }
}
