'use client';

import { MessageSquare, Zap, Shield, Globe } from 'lucide-react';

export function WelcomeScreen() {
  const features = [
    {
      icon: MessageSquare,
      title: 'Çoklu Platform Desteği',
      description: 'Trendyol, Hepsiburada, Getir, Yemeksepeti ve daha fazlası',
    },
    {
      icon: Zap,
      title: 'Anında İşlem',
      description: 'Ürün yükleme, sipariş takibi, stok güncelleme',
    },
    {
      icon: Shield,
      title: 'Güvenli & KVKK Uyumlu',
      description: 'White-hat yaklaşım, resmi API entegrasyonları',
    },
    {
      icon: Globe,
      title: 'Çoklu Dil Desteği',
      description: 'Türkçe, İngilizce, Arapça ve daha fazlası',
    },
  ];

  const examples = [
    'Trendyol\'da ürün yükle',
    'Getir siparişlerimi göster',
    'Yemeksepeti menüsünü güncelle',
    'Tüm platformlardaki siparişleri listele',
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full px-4 py-12">
      {/* Logo & Title */}
      <div className="text-center mb-12">
        <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
          <MessageSquare className="w-8 h-8 text-primary-foreground" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Lydian Chat'e Hoş Geldiniz</h1>
        <p className="text-muted-foreground">
          Çoklu platform yönetimi için AI asistanınız
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12 max-w-2xl w-full">
        {features.map((feature, index) => (
          <div
            key={index}
            className="p-4 rounded-xl border border-border bg-card hover:shadow-lg transition-shadow"
          >
            <feature.icon className="w-6 h-6 text-primary mb-2" />
            <h3 className="font-semibold mb-1">{feature.title}</h3>
            <p className="text-sm text-muted-foreground">{feature.description}</p>
          </div>
        ))}
      </div>

      {/* Example Prompts */}
      <div className="max-w-xl w-full">
        <h2 className="text-sm font-semibold text-muted-foreground mb-3">
          Örnek komutlar:
        </h2>
        <div className="space-y-2">
          {examples.map((example, index) => (
            <div
              key={index}
              className="px-4 py-3 rounded-lg border border-border bg-card hover:bg-accent cursor-pointer transition-colors"
            >
              <p className="text-sm">{example}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Note */}
      <p className="text-xs text-muted-foreground mt-12 text-center max-w-md">
        Bu asistan, resmi API entegrasyonları kullanarak güvenli ve KVKK uyumlu
        işlemler gerçekleştirir. Tüm işlemler white-hat yaklaşımla yapılır.
      </p>
    </div>
  );
}
