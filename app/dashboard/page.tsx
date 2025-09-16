import React from 'react';
import MainLayout from '@/components/MainLayout';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

// Force dynamic rendering to handle authentication
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  // Server-side authentication check
  const session = await getServerSession(authOptions);
  
  // Redirect to login if not authenticated
  if (!session) {
    redirect('/tr/auth/signin?callbackUrl=/dashboard');
  }

  return <MainLayout />;
}
