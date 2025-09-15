import { Metadata } from 'next'
import { redirect } from 'next/navigation'
// Fixed import for HeroSection component
import HeroSection from '@/components/hero-section'
import { SearchPanel } from '@/components/search-panel'
import { TopNav } from '@/components/nav/top-nav'
import StatsSection from '@/components/stats-section'
import FeaturedDestinations from '@/components/featured-destinations'
import TrendingDeals from '@/components/trending-deals'
import TestimonialsSection from '@/components/testimonials'

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
  // Redirect to working search page
  redirect('/search-simple')
}
