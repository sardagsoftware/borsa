import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { RAGRetriever, EmbeddingService } from '@ailydian/ai-rag';
import { z } from 'zod';

const searchSchema = z.object({
  query: z.string(),
  topK: z.number().optional().default(5),
  minScore: z.number().optional().default(0.7),
  tenantId: z.string().optional(),
});

// POST /api/rag/search - Semantic search using RAG
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = searchSchema.parse(body);

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Initialize RAG retriever
    const embedder = new EmbeddingService(process.env.OPENAI_API_KEY);
    const retriever = new RAGRetriever(prisma, embedder);

    // Retrieve relevant chunks
    const results = await retriever.retrieve({
      query: validated.query,
      topK: validated.topK,
      minScore: validated.minScore,
      tenantId: validated.tenantId,
    });

    return NextResponse.json({
      query: validated.query,
      results: results.map(r => ({
        documentId: r.documentId,
        chunkId: r.chunkId,
        content: r.content,
        score: r.score,
        metadata: r.metadata,
      })),
      count: results.length,
    });
  } catch (error) {
    console.error('RAG search error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
