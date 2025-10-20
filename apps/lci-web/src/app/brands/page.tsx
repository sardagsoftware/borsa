'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Brand {
  id: string;
  name: string;
  slug: string;
  verificationLevel: string;
  slaHours: number;
  solutionRate: number | null;
  _count?: {
    complaints: number;
  };
}

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      const response = await fetch('http://localhost:3201/brands');
      if (!response.ok) throw new Error('Failed to fetch brands');
      const data = await response.json();
      setBrands(data);
    } catch (error) {
      console.error('Error fetching brands:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Markalar yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mb-8">
        <h1 className="mb-4 text-4xl font-bold">Markalar</h1>
        <p className="text-lg text-muted-foreground">
          Platformdaki tüm markaları görüntüleyin ve değerlendirmeleri inceleyin.
        </p>
      </div>

      {brands.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-muted-foreground">
            Henüz kayıtlı marka bulunmuyor.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            İlk şikayeti oluşturduğunuzda markalar otomatik olarak eklenecektir.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {brands.map((brand) => (
            <Link
              key={brand.id}
              href={`/brands/${brand.slug}`}
              className="rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-semibold">{brand.name}</h3>
                  {brand.verificationLevel === 'DOCUMENTED' && (
                    <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                      ✓ Doğrulanmış
                    </span>
                  )}
                </div>

                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Şikayet Sayısı:</span>
                    <span className="font-medium text-foreground">
                      {brand._count?.complaints || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Çözüm Oranı:</span>
                    <span className="font-medium text-foreground">
                      {brand.solutionRate
                        ? `${(brand.solutionRate * 100).toFixed(0)}%`
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>SLA Hedefi:</span>
                    <span className="font-medium text-foreground">
                      {brand.slaHours} saat
                    </span>
                  </div>
                </div>

                <div className="mt-4 text-right">
                  <span className="text-sm text-primary hover:underline">
                    Detayları Gör →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
