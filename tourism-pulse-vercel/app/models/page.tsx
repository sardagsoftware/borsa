'use client'

import { useState, useEffect } from 'react'
import { TopNav } from '@/components/nav/top-nav'

interface AIModel {
  id: string
  name: string
  provider: string
  status: 'active' | 'inactive' | 'maintenance'
  description: string
  capabilities: string[]
  pricing: {
    inputTokens: number
    outputTokens: number
    currency: string
  }
  limits: {
    maxTokens: number
    requestsPerMinute: number
  }
  icon: string
}

export default function ModelsPage() {
  const [models, setModels] = useState<AIModel[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    fetch('/api/models')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setModels(data.data)
        }
        setLoading(false)
      })
      .catch(error => {
        console.error('Failed to fetch models:', error)
        setLoading(false)
      })
  }, [])

  const filteredModels = models.filter(model => {
    if (filter === 'all') return true
    if (filter === 'active') return model.status === 'active'
    if (filter === 'text') return model.capabilities.includes('text-generation')
    if (filter === 'image') return model.capabilities.includes('image-generation')
    return true
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10a37f'
      case 'inactive': return '#ef4444'
      case 'maintenance': return '#f59e0b'
      default: return '#6b7280'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Aktif'
      case 'inactive': return 'Devre Dışı'
      case 'maintenance': return 'Bakımda'
      default: return 'Bilinmiyor'
    }
  }

  return (
    <>
      <TopNav />
      <div className="min-h-screen pt-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              AI Modelleri
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Kullanılabilir yapay zeka modellerini keşfedin ve yönetin
            </p>

            {/* Filter Buttons */}
            <div className="flex gap-2 mb-6">
              {[
                { key: 'all', label: 'Tümü', count: models.length },
                { key: 'active', label: 'Aktif', count: models.filter(m => m.status === 'active').length },
                { key: 'text', label: 'Metin', count: models.filter(m => m.capabilities.includes('text-generation')).length },
                { key: 'image', label: 'Görsel', count: models.filter(m => m.capabilities.includes('image-generation')).length }
              ].map(({ key, label, count }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === key
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {label} ({count})
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-6 animate-pulse">
                  <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4"></div>
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-3/4"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredModels.map((model) => (
                <div
                  key={model.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{model.icon}</div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {model.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {model.provider}
                        </p>
                      </div>
                    </div>
                    <div
                      className="px-2 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: `${getStatusColor(model.status)}20`,
                        color: getStatusColor(model.status)
                      }}
                    >
                      {getStatusText(model.status)}
                    </div>
                  </div>

                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                    {model.description}
                  </p>

                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                      Yetenekler
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {model.capabilities.map((capability) => (
                        <span
                          key={capability}
                          className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded"
                        >
                          {capability}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Max Token</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {model.limits.maxTokens.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">RPM Limit</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {model.limits.requestsPerMinute}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                      <p className="text-gray-500 dark:text-gray-400 text-xs">
                        Input: ${model.pricing.inputTokens}/1K • Output: ${model.pricing.outputTokens}/1K
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && filteredModels.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🤖</div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Model bulunamadı
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Seçili filtreye uygun model bulunmuyor.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}