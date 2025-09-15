'use client'

import { useState, useEffect } from 'react'
import { TopNav } from '@/components/nav/top-nav'

interface AIModel {
  id: string
  name: string
  provider: string
  status: string
  icon: string
  category?: string
  speed?: string
  apiProvider?: string
}

interface ChatMessage {
  id: string
  type: 'user' | 'assistant'
  content: string
  model?: string
  timestamp: string
}

export default function SearchPage() {
  const [models, setModels] = useState<AIModel[]>([])
  const [selectedModel, setSelectedModel] = useState('groq_llama-3.3-70b-versatile')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Fetch AI models
    fetch('/api/models')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const activeModels = data.data.filter((model: AIModel) => model.status === 'active')
          setModels(activeModels)
          // Set default to first Groq model if available
          const groqModel = activeModels.find((m: AIModel) => m.id.startsWith('groq_'))
          if (groqModel) {
            setSelectedModel(groqModel.id)
          }
        }
      })
      .catch(error => console.error('Failed to fetch models:', error))
  }, [])

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    const currentInput = inputValue
    setInputValue('')
    setIsLoading(true)

    try {
      const selectedModelData = models.find(m => m.id === selectedModel)
      const apiProvider = selectedModelData?.apiProvider || 'groq'

      let response
      if (apiProvider === 'groq') {
        response = await fetch('/api/ai/unified', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: currentInput,
            provider: 'groq',
            model: selectedModel.replace('groq_', ''),
            conversation: messages.slice(-10).map(m => ({
              role: m.type === 'user' ? 'user' : 'assistant',
              content: m.content
            }))
          })
        })
      } else if (apiProvider === 'huggingface') {
        response = await fetch('/api/huggingface/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: currentInput,
            model: selectedModel.replace('hf_', ''),
            conversation: messages.slice(-10).map(m => ({
              role: m.type === 'user' ? 'user' : 'assistant',
              content: m.content
            }))
          })
        })
      } else if (apiProvider === 'google') {
        response = await fetch('/api/gemini/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: currentInput,
            model: selectedModel.replace('gemini_', ''),
            conversation: messages.slice(-10).map(m => ({
              role: m.type === 'user' ? 'user' : 'assistant',
              content: m.content
            }))
          })
        })
      } else if (apiProvider === 'asi1') {
        response = await fetch('/api/asi1/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: currentInput,
            model: selectedModel.replace('asi1_', ''),
            conversation: messages.slice(-10).map(m => ({
              role: m.type === 'user' ? 'user' : 'assistant',
              content: m.content
            }))
          })
        })
      } else {
        // Fallback to search API
        response = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: currentInput,
            model: selectedModel
          })
        })
      }

      const data = await response.json()

      if (data.success) {
        const assistantMessage: ChatMessage = {
          id: data.data.id,
          type: 'assistant',
          content: data.data.response,
          model: selectedModelData?.name || selectedModel,
          timestamp: data.data.timestamp
        }
        setMessages(prev => [...prev, assistantMessage])
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: 'Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.',
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <>
      <TopNav />
      <div className="min-h-screen pt-16 bg-white">
        <div className="max-w-6xl mx-auto p-4">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 p-4 mb-6">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
              AI Studio - {models.length} Models Available
            </h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Models Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-4">AI Models ({models.length})</h3>
                <div className="space-y-2">
                  {models.map((model) => (
                    <div
                      key={model.id}
                      className={`p-3 rounded-lg cursor-pointer transition-all ${
                        selectedModel === model.id
                          ? 'bg-orange-100 border-2 border-orange-500'
                          : 'bg-white border border-gray-200 hover:border-orange-300'
                      }`}
                      onClick={() => setSelectedModel(model.id)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{model.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {model.name}
                          </div>
                          <div className="text-xs text-gray-500">{model.provider}</div>
                        </div>
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Chat Area */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-lg border border-gray-200 h-[600px] flex flex-col">
                {/* Messages */}
                <div className="flex-1 p-4 overflow-y-auto">
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-500 mt-20">
                      <div className="text-6xl mb-4">🧠</div>
                      <h2 className="text-xl font-semibold mb-2">Welcome to AI Studio</h2>
                      <p>Start a conversation with any AI model</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div key={message.id} className="flex gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold ${
                            message.type === 'user' ? 'bg-orange-500' : 'bg-gray-600'
                          }`}>
                            {message.type === 'user' ? 'U' : '🤖'}
                          </div>
                          <div className="flex-1">
                            <div className="prose prose-sm max-w-none">
                              {message.content}
                            </div>
                            {message.model && (
                              <div className="text-xs text-gray-500 mt-1">
                                {message.model} • {new Date(message.timestamp).toLocaleTimeString('tr-TR')}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      {isLoading && (
                        <div className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white">
                            🤖
                          </div>
                          <div className="flex-1">
                            <div className="text-gray-500 italic">Yazıyor...</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Input */}
                <div className="border-t border-gray-200 p-4">
                  <div className="flex gap-2">
                    <textarea
                      placeholder="Mesajınızı yazın..."
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={isLoading}
                      className="flex-1 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      rows={1}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={isLoading || !inputValue.trim()}
                      className={`px-4 py-2 rounded-lg font-medium ${
                        isLoading || !inputValue.trim()
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-orange-500 text-white hover:bg-orange-600'
                      }`}
                    >
                      {isLoading ? '⏳' : 'Gönder'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}