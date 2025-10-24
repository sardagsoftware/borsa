import {
  OpenAIAdapter,
  AnthropicAdapter,
  GeminiAdapter,
  MistralAdapter,
  ZhipuAdapter,
  YiAdapter,
  ZaiAdapter
} from '@ailydian/ai-adapters';
import { IntelligentRouter } from '@ailydian/ai-routing';

let router: IntelligentRouter | null = null;

export function getIntelligentRouter(): IntelligentRouter {
  if (!router) {
    router = new IntelligentRouter();

    // Register all adapters with intelligent routing
    if (process.env.OPENAI_API_KEY) {
      const openaiAdapter = new OpenAIAdapter({
        apiKey: process.env.OPENAI_API_KEY,
      });
      router.registerAdapter(openaiAdapter);
    }

    if (process.env.ANTHROPIC_API_KEY) {
      const anthropicAdapter = new AnthropicAdapter({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
      router.registerAdapter(anthropicAdapter);
    }

    if (process.env.GOOGLE_AI_API_KEY) {
      const geminiAdapter = new GeminiAdapter({
        apiKey: process.env.GOOGLE_AI_API_KEY,
      });
      router.registerAdapter(geminiAdapter);
    }

    if (process.env.MISTRAL_API_KEY) {
      const mistralAdapter = new MistralAdapter({
        apiKey: process.env.MISTRAL_API_KEY,
      });
      router.registerAdapter(mistralAdapter);
    }

    if (process.env.ZHIPU_API_KEY) {
      const zhipuAdapter = new ZhipuAdapter(process.env.ZHIPU_API_KEY);
      router.registerAdapter(zhipuAdapter);
    }

    if (process.env.Z_AI_API_KEY) {
      const zaiAdapter = new ZaiAdapter(process.env.Z_AI_API_KEY);
      router.registerAdapter(zaiAdapter);
    }

    if (process.env.YI_API_KEY) {
      const yiAdapter = new YiAdapter(process.env.YI_API_KEY);
      router.registerAdapter(yiAdapter);
    }
  }

  return router;
}
