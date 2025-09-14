// lib/llm/groq.ts
// GROQ Ultra-Fast LLM Router & AI Model Management
// © 2024 Emrah Şardağ. All Rights Reserved.

type ChatMsg = { role:'system'|'user'|'assistant'|'tool'; content:string };
type Workload = 'ui_suggest'|'quick_qa'|'deep_analysis'|'code'|'translate';

export type GroqModel = { 
  id: string; 
  family: 'llama3.1'|'mixtral'|'gemma2'|'qwen'; 
  size: '8b'|'9b'|'70b'|'8x7b'; 
  contextWindow?: number;
  tokensPerSecond?: number;
};

// Model preference matrix based on workload types
const PREFERENCES: Record<Workload, GroqModel[]> = {
  ui_suggest: [
    {id:'llama-3.1-8b-instruct', family:'llama3.1', size:'8b', contextWindow: 131072, tokensPerSecond: 750},
    {id:'gemma2-9b-it', family:'gemma2', size:'9b', contextWindow: 8192, tokensPerSecond: 600}
  ],
  quick_qa: [
    {id:'llama-3.1-8b-instruct', family:'llama3.1', size:'8b', contextWindow: 131072, tokensPerSecond: 750},
    {id:'mixtral-8x7b-32768', family:'mixtral', size:'8x7b', contextWindow: 32768, tokensPerSecond: 500}
  ],
  deep_analysis: [
    {id:'llama-3.1-70b-versatile', family:'llama3.1', size:'70b', contextWindow: 131072, tokensPerSecond: 250},
    {id:'mixtral-8x7b-32768', family:'mixtral', size:'8x7b', contextWindow: 32768, tokensPerSecond: 500}
  ],
  code: [
    {id:'llama-3.1-70b-versatile', family:'llama3.1', size:'70b', contextWindow: 131072, tokensPerSecond: 250}
  ],
  translate: [
    {id:'llama-3.1-8b-instruct', family:'llama3.1', size:'8b', contextWindow: 131072, tokensPerSecond: 750}
  ],
};

const GROQ_BASE = 'https://api.groq.com/openai/v1';

// Cache for model availability (60 second TTL)
let modelCache: { models: string[]; timestamp: number } | null = null;
const CACHE_TTL = 60000; // 60 seconds

/**
 * Fetch available models from GROQ API with caching
 */
export async function groqListModels(): Promise<string[]> {
  // Check cache first
  if (modelCache && (Date.now() - modelCache.timestamp) < CACHE_TTL) {
    return modelCache.models;
  }

  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.warn('GROQ_API_KEY not found in environment variables');
      return [];
    }

    const response = await fetch(`${GROQ_BASE}/models`, {
      headers: { 
        'authorization': `Bearer ${apiKey}`, 
        'content-type': 'application/json' 
      },
      // Next.js Edge runtime compatible caching
      // @ts-ignore
      next: { revalidate: 60 }
    });

    if (!response.ok) {
      console.error(`GROQ API error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const models = (data?.data || []).map((m: any) => m.id);
    
    // Update cache
    modelCache = { models, timestamp: Date.now() };
    
    return models;
  } catch (error) {
    console.error('Failed to fetch GROQ models:', error);
    return [];
  }
}

/**
 * Choose optimal model based on workload and latency requirements
 */
export async function groqChooseModel(task: Workload, latencyBias = 0.7): Promise<string> {
  const preferences = PREFERENCES[task] || PREFERENCES.ui_suggest;
  const liveModels = new Set(await groqListModels());
  
  // Apply latency bias to model ordering
  const orderedModels = latencyBias > 0.6 ? preferences : preferences.slice().reverse();
  
  // Find first available model
  const selectedModel = orderedModels.find(model => {
    return liveModels.size ? liveModels.has(model.id) : true;
  }) || preferences[0];
  
  console.log(`Selected model for ${task}: ${selectedModel.id} (latency bias: ${latencyBias})`);
  
  return selectedModel.id;
}

/**
 * Call GROQ Chat Completions API with comprehensive error handling
 */
export async function groqChat(opts: {
  model: string; 
  messages: ChatMsg[]; 
  temperature?: number; 
  top_p?: number;
  max_tokens?: number;
  jsonSchema?: any; 
  stream?: boolean;
}) {
  const { 
    model, 
    messages, 
    temperature = 0.2, 
    top_p = 0.9, 
    max_tokens = 1024,
    jsonSchema, 
    stream = false 
  } = opts;

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY not configured');
  }

  const body: any = { 
    model, 
    messages, 
    temperature, 
    top_p, 
    max_tokens,
    stream 
  };

  // Add JSON Schema if provided
  if (jsonSchema) {
    body.response_format = { 
      type: 'json_object',
      // Alternative: structured output with schema
      // json_schema: { name: 'schema', schema: jsonSchema } 
    };
    
    // Add schema instruction to system message
    const schemaInstruction = `You must respond with valid JSON that follows this schema: ${JSON.stringify(jsonSchema)}`;
    if (messages[0]?.role === 'system') {
      messages[0].content += `\n\n${schemaInstruction}`;
    } else {
      messages.unshift({ role: 'system', content: schemaInstruction });
    }
  }

  const startTime = Date.now();
  
  try {
    const response = await fetch(`${GROQ_BASE}/chat/completions`, {
      method: 'POST',
      headers: { 
        'authorization': `Bearer ${apiKey}`, 
        'content-type': 'application/json' 
      },
      body: JSON.stringify(body)
    });

    const ttft = Date.now() - startTime; // Time to First Token

    if (stream) {
      return { res: response, ttft };
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GROQ_${response.status}: ${errorText}`);
    }

    const data = await response.json();
    
    // Validate JSON response if schema provided
    if (jsonSchema && data.choices?.[0]?.message?.content) {
      try {
        JSON.parse(data.choices[0].message.content);
      } catch (parseError) {
        console.error('Invalid JSON response from GROQ:', data.choices[0].message.content);
        throw new Error('schema_validation_error: Response is not valid JSON');
      }
    }

    return { json: data, ttft };
    
  } catch (error) {
    const ttft = Date.now() - startTime;
    console.error('GROQ Chat API error:', error);
    throw { error, ttft };
  }
}

/**
 * Get workload-specific default parameters
 */
export function getWorkloadDefaults(task: Workload): {
  temperature: number;
  top_p: number; 
  max_tokens: number;
} {
  const defaults = {
    ui_suggest: { temperature: 0.2, top_p: 0.9, max_tokens: 512 },
    quick_qa: { temperature: 0.2, top_p: 0.9, max_tokens: 1024 },
    deep_analysis: { temperature: 0.2, top_p: 0.8, max_tokens: 2048 },
    code: { temperature: 0.1, top_p: 0.8, max_tokens: 2048 },
    translate: { temperature: 0.1, top_p: 1.0, max_tokens: 1024 },
  };

  return defaults[task] || defaults.quick_qa;
}

/**
 * Create optimized chat request for workload type
 */
export async function groqOptimizedChat(
  task: Workload,
  messages: ChatMsg[],
  options: {
    jsonSchema?: any;
    stream?: boolean;
    latencyBias?: number;
    customParams?: Partial<{ temperature: number; top_p: number; max_tokens: number }>;
  } = {}
) {
  const { jsonSchema, stream = false, latencyBias = 0.7, customParams = {} } = options;
  
  const model = await groqChooseModel(task, latencyBias);
  const defaults = getWorkloadDefaults(task);
  const params = { ...defaults, ...customParams };
  
  return groqChat({
    model,
    messages,
    jsonSchema,
    stream,
    ...params
  });
}

/**
 * Health check for GROQ service
 */
export async function groqHealthCheck(): Promise<{
  status: 'healthy' | 'degraded' | 'down';
  latency: number;
  availableModels: number;
  details?: string;
}> {
  const startTime = Date.now();
  
  try {
    const models = await groqListModels();
    const latency = Date.now() - startTime;
    
    if (models.length === 0) {
      return {
        status: 'down',
        latency,
        availableModels: 0,
        details: 'No models available'
      };
    }
    
    return {
      status: latency > 5000 ? 'degraded' : 'healthy',
      latency,
      availableModels: models.length
    };
    
  } catch (error) {
    return {
      status: 'down',
      latency: Date.now() - startTime,
      availableModels: 0,
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export default {
  listModels: groqListModels,
  chooseModel: groqChooseModel,
  chat: groqChat,
  optimizedChat: groqOptimizedChat,
  healthCheck: groqHealthCheck,
  getWorkloadDefaults
};
