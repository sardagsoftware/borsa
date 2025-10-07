import { NextRequest, NextResponse } from 'next/server';
import {
  OpenAIAdapter,
  AnthropicAdapter,
  GeminiAdapter,
  MistralAdapter,
  ZhipuAdapter,
  YiAdapter
} from '@ailydian/ai-adapters';

// GET /api/models - Get all available AI models from all providers
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const provider = searchParams.get('provider'); // optional filter

    const allModels: any[] = [];

    // OpenAI
    if (!provider || provider === 'openai') {
      try {
        const openai = new OpenAIAdapter({ apiKey: process.env.OPENAI_API_KEY || 'test' });
        const models = await openai.getAvailableModels();
        allModels.push(
          ...models.map(m => ({
            ...m,
            provider: 'openai',
            providerName: 'OpenAI',
          }))
        );
      } catch (e) {
        console.error('OpenAI models fetch failed:', e);
      }
    }

    // Anthropic
    if (!provider || provider === 'anthropic') {
      try {
        const anthropic = new AnthropicAdapter({ apiKey: process.env.ANTHROPIC_API_KEY || 'test' });
        const models = await anthropic.getAvailableModels();
        allModels.push(
          ...models.map(m => ({
            ...m,
            provider: 'anthropic',
            providerName: 'Anthropic',
          }))
        );
      } catch (e) {
        console.error('Anthropic models fetch failed:', e);
      }
    }

    // Gemini
    if (!provider || provider === 'gemini') {
      try {
        const gemini = new GeminiAdapter({ apiKey: process.env.GOOGLE_AI_API_KEY || 'test' });
        const models = await gemini.getAvailableModels();
        allModels.push(
          ...models.map(m => ({
            ...m,
            provider: 'gemini',
            providerName: 'Google AI',
          }))
        );
      } catch (e) {
        console.error('Gemini models fetch failed:', e);
      }
    }

    // Mistral
    if (!provider || provider === 'mistral') {
      try {
        const mistral = new MistralAdapter({ apiKey: process.env.MISTRAL_API_KEY || 'test' });
        const models = await mistral.getAvailableModels();
        allModels.push(
          ...models.map(m => ({
            ...m,
            provider: 'mistral',
            providerName: 'Mistral AI',
          }))
        );
      } catch (e) {
        console.error('Mistral models fetch failed:', e);
      }
    }

    // Zhipu AI
    if (!provider || provider === 'zhipu') {
      try {
        const zhipu = new ZhipuAdapter(process.env.ZHIPU_API_KEY || 'test');
        const models = await zhipu.getAvailableModels();
        allModels.push(
          ...models.map(m => ({
            ...m,
            provider: 'zhipu',
            providerName: 'Zhipu AI (智谱AI)',
          }))
        );
      } catch (e) {
        console.error('Zhipu models fetch failed:', e);
      }
    }

    // 01.AI (Yi)
    if (!provider || provider === '01ai') {
      try {
        const yi = new YiAdapter(process.env.YI_API_KEY || 'test');
        const models = await yi.getAvailableModels();
        allModels.push(
          ...models.map(m => ({
            ...m,
            provider: '01ai',
            providerName: '01.AI (零一万物)',
          }))
        );
      } catch (e) {
        console.error('Yi models fetch failed:', e);
      }
    }

    // Sort by cost (cheapest first)
    allModels.sort((a, b) => {
      const avgCostA = (a.costPer1kIn + a.costPer1kOut) / 2;
      const avgCostB = (b.costPer1kIn + b.costPer1kOut) / 2;
      return avgCostA - avgCostB;
    });

    return NextResponse.json({
      models: allModels,
      count: allModels.length,
      providers: ['openai', 'anthropic', 'gemini', 'mistral', 'zhipu', '01ai'],
    });
  } catch (error) {
    console.error('Get models error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
