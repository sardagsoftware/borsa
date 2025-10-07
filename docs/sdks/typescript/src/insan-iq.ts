import { LydianClient } from './client';
import { Persona, Skill, ChatSession, ChatMessage, PaginatedResponse, PaginationParams } from './types';

/**
 * İnsan IQ API client
 */
export class InsanIQClient {
  constructor(private client: LydianClient) {}

  /**
   * Create a new persona
   */
  async createPersona(data: Omit<Persona, 'id' | 'createdAt' | 'updatedAt'>): Promise<Persona> {
    return this.client.request<Persona>('POST', '/insan-iq/personas', { body: data });
  }

  /**
   * Get persona by ID
   */
  async getPersona(personaId: string): Promise<Persona> {
    return this.client.request<Persona>('GET', `/insan-iq/personas/${personaId}`);
  }

  /**
   * List personas
   */
  async listPersonas(params?: PaginationParams): Promise<PaginatedResponse<Persona>> {
    return this.client.request<PaginatedResponse<Persona>>('GET', '/insan-iq/personas', {
      query: params,
    });
  }

  /**
   * Update persona
   */
  async updatePersona(personaId: string, data: Partial<Persona>): Promise<Persona> {
    return this.client.request<Persona>('PATCH', `/insan-iq/personas/${personaId}`, { body: data });
  }

  /**
   * Delete persona
   */
  async deletePersona(personaId: string): Promise<void> {
    await this.client.request<void>('DELETE', `/insan-iq/personas/${personaId}`);
  }

  /**
   * Publish skill to persona
   */
  async publishSkill(data: Omit<Skill, 'id' | 'createdAt'>): Promise<Skill> {
    return this.client.request<Skill>('POST', '/insan-iq/skills', { body: data });
  }

  /**
   * List persona skills
   */
  async listSkills(personaId: string, params?: PaginationParams): Promise<PaginatedResponse<Skill>> {
    return this.client.request<PaginatedResponse<Skill>>('GET', `/insan-iq/personas/${personaId}/skills`, {
      query: params,
    });
  }

  /**
   * Create chat session
   */
  async createSession(data: Omit<ChatSession, 'id' | 'createdAt' | 'messageCount' | 'lastMessageAt' | 'status'>): Promise<ChatSession> {
    return this.client.request<ChatSession>('POST', '/insan-iq/sessions', { body: data });
  }

  /**
   * Send message in session
   */
  async sendMessage(sessionId: string, content: string, metadata?: Record<string, any>): Promise<ChatMessage> {
    return this.client.request<ChatMessage>('POST', `/insan-iq/sessions/${sessionId}/messages`, {
      body: { content, metadata },
    });
  }

  /**
   * Get session history
   */
  async getSessionHistory(sessionId: string, params?: PaginationParams): Promise<PaginatedResponse<ChatMessage>> {
    return this.client.request<PaginatedResponse<ChatMessage>>('GET', `/insan-iq/sessions/${sessionId}/messages`, {
      query: params,
    });
  }
}
