// LCI Web - Home Page
// White-hat: Accessible, semantic markup

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-16">
      {/* Hero Section */}
      <section className="mb-16 text-center">
        <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          Lydian Complaint Intelligence
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
          KVKK/GDPR uyumlu şeffaf şikayet yönetim platformu. Tüketici hakları ve
          marka çözüm süreçlerini bir araya getiriyoruz.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button size="lg" asChild>
            <Link href="/complaints/new">Şikayet Oluştur</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/brands">Markalar</Link>
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="grid gap-8 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>🔒 White-hat Güvenlik</CardTitle>
            <CardDescription>
              End-to-end şifreleme, güvenli veri saklama
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Tüm verileriniz KVKK/GDPR standartlarında korunur. Data export ve
              silme hakları tam desteklenir.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>⚡ Hızlı Çözüm</CardTitle>
            <CardDescription>
              Ortalama 72 saat içinde ilk yanıt
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Markalar SLA hedefleriyle takip edilir. Otomatik hatırlatma ve
              escalation sistemi.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>📊 Şeffaf Süreç</CardTitle>
            <CardDescription>Her adımı takip edin</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Şikayetinizin her aşaması kayıt altında. Audit trail ile tam
              şeffaflık.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Stats */}
      <section className="mt-16 rounded-lg border bg-card p-8 text-center">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <p className="text-4xl font-bold">0</p>
            <p className="text-sm text-muted-foreground">Aktif Şikayet</p>
          </div>
          <div>
            <p className="text-4xl font-bold">0</p>
            <p className="text-sm text-muted-foreground">Kayıtlı Marka</p>
          </div>
          <div>
            <p className="text-4xl font-bold">0%</p>
            <p className="text-sm text-muted-foreground">Çözüm Oranı</p>
          </div>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          * Platform Phase 1 - Development mode
        </p>
      </section>
    </div>
  );
}
