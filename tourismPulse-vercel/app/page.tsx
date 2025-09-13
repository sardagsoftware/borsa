import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import HeroSection from '@/components/hero-section'
import { SearchPanel } from '@/components/search-panel'
import { TopNav } from '@/components/nav/top-nav'

export const metadata: Metadata = {
  title: 'TourismPulse AI - Intelligent Travel Platform',
  description: 'Plan your perfect trip with AI-powered recommendations. Book hotels, flights, restaurants and activities with real-time pricing.',
  openGraph: {
    title: 'TourismPulse AI - Intelligent Travel Platform',
    description: 'Plan your perfect trip with AI-powered recommendations',
    images: ['/og-home.jpg'],
  },
}

export default function HomePage() {
  // Check if we should redirect to search
  if (process.env.NEXT_PUBLIC_SEARCH_AS_HOME === '1') {
    redirect('/search')
  }

  return (
    <>
      <TopNav />
      <main className="min-h-screen pt-16">
        <HeroSection />
        <SearchPanel />
        {/* <StatsSection />
        <FeaturedDestinations />
        <TrendingDeals />
        <TestimonialsSection /> */}
      </main>
    </>
  )
}
