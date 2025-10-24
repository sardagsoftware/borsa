"use client";
import { BookOpen, X, TrendingUp, Zap, Shield, Target, Brain, DollarSign } from "lucide-react";

export default function QuickReference() {
  return (
    <div className="p-6 space-y-6">
      {/* Swing Trading Stratejisi */}
      <section>
        <h3 className="font-bold text-lg flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-accent-blue" />
          🎯 Swing Trading Stratejisi (4 Saatlik)
        </h3>

        <div className="space-y-3 text-sm">
          <div className="bg-accent-blue/10 border border-accent-blue/30 rounded-lg p-4">
            <div className="font-semibold text-accent-blue mb-2">📊 Swing Trading Nedir?</div>
            <p className="text-xs opacity-80 leading-relaxed">
              Orta vadeli pozisyon stratejisi. Birkaç gün ila birkaç hafta süren fiyat dalgalanmalarından kar elde etmeyi amaçlar.
              4 saatlik zaman dilimi trend analizi için idealdir.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <div className="bg-accent-green/10 border border-accent-green/30 rounded-lg p-3">
              <div className="font-semibold text-accent-green mb-2">✅ Giriş Kriterleri</div>
              <ul className="text-xs space-y-1 opacity-80">
                <li>• <strong>Golden Cross:</strong> EMA50 yukarı keserse EMA200</li>
                <li>• <strong>MACD:</strong> Histogram pozitif, signal yukarı</li>
                <li>• <strong>RSI:</strong> 40-60 arası (momentum başlangıcı)</li>
                <li>• <strong>Bollinger:</strong> Squeeze sonrası breakout</li>
                <li>• <strong>Hacim:</strong> Ortalama +300% artış</li>
                <li>• <strong>MTF Onay:</strong> 3 zaman dilimi aynı yönde</li>
              </ul>
            </div>

            <div className="bg-accent-red/10 border border-accent-red/30 rounded-lg p-3">
              <div className="font-semibold text-accent-red mb-2">⛔ Çıkış Kriterleri</div>
              <ul className="text-xs space-y-1 opacity-80">
                <li>• <strong>Death Cross:</strong> EMA50 aşağı keserse EMA200</li>
                <li>• <strong>MACD:</strong> Histogram negatif, signal aşağı</li>
                <li>• <strong>RSI:</strong> 70+ (aşırı alım) veya 30- (aşırı satım)</li>
                <li>• <strong>Direnç Test:</strong> Güçlü direnç reddedildi</li>
                <li>• <strong>Stop Loss:</strong> -2% zarar (risk yönetimi)</li>
                <li>• <strong>Take Profit:</strong> +6% kar (1:3 risk/reward)</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Candlestick Patterns */}
      <section>
        <h3 className="font-bold text-lg flex items-center gap-2 mb-4">
          <BookOpen className="w-5 h-5 text-accent-yellow" />
          🕯️ Mum Formasyonları (Candlestick Patterns)
        </h3>

        <div className="grid md:grid-cols-3 gap-3 text-sm">
          {/* Bullish Patterns */}
          <div className="bg-accent-green/10 border border-accent-green/30 rounded-lg p-3">
            <div className="font-semibold text-accent-green mb-2">🟢 Yükseliş Formasyonları</div>

            <div className="space-y-2 text-xs">
              <div className="bg-white/5 p-2 rounded">
                <strong>Hammer (Çekiç):</strong>
                <p className="opacity-70 mt-1">Küçük gövde, uzun alt fitil. Düşüş sonrası dönüş sinyali.</p>
              </div>

              <div className="bg-white/5 p-2 rounded">
                <strong>Bullish Engulfing:</strong>
                <p className="opacity-70 mt-1">Yeşil mum önceki kırmızı mumu yutar. Güçlü yükseliş!</p>
              </div>

              <div className="bg-white/5 p-2 rounded">
                <strong>Morning Star:</strong>
                <p className="opacity-70 mt-1">3 mumluk dönüş formasyonu. Güçlü trend değişimi.</p>
              </div>

              <div className="bg-white/5 p-2 rounded">
                <strong>Piercing Line:</strong>
                <p className="opacity-70 mt-1">Yeşil mum önceki kırmızının yarısını geçer.</p>
              </div>
            </div>
          </div>

          {/* Bearish Patterns */}
          <div className="bg-accent-red/10 border border-accent-red/30 rounded-lg p-3">
            <div className="font-semibold text-accent-red mb-2">🔴 Düşüş Formasyonları</div>

            <div className="space-y-2 text-xs">
              <div className="bg-white/5 p-2 rounded">
                <strong>Shooting Star (Kayan Yıldız):</strong>
                <p className="opacity-70 mt-1">Küçük gövde, uzun üst fitil. Yükseliş sonrası dönüş.</p>
              </div>

              <div className="bg-white/5 p-2 rounded">
                <strong>Bearish Engulfing:</strong>
                <p className="opacity-70 mt-1">Kırmızı mum önceki yeşil mumu yutar. Güçlü düşüş!</p>
              </div>

              <div className="bg-white/5 p-2 rounded">
                <strong>Evening Star:</strong>
                <p className="opacity-70 mt-1">3 mumluk dönüş formasyonu. Trend değişimi.</p>
              </div>

              <div className="bg-white/5 p-2 rounded">
                <strong>Dark Cloud Cover:</strong>
                <p className="opacity-70 mt-1">Kırmızı mum önceki yeşilin yarısını geçer.</p>
              </div>
            </div>
          </div>

          {/* Neutral/Reversal */}
          <div className="bg-accent-yellow/10 border border-accent-yellow/30 rounded-lg p-3">
            <div className="font-semibold text-accent-yellow mb-2">⚪ Kararsızlık/Dönüş</div>

            <div className="space-y-2 text-xs">
              <div className="bg-white/5 p-2 rounded">
                <strong>Doji:</strong>
                <p className="opacity-70 mt-1">Açılış = Kapanış. Kararsızlık, trend dönüşü olabilir.</p>
              </div>

              <div className="bg-white/5 p-2 rounded">
                <strong>Spinning Top:</strong>
                <p className="opacity-70 mt-1">Küçük gövde, uzun fitiller. Belirsizlik.</p>
              </div>

              <div className="bg-white/5 p-2 rounded">
                <strong>Harami:</strong>
                <p className="opacity-70 mt-1">İkinci mum öncekinin içinde. Dönüş sinyali.</p>
              </div>

              <div className="bg-white/5 p-2 rounded">
                <strong>Marubozu:</strong>
                <p className="opacity-70 mt-1">Fitil yok, sadece gövde. Güçlü trend.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* İndikatör Detayları */}
      <section>
        <h3 className="font-bold text-lg flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-accent-green" />
          📈 İndikatör Detaylı Açıklamalar
        </h3>

        <div className="grid md:grid-cols-2 gap-3 text-sm">
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="font-semibold text-blue-400 mb-2">📊 EMA (Exponential Moving Average)</div>
            <div className="space-y-2 text-xs opacity-80">
              <p><strong>Formül:</strong> Son fiyatlara daha çok ağırlık verir</p>
              <p><strong>EMA(50):</strong> Kısa-orta vadeli trend</p>
              <p><strong>EMA(200):</strong> Uzun vadeli trend</p>
              <p className="text-accent-green"><strong>Golden Cross:</strong> EMA50 &gt; EMA200 = Yükseliş başlangıcı</p>
              <p className="text-accent-red"><strong>Death Cross:</strong> EMA50 &lt; EMA200 = Düşüş başlangıcı</p>
              <p className="bg-accent-blue/20 p-2 rounded mt-2">
                <strong>Kullanım:</strong> Fiyat EMA50 üstünde ve EMA50 EMA200 üstündeyse = Güçlü yükseliş trendi
              </p>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="font-semibold text-purple-400 mb-2">⚡ MACD (Moving Average Convergence Divergence)</div>
            <div className="space-y-2 text-xs opacity-80">
              <p><strong>Parametreler:</strong> MACD(12,26,9)</p>
              <p><strong>Histogram:</strong> MACD - Signal line farkı</p>
              <p className="text-accent-green"><strong>Bullish Cross:</strong> MACD yukarı keser signal = AL</p>
              <p className="text-accent-red"><strong>Bearish Cross:</strong> MACD aşağı keser signal = SAT</p>
              <p className="text-accent-yellow"><strong>Divergence:</strong> Fiyat yeni zirve ama MACD yapmıyor = Dönüş</p>
              <p className="bg-accent-blue/20 p-2 rounded mt-2">
                <strong>Momentum:</strong> Histogram büyüdükçe trend güçleniyor
              </p>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="font-semibold text-orange-400 mb-2">🎯 RSI (Relative Strength Index)</div>
            <div className="space-y-2 text-xs opacity-80">
              <p><strong>Ölçek:</strong> 0-100 arası momentum göstergesi</p>
              <p className="text-accent-red"><strong>&gt; 70:</strong> Aşırı alım bölgesi (Overbot) - SAT sinyali</p>
              <p className="text-accent-green"><strong>&lt; 30:</strong> Aşırı satım bölgesi (Oversold) - AL sinyali</p>
              <p className="text-accent-yellow"><strong>40-60:</strong> Swing trading için ideal giriş bölgesi</p>
              <p className="bg-accent-blue/20 p-2 rounded mt-2">
                <strong>Bullish Divergence:</strong> Fiyat düşerken RSI yükselirse = Yükseliş dönüşü yakın<br/>
                <strong>Bearish Divergence:</strong> Fiyat yükselirken RSI düşerse = Düşüş dönüşü yakın
              </p>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="font-semibold text-yellow-400 mb-2">📏 Bollinger Bands (BB)</div>
            <div className="space-y-2 text-xs opacity-80">
              <p><strong>Parametreler:</strong> BB(20, 2) - 20 periyot, 2 standart sapma</p>
              <p><strong>3 Bant:</strong> Üst, Orta (SMA20), Alt</p>
              <p className="text-accent-red"><strong>Üst Banda Dokunma:</strong> Aşırı alım, muhtemel geri çekilme</p>
              <p className="text-accent-green"><strong>Alt Banda Dokunma:</strong> Aşırı satım, muhtemel yükseliş</p>
              <p className="text-accent-yellow"><strong>Squeeze (Sıkışma):</strong> Bantlar daralırsa = Büyük hareket yakın</p>
              <p className="bg-accent-blue/20 p-2 rounded mt-2">
                <strong>Breakout:</strong> Fiyat üst banttan çıkarsa = Güçlü yükseliş<br/>
                <strong>Breakdown:</strong> Fiyat alt banttan çıkarsa = Güçlü düşüş
              </p>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="font-semibold text-purple-400 mb-2">📊 VWAP (Volume Weighted Average Price)</div>
            <div className="space-y-2 text-xs opacity-80">
              <p><strong>Tanım:</strong> Hacim ağırlıklı ortalama fiyat</p>
              <p><strong>Kullanım:</strong> Kurumsal yatırımcıların referans noktası</p>
              <p className="text-accent-green"><strong>Fiyat &gt; VWAP:</strong> Alıcılar kontrolde, yükseliş trendi</p>
              <p className="text-accent-red"><strong>Fiyat &lt; VWAP:</strong> Satıcılar kontrolde, düşüş trendi</p>
              <p className="bg-accent-blue/20 p-2 rounded mt-2">
                <strong>Gün içi Trading:</strong> VWAP desteği veya direnci olarak kullanılır<br/>
                <strong>Kurumsal İşlemler:</strong> Büyük oyuncular VWAP'e yakın fiyatları hedefler
              </p>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="font-semibold text-cyan-400 mb-2">📍 Destek & Direnç Seviyeleri</div>
            <div className="space-y-2 text-xs opacity-80">
              <p><strong>Destek (Support):</strong> Fiyatın geri sıçradığı alt seviye</p>
              <p><strong>Direnç (Resistance):</strong> Fiyatın reddedildiği üst seviye</p>
              <p className="text-accent-green"><strong>Destek Kırılırsa:</strong> Yeni direnç olur (Role Reversal)</p>
              <p className="text-accent-red"><strong>Direnç Kırılırsa:</strong> Yeni destek olur</p>
              <p className="bg-accent-blue/20 p-2 rounded mt-2">
                <strong>Güç Seviyesi:</strong> 1-10 arası. Yüksek = Güçlü seviye<br/>
                <strong>Test Sayısı:</strong> Seviye ne kadar çok test edilirse o kadar güçlü
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Risk Yönetimi */}
      <section>
        <h3 className="font-bold text-lg flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-accent-red" />
          🛡️ Risk Yönetimi & Para Yönetimi
        </h3>

        <div className="grid md:grid-cols-2 gap-3 text-sm">
          <div className="bg-accent-red/10 border border-accent-red/30 rounded-lg p-4">
            <div className="font-semibold text-accent-red mb-3">⚠️ Altın Kurallar</div>
            <div className="space-y-2 text-xs">
              <div className="bg-white/5 p-2 rounded">
                <strong>1. %2 Kuralı:</strong>
                <p className="opacity-70 mt-1">Tek bir işlemde sermayenizin maksimum %2'sini riske edin.</p>
              </div>

              <div className="bg-white/5 p-2 rounded">
                <strong>2. Stop Loss Zorunlu:</strong>
                <p className="opacity-70 mt-1">Her pozisyona girmeden önce stop loss belirleyin. Disiplini koruyun!</p>
              </div>

              <div className="bg-white/5 p-2 rounded">
                <strong>3. Risk/Reward 1:3:</strong>
                <p className="opacity-70 mt-1">En az 3 kat kazanç hedefleyin. Örn: %2 risk = %6 hedef</p>
              </div>

              <div className="bg-white/5 p-2 rounded">
                <strong>4. Pozisyon Büyüklüğü:</strong>
                <p className="opacity-70 mt-1">Sermaye × 2% ÷ Stop Loss Mesafesi = Lot büyüklüğü</p>
              </div>

              <div className="bg-white/5 p-2 rounded">
                <strong>5. Overtrading Yapma:</strong>
                <p className="opacity-70 mt-1">Günde max 2-3 işlem. Kalite &gt; Miktar</p>
              </div>
            </div>
          </div>

          <div className="bg-accent-green/10 border border-accent-green/30 rounded-lg p-4">
            <div className="font-semibold text-accent-green mb-3">✅ Pozisyon Yönetimi</div>
            <div className="space-y-2 text-xs">
              <div className="bg-white/5 p-2 rounded">
                <strong>Kademeli Giriş:</strong>
                <p className="opacity-70 mt-1">%50 giriş yap, doğrulama sonrası %50 daha ekle.</p>
              </div>

              <div className="bg-white/5 p-2 rounded">
                <strong>Trailing Stop:</strong>
                <p className="opacity-70 mt-1">Kar arttıkça stop loss'u yukarı taşı. Karı kilitle!</p>
              </div>

              <div className="bg-white/5 p-2 rounded">
                <strong>Kısmi Kar Al:</strong>
                <p className="opacity-70 mt-1">%50 hedefte yarısını sat, kalanı trailing stop ile tut.</p>
              </div>

              <div className="bg-white/5 p-2 rounded">
                <strong>Psikoloji:</strong>
                <p className="opacity-70 mt-1">Duygusal kararlardan kaçın. Plana sadık kalın.</p>
              </div>

              <div className="bg-white/5 p-2 rounded">
                <strong>Trading Journal:</strong>
                <p className="opacity-70 mt-1">Her işlemi kaydet, analiz et, öğren.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Multi-Timeframe Analizi */}
      <section>
        <h3 className="font-bold text-lg flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5 text-accent-purple" />
          🧠 Çoklu Zaman Dilimi (MTF) Stratejisi
        </h3>

        <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-lg p-4 text-sm">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <div className="font-semibold text-purple-400 mb-2">📊 Üst Zaman Dilimi (1D)</div>
              <div className="text-xs opacity-80 space-y-1">
                <p><strong>Amaç:</strong> Ana trend yönünü belirle</p>
                <p><strong>Kullanım:</strong> Long için 1D yükseliş trendi şart</p>
                <p className="text-accent-green">✅ Trend filtremiz</p>
              </div>
            </div>

            <div>
              <div className="font-semibold text-blue-400 mb-2">🎯 Ana Zaman Dilimi (4H)</div>
              <div className="text-xs opacity-80 space-y-1">
                <p><strong>Amaç:</strong> Giriş/çıkış sinyalleri</p>
                <p><strong>Kullanım:</strong> Tüm indikatörleri buradan takip et</p>
                <p className="text-accent-blue">📈 Ana trading dilimiz</p>
              </div>
            </div>

            <div>
              <div className="font-semibold text-cyan-400 mb-2">⚡ Alt Zaman Dilimi (1H)</div>
              <div className="text-xs opacity-80 space-y-1">
                <p><strong>Amaç:</strong> Giriş zamanlaması</p>
                <p><strong>Kullanım:</strong> En iyi fiyat için timing</p>
                <p className="text-accent-yellow">⏰ Zamanlamacı</p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="text-xs space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-accent-green rounded-full"></div>
                <strong>3/3 Onay:</strong> Tüm zaman dilimleri aynı yönde = Güven %95+
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-accent-yellow rounded-full"></div>
                <strong>2/3 Onay:</strong> İki zaman dilimi onaylıyor = Güven %70
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-accent-red rounded-full"></div>
                <strong>1/3 veya Çelişkili:</strong> İşlem yapma! Bekle.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Önemli Notlar */}
      <section>
        <h3 className="font-bold text-lg flex items-center gap-2 mb-4">
          <DollarSign className="w-5 h-5 text-accent-yellow" />
          💰 Profesyonel Trading İpuçları
        </h3>

        <div className="grid md:grid-cols-2 gap-3 text-sm">
          <div className="bg-accent-yellow/10 border border-accent-yellow/30 rounded-lg p-3">
            <div className="font-semibold text-accent-yellow mb-2">⚡ Hızlı İpuçları</div>
            <ul className="text-xs space-y-1 opacity-80">
              <li>• <strong>Sabır:</strong> Mükemmel setup'ı bekle, her fırsata atlama</li>
              <li>• <strong>Trend is Your Friend:</strong> Trend yönünde trade et</li>
              <li>• <strong>Hacim Onayı:</strong> Her sinyal hacimle onaylanmalı</li>
              <li>• <strong>News Trading:</strong> Önemli haberlerden önce pozisyon kapatılması tavsiye edilir</li>
              <li>• <strong>Weekend Risk:</strong> Hafta sonu pozisyon tutmayın (kripto hariç)</li>
            </ul>
          </div>

          <div className="bg-accent-red/10 border border-accent-red/30 rounded-lg p-3">
            <div className="font-semibold text-accent-red mb-2">🚫 Yapılmaması Gerekenler</div>
            <ul className="text-xs space-y-1 opacity-80">
              <li>• <strong>Revenge Trading:</strong> Kaybettikten sonra hemen geri almaya çalışma</li>
              <li>• <strong>FOMO:</strong> Trendin en üstünde girme korkusu (Fear of Missing Out)</li>
              <li>• <strong>Overleveraging:</strong> Aşırı kaldıraç kullanma (max 3x swing için)</li>
              <li>• <strong>No Stop Loss:</strong> Stop loss koymadan işlem yapma</li>
              <li>• <strong>Averaging Down:</strong> Kayıpları çoğaltma, kaybı kabul et</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Klavye Kısayolları */}
      <section>
        <h3 className="font-bold text-lg mb-4">⌨️ Klavye Kısayolları</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <div className="bg-white/5 rounded p-2">
            <kbd className="px-2 py-1 bg-white/10 rounded text-[10px]">ESC</kbd>
            <div className="mt-1 opacity-70">Drawer Kapat</div>
          </div>
          <div className="bg-white/5 rounded p-2">
            <kbd className="px-2 py-1 bg-white/10 rounded text-[10px]">ENTER</kbd>
            <div className="mt-1 opacity-70">Koin Seç</div>
          </div>
          <div className="bg-white/5 rounded p-2">
            <kbd className="px-2 py-1 bg-white/10 rounded text-[10px]">1-8</kbd>
            <div className="mt-1 opacity-70">Zaman Dilimi</div>
          </div>
          <div className="bg-white/5 rounded p-2">
            <kbd className="px-2 py-1 bg-white/10 rounded text-[10px]">SPACE</kbd>
            <div className="mt-1 opacity-70">Chart Duraklat</div>
          </div>
        </div>
      </section>

      {/* Sorumluluk Reddi */}
      <div className="mt-6 pt-6 border-t border-border">
        <div className="bg-accent-red/10 border border-accent-red/30 rounded-lg p-4 text-xs">
          <div className="font-semibold text-accent-red mb-2">⚠️ Önemli Uyarı & Sorumluluk Reddi</div>
          <p className="opacity-80 leading-relaxed">
            Bu rehber sadece eğitim amaçlıdır. Finansal tavsiye niteliği taşımaz.
            Kripto para ve türev ürün yatırımları yüksek risk içerir. Sermayenizin tamamını kaybedebilirsiniz.
            Yatırım kararlarınızı profesyonel danışmanlık alarak ve risk toleransınızı değerlendirerek verin.
            Geçmiş performans gelecekteki sonuçların göstergesi değildir.
          </p>
        </div>
      </div>
    </div>
  );
}
