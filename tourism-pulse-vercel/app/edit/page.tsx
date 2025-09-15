'use client'

import { TopNav } from '@/components/nav/top-nav'

export default function EditPage() {
  return (
    <>
      <TopNav />
      <div className="min-h-screen pt-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            AI Content Editing
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            AI tabanlı içerik düzenleme araçları
          </p>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
            <div className="text-6xl mb-4">✂️</div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              AI Edit Suite
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Akıllı metin düzenleme ve optimizasyon araçları
            </p>
          </div>
        </div>
      </div>
    </>
  )
}