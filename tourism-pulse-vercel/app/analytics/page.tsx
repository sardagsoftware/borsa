'use client'

import { TopNav } from '@/components/nav/top-nav'

export default function AnalyticsPage() {
  const stats = {
    totalRequests: 45672,
    totalTokens: 2847391,
    totalUsers: 1243,
    avgResponseTime: 1.2
  }

  const modelUsage = [
    { name: 'GPT-4 Turbo', usage: 35, color: '#3b82f6' },
    { name: 'Claude 3.5', usage: 28, color: '#8b5cf6' },
    { name: 'Gemini 2.0', usage: 22, color: '#f59e0b' },
    { name: 'Mistral Large', usage: 15, color: '#10b981' }
  ]

  const recentActivity = [
    { time: '2 dk önce', user: 'user_1234', model: 'GPT-4', tokens: 245 },
    { time: '3 dk önce', user: 'user_5678', model: 'Claude', tokens: 189 },
    { time: '5 dk önce', user: 'user_9012', model: 'Gemini', tokens: 312 },
    { time: '7 dk önce', user: 'user_3456', model: 'GPT-4', tokens: 156 },
    { time: '9 dk önce', user: 'user_7890', model: 'Mistral', tokens: 278 }
  ]

  return (
    <>
      <TopNav />
      <div className="min-h-screen pt-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Analytics & İstatistikler
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              AI model kullanımı ve performans metrikleri
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 dark:text-blue-400">📊</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Toplam İstek</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {stats.totalRequests.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                    <span className="text-green-600 dark:text-green-400">🔤</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Toplam Token</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {(stats.totalTokens / 1000000).toFixed(1)}M
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                    <span className="text-purple-600 dark:text-purple-400">👥</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Aktif Kullanıcı</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {stats.totalUsers.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
                    <span className="text-yellow-600 dark:text-yellow-400">⚡</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg. Yanıt</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {stats.avgResponseTime}s
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Model Usage Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Model Kullanım Dağılımı
              </h3>
              <div className="space-y-4">
                {modelUsage.map((model) => (
                  <div key={model.name}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {model.name}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        %{model.usage}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${model.usage}%`,
                          backgroundColor: model.color
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Son Aktiviteler
              </h3>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {activity.user}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {activity.model} • {activity.tokens} token
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {activity.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Performans Metrikleri
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-3">
                  <span className="text-2xl text-green-600 dark:text-green-400">✅</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">99.9%</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Uptime</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-3">
                  <span className="text-2xl text-blue-600 dark:text-blue-400">⚡</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">850ms</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Avg. Latency</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mb-3">
                  <span className="text-2xl text-purple-600 dark:text-purple-400">🎯</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">4.8/5</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">User Rating</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}