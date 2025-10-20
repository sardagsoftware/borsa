// LCI Web - Dashboard Page
// White-hat: Protected route with auth check

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface User {
  id: string;
  email: string;
  role: string;
  kycLevel: string;
  status: string;
  locale: string;
  createdAt: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('lci_token');
    const userData = localStorage.getItem('lci_user');

    if (!token || !userData) {
      router.push('/auth/login');
      return;
    }

    try {
      setUser(JSON.parse(userData));
    } catch (err) {
      console.error('Failed to parse user data:', err);
      router.push('/auth/login');
      return;
    }

    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('lci_token');
    localStorage.removeItem('lci_user');
    router.push('/auth/login');
  };

  if (loading) {
    return (
      <div className="container flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Yükleniyor...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container py-16">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Hoş geldiniz, {user.email}
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            Çıkış Yap
          </Button>
        </div>

        {/* User Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle>Profil Bilgileri</CardTitle>
            <CardDescription>
              Hesap detaylarınız ve kimlik doğrulama durumu
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Kullanıcı ID
                </p>
                <p className="text-sm font-mono">{user.id}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Email
                </p>
                <p className="text-sm">{user.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Rol
                </p>
                <p className="text-sm">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      user.role === 'ADMIN'
                        ? 'bg-purple-100 text-purple-700'
                        : user.role === 'MODERATOR'
                        ? 'bg-orange-100 text-orange-700'
                        : user.role === 'BRAND_AGENT'
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {user.role}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  KYC Seviyesi
                </p>
                <p className="text-sm">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      user.kycLevel === 'VERIFIED'
                        ? 'bg-green-100 text-green-700'
                        : user.kycLevel === 'PHONE'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {user.kycLevel}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Durum
                </p>
                <p className="text-sm">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      user.status === 'ACTIVE'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {user.status}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Dil
                </p>
                <p className="text-sm uppercase">{user.locale}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Kayıt Tarihi
                </p>
                <p className="text-sm">
                  {new Date(user.createdAt).toLocaleDateString('tr-TR')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Yeni Şikayet</CardTitle>
              <CardDescription>
                Marka hakkında şikayet oluşturun
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Şikayetlerim</CardTitle>
              <CardDescription>
                Tüm şikayetlerinizi görüntüleyin
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Kimlik Doğrulama</CardTitle>
              <CardDescription>
                KYC seviyenizi yükseltin
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* KVKK Notice */}
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="text-lg">KVKK / GDPR Uyumluluğu</CardTitle>
            <CardDescription>
              Verileriniz güvende ve haklarınız korunuyor
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Kişisel verilerinizi dilediğiniz zaman silebilir veya dışa aktarabilirsiniz.
              Tüm şikayetleriniz PII maskeleme ile korunmaktadır.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
