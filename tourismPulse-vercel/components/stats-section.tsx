'use client'

import { motion } from 'framer-motion'
import { Users, MapPin, Star, TrendingUp } from 'lucide-react'

const stats = [
  {
    icon: Users,
    value: '2.5M+',
    label: 'Happy Travelers',
    description: 'Customers trust us worldwide'
  },
  {
    icon: MapPin,
    value: '180+',
    label: 'Countries Covered',
    description: 'Global destination network'
  },
  {
    icon: Star,
    value: '4.9',
    label: 'Average Rating',
    description: 'Based on 50K+ reviews'
  },
  {
    icon: TrendingUp,
    value: '95%',
    label: 'Money Saved',
    description: 'Users save on every booking'
  }
]

export function StatsSection() {
  return (
    <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
      <div className="container mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Trusted by Millions
          </h2>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            Join the growing community of smart travelers who save time and money 
            with our AI-powered platform
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.05 }}
              className="text-center group"
            >
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 group-hover:bg-white/20 transition-all duration-300">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-6 group-hover:scale-110 transition-transform duration-300">
                  <stat.icon className="h-8 w-8 text-white" />
                </div>
                
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                  {stat.value}
                </div>
                
                <div className="text-xl font-semibold text-blue-100 mb-2">
                  {stat.label}
                </div>
                
                <p className="text-blue-200 text-sm">
                  {stat.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-white mb-4">
              Real-time Performance Metrics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold text-cyan-300 mb-1">$12.4M</div>
                <div className="text-blue-100 text-sm">Total Savings Generated</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-300 mb-1">8.2s</div>
                <div className="text-blue-100 text-sm">Average Search Time</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-yellow-300 mb-1">24/7</div>
                <div className="text-blue-100 text-sm">Global Support</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default StatsSection