'use client'

import { TopNav } from '@/components/nav/top-nav'

export default function KnowledgePage() {
  const articles = [
    {
      id: 1,
      title: 'AI Modelleri Nasıl Çalışır?',
      category: 'AI Basics',
      readTime: '5 dk',
      description: 'Yapay zeka modellerinin temel çalışma prensipleri ve kullanım alanları hakkında kapsamlı bilgi.',
      tags: ['AI', 'Machine Learning', 'Deep Learning']
    },
    {
      id: 2,
      title: 'GPT-4 vs Claude: Hangisi Daha İyi?',
      category: 'Model Comparison',
      readTime: '8 dk',
      description: 'En popüler dil modellerinin detaylı karşılaştırması ve hangi durumda hangisinin tercih edilmesi gerektiği.',
      tags: ['GPT-4', 'Claude', 'Comparison']
    },
    {
      id: 3,
      title: 'Prompt Engineering En İyi Uygulamaları',
      category: 'Best Practices',
      readTime: '12 dk',
      description: 'AI modellerinden en iyi sonuçları alabilmek için prompt yazma teknikleri ve ipuçları.',
      tags: ['Prompt', 'Engineering', 'Tips']
    },
    {
      id: 4,
      title: 'AI Güvenliği ve Etik Kullanım',
      category: 'Ethics & Safety',
      readTime: '10 dk',
      description: 'Yapay zeka teknolojilerinin güvenli ve etik kullanımı için dikkat edilmesi gereken noktalar.',
      tags: ['Safety', 'Ethics', 'Guidelines']
    },
    {
      id: 5,
      title: 'API Entegrasyonu Rehberi',
      category: 'Development',
      readTime: '15 dk',
      description: 'AI model API\'lerini uygulamanıza entegre etmek için adım adım rehber ve kod örnekleri.',
      tags: ['API', 'Integration', 'Development']
    },
    {
      id: 6,
      title: 'Çoklu Modal AI Modelleri',
      category: 'Advanced Topics',
      readTime: '7 dk',
      description: 'Metin, görsel ve ses verilerini birlikte işleyebilen gelişmiş AI modelleri hakkında.',
      tags: ['Multimodal', 'Vision', 'Audio']
    }
  ]

  const categories = [
    { name: 'Tümü', count: articles.length },
    { name: 'AI Basics', count: articles.filter(a => a.category === 'AI Basics').length },
    { name: 'Model Comparison', count: articles.filter(a => a.category === 'Model Comparison').length },
    { name: 'Best Practices', count: articles.filter(a => a.category === 'Best Practices').length },
    { name: 'Ethics & Safety', count: articles.filter(a => a.category === 'Ethics & Safety').length },
    { name: 'Development', count: articles.filter(a => a.category === 'Development').length },
    { name: 'Advanced Topics', count: articles.filter(a => a.category === 'Advanced Topics').length }
  ]

  return (
    <>
      <TopNav />
      <div className="min-h-screen pt-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Bilgi Bankası
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              AI teknolojileri ve en iyi uygulamalar hakkında kapsamlı kaynak merkezi
            </p>

            {/* Search Bar */}
            <div className="relative max-w-md">
              <input
                type="text"
                placeholder="Bilgi bankasında ara..."
                className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar */}
            <div className="lg:w-64 flex-shrink-0">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Kategoriler
                </h3>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <div
                      key={category.name}
                      className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                    >
                      <span className="text-gray-700 dark:text-gray-300">
                        {category.name}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400 text-sm">
                        {category.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Popüler Etiketler
                </h3>
                <div className="flex flex-wrap gap-2">
                  {['AI', 'Machine Learning', 'GPT-4', 'Claude', 'API', 'Prompt', 'Ethics', 'Safety'].map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1">
              <div className="grid gap-6">
                {articles.map((article) => (
                  <div
                    key={article.id}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium rounded">
                          {article.category}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400 text-sm">
                          {article.readTime} okuma
                        </span>
                      </div>
                      <div className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                      </div>
                    </div>

                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      {article.title}
                    </h2>

                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      {article.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {article.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer transition-colors"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                      <div className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                        Devamını oku →
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Load More Button */}
              <div className="mt-8 text-center">
                <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Daha Fazla Makale Yükle
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}