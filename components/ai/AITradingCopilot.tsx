/**
 * AILYDIAN GLOBAL TRADER - AI Trading Copilot Chat Interface
 * Natural language trading commands with real-time responses
 * © 2025 Emrah Şardağ - Ultra Pro Edition
 */

'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Send, 
  Mic, 
  MicOff, 
  Bot, 
  User, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Loader2,
  Lightbulb,
  BarChart3
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  functionCalled?: string;
  functionResult?: any;
  isLoading?: boolean;
}

interface AITradingCopilotProps {
  userId?: string;
  className?: string;
  height?: number;
}

const QUICK_COMMANDS = [
  { label: 'Portfolio Status', command: 'Show me my current portfolio status' },
  { label: 'Market Analysis', command: 'Analyze AAPL and give me your recommendation' },
  { label: 'Risk Check', command: 'Check my risk exposure and suggest improvements' },
  { label: 'Buy Signal', command: 'Find me the best buy opportunities right now' },
  { label: 'Sentiment Analysis', command: 'What\'s the sentiment on Bitcoin today?' },
  { label: 'Position Sizing', command: 'How much should I invest in Tesla with 2% risk?' },
];

export default function AITradingCopilot({
  userId = 'demo-user',
  className = '',
  height = 600
}: AITradingCopilotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hi! I\'m AILYDIAN, your AI trading copilot. I can help you with market analysis, portfolio management, risk assessment, and trade execution. What would you like to know?',
      timestamp: new Date()
    }
  ]);
  
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognition = useRef<any>(null);

  // Auto scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      recognition.current = new (window as any).webkitSpeechRecognition();
      recognition.current!.continuous = false;
      recognition.current!.interimResults = false;
      recognition.current!.lang = 'en-US';

      recognition.current!.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(transcript);
        setIsListening(false);
      };

      recognition.current!.onerror = () => {
        setIsListening(false);
      };

      recognition.current!.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  // Send message to AI
  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: message.trim(),
      timestamp: new Date()
    };

    const loadingMessage: ChatMessage = {
      id: `loading_${Date.now()}`,
      role: 'assistant',
      content: 'Analyzing your request...',
      timestamp: new Date(),
      isLoading: true
    };

    setMessages(prev => [...prev, userMessage, loadingMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/copilot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message.trim(),
          userId,
          sessionId
        })
      });

      const data = await response.json();

      const aiMessage: ChatMessage = {
        id: `ai_${Date.now()}`,
        role: 'assistant',
        content: data.message || (data.success ? 'Request completed successfully.' : 'I apologize, but I encountered an error processing your request.'),
        timestamp: new Date(),
        functionCalled: data.functionCalled,
        functionResult: data.functionResult
      };

      setMessages(prev => prev.slice(0, -1).concat([aiMessage]));
      
    } catch (error) {
      console.error('Failed to send message:', error);
      
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: 'I apologize, but I\'m having trouble connecting right now. Please try again in a moment.',
        timestamp: new Date()
      };

      setMessages(prev => prev.slice(0, -1).concat([errorMessage]));
    } finally {
      setIsLoading(false);
    }
  }, [userId, sessionId, isLoading]);

  // Handle form submission
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputMessage);
  }, [inputMessage, sendMessage]);

  // Handle quick command
  const handleQuickCommand = useCallback((command: string) => {
    setInputMessage(command);
    sendMessage(command);
  }, [sendMessage]);

  // Toggle voice input
  const toggleVoiceInput = useCallback(() => {
    if (!recognition.current) return;

    if (isListening) {
      recognition.current.stop();
      setIsListening(false);
    } else {
      recognition.current.start();
      setIsListening(true);
    }
  }, [isListening]);

  // Render function result
  const renderFunctionResult = (result: any) => {
    if (!result || !result.success) return null;

    const { functionCalled } = result;
    
    if (functionCalled === 'get_market_data' && result.data) {
      return (
        <div className="mt-3 p-3 bg-gray-900 rounded-lg border border-gray-700">
          <h4 className="text-sm font-medium text-green-400 mb-2">📊 Market Data</h4>
          {Object.entries(result.data).map(([symbol, data]: [string, any]) => (
            <div key={symbol} className="flex justify-between items-center py-1 text-sm">
              <span className="text-white font-medium">{symbol}</span>
              <div className="text-right">
                <span className="text-white">${data.price?.toFixed(2)}</span>
                <span className={`ml-2 ${data.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {data.changePercent >= 0 ? '+' : ''}{data.changePercent?.toFixed(2)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (functionCalled === 'get_portfolio_status' && result.data) {
      const portfolio = result.data;
      return (
        <div className="mt-3 p-3 bg-gray-900 rounded-lg border border-gray-700">
          <h4 className="text-sm font-medium text-blue-400 mb-2">💼 Portfolio Status</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Total Value:</span>
              <span className="text-white font-medium">${portfolio.totalValue?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Available Funds:</span>
              <span className="text-green-400 font-medium">${portfolio.availableFunds?.toLocaleString()}</span>
            </div>
            {portfolio.positions?.length > 0 && (
              <div className="mt-2">
                <span className="text-gray-400 text-xs">Positions:</span>
                {portfolio.positions.map((position: any, index: number) => (
                  <div key={index} className="flex justify-between items-center py-1">
                    <span className="text-white text-xs">{position.symbol}</span>
                    <span className={`text-xs ${position.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {position.pnl >= 0 ? '+' : ''}${position.pnl?.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }

    if (functionCalled === 'calculate_position_size' && result.data) {
      const calc = result.data;
      return (
        <div className="mt-3 p-3 bg-gray-900 rounded-lg border border-gray-700">
          <h4 className="text-sm font-medium text-purple-400 mb-2">🎯 Position Size Calculator</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Recommended Quantity:</span>
              <span className="text-white font-medium">{calc.recommendedQuantity} shares</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Position Value:</span>
              <span className="text-white">${calc.positionValue?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Stop Loss Price:</span>
              <span className="text-red-400">${calc.stopLossPrice?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Max Loss:</span>
              <span className="text-red-400">${calc.maxLoss?.toFixed(2)}</span>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="mt-3 p-3 bg-gray-900 rounded-lg border border-gray-700">
        <pre className="text-xs text-gray-300 whitespace-pre-wrap overflow-x-auto">
          {JSON.stringify(result.data, null, 2)}
        </pre>
      </div>
    );
  };

  return (
    <Card className={`flex flex-col bg-black/90 border-gray-800 ${className}`} style={{ height }}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">AI Trading Copilot</h3>
            <p className="text-xs text-gray-400">AILYDIAN Ultra Pro</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
          <span className="text-xs text-gray-400">Online</span>
        </div>
      </div>

      {/* Quick Commands */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex flex-wrap gap-2">
          {QUICK_COMMANDS.map((cmd, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => handleQuickCommand(cmd.command)}
              className="text-xs h-auto py-1 px-2 bg-gray-900/50 border-gray-700 text-gray-300 hover:bg-gray-800"
              disabled={isLoading}
            >
              {cmd.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start space-x-3 ${
              message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              message.role === 'user' 
                ? 'bg-blue-600' 
                : 'bg-gradient-to-r from-purple-500 to-pink-500'
            }`}>
              {message.role === 'user' ? (
                <User className="w-4 h-4 text-white" />
              ) : (
                <Bot className="w-4 h-4 text-white" />
              )}
            </div>
            
            <div className={`flex-1 max-w-xs sm:max-w-md lg:max-w-lg ${
              message.role === 'user' ? 'text-right' : ''
            }`}>
              <div className={`inline-block px-4 py-2 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-white border border-gray-700'
              }`}>
                {message.isLoading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{message.content}</span>
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                )}
              </div>
              
              {message.functionResult && renderFunctionResult(message.functionResult)}
              
              <p className="text-xs text-gray-500 mt-1">
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-800">
        <form onSubmit={handleSubmit} className="flex items-center space-x-2">
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask me about markets, portfolio, or trading strategies..."
              className="bg-gray-900 border-gray-700 text-white pr-10"
              disabled={isLoading}
            />
            {recognition.current && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={toggleVoiceInput}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-800"
              >
                {isListening ? (
                  <MicOff className="w-4 h-4 text-red-400 animate-pulse" />
                ) : (
                  <Mic className="w-4 h-4 text-gray-400" />
                )}
              </Button>
            )}
          </div>
          
          <Button
            type="submit"
            disabled={!inputMessage.trim() || isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>

        <div className="flex items-center justify-center mt-2 text-xs text-gray-500">
          <Lightbulb className="w-3 h-3 mr-1" />
          <span>AI can analyze markets, manage risk, and help with trading decisions</span>
        </div>
      </div>
    </Card>
  );
}
