'use client'

import { motion } from 'framer-motion'
import { TrendingUp, Clock, Users, Star } from 'lucide-react'

const deals = [
  {
    id: 1,
    title: 'Maldives Paradise Resort',
    originalPrice: 2999,
    currentPrice: 1899,
    discount: 37,
    image: '/api/placeholder/300/200',
    rating: 4.9,
    reviews: 1247,
    timeLeft: '2d 14h',
    bookedToday: 23
  },
  {
    id: 2,
    title: 'Tokyo Cultural Experience',
    originalPrice: 1599,
    currentPrice: 1099,
    discount: 31,
    image: '/api/placeholder/300/200',
    rating: 4.8,
    reviews: 892,
    timeLeft: '1d 8h',
    bookedToday: 41
  },
  {
    id: 3,
    title: 'Swiss Alpine Adventure',
    originalPrice: 2299,
    currentPrice: 1699,
    discount: 26,
    image: '/api/placeholder/300/200',
    rating: 4.7,
    reviews: 634,
    timeLeft: '3d 2h',
    bookedToday: 18
  },
  {
    id: 4,
    title: 'Bali Spiritual Retreat',
    originalPrice: 1199,
    currentPrice: 899,
    discount: 25,
    image: '/api/placeholder/300/200',
    rating: 4.6,
    reviews: 567,
    timeLeft: '5d 16h',
    bookedToday: 29
  }
]

export default function TrendingDeals() {
  return (
    <section className="py-20 bg-gradient-to-br from-orange-50 to-red-50">
      <div className="container mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-800 px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <TrendingUp className="h-4 w-4" />
            Trending Now
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Limited-Time Deals
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            AI-detected price drops and exclusive offers updated in real-time. 
            Don't miss these incredible deals!
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {deals.map((deal, index) => (
            <motion.div
              key={deal.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.03, y: -5 }}
              className="bg-white rounded-2xl shadow-lg overflow-hidden group cursor-pointer relative"
            >
              {/* Discount Badge */}
              <div className="absolute top-4 left-4 z-10 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                -{deal.discount}%
              </div>

              {/* Timer Badge */}
              <div className="absolute top-4 right-4 z-10 bg-black/80 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {deal.timeLeft}
              </div>

              {/* Image */}
              <div className="relative h-48 overflow-hidden">
                <div className="w-full h-full bg-gradient-to-br from-orange-400 to-pink-500"></div>
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-all duration-300"></div>
              </div>

              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {deal.title}
                </h3>

                {/* Rating */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="text-sm font-semibold">{deal.rating}</span>
                  </div>
                  <span className="text-gray-400 text-sm">({deal.reviews} reviews)</span>
                </div>

                {/* Pricing */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-3xl font-bold text-blue-600">${deal.currentPrice}</span>
                  <span className="text-lg text-gray-500 line-through">${deal.originalPrice}</span>
                </div>

                {/* Booking Stats */}
                <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{deal.bookedToday} booked today</span>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-lg font-semibold group-hover:shadow-lg transition-all duration-200"
                >
                  Book Now
                </motion.button>
              </div>

              {/* Trending Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </motion.div>
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <p className="text-sm text-gray-600 mb-4">
            🔥 Over 150 new deals added in the last 24 hours
          </p>
          <button className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-8 py-3 rounded-lg font-semibold hover:shadow-xl transition-all duration-200">
            View All Deals
          </button>
        </motion.div>
      </div>
    </section>
  )
}