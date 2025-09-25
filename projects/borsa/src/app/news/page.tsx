'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Newspaper, Clock, TrendingUp, ExternalLink, Calendar, Tag } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  content: string;
  source: string;
  publishedAt: string;
  category: 'stocks' | 'crypto' | 'markets' | 'analysis';
  tags: string[];
  imageUrl?: string;
  url: string;
  sentiment: 'positive' | 'negative' | 'neutral';
}

export default function NewsPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock news data - gerçek API entegrasyonu için hazır
  const mockNews: NewsItem[] = [
    {
      id: '1',
      title: 'Tesla Hisseleri %5 Yükseldi: Yeni Model Duyurusu Sonrası',
      summary: 'Tesla\'nın yeni elektrikli araç modeli duyurusu sonrası hisseler güçlü bir yükseliş gösterdi.',
      content: 'Tesla Inc. bugün düzenlediği etkinlikte yeni elektrikli araç modelini tanıttı. Şirketin CEO\'su Elon Musk, yeni modelin daha düşük fiyat segmentinde olacağını ve 2024 yılında üretime başlanacağını açıkladı.',
      source: 'MarketWatch',
      publishedAt: '2024-01-15T10:30:00Z',
      category: 'stocks',
      tags: ['TSLA', 'elektrikli araç', 'teknoloji'],
      url: '#',
      sentiment: 'positive'
    },
    {
      id: '2',
      title: 'Bitcoin 45,000 Doları Aştı: Kurumsal Yatırım Devam Ediyor',
      summary: 'Bitcoin fiyatı 45,000 dolar seviyesini aşarak son 6 ayın en yüksek seviyesine ulaştı.',
      content: 'Kripto para piyasasında Bitcoin liderliğindeki yükseliş devam ediyor. Kurumsal yatırımcıların artan ilgisi ve ETF beklentileri fiyatları desteklemeye devam ediyor.',
      source: 'CoinDesk',
      publishedAt: '2024-01-15T09:15:00Z',
      category: 'crypto',
      tags: ['Bitcoin', 'BTC', 'kripto'],
      url: '#',
      sentiment: 'positive'
    },
    {
      id: '3',
      title: 'Fed Faiz Kararı Öncesi Piyasalarda Beklenti',
      summary: 'Federal Reserve\'in bu hafta açıklayacağı faiz kararı öncesi piyasalarda beklenti hakim.',
      content: 'Amerikan Merkez Bankası Federal Reserve\'in bu hafta açıklayacağı faiz kararı piyasaların odak noktası. Analistler faizlerin sabit kalması beklentisinde.',
      source: 'Bloomberg',
      publishedAt: '2024-01-15T08:00:00Z',
      category: 'markets',
      tags: ['Fed', 'faiz', 'para politikası'],
      url: '#',
      sentiment: 'neutral'
    },
    {
      id: '4',
      title: 'Apple Q4 Sonuçları Beklentileri Aştı',
      summary: 'Apple\'ın son çeyrek finansal sonuçları analist beklentilerini geride bıraktı.',
      content: 'Apple Inc. açıkladığı son çeyrek finansal sonuçlarında gelir ve kar rakamlarında güçlü performans sergiledi. iPhone satışları özellikle dikkat çekti.',
      source: 'Reuters',
      publishedAt: '2024-01-14T16:45:00Z',
      category: 'stocks',
      tags: ['AAPL', 'finansal sonuçlar', 'teknoloji'],
      url: '#',
      sentiment: 'positive'
    },
    {
      id: '5',
      title: 'Ethereum 2.0 Güncelleme Yaklaşıyor',
      summary: 'Ethereum ağındaki büyük güncelleme olan "The Merge" işlemi yaklaşıyor.',
      content: 'Ethereum ağının proof-of-stake sistemine geçiş süreci hızlanıyor. Bu güncelleme ağın enerji tüketimini %99 azaltması bekleniyor.',
      source: 'CryptoNews',
      publishedAt: '2024-01-14T14:20:00Z',
      category: 'crypto',
      tags: ['Ethereum', 'ETH', 'blockchain'],
      url: '#',
      sentiment: 'positive'
    },
    {
      id: '6',
      title: 'Piyasa Analizi: 2024 Beklentileri',
      summary: 'Uzmanlar 2024 yılı için piyasa beklentilerini değerlendirdi.',
      content: 'Wall Street analistleri 2024 yılı için piyasa öngörülerini açıkladı. Teknoloji sektörünün öne çıkması bekleniyor.',
      source: 'Financial Times',
      publishedAt: '2024-01-14T12:00:00Z',
      category: 'analysis',
      tags: ['piyasa analizi', '2024', 'beklentiler'],
      url: '#',
      sentiment: 'neutral'
    }
  ];

  useEffect(() => {
    // Gerçek API çağrısı burada yapılacak
    setTimeout(() => {
      setNews(mockNews);
      setLoading(false);
    }, 1000);
  }, []);

  const categories = [
    { key: 'all', label: 'Tümü', icon: Newspaper },
    { key: 'stocks', label: 'Hisseler', icon: TrendingUp },
    { key: 'crypto', label: 'Kripto', icon: TrendingUp },
    { key: 'markets', label: 'Piyasalar', icon: TrendingUp },
    { key: 'analysis', label: 'Analiz', icon: TrendingUp }
  ];

  const filteredNews = news.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesCategory && matchesSearch;
  });

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-gain';
      case 'negative': return 'text-loss';
      default: return 'text-gray-400';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'stocks': return 'bg-blue-500/20 text-blue-400';
      case 'crypto': return 'bg-orange-500/20 text-orange-400';
      case 'markets': return 'bg-green-500/20 text-green-400';
      case 'analysis': return 'bg-purple-500/20 text-purple-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Şimdi';
    if (diffInHours < 24) return `${diffInHours} saat önce`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} gün önce`;
    
    return date.toLocaleDateString('tr-TR');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold neon-text mb-4">Piyasa Haberleri</h1>
          <p className="text-xl text-gray-300">
            Finansal piyasalardan son dakika haberleri ve analizler
          </p>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <motion.button
                key={category.key}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory(category.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  selectedCategory === category.key
                    ? 'gradient-bg text-white'
                    : 'neon-border text-gray-300 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                {category.label}
              </motion.button>
            );
          })}
        </div>

        {/* Search */}
        <div className="max-w-md mx-auto mb-8">
          <input
            type="text"
            placeholder="Haberlerde ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-accent-1"
          />
        </div>
      </motion.div>

      {/* News Feed */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {filteredNews.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <Newspaper className="w-24 h-24 text-gray-600 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-4">
              Haber bulunamadı
            </h2>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              Seçtiğiniz kriterlere uygun haber bulunmamaktadır.
            </p>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {/* Featured News */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="neon-border bg-gray-900/50 backdrop-blur-sm rounded-lg p-6"
            >
              <div className="flex items-start gap-4">
                <div className="w-2 h-2 bg-accent-1 rounded-full mt-2 pulse-glow"></div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(filteredNews[0]?.category)}`}>
                      {filteredNews[0]?.category?.toUpperCase()}
                    </span>
                    <div className="flex items-center gap-1 text-gray-400 text-sm">
                      <Clock className="w-4 h-4" />
                      {formatDate(filteredNews[0]?.publishedAt)}
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-3 leading-tight">
                    {filteredNews[0]?.title}
                  </h2>
                  <p className="text-gray-300 mb-4 leading-relaxed">
                    {filteredNews[0]?.summary}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-400">
                        Kaynak: {filteredNews[0]?.source}
                      </span>
                      <div className="flex gap-2">
                        {filteredNews[0]?.tags.slice(0, 3).map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-800 text-gray-300 text-xs rounded-full"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className={`text-sm ${getSentimentColor(filteredNews[0]?.sentiment)}`}>
                      {filteredNews[0]?.sentiment === 'positive' && '📈 Pozitif'}
                      {filteredNews[0]?.sentiment === 'negative' && '📉 Negatif'}
                      {filteredNews[0]?.sentiment === 'neutral' && '📊 Nötr'}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* News List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredNews.slice(1).map((item, index) => (
                <motion.article
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="neon-border bg-gray-900/50 backdrop-blur-sm rounded-lg p-6 hover:shadow-lg hover:shadow-accent-1/20 transition-all duration-300 group cursor-pointer"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(item.category)}`}>
                      {item.category.toUpperCase()}
                    </span>
                    <div className="flex items-center gap-1 text-gray-400 text-sm">
                      <Clock className="w-3 h-3" />
                      {formatDate(item.publishedAt)}
                    </div>
                    <div className={`ml-auto text-xs ${getSentimentColor(item.sentiment)}`}>
                      {item.sentiment === 'positive' && '📈'}
                      {item.sentiment === 'negative' && '📉'}
                      {item.sentiment === 'neutral' && '📊'}
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-accent-1 transition-colors line-clamp-2">
                    {item.title}
                  </h3>

                  <p className="text-gray-300 text-sm mb-4 line-clamp-3 leading-relaxed">
                    {item.summary}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      {item.source}
                    </span>
                    
                    <div className="flex gap-1">
                      {item.tags.slice(0, 2).map((tag, tagIndex) => (
                        <span
                          key={tagIndex}
                          className="px-2 py-1 bg-gray-800 text-gray-400 text-xs rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-700">
                    <button className="text-accent-1 hover:text-accent-2 transition-colors text-sm font-medium flex items-center gap-1">
                      Devamını Oku
                      <ExternalLink className="w-3 h-3" />
                    </button>
                    
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-xs text-gray-400">
                        {new Date(item.publishedAt).toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}