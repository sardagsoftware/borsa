'use client'

import { motion } from 'framer-motion'
import { Star, MapPin, Clock, Thermometer } from 'lucide-react'
import Image from 'next/image'

const destinations = [
  {
    id: 1,
    name: 'Tokyo, Japan',
    image: '/api/placeholder/400/300',
    rating: 4.9,
    price: '$1,299',
    description: 'Futuristic metropolis with ancient temples',
    weather: '22°C',
    timezone: 'GMT+9',
    highlights: ['Shibuya Crossing', 'Mount Fuji', 'Cherry Blossoms']
  },
  {
    id: 2,
    name: 'Paris, France',
    image: '/api/placeholder/400/300',
    rating: 4.8,
    price: '$899',
    description: 'City of lights and romance',
    weather: '18°C',
    timezone: 'GMT+1',
    highlights: ['Eiffel Tower', 'Louvre Museum', 'Seine River']
  },
  {
    id: 3,
    name: 'Bali, Indonesia',
    image: '/api/placeholder/400/300',
    rating: 4.7,
    price: '$699',
    description: 'Tropical paradise with rich culture',
    weather: '28°C',
    timezone: 'GMT+8',
    highlights: ['Rice Terraces', 'Ancient Temples', 'Beach Resorts']
  },
  {
    id: 4,
    name: 'New York, USA',
    image: '/api/placeholder/400/300',
    rating: 4.6,
    price: '$1,199',
    description: 'The city that never sleeps',
    weather: '15°C',
    timezone: 'GMT-5',
    highlights: ['Times Square', 'Central Park', 'Brooklyn Bridge']
  }
]

export default function FeaturedDestinations() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            AI-Curated Destinations
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover handpicked destinations based on real-time data, weather conditions, 
            and personalized AI recommendations
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {destinations.map((destination, index) => (
            <motion.div
              key={destination.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.05 }}
              className="bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer group"
            >
              <div className="relative h-48 overflow-hidden">
                <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500"></div>
                <div className="absolute inset-0 bg-black/20"></div>
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  <span className="text-sm font-semibold">{destination.rating}</span>
                </div>
                <div className="absolute bottom-4 left-4 text-white">
                  <div className="flex items-center gap-2 text-sm">
                    <Thermometer className="h-4 w-4" />
                    {destination.weather}
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold text-gray-900">{destination.name}</h3>
                  <span className="text-2xl font-bold text-blue-600">{destination.price}</span>
                </div>

                <p className="text-gray-600 mb-4">{destination.description}</p>

                <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                  <Clock className="h-4 w-4" />
                  {destination.timezone}
                </div>

                <div className="space-y-2">
                  <span className="text-sm font-semibold text-gray-700">Top Highlights:</span>
                  <div className="flex flex-wrap gap-2">
                    {destination.highlights.map((highlight, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                      >
                        {highlight}
                      </span>
                    ))}
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full mt-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold group-hover:shadow-lg transition-all duration-200"
                >
                  Explore Destination
                </motion.button>
              </div>
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
          <button className="bg-white text-blue-600 border-2 border-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-600 hover:text-white transition-all duration-200">
            View All Destinations
          </button>
        </motion.div>
      </div>
    </section>
  )
}