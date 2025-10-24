"use client";

import { useState } from 'react';

/**
 * SIGNAL LEGEND COMPONENT
 *
 * Çerçeve renklerinin ne anlama geldiğini gösterir
 * - Risk levels
 * - Signal strength
 * - Top performers
 *
 * Kullanıcıya görsel rehberlik sağlar
 */

interface SignalLegendProps {
  compact?: boolean;
}

export default function SignalLegend({ compact = false }: SignalLegendProps) {
  const [isExpanded, setIsExpanded] = useState(!compact);

  const legendItems = [
    {
      category: "🎯 Sinyal Gücü (Alım Gücü Bazlı)",
      items: [
        {
          color: "border-4 border-emerald-400 shadow-[0_0_25px_rgba(52,211,153,0.7)]",
          label: "💎 Diamond (90-100%)",
          description: "Ultra güçlü AL sinyali - En yüksek güven + Yeşil patlama glow"
        },
        {
          color: "border-4 border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.6)]",
          label: "🚀 Strong Buy (80-89%)",
          description: "Çok güçlü AL sinyali - 6/6 strateji onayı + Güçlü yeşil glow"
        },
        {
          color: "border-4 border-lime-500 shadow-[0_0_18px_rgba(132,204,22,0.5)]",
          label: "✅ Buy (70-79%)",
          description: "Güçlü AL sinyali - 5/6 strateji onayı + Lime glow"
        },
        {
          color: "border-4 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.4)]",
          label: "🟢 Moderate Buy (60-69%)",
          description: "Orta seviye AL sinyali - 4/6 strateji + Hafif sarı glow"
        },
        {
          color: "border-4 border-orange-500",
          label: "🟡 Weak (50-59%)",
          description: "Zayıf sinyal - Dikkatli ol (glow yok)"
        },
        {
          color: "border-4 border-red-500",
          label: "⚠️ Very Weak (30-49%)",
          description: "Çok zayıf - Almaya uygun değil (glow yok)"
        },
      ]
    },
    {
      category: "🛡️ Risk Seviyeleri",
      items: [
        {
          color: "border-emerald-500",
          label: "🟢 Çok Düşük Risk",
          description: "Stabil, güvenli - Yeni başlayanlar için ideal"
        },
        {
          color: "border-lime-500",
          label: "🔵 Düşük Risk",
          description: "Kontrollü volatilite - Güvenli"
        },
        {
          color: "border-yellow-500",
          label: "🟡 Orta Risk",
          description: "Normal volatilite - Dikkat gerektirir"
        },
        {
          color: "border-orange-500",
          label: "🟠 Yüksek Risk",
          description: "Yüksek volatilite - Tecrübeli yatırımcılar"
        },
        {
          color: "border-red-600 animate-pulse",
          label: "🔴 Çok Yüksek Risk",
          description: "Aşırı volatilite - Stop-loss zorunlu!"
        },
      ]
    },
    {
      category: "🏆 Özel İşaretler",
      items: [
        {
          color: "border-4 border-yellow-500",
          label: "🏆 TOP 10",
          description: "7 günlük en iyi performans - Sadece altın border (glow yok)"
        },
        {
          color: "border-4 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.5)]",
          label: "⭐ VIP Sinyal",
          description: "Groq AI + 6 strateji onayı - Mor glow premium"
        },
      ]
    }
  ];

  return (
    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-md border border-white/10 rounded-xl p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-2xl">🎨</span>
          </div>
          <div>
            <h3 className="text-lg md:text-xl font-extrabold text-white">
              Çerçeve Renkleri Rehberi
            </h3>
            <p className="text-xs md:text-sm text-gray-400">
              Her renk bir anlam taşır - Doğru kararlar için öğren
            </p>
          </div>
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium text-gray-300"
        >
          {isExpanded ? '▲ Gizle' : '▼ Göster'}
        </button>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {legendItems.map((category, idx) => (
            <div key={idx} className="space-y-3">
              {/* Category Title */}
              <div className="flex items-center gap-2 pb-2 border-b border-white/10">
                <h4 className="text-base md:text-lg font-bold text-white">
                  {category.category}
                </h4>
              </div>

              {/* Legend Items */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {category.items.map((item, itemIdx) => (
                  <div
                    key={itemIdx}
                    className={`
                      group relative
                      bg-gradient-to-br from-white/5 to-transparent
                      backdrop-blur-sm
                      rounded-lg p-3
                      border-2 ${item.color}
                      hover:scale-[1.02]
                      transition-all duration-200
                    `}
                  >
                    {/* Label */}
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-1 h-8 rounded-full ${item.color.replace('border-', 'bg-')}`} />
                      <span className="text-sm font-bold text-white">
                        {item.label}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-gray-400 leading-relaxed">
                      {item.description}
                    </p>

                    {/* Hover Glow */}
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg pointer-events-none" />
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Pro Tip */}
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-600/10 border border-blue-500/30 rounded-lg p-4 mt-6">
            <div className="flex items-start gap-3">
              <span className="text-2xl">💡</span>
              <div>
                <h5 className="text-sm font-bold text-blue-400 mb-1">
                  Pro İpucu
                </h5>
                <p className="text-xs text-gray-300 leading-relaxed">
                  <strong className="text-white">Yeni Border + Glow Sistemi!</strong><br/>
                  • Çerçeve kalınlığı 4px - Köşelerde tam görünürlük ✅<br/>
                  • Güçlü sinyallerde GLOW efekti - Çok daha dikkat çekici 🌟<br/>
                  • <strong className="text-emerald-400">Yeşil glow + 90-100%</strong> = Diamond AL sinyali 💎<br/>
                  • <strong className="text-green-400">Güçlü yeşil glow + 80-89%</strong> = Strong Buy 🚀<br/>
                  • <strong className="text-lime-400">Lime glow + 70-79%</strong> = Buy ✅<br/>
                  • <strong className="text-yellow-400">Sarı glow + 60-69%</strong> = Moderate Buy 🟢<br/>
                  • <strong className="text-orange-400">Turuncu border (glow yok) + 50-59%</strong> = Weak 🟡<br/>
                  • <strong className="text-red-400">Kırmızı border (glow yok) + 30-49%</strong> = Very Weak ⚠️
                </p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-white/10">
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-400">93-95%</div>
              <div className="text-xs text-gray-400">Groq AI Başarı</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">6</div>
              <div className="text-xs text-gray-400">Strateji Analizi</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">4</div>
              <div className="text-xs text-gray-400">Renk Paleti</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">7/24</div>
              <div className="text-xs text-gray-400">Otomatik Tarama</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
