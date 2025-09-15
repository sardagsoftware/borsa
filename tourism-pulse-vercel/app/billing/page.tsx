'use client'

import { TopNav } from '@/components/nav/top-nav'

export default function BillingPage() {
  return (
    <>
      <TopNav />
      <div className="min-h-screen pt-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Billing & Usage
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Kullanım ve faturalama bilgileri
          </p>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
            <div className="text-6xl mb-4">💳</div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Ücretsiz Plan Aktif
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Günlük 100 istek limiti kullanılıyor
            </p>
          </div>
        </div>
      </div>
    </>
  )
}