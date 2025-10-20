import { NextRequest, NextResponse } from 'next/server';
import { getIntelligentRouter } from '@/lib/ai-router';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const requestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant', 'system', 'tool']),
      content: z.string(),
    })
  ),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().optional(),
  stream: z.boolean().optional().default(false),
  conversationId: z.string().optional(),
  userId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = requestSchema.parse(body);

    const router = getIntelligentRouter();

    // Select best model using intelligent routing
    const { adapter, model, reasoning } = await router.selectBestModel(
      {
        messages: validated.messages,
        model: validated.model,
        temperature: validated.temperature,
        maxTokens: validated.maxTokens,
      },
      {
        userId: validated.userId,
        budgetRemaining: 10, // TODO: Get from user budget
      }
    );

    console.log(`[Intelligent Router] Selected: ${model} - Reason: ${reasoning}`);

    // Non-streaming response
    if (!validated.stream) {
      const response = await adapter.complete({
        messages: validated.messages,
        model: model, // Use intelligently selected model
        temperature: validated.temperature,
        maxTokens: validated.maxTokens,
        stream: false,
        userId: validated.userId,
        conversationId: validated.conversationId,
      });

      // Store message in database if conversationId provided
      if (validated.conversationId) {
        await prisma.message.create({
          data: {
            conversationId: validated.conversationId,
            role: 'ASSISTANT',
            content: response.content,
            tokensIn: response.tokensIn,
            tokensOut: response.tokensOut,
            latencyMs: response.latencyMs,
            cost: response.cost,
          },
        });
      }

      return NextResponse.json({
        id: response.id,
        content: response.content,
        model: response.model,
        provider: adapter.name,
        routingReasoning: reasoning,
        usage: {
          promptTokens: response.tokensIn,
          completionTokens: response.tokensOut,
          totalTokens: response.tokensIn + response.tokensOut,
        },
        cost: response.cost,
        latencyMs: response.latencyMs,
        finishReason: response.finishReason,
      });
    }

    // Streaming response using SSE
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send routing info first
          const routingInfo = `data: ${JSON.stringify({
            type: 'routing',
            provider: adapter.name,
            model,
            reasoning
          })}\n\n`;
          controller.enqueue(encoder.encode(routingInfo));

          for await (const chunk of adapter.stream({
            messages: validated.messages,
            model: model, // Use intelligently selected model
            temperature: validated.temperature,
            maxTokens: validated.maxTokens,
            stream: true,
            userId: validated.userId,
            conversationId: validated.conversationId,
          })) {
            const data = `data: ${JSON.stringify(chunk)}\n\n`;
            controller.enqueue(encoder.encode(data));

            if (chunk.done) {
              controller.enqueue(encoder.encode('data: [DONE]\n\n'));
              controller.close();
            }
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: errorMessage })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat completion error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
