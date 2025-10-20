# Building a Mental Health Support System with İnsan IQ

Comprehensive tutorial for creating a HIPAA-compliant mental health support platform with emotion tracking, crisis detection, and therapeutic conversation capabilities.

## Overview

This tutorial guides you through building a production-ready mental health support system using İnsan IQ's advanced emotion detection, empathetic response generation, and clinical safety features.

**What you'll build:**
- Secure patient intake system
- Real-time mood tracking dashboard
- AI-powered therapeutic conversations
- Crisis detection and intervention
- Progress monitoring and analytics

**Time to complete**: 90-120 minutes

**Prerequisites:**
- İnsan IQ API key
- Node.js 18+, PostgreSQL 14+
- Understanding of HIPAA compliance
- React/TypeScript proficiency

## Architecture

```
Patient Portal → API Gateway → İnsan IQ Engine → Clinical Database
                      ↓                ↓                ↓
               Security Layer → Crisis Monitor → Alert System
```

## Step 1: Project Foundation

### Initialize Project

```bash
# Create project
mkdir mental-health-platform
cd mental-health-platform

# Backend
npm init -y
npm install express @lydian/insan-iq pg dotenv bcrypt jsonwebtoken
npm install -D typescript @types/express @types/pg @types/node

# Frontend
npx create-react-app client --template typescript
cd client
npm install axios recharts @emotion/react @emotion/styled date-fns
```

### Database Schema

```sql
-- database/schema.sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  date_of_birth DATE,
  phone VARCHAR(20),
  emergency_contact JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE therapy_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id),
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP,
  session_type VARCHAR(50),
  crisis_detected BOOLEAN DEFAULT FALSE,
  summary TEXT,
  emotional_trajectory JSONB
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES therapy_sessions(id),
  role VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  emotion_analysis JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE mood_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id),
  mood_score INTEGER CHECK (mood_score BETWEEN 1 AND 10),
  emotions JSONB,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE crisis_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES therapy_sessions(id),
  patient_id UUID REFERENCES patients(id),
  severity VARCHAR(20) NOT NULL,
  indicators JSONB,
  action_taken TEXT,
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sessions_patient ON therapy_sessions(patient_id);
CREATE INDEX idx_messages_session ON messages(session_id);
CREATE INDEX idx_mood_entries_patient ON mood_entries(patient_id);
CREATE INDEX idx_crisis_events_unresolved ON crisis_events(resolved) WHERE resolved = FALSE;
```

## Step 2: Backend - Clinical AI Service

### Therapeutic Conversation Engine

```typescript
// backend/src/services/therapeutic-ai.service.ts
import { InsanIQClient } from '@lydian/insan-iq';

const client = new InsanIQClient({
  apiKey: process.env.INSAN_IQ_API_KEY!
});

export class TherapeuticAIService {
  async conductTherapy(
    patientId: string,
    message: string,
    sessionContext: any
  ): Promise<any> {
    // Analyze patient message
    const analysis = await client.emotions.analyze({
      text: message,
      context: sessionContext.history,
      detect_clinical_indicators: true,
      assess_risk: true
    });

    // Generate therapeutic response
    const response = await client.generate({
      prompt: message,
      conversation_history: sessionContext.history,
      emotion_context: analysis,
      generation_config: {
        style: 'therapeutic',
        technique: this.selectTherapeuticApproach(analysis),
        empathy_level: 0.95,
        max_length: 250,
        temperature: 0.7,
        clinical_safety: true
      },
      constraints: {
        never_diagnose: true,
        never_prescribe: true,
        always_support: true,
        crisis_sensitive: true
      }
    });

    return {
      analysisResult: analysis,
      therapeuticResponse: response.text,
      technique: response.technique_used,
      recommendedFollowUp: response.follow_up_suggestions
    };
  }

  private selectTherapeuticApproach(analysis: any): string {
    // Select evidence-based therapeutic technique based on emotional state
    if (analysis.anxiety_score > 0.7) {
      return 'cognitive_behavioral_therapy';
    } else if (analysis.sadness_score > 0.7) {
      return 'interpersonal_therapy';
    } else if (analysis.distorted_thinking_detected) {
      return 'cognitive_restructuring';
    } else {
      return 'person_centered_therapy';
    }
  }

  async assessMentalHealth(patientId: string): Promise<any> {
    const recentSessions = await this.getRecentSessions(patientId);

    const assessment = await client.assessment.comprehensive({
      patient_id: patientId,
      session_data: recentSessions,
      assess_for: [
        'depression',
        'anxiety',
        'trauma',
        'substance_abuse',
        'eating_disorders'
      ],
      clinical_validated: true,
      scoring: 'dsm5_aligned'
    });

    return {
      overall_score: assessment.overall_mental_health_score,
      conditions_screening: assessment.condition_scores,
      risk_factors: assessment.identified_risks,
      protective_factors: assessment.protective_factors,
      recommendations: assessment.clinical_recommendations,
      confidence: assessment.confidence_score
    };
  }

  private async getRecentSessions(patientId: string): Promise<any[]> {
    // Retrieve from database
    // Implementation here...
    return [];
  }
}
```

## Step 3: Crisis Detection System

### Real-Time Crisis Monitoring

```typescript
// backend/src/services/crisis-detection.service.ts
import { InsanIQClient } from '@lydian/insan-iq';
import { EmergencyAlertService } from './emergency-alert.service';

const client = new InsanIQClient({
  apiKey: process.env.INSAN_IQ_API_KEY!
});

export class CrisisDetectionService {
  private emergencyAlert = new EmergencyAlertService();

  async monitorForCrisis(
    message: string,
    emotionAnalysis: any,
    patientId: string,
    sessionId: string
  ): Promise<any> {
    const crisisAssessment = await client.safety.assessCrisis({
      text: message,
      emotion_data: emotionAnalysis,
      historical_context: await this.getPatientHistory(patientId),
      risk_factors: [
        'suicide_ideation',
        'self_harm',
        'harm_to_others',
        'psychotic_symptoms',
        'severe_distress'
      ],
      clinical_protocols: true
    });

    if (crisisAssessment.crisis_detected) {
      await this.handleCrisis({
        patientId,
        sessionId,
        severity: crisisAssessment.severity,
        indicators: crisisAssessment.indicators,
        recommendation: crisisAssessment.recommended_action
      });
    }

    return crisisAssessment;
  }

  private async handleCrisis(crisisData: any): Promise<void> {
    // Log crisis event
    await this.logCrisisEvent(crisisData);

    // Immediate actions based on severity
    switch (crisisData.severity) {
      case 'critical':
        // Immediate emergency response
        await this.emergencyAlert.notifyEmergencyServices(crisisData);
        await this.emergencyAlert.notifyClinicianOnCall(crisisData);
        await this.emergencyAlert.displayEmergencyResources(crisisData.patientId);
        break;

      case 'high':
        // Urgent clinical intervention
        await this.emergencyAlert.notifyClinicianOnCall(crisisData);
        await this.emergencyAlert.escalateToHumanTherapist(crisisData);
        break;

      case 'medium':
        // Enhanced monitoring
        await this.emergencyAlert.flagForClinicalReview(crisisData);
        await this.provideCrisisResources(crisisData.patientId);
        break;
    }
  }

  private async logCrisisEvent(crisisData: any): Promise<void> {
    // Store in database with HIPAA logging
    const query = `
      INSERT INTO crisis_events (
        session_id,
        patient_id,
        severity,
        indicators,
        action_taken
      ) VALUES ($1, $2, $3, $4, $5)
    `;
    // Execute query...
  }

  async provideCrisisResources(patientId: string): Promise<any> {
    return {
      immediate: [
        {
          name: '988 Suicide & Crisis Lifeline',
          phone: '988',
          description: '24/7 crisis support'
        },
        {
          name: 'Crisis Text Line',
          text: 'HOME to 741741',
          description: 'Text-based crisis support'
        },
        {
          name: 'Emergency Services',
          phone: '911',
          description: 'For immediate danger'
        }
      ],
      ongoing: [
        {
          name: 'SAMHSA National Helpline',
          phone: '1-800-662-4357',
          description: 'Mental health and substance abuse'
        },
        {
          name: 'Veterans Crisis Line',
          phone: '988, then press 1',
          description: 'Support for veterans'
        }
      ]
    };
  }

  private async getPatientHistory(patientId: string): Promise<any> {
    // Retrieve relevant clinical history
    return {};
  }
}
```

## Step 4: Mood Tracking System

### Longitudinal Mood Monitoring

```typescript
// backend/src/services/mood-tracking.service.ts
import { InsanIQClient } from '@lydian/insan-iq';

const client = new InsanIQClient({
  apiKey: process.env.INSAN_IQ_API_KEY!
});

export class MoodTrackingService {
  async recordMoodEntry(
    patientId: string,
    moodData: {
      score: number;
      notes?: string;
    }
  ): Promise<any> {
    // Analyze mood entry text if provided
    let emotionAnalysis = null;
    if (moodData.notes) {
      emotionAnalysis = await client.emotions.analyze({
        text: moodData.notes,
        detailed_emotions: true
      });
    }

    // Store mood entry
    const entry = await this.storeMoodEntry({
      patient_id: patientId,
      mood_score: moodData.score,
      emotions: emotionAnalysis?.emotions || [],
      notes: moodData.notes
    });

    // Analyze trends
    const trends = await this.analyzeMoodTrends(patientId);

    return {
      entry,
      trends,
      alerts: this.checkForAnomalies(trends)
    };
  }

  async analyzeMoodTrends(patientId: string): Promise<any> {
    const moodHistory = await this.getMoodHistory(patientId, 30); // Last 30 days

    const analysis = await client.analytics.timeSeries({
      data: moodHistory.map(m => ({
        timestamp: m.created_at,
        value: m.mood_score,
        emotions: m.emotions
      })),
      analysis_types: [
        'trend_direction',
        'volatility',
        'patterns',
        'anomalies',
        'predictions'
      ]
    });

    return {
      average_mood: this.calculateAverage(moodHistory),
      trend: analysis.trend_direction, // improving | stable | declining
      volatility: analysis.volatility_score,
      patterns: analysis.detected_patterns,
      prediction: analysis.next_week_forecast,
      alerts: analysis.anomalies
    };
  }

  private checkForAnomalies(trends: any): any[] {
    const alerts = [];

    if (trends.trend === 'declining' && trends.volatility > 0.7) {
      alerts.push({
        type: 'deteriorating_mood',
        severity: 'high',
        message: 'Significant mood decline detected over past weeks'
      });
    }

    if (trends.volatility > 0.8) {
      alerts.push({
        type: 'high_volatility',
        severity: 'medium',
        message: 'Mood instability - may indicate emotional dysregulation'
      });
    }

    return alerts;
  }

  private async getMoodHistory(patientId: string, days: number): Promise<any[]> {
    // Query database for mood entries
    return [];
  }

  private calculateAverage(data: any[]): number {
    return data.reduce((sum, item) => sum + item.mood_score, 0) / data.length;
  }

  private async storeMoodEntry(data: any): Promise<any> {
    // Insert into database
    return data;
  }
}
```

## Step 5: Frontend - Patient Dashboard

### Main Dashboard Component

```tsx
// client/src/components/PatientDashboard.tsx
import React, { useState, useEffect } from 'react';
import { MoodTracker } from './MoodTracker';
import { TherapyChat } from './TherapyChat';
import { ProgressChart } from './ProgressChart';
import { ResourcesPanel } from './ResourcesPanel';
import axios from 'axios';

export const PatientDashboard: React.FC = () => {
  const [moodData, setMoodData] = useState<any>(null);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [crisisResources, setCrisisResources] = useState<any>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const response = await axios.get('/api/dashboard', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      setMoodData(response.data.mood_trends);
      setActiveSession(response.data.active_session);
      setCrisisResources(response.data.crisis_resources);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    }
  };

  const startTherapySession = async () => {
    try {
      const response = await axios.post('/api/sessions/start', {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      setActiveSession(response.data.session);
    } catch (error) {
      console.error('Failed to start session:', error);
    }
  };

  return (
    <div className="patient-dashboard">
      <header className="dashboard-header">
        <h1>Mental Health Support</h1>
        <button onClick={startTherapySession} className="start-session-btn">
          Start Therapy Session
        </button>
      </header>

      <div className="dashboard-grid">
        <section className="mood-section">
          <h2>Mood Tracking</h2>
          <MoodTracker onMoodRecorded={loadDashboardData} />
          {moodData && <ProgressChart data={moodData} />}
        </section>

        <section className="therapy-section">
          {activeSession ? (
            <TherapyChat session={activeSession} />
          ) : (
            <div className="no-session">
              <p>Start a therapy session to talk with your AI therapist</p>
            </div>
          )}
        </section>

        <section className="resources-section">
          <h2>Resources & Support</h2>
          {crisisResources && <ResourcesPanel resources={crisisResources} />}
        </section>
      </div>
    </div>
  );
};
```

### Therapy Chat Interface

```tsx
// client/src/components/TherapyChat.tsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

interface TherapyChatProps {
  session: any;
}

export const TherapyChat: React.FC<TherapyChatProps> = ({ session }) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadSessionMessages();
  }, [session.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadSessionMessages = async () => {
    const response = await axios.get(`/api/sessions/${session.id}/messages`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });

    setMessages(response.data);
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = {
      role: 'patient',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await axios.post(
        `/api/sessions/${session.id}/message`,
        { content: input },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );

      setMessages(prev => [...prev, {
        role: 'therapist',
        content: response.data.response,
        emotion_analysis: response.data.emotion_analysis,
        timestamp: new Date()
      }]);

      setCurrentEmotion(response.data.emotion_analysis);

      if (response.data.crisis_detected) {
        // Show crisis alert
        alert('Crisis detected. Emergency resources are being displayed.');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="therapy-chat">
      <div className="session-info">
        <span>Session ID: {session.id}</span>
        {currentEmotion && (
          <span className="emotion-badge">
            Current: {currentEmotion.primary_emotion}
          </span>
        )}
      </div>

      <div className="messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.role}`}>
            <div className="message-content">{msg.content}</div>
            <div className="message-time">
              {new Date(msg.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="message therapist typing">
            <div className="typing-indicator">
              <span></span><span></span><span></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-area">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          placeholder="Share your thoughts and feelings..."
          rows={3}
        />
        <button onClick={sendMessage} disabled={!input.trim()}>
          Send
        </button>
      </div>
    </div>
  );
};
```

## Step 6: Security & Compliance

### HIPAA Compliance Layer

```typescript
// backend/src/middleware/hipaa-compliance.ts
import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export class HIPAAComplianceMiddleware {
  // Encrypt PHI (Protected Health Information)
  static encryptPHI(data: any): string {
    const algorithm = 'aes-256-gcm';
    const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return JSON.stringify({
      iv: iv.toString('hex'),
      data: encrypted,
      authTag: authTag.toString('hex')
    });
  }

  // Decrypt PHI
  static decryptPHI(encrypted: string): any {
    const { iv, data, authTag } = JSON.parse(encrypted);
    const algorithm = 'aes-256-gcm';
    const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');

    const decipher = crypto.createDecipheriv(
      algorithm,
      key,
      Buffer.from(iv, 'hex')
    );

    decipher.setAuthTag(Buffer.from(authTag, 'hex'));

    let decrypted = decipher.update(data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return JSON.parse(decrypted);
  }

  // Audit logging middleware
  static auditLog(req: Request, res: Response, next: NextFunction) {
    const auditEntry = {
      timestamp: new Date(),
      user_id: req.user?.id,
      action: `${req.method} ${req.path}`,
      ip_address: req.ip,
      user_agent: req.headers['user-agent'],
      phi_accessed: req.path.includes('/patients') || req.path.includes('/sessions')
    };

    // Log to secure audit database
    console.log('[AUDIT]', auditEntry);

    next();
  }

  // Access control
  static requireRole(allowedRoles: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.user || !allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      next();
    };
  }
}
```

### Data Retention Policy

```typescript
// backend/src/services/data-retention.service.ts
export class DataRetentionService {
  async enforceRetentionPolicies(): Promise<void> {
    // HIPAA requires minimum 6 years retention
    const retentionDate = new Date();
    retentionDate.setFullYear(retentionDate.getFullYear() - 6);

    // Archive old records
    await this.archiveOldRecords(retentionDate);

    // Delete data past retention period
    await this.deleteExpiredData(retentionDate);
  }

  private async archiveOldRecords(beforeDate: Date): Promise<void> {
    // Move to cold storage
  }

  private async deleteExpiredData(beforeDate: Date): Promise<void> {
    // Securely delete per HIPAA requirements
  }
}
```

## Step 7: Deployment

### Environment Configuration

```bash
# .env.production
# API Keys
INSAN_IQ_API_KEY=your_production_key

# Database
DATABASE_URL=postgresql://user:pass@host:5432/mental_health_db

# Security
ENCRYPTION_KEY=64_character_hex_key
JWT_SECRET=your_jwt_secret

# Compliance
HIPAA_MODE=true
AUDIT_LOG_LEVEL=detailed
```

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application
COPY . .

# Build
RUN npm run build

# Security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

EXPOSE 3000

CMD ["npm", "start"]
```

## Best Practices

1. **Clinical Safety**: Never diagnose or prescribe
2. **Crisis Protocol**: Immediate escalation for high-risk situations
3. **Data Privacy**: End-to-end encryption for all PHI
4. **Audit Trails**: Comprehensive logging per HIPAA
5. **Session Limits**: Recommend professional help after X sessions

## Related Documentation

- [İnsan IQ Safety & Ethics](../guides/insan-iq-safety-ethics.md)
- [İnsan IQ Emotion Detection](../guides/insan-iq-emotion-detection.md)
- [HIPAA Compliance Guide](../compliance/hipaa.md)

## Support

- **Clinical Integration**: clinical@lydian.com
- **Compliance Questions**: compliance@lydian.com
- **Emergency Support**: emergency@lydian.com
