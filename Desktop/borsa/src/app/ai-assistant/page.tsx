'use client';

import { useState } from 'react';
import { Send, Bot, TrendingUp, Shield, Globe } from 'lucide-react';

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    {
      role: 'assistant',
      content: '👋 Merhaba! Ben Ailydian AI Trading Asistanınızım. Size kripto ve hisse senedi piyasaları hakkında yardımcı olabilirim. Hangi coin veya hisse hakkında bilgi almak istersiniz?'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('tr');

  const languages = [
    { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' }
  ];

  const quickActionsMap: Record<string, Array<{ icon: any; text: string; query: string }>> = {
    tr: [
      { icon: TrendingUp, text: 'BTC analizi yap', query: 'Bitcoin (BTC) için teknik analiz yap ve AL/ALMA önerisi ver' },
      { icon: TrendingUp, text: 'ETH sinyali', query: 'Ethereum (ETH) için güncel sinyal ver' },
      { icon: Shield, text: 'Risk analizi', query: 'Kripto piyasasındaki mevcut risk seviyesini analiz et' },
      { icon: Globe, text: 'Piyasa özeti', query: 'Bugünkü kripto piyasası genel durumunu özetle' }
    ],
    en: [
      { icon: TrendingUp, text: 'BTC analysis', query: 'Provide technical analysis for Bitcoin (BTC) with BUY/HOLD recommendation' },
      { icon: TrendingUp, text: 'ETH signal', query: 'Give current signal for Ethereum (ETH)' },
      { icon: Shield, text: 'Risk analysis', query: 'Analyze current risk level in crypto market' },
      { icon: Globe, text: 'Market summary', query: 'Summarize today\'s crypto market situation' }
    ],
    de: [
      { icon: TrendingUp, text: 'BTC Analyse', query: 'Technische Analyse für Bitcoin (BTC) mit KAUFEN/HALTEN Empfehlung' },
      { icon: TrendingUp, text: 'ETH Signal', query: 'Aktuelles Signal für Ethereum (ETH)' },
      { icon: Shield, text: 'Risikoanalyse', query: 'Aktuelles Risikoniveau im Kryptomarkt analysieren' },
      { icon: Globe, text: 'Marktübersicht', query: 'Heutige Kryptomarkt-Situation zusammenfassen' }
    ],
    fr: [
      { icon: TrendingUp, text: 'Analyse BTC', query: 'Analyse technique pour Bitcoin (BTC) avec recommandation ACHETER/CONSERVER' },
      { icon: TrendingUp, text: 'Signal ETH', query: 'Signal actuel pour Ethereum (ETH)' },
      { icon: Shield, text: 'Analyse des risques', query: 'Analyser le niveau de risque actuel du marché crypto' },
      { icon: Globe, text: 'Résumé du marché', query: 'Résumer la situation du marché crypto aujourd\'hui' }
    ],
    ru: [
      { icon: TrendingUp, text: 'Анализ BTC', query: 'Технический анализ Bitcoin (BTC) с рекомендацией КУПИТЬ/ДЕРЖАТЬ' },
      { icon: TrendingUp, text: 'Сигнал ETH', query: 'Текущий сигнал для Ethereum (ETH)' },
      { icon: Shield, text: 'Анализ рисков', query: 'Проанализировать текущий уровень риска на крипторынке' },
      { icon: Globe, text: 'Обзор рынка', query: 'Резюме ситуации на крипторынке сегодня' }
    ],
    zh: [
      { icon: TrendingUp, text: 'BTC分析', query: '提供比特币(BTC)技术分析和买入/持有建议' },
      { icon: TrendingUp, text: 'ETH信号', query: '提供以太坊(ETH)当前信号' },
      { icon: Shield, text: '风险分析', query: '分析加密市场当前风险水平' },
      { icon: Globe, text: '市场摘要', query: '总结今日加密市场情况' }
    ],
    ja: [
      { icon: TrendingUp, text: 'BTC分析', query: 'ビットコイン(BTC)のテクニカル分析と購入/保有の推奨' },
      { icon: TrendingUp, text: 'ETHシグナル', query: 'イーサリアム(ETH)の現在のシグナル' },
      { icon: Shield, text: 'リスク分析', query: '暗号市場の現在のリスクレベルを分析' },
      { icon: Globe, text: '市場概要', query: '今日の暗号市場の状況をまとめる' }
    ]
  };

  const quickActions = quickActionsMap[selectedLanguage] || quickActionsMap.tr;

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          language: selectedLanguage,
          history: messages.slice(-5) // Son 5 mesaj
        })
      });

      const data = await response.json();

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.message || 'Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.'
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '❌ Bağlantı hatası. Lütfen tekrar deneyin.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = (query: string) => {
    setInput(query);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Bot className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Ailydian AI Trading Assistant</h1>
                <p className="text-sm text-gray-400">Multi-language Crypto & Stock Analysis</p>
              </div>
            </div>

            {/* Language Selector */}
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {languages.map(lang => (
                <option key={lang.code} value={lang.code} className="bg-slate-900">
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* Sidebar - Quick Actions */}
          <div className="lg:col-span-1">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-400" />
                {selectedLanguage === 'tr' ? 'Hızlı İşlemler' :
                 selectedLanguage === 'en' ? 'Quick Actions' :
                 selectedLanguage === 'de' ? 'Schnellaktionen' :
                 selectedLanguage === 'fr' ? 'Actions Rapides' :
                 selectedLanguage === 'ru' ? 'Быстрые действия' :
                 selectedLanguage === 'zh' ? '快速操作' :
                 selectedLanguage === 'ja' ? 'クイックアクション' : 'Hızlı İşlemler'}
              </h2>
              <div className="space-y-2">
                {quickActions.map((action, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuickAction(action.query)}
                    className="w-full px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-left text-white transition-all duration-200 flex items-center gap-3 group"
                  >
                    <action.icon className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
                    <span className="text-sm">{action.text}</span>
                  </button>
                ))}
              </div>

              {/* Features */}
              <div className="mt-6 pt-6 border-t border-white/10">
                <h3 className="text-sm font-semibold text-gray-400 mb-3">
                  {selectedLanguage === 'tr' ? 'Özellikler' :
                   selectedLanguage === 'en' ? 'Features' :
                   selectedLanguage === 'de' ? 'Funktionen' :
                   selectedLanguage === 'fr' ? 'Fonctionnalités' :
                   selectedLanguage === 'ru' ? 'Особенности' :
                   selectedLanguage === 'zh' ? '特点' :
                   selectedLanguage === 'ja' ? '機能' : 'Özellikler'}
                </h3>
                <div className="space-y-2 text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>
                      {selectedLanguage === 'tr' ? 'Gerçek zamanlı analiz' :
                       selectedLanguage === 'en' ? 'Real-time analysis' :
                       selectedLanguage === 'de' ? 'Echtzeit-Analyse' :
                       selectedLanguage === 'fr' ? 'Analyse en temps réel' :
                       selectedLanguage === 'ru' ? 'Анализ в реальном времени' :
                       selectedLanguage === 'zh' ? '实时分析' :
                       selectedLanguage === 'ja' ? 'リアルタイム分析' : 'Gerçek zamanlı analiz'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>
                      {selectedLanguage === 'tr' ? '7 dil desteği' :
                       selectedLanguage === 'en' ? '7 language support' :
                       selectedLanguage === 'de' ? '7 Sprachen' :
                       selectedLanguage === 'fr' ? '7 langues' :
                       selectedLanguage === 'ru' ? '7 языков' :
                       selectedLanguage === 'zh' ? '7种语言' :
                       selectedLanguage === 'ja' ? '7言語対応' : '7 dil desteği'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>
                      {selectedLanguage === 'tr' ? 'Teknik göstergeler' :
                       selectedLanguage === 'en' ? 'Technical indicators' :
                       selectedLanguage === 'de' ? 'Technische Indikatoren' :
                       selectedLanguage === 'fr' ? 'Indicateurs techniques' :
                       selectedLanguage === 'ru' ? 'Технические индикаторы' :
                       selectedLanguage === 'zh' ? '技术指标' :
                       selectedLanguage === 'ja' ? 'テクニカル指標' : 'Teknik göstergeler'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                    <span>
                      {selectedLanguage === 'tr' ? 'AL/ALMA sinyalleri' :
                       selectedLanguage === 'en' ? 'BUY/HOLD signals' :
                       selectedLanguage === 'de' ? 'KAUFEN/HALTEN Signale' :
                       selectedLanguage === 'fr' ? 'Signaux ACHETER/CONSERVER' :
                       selectedLanguage === 'ru' ? 'КУПИТЬ/ДЕРЖАТЬ сигналы' :
                       selectedLanguage === 'zh' ? '买入/持有信号' :
                       selectedLanguage === 'ja' ? '買い/保有シグナル' : 'AL/ALMA sinyalleri'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Chat Area */}
          <div className="lg:col-span-3">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden flex flex-col" style={{ height: '75vh' }}>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Bot className="w-5 h-5 text-white" />
                      </div>
                    )}

                    <div
                      className={`px-4 py-3 rounded-2xl max-w-[80%] ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white'
                          : 'bg-white/10 text-white border border-white/10'
                      }`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    </div>

                    {msg.role === 'user' && (
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-sm font-semibold">ME</span>
                      </div>
                    )}
                  </div>
                ))}

                {loading && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <Bot className="w-5 h-5 text-white animate-pulse" />
                    </div>
                    <div className="px-4 py-3 bg-white/10 rounded-2xl border border-white/10">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="border-t border-white/10 p-4 bg-black/20">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Mesajınızı yazın... (örn: BTC analizi yap)"
                    className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 backdrop-blur-xl"
                    disabled={loading}
                  />
                  <button
                    onClick={handleSend}
                    disabled={loading || !input.trim()}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white font-medium transition-all duration-200 flex items-center gap-2"
                  >
                    <Send className="w-5 h-5" />
                    Gönder
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}