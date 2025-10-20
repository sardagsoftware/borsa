/**
 * İnsan IQ SDK - Skills Marketplace Example
 *
 * This example shows how to publish and discover skills
 */

import { createClient } from '@lydian/insan-iq-sdk';

const client = createClient({
  auth: { apiKey: process.env.LYDIAN_API_KEY! }
});

// Publish a new skill to the marketplace
const skill = await client.publishSkill({
  name: 'Turkish Language Expert',
  description: 'Advanced Turkish language processing and translation',
  category: 'language',
  version: '1.0.0',
  capabilities: ['translation', 'grammar-check', 'sentiment-analysis'],
  pricing: { model: 'usage-based', pricePerRequest: 0.01 }
});

console.log('Skill published:', skill.skillId);

// Browse skills in the marketplace
const skillsResponse = await client.listSkills({
  limit: 10,
  category: 'language'
});

console.log(`Found ${skillsResponse.data.length} language skills`);
