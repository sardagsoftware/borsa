'use client'

import { motion } from 'framer-motion'
import { Brain, Zap, Globe, Shield, Clock, TrendingUp } from 'lucide-react'

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Recommendations',
    description: 'Advanced machine learning algorithms analyze your preferences, past trips, and real-time data to suggest perfect destinations.',
    color: 'from-purple-500 to-pink-500'
  },
  {
    icon: Zap,
    title: 'Quantum Computing Integration',
    description: 'Leverage quantum algorithms for complex route optimization and instant price comparisons across millions of combinations.',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    icon: Globe,
    title: 'Real-Time Global Data',
    description: 'Access live weather, traffic, events, and local insights from our global network of data sources and local partners.',
    color: 'from-green-500 to-emerald-500'
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'Bank-level encryption, secure payment processing, and privacy-first architecture protect your data and transactions.',
    color: 'from-red-500 to-orange-500'
  },
  {
    icon: Clock,
    title: 'Predictive Analytics',
    description: 'Forecast price trends, weather patterns, and crowd levels to help you plan the perfect trip at the best time.',
    color: 'from-indigo-500 to-purple-500'
  },
  {
    icon: TrendingUp,
    title: 'Dynamic Pricing Intelligence',
    description: 'AI monitors millions of price points in real-time to alert you of deals and optimize your travel budget.',
    color: 'from-yellow-500 to-orange-500'
  }
]

export default function AIFeatures() {
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
            Next-Generation AI Technology
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Experience the future of travel planning with cutting-edge artificial intelligence, 
            quantum computing, and real-time data processing
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.05 }}
              className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100"
            >
              <div className="relative z-10">
                <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-r ${feature.color} mb-6`}>
                  <feature.icon className="h-8 w-8 text-white" />
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 group-hover:bg-clip-text transition-all duration-300">
                  {feature.title}
                </h3>
                
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>

              <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </motion.div>
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <div className="bg-gradient-to-r from-blue-900 to-purple-900 rounded-2xl p-12 text-white">
            <h3 className="text-3xl font-bold mb-4">Ready to Experience AI-Powered Travel?</h3>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of travelers who trust TourismPulse AI for their adventures
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white text-blue-900 px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-xl transition-all duration-200"
            >
              Start Planning Your Trip
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}