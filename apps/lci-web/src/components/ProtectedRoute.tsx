// LCI Web - Protected Route Component
// White-hat: Auth guard for protected pages

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export function ProtectedRoute({
  children,
  requireAuth = true,
}: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && requireAuth && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [loading, isAuthenticated, requireAuth, router]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  // If not authenticated and auth is required, return null (redirect will happen)
  if (requireAuth && !isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
