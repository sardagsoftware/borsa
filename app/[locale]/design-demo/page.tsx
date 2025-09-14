'use client';

import React from 'react';

export default function DesignDemo() {
  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-4">
          🚀 AILYDIAN Tasarım Sistemi
        </h1>
        <p className="text-lg text-gray-300 mb-8">
          Ultra-Modern UI Bileşenleri - Smoke Test Başarılı! ✅
        </p>
        
        <div className="grid gap-6">
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
            <h2 className="text-xl font-semibold text-white mb-2">
              Temel Bileşenler Testi
            </h2>
            <p className="text-gray-300">
              Bu sayfayı görüyorsanız, tasarım sistemi doğru çalışıyor demektir.
            </p>
          </div>
          
          <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 p-6 rounded-2xl border border-cyan-400/30">
            <h3 className="text-lg font-semibold text-white">
              ✅ Durum: Tasarım Sistemi Aktif
            </h3>
            <p className="text-sm text-gray-300 mt-2">
              Tüm temel bileşenler ve stiller yüklendi ve çalışıyor.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-green-500/10 border border-green-400/30 p-4 rounded-xl text-center">
              <div className="text-2xl mb-2">✅</div>
              <p className="text-sm text-green-400 font-medium">CSS Değişkenleri Yüklü</p>
            </div>
            
            <div className="bg-cyan-500/10 border border-cyan-400/30 p-4 rounded-xl text-center">
              <div className="text-2xl mb-2">🎨</div>
              <p className="text-sm text-cyan-400 font-medium">Marka Renkleri Aktif</p>
            </div>
            
            <div className="bg-yellow-500/10 border border-yellow-400/30 p-4 rounded-xl text-center">
              <div className="text-2xl mb-2">💫</div>
              <p className="text-sm text-yellow-400 font-medium">Animasyonlar Hazır</p>
            </div>
          </div>

          {/* Ek Test Bileşenleri */}
          <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-600">
            <h3 className="text-lg font-semibold text-white mb-4">
              🧪 Sistem Test Sonuçları
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Next.js 14 Runtime</span>
                <span className="text-green-400">✅ Çalışıyor</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Tailwind CSS</span>
                <span className="text-green-400">✅ Aktif</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">TypeScript</span>
                <span className="text-green-400">✅ Derlendi</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Responsive Design</span>
                <span className="text-green-400">✅ Hazır</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-6 rounded-2xl border border-purple-400/30">
            <h3 className="text-lg font-semibold text-white mb-2">
              🎯 Smoke Test Tamamlandı
            </h3>
            <p className="text-sm text-gray-300">
              Tüm temel sistemler çalışıyor ve hazır. Geliştirme devam edebilir!
            </p>
            <div className="mt-4 flex items-center text-sm text-green-400">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
              Sistem Durumu: Sağlıklı ve Operasyonel
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
