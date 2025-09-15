'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Search, MapPin, Calendar, Users, Plane, Hotel, Car, Camera, Bot, ChevronDown } from 'lucide-react'

export function SearchPanel() {
  const [activeTab, setActiveTab] = useState('all')
  const [selectedModel, setSelectedModel] = useState('gpt-4-turbo')
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const aiModels = [
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', icon: '🧠', provider: 'OpenAI' },
    { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', icon: '🎭', provider: 'Anthropic' },
    { id: 'gemini-2-0-flash', name: 'Gemini 2.0 Flash', icon: '💎', provider: 'Google' },
    { id: 'mistral-large-2', name: 'Mistral Large 2', icon: '🌪️', provider: 'Mistral' },
    { id: 'llama-3-70b', name: 'Llama 3 70B', icon: '🦙', provider: 'Meta' }
  ]

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsLoading(true)
    setSearchResults(null)

    // Simulate AI response based on selected model
    setTimeout(() => {
      const model = aiModels.find(m => m.id === selectedModel)
      const responses = {
        'gpt-4-turbo': `GPT-4 Turbo Response: Based on your search "${searchQuery}", I recommend exploring Istanbul's historic districts. The city offers a perfect blend of European and Asian cultures, with magnificent Ottoman architecture, world-class cuisine, and vibrant markets. Key highlights include Hagia Sophia, Blue Mosque, Grand Bazaar, and Bosphorus cruise opportunities.`,
        'claude-3-5-sonnet': `Claude 3.5 Sonnet Analysis: Your query "${searchQuery}" suggests interest in cultural experiences. I'd recommend considering factors like seasonal weather, local festivals, and cultural events. Turkey offers diverse experiences from Cappadocia's balloon rides to Mediterranean coastal towns like Antalya and Kas.`,
        'gemini-2-0-flash': `Gemini 2.0 Flash: For "${searchQuery}", here's a comprehensive travel plan: Budget considerations, visa requirements, local transportation options, and must-visit destinations. I can help you create a detailed itinerary with real-time pricing and availability.`,
        'mistral-large-2': `Mistral Large 2: Analyzing "${searchQuery}" - I suggest a balanced approach focusing on authentic local experiences, sustainable tourism practices, and cultural immersion opportunities. Let me provide specific recommendations based on your preferences.`,
        'llama-3-70b': `Llama 3 70B: Your search for "${searchQuery}" opens many possibilities. I recommend considering off-the-beaten-path destinations alongside popular tourist spots for a more authentic experience. Let me help you discover hidden gems and local favorites.`
      }

      setSearchResults(responses[selectedModel as keyof typeof responses] || 'AI response generated successfully!')
      setIsLoading(false)
    }, 1500)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const tabs = [
    { id: 'all', label: 'All', icon: Search },
    { id: 'flights', label: 'Flights', icon: Plane },
    { id: 'hotels', label: 'Hotels', icon: Hotel },
    { id: 'cars', label: 'Cars', icon: Car },
    { id: 'activities', label: 'Activities', icon: Camera }
  ]

  const selectedModelData = aiModels.find(m => m.id === selectedModel)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl p-6 max-w-6xl mx-auto relative z-10"
    >
      {/* AI Model Selection */}
      <div className="mb-6">
        <label className="text-sm font-medium text-gray-700 mb-2 block">Select AI Model</label>
        <div className="relative">
          <button
            onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
            className="w-full md:w-auto flex items-center justify-between gap-3 px-4 py-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{selectedModelData?.icon}</span>
              <div className="text-left">
                <div className="font-medium text-gray-900">{selectedModelData?.name}</div>
                <div className="text-xs text-gray-500">{selectedModelData?.provider}</div>
              </div>
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isModelDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isModelDropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-full left-0 mt-1 w-full md:w-80 bg-white border border-gray-300 rounded-lg shadow-lg z-[100] max-h-60 overflow-y-auto"
            >
              {aiModels.map((model) => (
                <button
                  key={model.id}
                  onClick={() => {
                    setSelectedModel(model.id)
                    setIsModelDropdownOpen(false)
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left ${
                    selectedModel === model.id ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''
                  }`}
                >
                  <span className="text-lg">{model.icon}</span>
                  <div>
                    <div className="font-medium text-gray-900">{model.name}</div>
                    <div className="text-xs text-gray-500">{model.provider}</div>
                  </div>
                </button>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap justify-center gap-2 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* AI Search Input */}
      <div className="mb-6">
        <label className="text-sm font-medium text-gray-700 mb-2 block">Ask AI Anything</label>
        <div className="relative">
          <Bot className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me about travel destinations, planning, activities..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
          />
        </div>
      </div>

      {/* Search Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Destination */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Where to?</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search destinations..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Check-in */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Check-in</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="date"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Check-out */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Check-out</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="date"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Guests */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Guests</label>
          <div className="relative">
            <Users className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <select className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option>1 Guest</option>
              <option>2 Guests</option>
              <option>3 Guests</option>
              <option>4+ Guests</option>
            </select>
          </div>
        </div>
      </div>

      {/* Search Button */}
      <div className="mb-6 flex justify-center">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSearch}
          disabled={isLoading || !searchQuery.trim()}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-12 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
              />
              Searching...
            </>
          ) : (
            <>
              <Search size={20} />
              Search with AI
            </>
          )}
        </motion.button>
      </div>

      {/* AI Response */}
      {searchResults && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6"
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">{selectedModelData?.icon}</span>
            <h3 className="font-semibold text-gray-900">{selectedModelData?.name} Response</h3>
          </div>
          <p className="text-gray-700 leading-relaxed">{searchResults}</p>
        </motion.div>
      )}
    </motion.div>
  )
}