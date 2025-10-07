import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DocumentChunker, EmbeddingService } from '@ailydian/ai-rag';
import { z } from 'zod';

const uploadSchema = z.object({
  title: z.string(),
  content: z.string(),
  tenantId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

// POST /api/documents - Upload and process document
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = uploadSchema.parse(body);

    // 1. Create document
    const document = await prisma.document.create({
      data: {
        title: validated.title,
        content: validated.content,
        tenantId: validated.tenantId,
        metadata: validated.metadata as any,
      },
    });

    // 2. Chunk document
    const chunker = new DocumentChunker();
    const chunks = chunker.chunk(validated.content, {
      maxTokens: 512,
      overlap: 50,
    });

    // 3. Create chunks in database
    const chunkRecords = await Promise.all(
      chunks.map(chunk =>
        prisma.documentChunk.create({
          data: {
            documentId: document.id,
            content: chunk.content,
            chunkIndex: chunk.index,
          },
        })
      )
    );

    // 4. Generate embeddings
    if (process.env.OPENAI_API_KEY) {
      const embedder = new EmbeddingService(process.env.OPENAI_API_KEY);

      const embeddings = await embedder.embedBatch(
        chunks.map(c => c.content),
        'text-embedding-3-small'
      );

      // 5. Store embeddings
      await Promise.all(
        chunkRecords.map((chunk, i) =>
          prisma.$executeRaw`
            INSERT INTO "ChunkEmbedding" (id, "chunkId", embedding, model, "createdAt")
            VALUES (
              gen_random_uuid(),
              ${chunk.id},
              ${JSON.stringify(embeddings[i].embedding)}::vector,
              ${embeddings[i].model},
              NOW()
            )
          `
        )
      );
    }

    chunker.free();

    return NextResponse.json({
      document: {
        id: document.id,
        title: document.title,
        chunks: chunks.length,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Document upload error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/documents - List documents
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId');

    const documents = await prisma.document.findMany({
      where: tenantId ? { tenantId } : {},
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        _count: {
          select: { chunks: true },
        },
      },
    });

    return NextResponse.json({ documents });
  } catch (error) {
    console.error('List documents error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
