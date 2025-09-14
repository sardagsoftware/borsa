import { Metadata } from 'next'
import { HeroSection } from '@/components/hero-section'
import { FeaturedDestinations } from '@/components/featured-destinations'
import { SearchPanel } from '@/components/search-panel'
import { TrendingDeals } from '@/components/trending-deals'
import { TestimonialsSection } from '@/components/testimonials'
import { StatsSection } from '@/components/stats-section'

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
  return (
    <main className="min-h-screen">
      <HeroSection />
      <SearchPanel />
      <StatsSection />
      <FeaturedDestinations />
      <TrendingDeals />
      <TestimonialsSection />
    </main>
  )
}
