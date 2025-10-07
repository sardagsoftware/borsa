# Building an Empathetic Chatbot with İnsan IQ

Step-by-step tutorial for creating a production-ready empathetic chatbot that understands emotions, provides supportive responses, and adapts to user needs.

## Overview

This tutorial demonstrates how to build a full-featured empathetic chatbot using İnsan IQ's emotion detection, contextual understanding, and empathetic response generation capabilities.

**What you'll build:**
- Real-time empathetic chat interface
- Emotion detection and tracking
- Context-aware response generation
- User personalization
- Crisis detection and intervention

**Time to complete**: 60-75 minutes

**Prerequisites:**
- İnsan IQ API key
- Node.js 18+ and npm
- React and TypeScript knowledge
- Basic understanding of WebSockets

## Architecture

```
User Input → Emotion Analysis → Context Integration → Response Generation
     ↓              ↓                    ↓                    ↓
  Frontend ← WebSocket Server ← İnsan IQ API ← Conversation Memory
```

## Step 1: Project Setup

### Initialize Project

```bash
# Create project directory
mkdir empathetic-chatbot
cd empathetic-chatbot

# Backend setup
npm init -y
npm install express @lydian/insan-iq ws cors dotenv
npm install -D typescript @types/express @types/ws @types/node ts-node

# Frontend setup
npx create-react-app frontend --template typescript
cd frontend
npm install socket.io-client @emotion/react @emotion/styled recharts
```

### Project Structure

```
empathetic-chatbot/
├── backend/
│   ├── src/
│   │   ├── server.ts
│   │   ├── emotion-service.ts
│   │   ├── conversation-manager.ts
│   │   ├── crisis-detector.ts
│   │   └── websocket-handler.ts
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatInterface.tsx
│   │   │   ├── EmotionIndicator.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   └── EmotionChart.tsx
│   │   ├── App.tsx
│   │   └── index.tsx
│   └── package.json
└── .env
```

### Environment Configuration

```bash
# .env
INSAN_IQ_API_KEY=your_api_key_here
PORT=3001
NODE_ENV=development
```

## Step 2: Backend - Emotion Service

### Emotion Detection Module

```typescript
// backend/src/emotion-service.ts
import { InsanIQClient } from '@lydian/insan-iq';

const client = new InsanIQClient({
  apiKey: process.env.INSAN_IQ_API_KEY!
});

export interface EmotionAnalysis {
  primaryEmotion: string;
  intensity: number;
  emotions: Array<{ emotion: string; score: number }>;
  sentiment: number;
  urgency: number;
}

export class EmotionService {
  async analyzeMessage(text: string, context?: any): Promise<EmotionAnalysis> {
    const analysis = await client.emotions.analyze({
      text,
      context,
      include_intensity: true,
      detect_urgency: true
    });

    return {
      primaryEmotion: analysis.primary_emotion,
      intensity: analysis.intensity,
      emotions: analysis.all_emotions,
      sentiment: analysis.sentiment.score,
      urgency: analysis.urgency_score
    };
  }

  async trackEmotionalTrajectory(
    conversationId: string,
    currentEmotion: string
  ): Promise<any> {
    return await client.emotions.trackTrajectory({
      conversation_id: conversationId,
      current_emotion: currentEmotion
    });
  }
}

export const emotionService = new EmotionService();
```

## Step 3: Backend - Conversation Management

### Context and Memory Management

```typescript
// backend/src/conversation-manager.ts
import { InsanIQClient } from '@lydian/insan-iq';

const client = new InsanIQClient({
  apiKey: process.env.INSAN_IQ_API_KEY!
});

export class ConversationManager {
  private conversations = new Map<string, any>();

  async createConversation(userId: string): Promise<string> {
    const conversation = await client.conversations.create({
      user_id: userId,
      context_window: 20,
      enable_memory: true,
      enable_personalization: true
    });

    this.conversations.set(conversation.id, {
      id: conversation.id,
      userId,
      messages: [],
      emotionalHistory: [],
      startedAt: new Date()
    });

    return conversation.id;
  }

  async addMessage(
    conversationId: string,
    role: 'user' | 'assistant',
    content: string,
    emotion?: any
  ): Promise<void> {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) throw new Error('Conversation not found');

    const message = {
      role,
      content,
      emotion,
      timestamp: new Date()
    };

    conversation.messages.push(message);

    if (emotion) {
      conversation.emotionalHistory.push({
        emotion: emotion.primaryEmotion,
        intensity: emotion.intensity,
        timestamp: new Date()
      });
    }

    // Store in İnsan IQ context
    await client.context.addMessage({
      conversation_id: conversationId,
      role,
      content,
      metadata: { emotion }
    });
  }

  async generateResponse(
    conversationId: string,
    userMessage: string,
    emotionAnalysis: any
  ): Promise<string> {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) throw new Error('Conversation not found');

    const response = await client.generate({
      conversation_id: conversationId,
      prompt: userMessage,
      emotion_context: emotionAnalysis,
      conversation_history: conversation.messages.slice(-10),
      generation_config: {
        empathy_level: this.calculateEmpathyLevel(emotionAnalysis),
        max_length: 200,
        temperature: 0.7,
        tone: this.determineTone(emotionAnalysis)
      }
    });

    return response.text;
  }

  private calculateEmpathyLevel(emotionAnalysis: any): number {
    // Higher empathy for negative emotions and high intensity
    if (emotionAnalysis.sentiment < 0 && emotionAnalysis.intensity > 0.7) {
      return 0.95;
    } else if (emotionAnalysis.sentiment < 0) {
      return 0.85;
    } else {
      return 0.75;
    }
  }

  private determineTone(emotionAnalysis: any): string {
    if (emotionAnalysis.urgency > 0.8) return 'calm_reassuring';
    if (emotionAnalysis.sentiment < -0.5) return 'supportive_gentle';
    if (emotionAnalysis.sentiment > 0.5) return 'warm_encouraging';
    return 'balanced_empathetic';
  }

  getConversation(conversationId: string) {
    return this.conversations.get(conversationId);
  }
}

export const conversationManager = new ConversationManager();
```

## Step 4: Backend - Crisis Detection

### Crisis Intervention System

```typescript
// backend/src/crisis-detector.ts
import { InsanIQClient } from '@lydian/insan-iq';

const client = new InsanIQClient({
  apiKey: process.env.INSAN_IQ_API_KEY!
});

export interface CrisisAlert {
  detected: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  indicators: string[];
  recommendedAction: string;
  immediateResponse: string;
}

export class CrisisDetector {
  async detectCrisis(message: string, emotionAnalysis: any): Promise<CrisisAlert> {
    const crisisAnalysis = await client.safety.detectCrisis({
      text: message,
      emotion_context: emotionAnalysis,
      check_for: [
        'self_harm',
        'suicide_ideation',
        'severe_distress',
        'emergency_situation'
      ]
    });

    const alert: CrisisAlert = {
      detected: crisisAnalysis.crisis_detected,
      severity: crisisAnalysis.severity,
      indicators: crisisAnalysis.indicators,
      recommendedAction: this.getRecommendedAction(crisisAnalysis.severity),
      immediateResponse: this.getCrisisResponse(crisisAnalysis)
    };

    if (alert.detected && alert.severity === 'critical') {
      await this.escalateToCrisisSupport(crisisAnalysis);
    }

    return alert;
  }

  private getRecommendedAction(severity: string): string {
    switch (severity) {
      case 'critical':
        return 'immediate_professional_intervention';
      case 'high':
        return 'escalate_to_human_counselor';
      case 'medium':
        return 'provide_crisis_resources';
      default:
        return 'monitor_closely';
    }
  }

  private getCrisisResponse(analysis: any): string {
    if (analysis.indicators.includes('self_harm') ||
        analysis.indicators.includes('suicide_ideation')) {
      return "I'm really concerned about what you're sharing. Your safety is the most important thing right now. Please reach out to a crisis counselor immediately at 988 (Suicide & Crisis Lifeline) or text HOME to 741741 (Crisis Text Line). I care about your wellbeing.";
    } else if (analysis.severity === 'high') {
      return "I hear that you're going through an incredibly difficult time. While I want to support you, I think it's important that you speak with a professional who can provide the help you need. Would you be open to connecting with a counselor?";
    } else {
      return "It sounds like things are really challenging right now. I'm here to listen and support you. How are you feeling at this moment?";
    }
  }

  private async escalateToCrisisSupport(analysis: any): Promise<void> {
    // Log to monitoring system
    console.error('[CRISIS DETECTED]', {
      severity: analysis.severity,
      indicators: analysis.indicators,
      timestamp: new Date()
    });

    // Notify human supervisors
    // Send to crisis management system
    // Implementation depends on your infrastructure
  }
}

export const crisisDetector = new CrisisDetector();
```

## Step 5: Backend - WebSocket Handler

### Real-Time Communication

```typescript
// backend/src/websocket-handler.ts
import WebSocket from 'ws';
import { emotionService } from './emotion-service';
import { conversationManager } from './conversation-manager';
import { crisisDetector } from './crisis-detector';

export function setupWebSocket(server: any) {
  const wss = new WebSocket.Server({ server });

  wss.on('connection', async (ws: WebSocket) => {
    const userId = generateUserId();
    const conversationId = await conversationManager.createConversation(userId);

    console.log(`Client connected: ${userId}`);

    // Send welcome message
    ws.send(JSON.stringify({
      type: 'welcome',
      message: "Hi! I'm here to listen and support you. How are you feeling today?",
      conversationId
    }));

    ws.on('message', async (data: string) => {
      try {
        const message = JSON.parse(data);

        if (message.type === 'user_message') {
          // Analyze emotion
          const emotionAnalysis = await emotionService.analyzeMessage(
            message.content
          );

          // Check for crisis
          const crisisAlert = await crisisDetector.detectCrisis(
            message.content,
            emotionAnalysis
          );

          // Add user message to conversation
          await conversationManager.addMessage(
            conversationId,
            'user',
            message.content,
            emotionAnalysis
          );

          // Generate empathetic response
          let responseText: string;

          if (crisisAlert.detected) {
            responseText = crisisAlert.immediateResponse;
          } else {
            responseText = await conversationManager.generateResponse(
              conversationId,
              message.content,
              emotionAnalysis
            );
          }

          // Add assistant response to conversation
          await conversationManager.addMessage(
            conversationId,
            'assistant',
            responseText
          );

          // Track emotional trajectory
          const trajectory = await emotionService.trackEmotionalTrajectory(
            conversationId,
            emotionAnalysis.primaryEmotion
          );

          // Send response to client
          ws.send(JSON.stringify({
            type: 'assistant_message',
            content: responseText,
            emotion: emotionAnalysis,
            crisis: crisisAlert,
            trajectory
          }));
        }
      } catch (error) {
        console.error('Message handling error:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'An error occurred processing your message'
        }));
      }
    });

    ws.on('close', () => {
      console.log(`Client disconnected: ${userId}`);
    });
  });

  return wss;
}

function generateUserId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
```

### Main Server

```typescript
// backend/src/server.ts
import express from 'express';
import cors from 'cors';
import http from 'http';
import { setupWebSocket } from './websocket-handler';

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

// Setup WebSocket
setupWebSocket(server);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'empathetic-chatbot' });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket available at ws://localhost:${PORT}`);
});
```

## Step 6: Frontend - Chat Interface

### Main Chat Component

```tsx
// frontend/src/components/ChatInterface.tsx
import React, { useState, useEffect, useRef } from 'react';
import { MessageBubble } from './MessageBubble';
import { EmotionIndicator } from './EmotionIndicator';
import { EmotionChart } from './EmotionChart';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  emotion?: any;
  timestamp: Date;
}

export const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [currentEmotion, setCurrentEmotion] = useState<any>(null);
  const [emotionalHistory, setEmotionalHistory] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [crisisAlert, setCrisisAlert] = useState<any>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Connect to WebSocket
    const ws = new WebSocket('ws://localhost:3001');

    ws.onopen = () => {
      setIsConnected(true);
      console.log('Connected to chatbot');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'welcome') {
        setMessages([{
          role: 'assistant',
          content: data.message,
          timestamp: new Date()
        }]);
      } else if (data.type === 'assistant_message') {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.content,
          emotion: data.emotion,
          timestamp: new Date()
        }]);

        if (data.crisis?.detected) {
          setCrisisAlert(data.crisis);
        }

        if (data.trajectory) {
          setEmotionalHistory(data.trajectory.history);
        }
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      console.log('Disconnected from chatbot');
    };

    wsRef.current = ws;

    return () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    // Scroll to bottom on new message
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim() || !wsRef.current) return;

    const userMessage = {
      role: 'user' as const,
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    wsRef.current.send(JSON.stringify({
      type: 'user_message',
      content: inputValue
    }));

    setInputValue('');
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2>Empathetic Support Chat</h2>
        <div className={`status ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? '● Connected' : '○ Disconnected'}
        </div>
      </div>

      <div className="emotion-panel">
        {currentEmotion && (
          <EmotionIndicator emotion={currentEmotion} />
        )}
        {emotionalHistory.length > 0 && (
          <EmotionChart history={emotionalHistory} />
        )}
      </div>

      {crisisAlert?.detected && (
        <div className={`crisis-alert severity-${crisisAlert.severity}`}>
          <strong>⚠️ Crisis Detected:</strong> {crisisAlert.recommendedAction}
        </div>
      )}

      <div className="messages">
        {messages.map((msg, idx) => (
          <MessageBubble key={idx} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-area">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type your message..."
          disabled={!isConnected}
        />
        <button onClick={handleSend} disabled={!isConnected}>
          Send
        </button>
      </div>
    </div>
  );
};
```

## Step 7: Frontend - Emotion Visualization

### Emotion Indicator

```tsx
// frontend/src/components/EmotionIndicator.tsx
import React from 'react';

interface EmotionIndicatorProps {
  emotion: {
    primaryEmotion: string;
    intensity: number;
    sentiment: number;
  };
}

export const EmotionIndicator: React.FC<EmotionIndicatorProps> = ({ emotion }) => {
  const getEmotionColor = (emotionType: string) => {
    const colors: Record<string, string> = {
      joy: '#4CAF50',
      sadness: '#2196F3',
      anger: '#F44336',
      fear: '#9C27B0',
      anxiety: '#FF9800',
      contentment: '#8BC34A',
      frustration: '#FF5722'
    };
    return colors[emotionType] || '#757575';
  };

  const getEmotionEmoji = (emotionType: string) => {
    const emojis: Record<string, string> = {
      joy: '😊',
      sadness: '😢',
      anger: '😠',
      fear: '😨',
      anxiety: '😰',
      contentment: '😌',
      frustration: '😤'
    };
    return emojis[emotionType] || '😐';
  };

  return (
    <div className="emotion-indicator">
      <div className="emotion-label">
        <span className="emoji">{getEmotionEmoji(emotion.primaryEmotion)}</span>
        <span className="name">{emotion.primaryEmotion}</span>
      </div>
      <div className="intensity-bar">
        <div
          className="intensity-fill"
          style={{
            width: `${emotion.intensity * 100}%`,
            backgroundColor: getEmotionColor(emotion.primaryEmotion)
          }}
        />
      </div>
      <div className="sentiment">
        Sentiment: {emotion.sentiment > 0 ? 'Positive' : 'Negative'}
        ({emotion.sentiment.toFixed(2)})
      </div>
    </div>
  );
};
```

### Emotion Trajectory Chart

```tsx
// frontend/src/components/EmotionChart.tsx
import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface EmotionChartProps {
  history: Array<{
    emotion: string;
    intensity: number;
    timestamp: Date;
  }>;
}

export const EmotionChart: React.FC<EmotionChartProps> = ({ history }) => {
  const data = history.map((item, idx) => ({
    index: idx,
    intensity: item.intensity,
    emotion: item.emotion,
    time: new Date(item.timestamp).toLocaleTimeString()
  }));

  return (
    <div className="emotion-chart">
      <h3>Emotional Trajectory</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis domain={[0, 1]} />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="intensity"
            stroke="#8884d8"
            name="Intensity"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
```

### Message Bubble

```tsx
// frontend/src/components/MessageBubble.tsx
import React from 'react';

interface MessageBubbleProps {
  message: {
    role: 'user' | 'assistant';
    content: string;
    emotion?: any;
    timestamp: Date;
  };
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  return (
    <div className={`message-bubble ${message.role}`}>
      <div className="content">{message.content}</div>
      <div className="metadata">
        <span className="time">
          {message.timestamp.toLocaleTimeString()}
        </span>
        {message.emotion && (
          <span className="emotion-tag">
            {message.emotion.primaryEmotion}
          </span>
        )}
      </div>
    </div>
  );
};
```

## Step 8: Styling

### CSS Styles

```css
/* frontend/src/App.css */
.chat-container {
  max-width: 800px;
  margin: 0 auto;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.chat-header {
  background: #1976d2;
  color: white;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status.connected {
  color: #4CAF50;
}

.status.disconnected {
  color: #f44336;
}

.emotion-panel {
  background: white;
  padding: 16px;
  border-bottom: 1px solid #ddd;
}

.crisis-alert {
  padding: 12px;
  margin: 8px;
  border-radius: 4px;
  font-weight: 500;
}

.crisis-alert.severity-critical {
  background: #ffebee;
  border-left: 4px solid #f44336;
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.message-bubble {
  max-width: 70%;
  margin-bottom: 16px;
  padding: 12px;
  border-radius: 8px;
}

.message-bubble.user {
  background: #e3f2fd;
  margin-left: auto;
}

.message-bubble.assistant {
  background: white;
  border: 1px solid #ddd;
}

.input-area {
  display: flex;
  padding: 16px;
  background: white;
  border-top: 1px solid #ddd;
}

.input-area input {
  flex: 1;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

.input-area button {
  margin-left: 8px;
  padding: 12px 24px;
  background: #1976d2;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.input-area button:disabled {
  background: #ccc;
  cursor: not-allowed;
}
```

## Step 9: Running the Application

### Start Backend

```bash
# Terminal 1
cd backend
npx ts-node src/server.ts
```

### Start Frontend

```bash
# Terminal 2
cd frontend
npm start
```

Visit http://localhost:3000 to use the chatbot.

## Step 10: Testing & Validation

### Test Scenarios

```typescript
// Test different emotional states
const testScenarios = [
  {
    input: "I'm feeling really overwhelmed with everything",
    expectedEmotion: 'stress',
    expectedEmpathy: 'high'
  },
  {
    input: "Today was amazing! Got promoted at work!",
    expectedEmotion: 'joy',
    expectedEmpathy: 'celebratory'
  },
  {
    input: "I don't see the point in anything anymore",
    expectedCrisis: true,
    expectedSeverity: 'high'
  }
];
```

## Production Considerations

### Security

```typescript
// Add authentication
import jwt from 'jsonwebtoken';

// Rate limiting
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

app.use('/api/', limiter);
```

### Monitoring

```typescript
// Log important events
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

### Scaling

- Deploy backend on cloud platforms (AWS, Azure, GCP)
- Use Redis for session management
- Implement load balancing for WebSocket connections
- Add database for conversation persistence

## Next Steps

- Add voice input/output using İnsan IQ speech capabilities
- Implement user authentication and profiles
- Create admin dashboard for monitoring
- Add multi-language support
- Integrate with helpdesk systems

## Related Documentation

- [İnsan IQ Emotion Detection Guide](../guides/insan-iq-emotion-detection.md)
- [İnsan IQ Conversation AI Guide](../guides/insan-iq-conversation-ai.md)
- [İnsan IQ API Reference](/docs/api/insan-iq)

## Support

- **Documentation**: https://docs.lydian.com
- **Sample Code**: https://github.com/lydian/examples/empathetic-chatbot
- **Community**: https://community.lydian.com
