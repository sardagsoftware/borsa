'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewComplaintPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    brandName: '',
    productName: '',
    severity: 'MEDIUM' as const,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3201/complaints', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to create complaint');
      }

      const complaint = await response.json();
      router.push(`/complaints/${complaint.id}`);
    } catch (error) {
      console.error('Error creating complaint:', error);
      alert('Şikayet oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl">
      <h1 className="mb-8 text-4xl font-bold">Yeni Şikayet Oluştur</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Brand Name */}
        <div>
          <label htmlFor="brandName" className="block text-sm font-medium mb-2">
            Marka Adı *
          </label>
          <input
            id="brandName"
            type="text"
            required
            value={formData.brandName}
            onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Örn: Acme Corp"
          />
        </div>

        {/* Product Name */}
        <div>
          <label htmlFor="productName" className="block text-sm font-medium mb-2">
            Ürün Adı (Opsiyonel)
          </label>
          <input
            id="productName"
            type="text"
            value={formData.productName}
            onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Örn: Model X Pro"
          />
        </div>

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-2">
            Şikayet Başlığı *
          </label>
          <input
            id="title"
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Şikayetinizi kısaca özetleyin"
            maxLength={500}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            {formData.title.length}/500 karakter
          </p>
        </div>

        {/* Body */}
        <div>
          <label htmlFor="body" className="block text-sm font-medium mb-2">
            Şikayet Detayı *
          </label>
          <textarea
            id="body"
            required
            value={formData.body}
            onChange={(e) => setFormData({ ...formData, body: e.target.value })}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[200px]"
            placeholder="Şikayetinizi detaylı olarak açıklayın..."
          />
        </div>

        {/* Severity */}
        <div>
          <label htmlFor="severity" className="block text-sm font-medium mb-2">
            Öncelik Seviyesi
          </label>
          <select
            id="severity"
            value={formData.severity}
            onChange={(e) => setFormData({ ...formData, severity: e.target.value as any })}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="LOW">Düşük</option>
            <option value="MEDIUM">Orta</option>
            <option value="HIGH">Yüksek</option>
            <option value="CRITICAL">Kritik</option>
          </select>
        </div>

        {/* Submit Button */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-11 rounded-md px-8"
          >
            {loading ? 'Gönderiliyor...' : 'Şikayeti Gönder'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/')}
            className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-11 rounded-md px-8"
          >
            İptal
          </button>
        </div>

        {/* Privacy Notice */}
        <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
          <p className="font-semibold mb-2">🔒 Gizlilik Notı</p>
          <p>
            Şikayetiniz KVKK/GDPR uyumlu olarak işlenecektir. Kişisel bilgileriniz
            otomatik olarak anonimleştirilir ve güvenli bir şekilde saklanır.
          </p>
        </div>
      </form>
    </div>
  );
}
