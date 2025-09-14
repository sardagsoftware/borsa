'use client';

import { useState, useRef, useEffect } from 'react';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  message: string;
  timestamp: Date;
}

interface AIChatProps {
  className?: string;
  placeholder?: string;
  compact?: boolean;
}

export default function AIChat({ className = '', placeholder = 'AI asistanına soru sorun...', compact = false }: AIChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'ai',
      message: 'Merhaba! Ben AI asistanınızım. Size trading, kripto para analizi ve platform kullanımı hakkında yardımcı olabilirim. Nasıl yardımcı olabilirim?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Real AI responses using GROQ API
  const getAIResponse = async (userMessage: string): Promise<string> => {
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          task: 'quick_qa',
          messages: [
            {
              role: 'system',
              content: 'Sen Türkçe konuşan bir kripto para trading uzmanısın. Kullanıcılara Bitcoin, Ethereum, altcoin analizi, teknik analiz, risk yönetimi ve trading stratejileri konularında yardım ediyorsun. Kısa, net ve Türkçe yanıtlar ver. Finansal tavsiye değil, eğitim amaçlı bilgi veriyorsun.'
            },
            {
              role: 'user',
              content: userMessage
            }
          ],
          stream: false,
          latencyBias: 0.8, // Prioritize speed
          customParams: {
            temperature: 0.7,
            max_tokens: 300
          }
        })
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || 'Şu anda yanıt veremiyorum. Tekrar deneyin.';
    } catch (error) {
      console.error('AI API Error:', error);
      // Fallback to simulated responses
      return getSimulatedResponse(userMessage);
    }
  };

  // Fallback simulated responses
  const getSimulatedResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();
    
    if (message.includes('bitcoin') || message.includes('btc')) {
      return 'Bitcoin analizi: BTC şu anda güçlü trend gösteriyor. Teknik analizde RSI 65 seviyesinde ve MACD pozitif. Kısa vadede yükseliş bekliyorum. Risk yönetimi için pozisyonunuzun %2\'sini aşmayın.';
    } else if (message.includes('ethereum') || message.includes('eth')) {
      return 'Ethereum outlook: ETH 2.0 güncellemeleri ile güçlü fundamentallere sahip. Şu anki seviyede accumulation zone içindeyiz. DeFi aktiviteleri de artış gösteriyor.';
    } else if (message.includes('analiz') || message.includes('tavsiye')) {
      return 'Piyasa analizi: Genel trend yükselişte. VIX endeksi düşük seviyede ve risk iştahı yüksek. Ancak aşırı alım bölgesine yaklaştık. Pozisyon boyutlarınızı gözden geçirin.';
    } else if (message.includes('risk') || message.includes('stop')) {
      return 'Risk Yönetimi: Her pozisyon için %2-3 stop loss kullanın. Portföyün %5\'inden fazlasını tek pozisyonda risk altına sokmayın. Take profit seviyelerini belirleyin.';
    } else if (message.includes('nasıl') || message.includes('yardım')) {
      return 'Size şu konularda yardımcı olabilirim:\n• Kripto para analizi\n• Risk yönetimi tavsiyeleri\n• Teknik analiz\n• Platform kullanımı\n• Piyasa yorumları\n\nHangi konuda yardıma ihtiyacınız var?';
    } else {
      return 'Anlıyorum. Bu konuda detaylı analiz yapmam gerekiyor. Size trading stratejinizi optimize etmek için teknik ve fundamental analiz sunabilirim. Hangi kripto para veya trading stratejisi hakkında daha fazla bilgi istiyorsunuz?';
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      message: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate AI thinking time
    setTimeout(async () => {
      const aiResponseText = await getAIResponse(inputMessage.trim());
      
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        message: aiResponseText,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 800); // Reduced delay for better UX
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickQuestions = [
    'Bitcoin analizi yap',
    'Risk yönetimi tavsiyeleri',
    'Piyasa durumu nasıl?',
    'Hangi coin önerirsin?'
  ];

  if (compact && !isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="fixed bottom-6 right-6 bg-brand-1 text-white p-4 rounded-full shadow-lg hover:bg-brand-1/90 transition-colors z-50 flex items-center space-x-2"
      >
        <span className="text-2xl">🤖</span>
        <span className="hidden sm:inline font-semibold">AI Asistan</span>
      </button>
    );
  }

  return (
    <div className={`bg-panel border border-glass rounded-lg ${compact ? 'fixed bottom-6 right-6 w-96 h-96 shadow-xl z-50' : 'h-full'} ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-glass/30 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-brand-1 rounded-full flex items-center justify-center text-white font-bold">
            🤖
          </div>
          <div>
            <div className="font-semibold text-text">AI Asistan</div>
            <div className="text-xs text-muted">
              {isTyping ? 'Yazıyor...' : 'Online'}
            </div>
          </div>
        </div>
        {compact && (
          <button
            onClick={() => setIsExpanded(false)}
            className="text-muted hover:text-text transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {/* Messages */}
      <div className={`p-4 overflow-y-auto ${compact ? 'h-64' : 'h-80'} space-y-4`}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                msg.type === 'user'
                  ? 'bg-brand-1 text-white'
                  : 'bg-bg-soft text-text border border-glass/30'
              }`}
            >
              <div className="whitespace-pre-line">{msg.message}</div>
              <div
                className={`text-xs mt-1 ${
                  msg.type === 'user' ? 'text-white/70' : 'text-muted'
                }`}
              >
                {msg.timestamp.toLocaleTimeString('tr-TR', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-bg-soft text-text border border-glass/30 max-w-[80%] p-3 rounded-lg">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-brand-1 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-brand-1 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-brand-1 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Questions */}
      {messages.length <= 1 && (
        <div className="px-4 pb-2">
          <div className="text-xs text-muted mb-2">Hızlı sorular:</div>
          <div className="flex flex-wrap gap-1">
            {quickQuestions.map((question) => (
              <button
                key={question}
                onClick={() => setInputMessage(question)}
                className="text-xs bg-brand-1/10 text-brand-1 px-2 py-1 rounded border border-brand-1/20 hover:bg-brand-1/20 transition-colors"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-glass/30">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            className="flex-1 input-primary text-sm"
            disabled={isTyping}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isTyping}
            className="bg-brand-1 text-white p-2 rounded hover:bg-brand-1/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
