'use client'

import { motion } from 'framer-motion'
import { Star, Quote } from 'lucide-react'

const testimonials = [
  {
    id: 1,
    name: 'Sarah Johnson',
    location: 'San Francisco, CA',
    avatar: '/api/placeholder/80/80',
    rating: 5,
    text: 'TourismPulse AI completely transformed how I plan my travels. The AI recommendations were spot-on and saved me hours of research. Found amazing hidden gems I would never have discovered otherwise!',
    trip: 'Japan Cultural Tour'
  },
  {
    id: 2,
    name: 'Michael Chen',
    location: 'London, UK',
    avatar: '/api/placeholder/80/80',
    rating: 5,
    text: 'The quantum-powered price optimization is incredible! I saved over $800 on my family vacation to Bali. The real-time updates and predictive analytics are game-changing.',
    trip: 'Bali Family Vacation'
  },
  {
    id: 3,
    name: 'Elena Rodriguez',
    location: 'Barcelona, Spain',
    avatar: '/api/placeholder/80/80',
    rating: 5,
    text: 'As a business traveler, I love the enterprise security and seamless booking experience. The AI learns my preferences and suggests perfect accommodations every time.',
    trip: 'Business Travel Program'
  },
  {
    id: 4,
    name: 'David Thompson',
    location: 'Sydney, Australia',
    avatar: '/api/placeholder/80/80',
    rating: 5,
    text: 'The multi-language support and global coverage are outstanding. Used it for my European backpacking trip - the local insights and real-time weather updates were invaluable.',
    trip: 'European Backpacking'
  },
  {
    id: 5,
    name: 'Priya Patel',
    location: 'Mumbai, India',
    avatar: '/api/placeholder/80/80',
    rating: 5,
    text: 'The AI-curated destinations feature introduced me to places I never knew existed. The detailed cultural insights and local recommendations made my Morocco trip unforgettable.',
    trip: 'Morocco Cultural Experience'
  },
  {
    id: 6,
    name: 'James Wilson',
    location: 'Toronto, Canada',
    avatar: '/api/placeholder/80/80',
    rating: 5,
    text: 'Incredible platform! The predictive analytics helped me book flights at the perfect time. The customer service is exceptional and the app is beautifully designed.',
    trip: 'Iceland Northern Lights'
  }
]

export default function Testimonials() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Loved by Travelers Worldwide
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Join over 100,000+ satisfied travelers who trust TourismPulse AI 
            for their perfect vacation experiences
          </p>
          
          <div className="flex items-center justify-center gap-2 text-lg">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-6 w-6 text-yellow-500 fill-current" />
              ))}
            </div>
            <span className="font-semibold text-gray-900">4.9 out of 5</span>
            <span className="text-gray-600">(12,547 reviews)</span>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.02, y: -5 }}
              className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 relative group"
            >
              {/* Quote Icon */}
              <div className="absolute top-6 right-6 text-blue-200 group-hover:text-blue-300 transition-colors">
                <Quote className="h-8 w-8" />
              </div>

              {/* Rating */}
              <div className="flex items-center gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 text-yellow-500 fill-current" />
                ))}
              </div>

              {/* Review Text */}
              <p className="text-gray-700 leading-relaxed mb-6 relative z-10">
                "{testimonial.text}"
              </p>

              {/* Trip Info */}
              <div className="text-sm text-blue-600 font-semibold mb-4">
                {testimonial.trip}
              </div>

              {/* Author Info */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                  <span className="text-white font-semibold text-lg">
                    {testimonial.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                  <p className="text-sm text-gray-600">{testimonial.location}</p>
                </div>
              </div>

              {/* Hover Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </motion.div>
          ))}
        </div>

        {/* Call to Action */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <div className="bg-gradient-to-r from-blue-900 to-purple-900 rounded-2xl p-12 text-white">
            <h3 className="text-3xl font-bold mb-4">Ready to Join Them?</h3>
            <p className="text-xl mb-8 opacity-90">
              Start planning your dream vacation with AI-powered insights
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white text-blue-900 px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-xl transition-all duration-200"
            >
              Start Planning Now
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}