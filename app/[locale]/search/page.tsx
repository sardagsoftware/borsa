// app/[locale]/search/page.tsx
// AI Search Interface with GROQ Smart Router
// © 2024 Emrah Şardağ. All Rights Reserved.

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Send, Bot, Cpu, Zap, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import LatencyBadge from '@/components/LatencyBadge';

type Workload = 'ui_suggest' | 'quick_qa' | 'deep_analysis' | 'code' | 'translate';
type Provider = 'groq-auto' | 'openai' | 'claude' | 'local';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  metadata?: {
    model?: string;
    ttft?: number;
    totalTime?: number;
    task?: Workload;
    tokensPerSecond?: number;
  };
}

interface ProviderOption {
  id: Provider;
  label: string;
  icon: React.ComponentType<any>;
  description: string;
}

const PROVIDERS: ProviderOption[] = [
  {
    id: 'groq-auto',
    label: 'Groq (Auto)',
    icon: Cpu,
    description: 'Ultra-fast LLM with smart model selection'
  },
  {
    id: 'openai',
    label: 'OpenAI GPT',
    icon: Bot,
    description: 'GPT-4 family models'
  },
  {
    id: 'claude',
    label: 'Claude',
    icon: Bot,
    description: 'Anthropic Claude models'
  },
  {
    id: 'local',
    label: 'Local Model',
    icon: Cpu,
    description: 'On-device inference'
  }
];

/**
 * Detect task type from user input
 */
function detectTaskType(text: string): Workload {
  const lowercaseText = text.toLowerCase();
  
  if (lowercaseText.includes('çevir') || lowercaseText.includes('translate')) {
    return 'translate';
  }
  
  if (lowercaseText.includes('kod') || lowercaseText.includes('code') || 
      lowercaseText.includes('fonksiyon') || lowercaseText.includes('backtest')) {
    return 'code';
  }
  
  if (lowercaseText.includes('özet') || lowercaseText.includes('analiz') || 
      lowercaseText.includes('neden') || lowercaseText.includes('detay')) {
    return 'deep_analysis';
  }
  
  if (text.split(/\s+/).length < 15) {
    return 'quick_qa';
  }
  
  return 'ui_suggest';
}

/**
 * Format task name for display
 */
function getTaskDisplayName(task: Workload): string {
  const taskNames = {
    'ui_suggest': 'UI Öneri',
    'quick_qa': 'Hızlı Yanıt',
    'deep_analysis': 'Derin Analiz',
    'code': 'Kod Üretimi',
    'translate': 'Çeviri'
  };
  return taskNames[task];
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<Provider>('groq-auto');
  const [lastResponse, setLastResponse] = useState<{
    model?: string;
    ttft?: number;
    totalTime?: number;
    task?: Workload;
    tokensPerSecond?: number;
  }>({});

  // Initialize with URL query if present
  useEffect(() => {
    const query = searchParams.get('q');
    if (query) {
      setInput(query);
    }
  }, [searchParams]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setInput('');

    try {
      let response: Response;
      let responseData: any;

      if (selectedProvider === 'groq-auto') {
        // Use our GROQ router
        const task = detectTaskType(userMessage.content);
        
        response = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            task,
            messages: [
              {
                role: 'system',
                content: 'Sen AILYDIAN AI LENS TRADER platformunun AI asistanısın. Kripto para trading, piyasa analizi ve yatırım konularında uzmanlaştın. Türkçe ve profesyonel yanıtlar ver.'
              },
              {
                role: 'user',
                content: userMessage.content
              }
            ],
            stream: false,
            latencyBias: 0.7
          })
        });

        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`);
        }

        responseData = await response.json();

        // Extract metadata from headers
        const model = response.headers.get('X-Model-Picked');
        const ttft = response.headers.get('X-TTFT');
        const totalTime = response.headers.get('X-Total-Time');
        const taskHeader = response.headers.get('X-Task');

        setLastResponse({
          model: model || undefined,
          ttft: ttft ? parseInt(ttft) : undefined,
          totalTime: totalTime ? parseInt(totalTime) : undefined,
          task: taskHeader as Workload || task,
          tokensPerSecond: ttft ? Math.round(1000 / parseInt(ttft) * 10) : undefined
        });

        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: responseData.choices?.[0]?.message?.content || 'Yanıt alınamadı.',
          timestamp: Date.now(),
          metadata: {
            model: model || undefined,
            ttft: ttft ? parseInt(ttft) : undefined,
            totalTime: totalTime ? parseInt(totalTime) : undefined,
            task: taskHeader as Workload || task
          }
        };

        setMessages(prev => [...prev, assistantMessage]);

      } else {
        // Placeholder for other providers
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: `${selectedProvider} sağlayıcısı henüz entegre edilmedi. Şu an sadece Groq (Auto) destekleniyor.`,
          timestamp: Date.now()
        };

        setMessages(prev => [...prev, assistantMessage]);
      }

    } catch (error) {
      console.error('Chat error:', error);
      
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant', 
        content: `❌ Hata: ${error instanceof Error ? error.message : 'Bilinmeyen hata oluştu'}`,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, selectedProvider]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setLastResponse({});
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg via-bg-soft to-panel">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-brand-1 to-brand-2 bg-clip-text text-transparent mb-2">
            🔍 AI Search & Analysis
          </h1>
          <p className="text-muted">
            Ultra-fast AI search powered by Groq LPU inference
          </p>
        </div>

        {/* Provider Selection */}
        <div className="mb-6 p-4 bg-panel/80 backdrop-blur-sm rounded-lg border border-glass">
          <label className="block text-sm font-medium text-text mb-3">AI Provider</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {PROVIDERS.map((provider) => {
              const IconComponent = provider.icon;
              return (
                <button
                  key={provider.id}
                  onClick={() => setSelectedProvider(provider.id)}
                  className={`p-3 rounded-lg border transition-all ${
                    selectedProvider === provider.id
                      ? 'border-brand-1 bg-brand-1/10 text-brand-1'
                      : 'border-glass bg-panel/50 text-text hover:border-brand-2'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    <IconComponent className="w-4 h-4" />
                    <span className="font-medium">{provider.label}</span>
                  </div>
                  <p className="text-xs text-muted">{provider.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Chat Messages */}
        <div className="mb-6 space-y-4 max-h-96 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="text-center py-12 text-muted">
              <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Bir soru sorun veya analiz isteyin...</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`p-4 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-brand-1/10 border border-brand-1/20 ml-8'
                    : 'bg-panel/80 border border-glass mr-8'
                }`}
              >
                <div className="flex items-start space-x-3">
                  {message.role === 'user' ? (
                    <div className="w-8 h-8 bg-brand-1 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-white">U</span>
                    </div>
                  ) : (
                    <div className="w-8 h-8 bg-brand-2 rounded-full flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-text whitespace-pre-wrap">{message.content}</p>
                    
                    {/* Message Metadata */}
                    {message.metadata && (
                      <div className="mt-2 flex items-center space-x-4 text-xs text-muted">
                        {message.metadata.model && (
                          <span>Model: {message.metadata.model}</span>
                        )}
                        {message.metadata.ttft && (
                          <span>TTFT: {message.metadata.ttft}ms</span>
                        )}
                        {message.metadata.task && (
                          <span>Task: {getTaskDisplayName(message.metadata.task)}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex space-x-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Sorunuzu yazın veya analiz isteyin..."
              className="w-full px-4 py-3 bg-panel border border-glass rounded-lg text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-1 focus:border-transparent"
              disabled={isLoading}
            />
            {isLoading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="w-5 h-5 border-2 border-brand-1 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
          
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-6 py-3 bg-gradient-to-r from-brand-1 to-brand-2 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center space-x-2"
          >
            <Send className="w-4 h-4" />
            <span>Gönder</span>
          </button>
        </form>

        {/* Clear Chat Button */}
        {messages.length > 0 && (
          <div className="mt-4 text-center">
            <button
              onClick={clearChat}
              className="text-sm text-muted hover:text-text transition-colors"
            >
              Sohbeti Temizle
            </button>
          </div>
        )}

        {/* Latency Badge */}
        <LatencyBadge
          model={lastResponse.model}
          ttft={lastResponse.ttft}
          totalTime={lastResponse.totalTime}
          task={lastResponse.task}
          tokensPerSecond={lastResponse.tokensPerSecond}
        />
      </div>
    </div>
  );
}
