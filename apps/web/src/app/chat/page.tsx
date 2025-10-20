'use client';

import { useState, useEffect, useRef } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  provider?: string;
  model?: string;
  reasoning?: string;
  cost?: number;
  latencyMs?: number;
}

interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  providerName: string;
  costPer1kIn: number;
  costPer1kOut: number;
  contextWindow: number;
  capabilities: string[];
}

const providerColors: Record<string, string> = {
  openai: 'bg-green-500',
  anthropic: 'bg-orange-500',
  gemini: 'bg-blue-500',
  mistral: 'bg-purple-500',
  zhipu: 'bg-red-500',
  '01ai': 'bg-pink-500',
};

const providerIcons: Record<string, string> = {
  openai: '🤖',
  anthropic: '🧠',
  gemini: '💎',
  mistral: '🌀',
  zhipu: '🐉',
  '01ai': '🌸',
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('auto');
  const [showModelSelector, setShowModelSelector] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load available models
    fetch('/api/models')
      .then((res) => res.json())
      .then((data) => {
        setModels(data.models || []);
      })
      .catch((err) => console.error('Failed to load models:', err));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          model: selectedModel === 'auto' ? undefined : selectedModel,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.content,
        provider: data.provider,
        model: data.model,
        reasoning: data.routingReasoning,
        cost: data.cost,
        latencyMs: data.latencyMs,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  const groupedModels = models.reduce((acc, model) => {
    if (!acc[model.provider]) {
      acc[model.provider] = [];
    }
    acc[model.provider].push(model);
    return acc;
  }, {} as Record<string, ModelInfo[]>);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar - Model Selector */}
      <div
        className={`${
          showModelSelector ? 'w-80' : 'w-16'
        } transition-all duration-300 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col`}
      >
        <button
          onClick={() => setShowModelSelector(!showModelSelector)}
          className="p-4 hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700"
        >
          {showModelSelector ? '←' : '🤖'}
        </button>

        {showModelSelector && (
          <div className="flex-1 overflow-y-auto p-4">
            <h2 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">
              Select Model
            </h2>

            {/* Auto Selection */}
            <div
              onClick={() => setSelectedModel('auto')}
              className={`p-3 mb-2 rounded-lg cursor-pointer ${
                selectedModel === 'auto'
                  ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <div className="font-semibold">⚡ Intelligent Routing</div>
              <div className="text-sm opacity-80">
                Auto-select best model based on query
              </div>
            </div>

            {/* Provider Groups */}
            {Object.entries(groupedModels).map(([provider, providerModels]) => (
              <div key={provider} className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-3 h-3 rounded-full ${providerColors[provider]}`} />
                  <span className="font-semibold text-gray-700 dark:text-gray-300">
                    {providerIcons[provider]} {providerModels[0].providerName}
                  </span>
                </div>

                {providerModels.map((model) => (
                  <div
                    key={model.id}
                    onClick={() => setSelectedModel(model.id)}
                    className={`p-2 mb-1 rounded cursor-pointer text-sm ${
                      selectedModel === model.id
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                  >
                    <div className="font-medium">{model.name}</div>
                    <div className="text-xs opacity-80">
                      ${model.costPer1kIn.toFixed(4)}/1K in • $
                      {model.costPer1kOut.toFixed(4)}/1K out
                    </div>
                    <div className="text-xs opacity-70">
                      {model.contextWindow.toLocaleString()} ctx
                    </div>
                  </div>
                ))}
              </div>
            ))}

            {models.length === 0 && (
              <div className="text-gray-500 text-sm">Loading models...</div>
            )}
          </div>
        )}
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              AI Chat Assistant
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {selectedModel === 'auto'
                ? '⚡ Intelligent Routing Active'
                : `🎯 Using: ${models.find((m) => m.id === selectedModel)?.name || selectedModel}`}
            </p>
          </div>
          <button
            onClick={clearChat}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
          >
            Clear Chat
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 mt-20">
              <div className="text-6xl mb-4">💬</div>
              <p className="text-lg">Start a conversation with AI</p>
              <p className="text-sm mt-2">
                Try asking about coding, math, science, or anything else!
              </p>
            </div>
          )}

          {messages.map((message, idx) => (
            <div
              key={idx}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-4 ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
                }`}
              >
                {message.role === 'assistant' && message.provider && (
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        providerColors[message.provider]
                      }`}
                    />
                    <span className="text-xs font-semibold">
                      {providerIcons[message.provider]} {message.provider} •{' '}
                      {message.model}
                    </span>
                    {message.cost !== undefined && (
                      <span className="text-xs opacity-70">
                        ${message.cost.toFixed(6)}
                      </span>
                    )}
                    {message.latencyMs && (
                      <span className="text-xs opacity-70">
                        {message.latencyMs}ms
                      </span>
                    )}
                  </div>
                )}

                <div className="whitespace-pre-wrap">{message.content}</div>

                {message.reasoning && selectedModel === 'auto' && (
                  <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600 text-xs opacity-70">
                    <strong>Routing:</strong> {message.reasoning}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
                  <div
                    className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                    style={{ animationDelay: '0.2s' }}
                  />
                  <div
                    className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                    style={{ animationDelay: '0.4s' }}
                  />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
              className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
              rows={3}
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Send
            </button>
          </div>

          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            <strong>Available Models:</strong> {models.length} •{' '}
            <strong>Providers:</strong>{' '}
            {Object.keys(groupedModels).map((p) => providerIcons[p]).join(' ')}
          </div>
        </div>
      </div>
    </div>
  );
}
