// app/api/ai/chat/route.ts
// GROQ AI Chat Router - Ultra-Fast LLM Edge Function
// © 2024 Emrah Şardağ. All Rights Reserved.

export const runtime = 'edge';

import { groqChooseModel, groqChat, getWorkloadDefaults } from '@/lib/llm/groq';
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

type Workload = 'ui_suggest'|'quick_qa'|'deep_analysis'|'code'|'translate';
type ChatMessage = { role: 'system'|'user'|'assistant'|'tool'; content: string };

interface ChatRequest {
  task?: Workload;
  messages: ChatMessage[];
  stream?: boolean;
  jsonSchema?: any;
  latencyBias?: number;
  customParams?: {
    temperature?: number;
    top_p?: number;
    max_tokens?: number;
  };
}

interface ChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface ErrorResponse {
  error: string;
  detail?: string;
  code?: string;
}

/**
 * CORS Headers for borsa.ailydian.com
 */
function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': process.env.NODE_ENV === 'development' 
      ? '*' 
      : 'https://borsa.ailydian.com',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

/**
 * Rate limiting check (basic implementation)
 */
function checkRateLimit(request: NextRequest): { allowed: boolean; remaining?: number } {
  // Extract client identifier
  const clientIp = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown';
  
  // For development, allow all requests
  if (process.env.NODE_ENV === 'development') {
    return { allowed: true, remaining: 100 };
  }
  
  // TODO: Implement Redis-based rate limiting
  // For now, allow all requests in production (will be handled by Vercel/Cloudflare)
  return { allowed: true, remaining: 60 };
}

/**
 * Validate request body and extract parameters
 */
function validateRequest(body: any): {
  valid: boolean;
  data?: ChatRequest;
  error?: string;
} {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }

  const { task = 'quick_qa', messages, stream = false, jsonSchema, latencyBias = 0.7, customParams } = body;

  // Validate required fields
  if (!Array.isArray(messages) || messages.length === 0) {
    return { valid: false, error: 'Messages array is required and cannot be empty' };
  }

  // Validate task type
  if (!['ui_suggest', 'quick_qa', 'deep_analysis', 'code', 'translate'].includes(task)) {
    return { valid: false, error: `Invalid task type: ${task}` };
  }

  // Validate messages structure
  for (const msg of messages) {
    if (!msg.role || !msg.content || typeof msg.content !== 'string') {
      return { valid: false, error: 'Invalid message structure' };
    }
    if (!['system', 'user', 'assistant', 'tool'].includes(msg.role)) {
      return { valid: false, error: `Invalid message role: ${msg.role}` };
    }
  }

  return {
    valid: true,
    data: { task, messages, stream, jsonSchema, latencyBias, customParams }
  };
}

/**
 * Handle OPTIONS request for CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: getCorsHeaders()
  });
}

/**
 * Main POST handler for AI chat completions
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Check rate limiting
    const rateLimitResult = checkRateLimit(request);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'rate_limit_exceeded', detail: 'Too many requests' },
        { 
          status: 429, 
          headers: {
            ...getCorsHeaders(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.floor(Date.now() / 1000) + 60)
          }
        }
      );
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { error: 'invalid_json', detail: 'Request body must be valid JSON' },
        { status: 400, headers: getCorsHeaders() }
      );
    }

    // Validate request
    const validation = validateRequest(body);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'validation_error', detail: validation.error },
        { status: 400, headers: getCorsHeaders() }
      );
    }

    const { task, messages, stream, jsonSchema, latencyBias, customParams } = validation.data!;

    // Choose optimal model for the task
    const model = await groqChooseModel(task, latencyBias);
    const defaults = getWorkloadDefaults(task);
    const params = { ...defaults, ...customParams };

    console.log(`GROQ Chat Request: task=${task}, model=${model}, stream=${stream}`);

    // Handle streaming response
    if (stream) {
      const { res, ttft } = await groqChat({
        model,
        messages,
        jsonSchema,
        stream: true,
        ...params
      });

      const corsHeaders = getCorsHeaders();
      const responseHeaders = new Headers(res.headers);
      Object.entries(corsHeaders).forEach(([key, value]) => {
        responseHeaders.set(key, value);
      });
      responseHeaders.set('x-model-picked', model);
      responseHeaders.set('x-ttft', String(ttft));
      responseHeaders.set('x-task', task);
      responseHeaders.set('x-request-id', `groq_${startTime}`);

      return new Response(res.body, {
        status: 200,
        headers: responseHeaders
      });
    }

    // Handle non-streaming response
    const { json, ttft } = await groqChat({
      model,
      messages,
      jsonSchema,
      stream: false,
      ...params
    });

    const totalTime = Date.now() - startTime;

    return NextResponse.json(json, {
      status: 200,
      headers: {
        ...getCorsHeaders(),
        'Content-Type': 'application/json',
        'X-Model-Picked': model,
        'X-TTFT': String(ttft),
        'X-Total-Time': String(totalTime),
        'X-Task': task,
        'X-Request-ID': `groq_${startTime}`,
        'X-RateLimit-Remaining': String(rateLimitResult.remaining || 60),
      }
    });

  } catch (error: any) {
    const totalTime = Date.now() - startTime;
    
    console.error('GROQ Chat API Error:', error);

    // Handle GROQ-specific errors
    if (error.message?.includes('GROQ_')) {
      const [, status, detail] = error.message.match(/GROQ_(\d+): (.+)/) || [];
      return NextResponse.json(
        { 
          error: 'groq_api_error', 
          detail: detail || 'GROQ API error',
          code: status 
        },
        { 
          status: parseInt(status) || 502, 
          headers: {
            ...getCorsHeaders(),
            'X-Total-Time': String(totalTime),
            'X-Error': 'groq_api_error'
          }
        }
      );
    }

    // Handle schema validation errors
    if (error.message?.includes('schema_validation_error')) {
      return NextResponse.json(
        { 
          error: 'schema_validation_error', 
          detail: 'Response does not match required JSON schema' 
        },
        { 
          status: 422, 
          headers: {
            ...getCorsHeaders(),
            'X-Total-Time': String(totalTime),
            'X-Error': 'schema_validation_error'
          }
        }
      );
    }

    // Generic error handling
    return NextResponse.json(
      { 
        error: 'internal_server_error', 
        detail: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred' 
      },
      { 
        status: 500, 
        headers: {
          ...getCorsHeaders(),
          'X-Total-Time': String(totalTime),
          'X-Error': 'internal_server_error'
        }
      }
    );
  }
}

/**
 * Handle unsupported methods
 */
export async function GET() {
  return NextResponse.json(
    { error: 'method_not_allowed', detail: 'Only POST requests are supported' },
    { 
      status: 405, 
      headers: {
        ...getCorsHeaders(),
        'Allow': 'POST, OPTIONS'
      }
    }
  );
}
