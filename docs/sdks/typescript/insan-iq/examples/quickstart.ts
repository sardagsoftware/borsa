/**
 * İnsan IQ SDK - Quickstart Example
 *
 * This example shows how to:
 * 1. Create a client with API key authentication
 * 2. Create a persona
 * 3. Create an AI assistant with the persona
 */

import { createClient } from '@lydian/insan-iq-sdk';

// Create client with API key authentication
const client = createClient({
  auth: { apiKey: process.env.LYDIAN_API_KEY! }
});

// Create a persona
const persona = await client.createPersona({
  name: 'Customer Support Agent',
  personality: 'friendly, patient, solution-oriented',
  expertise: ['customer service', 'problem solving', 'communication'],
  language: 'tr'
});

// Create an AI assistant with this persona
const assistant = await client.createAssistant({
  name: 'Support Bot',
  personaId: persona.personaId,
  skills: ['ticket-management', 'knowledge-base-search'],
  capabilities: ['text-generation', 'sentiment-analysis']
});

console.log('Assistant created:', assistant.assistantId);
