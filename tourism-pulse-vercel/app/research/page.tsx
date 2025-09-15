'use client'

import { TopNav } from '@/components/nav/top-nav'

export default function ResearchPage() {
  return (
    <>
      <TopNav />
      <div className="min-h-screen pt-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            AI Research & Insights
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            AI araştırması ve içgörüler
          </p>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
            <div className="text-6xl mb-4">🔬</div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Research Lab
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Son AI araştırmaları ve teknolojik gelişmeler
            </p>
          </div>
        </div>
      </div>
    </>
  )
}