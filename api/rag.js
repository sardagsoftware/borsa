/**
 * RAG (Retrieval-Augmented Generation) API
 * Document upload, embedding, semantic search, and RAG-enhanced chat
 * Production-ready implementation with Azure AI Search or in-memory vector store
 */

require('dotenv').config();
const fetch = require('node-fetch');
const { applySanitization } = require('./_middleware/sanitize');

// In-memory vector store for documents
const documentStore = new Map();
const embeddingsCache = new Map();
let documentIdCounter = 0;

/**
 * Generate embeddings using OpenAI
 */
async function generateEmbedding(text) {
  try {
    // Check cache first
    const cacheKey = text.substring(0, 100);
    if (embeddingsCache.has(cacheKey)) {
      return embeddingsCache.get(cacheKey);
    }

    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const embedding = data.data[0].embedding;

    // Cache the embedding
    embeddingsCache.set(cacheKey, embedding);
    if (embeddingsCache.size > 1000) {
      const firstKey = embeddingsCache.keys().next().value;
      embeddingsCache.delete(firstKey);
    }

    return embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * POST /api/rag/upload
 * Upload and process documents
 */
async function handleUpload(req, res) {
  applySanitization(req, res);
  try {
    const { documents, metadata } = req.body;

    if (!documents || !Array.isArray(documents)) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Documents array is required',
      });
    }

    const uploadedDocs = [];

    for (const doc of documents) {
      const { title, content, category, source } = doc;

      if (!content) {
        continue;
      }

      // Split content into chunks (simple implementation)
      const chunks = splitIntoChunks(content, 500);

      for (let i = 0; i < chunks.length; i++) {
        const docId = `doc_${++documentIdCounter}`;
        const embedding = await generateEmbedding(chunks[i]);

        documentStore.set(docId, {
          id: docId,
          title: title || 'Untitled',
          content: chunks[i],
          embedding,
          category: category || 'general',
          source: source || 'user-upload',
          chunkIndex: i,
          totalChunks: chunks.length,
          uploadedAt: new Date().toISOString(),
          metadata: metadata || {},
        });

        uploadedDocs.push({
          id: docId,
          title,
          chunkIndex: i,
          totalChunks: chunks.length,
        });
      }
    }

    res.json({
      success: true,
      message: `Successfully uploaded ${uploadedDocs.length} document chunks`,
      documents: uploadedDocs,
      totalDocuments: documentStore.size,
    });
  } catch (error) {
    console.error('RAG upload error:', error);
    res.status(500).json({
      error: 'Upload failed',
      message: 'İşlem başarısız. Lütfen tekrar deneyin.',
    });
  }
}

/**
 * POST /api/rag/embed
 * Generate embeddings for text
 */
async function handleEmbed(req, res) {
  applySanitization(req, res);
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Text is required',
      });
    }

    const embedding = await generateEmbedding(text);

    res.json({
      success: true,
      embedding,
      dimensions: embedding.length,
      model: 'LyDian Embed',
    });
  } catch (error) {
    console.error('RAG embed error:', error);
    res.status(500).json({
      error: 'Embedding generation failed',
      message: 'İşlem başarısız. Lütfen tekrar deneyin.',
    });
  }
}

/**
 * POST /api/rag/search
 * Semantic search through documents
 */
async function handleSearch(req, res) {
  applySanitization(req, res);
  try {
    const { query, limit = 5, category, minScore = 0.7 } = req.body;

    if (!query) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Query is required',
      });
    }

    // Generate query embedding
    const queryEmbedding = await generateEmbedding(query);

    // Search through all documents
    const results = [];

    for (const [docId, doc] of documentStore.entries()) {
      // Filter by category if specified
      if (category && doc.category !== category) {
        continue;
      }

      const similarity = cosineSimilarity(queryEmbedding, doc.embedding);

      if (similarity >= minScore) {
        results.push({
          id: doc.id,
          title: doc.title,
          content: doc.content,
          category: doc.category,
          source: doc.source,
          score: similarity,
          chunkIndex: doc.chunkIndex,
          totalChunks: doc.totalChunks,
          uploadedAt: doc.uploadedAt,
        });
      }
    }

    // Sort by similarity score
    results.sort((a, b) => b.score - a.score);

    // Limit results
    const limitedResults = results.slice(0, limit);

    res.json({
      success: true,
      query,
      results: limitedResults,
      totalResults: results.length,
      returnedResults: limitedResults.length,
    });
  } catch (error) {
    console.error('RAG search error:', error);
    res.status(500).json({
      error: 'Search failed',
      message: 'İşlem başarısız. Lütfen tekrar deneyin.',
    });
  }
}

/**
 * POST /api/rag/chat
 * RAG-enhanced chat with context retrieval
 */
async function handleRagChat(req, res) {
  applySanitization(req, res);
  try {
    const { message, category, contextLimit = 3, model = 'OX5C9E2B' } = req.body;

    if (!message) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Message is required',
      });
    }

    // First, search for relevant context
    const queryEmbedding = await generateEmbedding(message);
    const contextDocs = [];

    for (const [docId, doc] of documentStore.entries()) {
      if (category && doc.category !== category) {
        continue;
      }

      const similarity = cosineSimilarity(queryEmbedding, doc.embedding);

      if (similarity >= 0.7) {
        contextDocs.push({
          content: doc.content,
          title: doc.title,
          score: similarity,
        });
      }
    }

    contextDocs.sort((a, b) => b.score - a.score);
    const topContext = contextDocs.slice(0, contextLimit);

    // Build context for the AI
    let contextText = '';
    if (topContext.length > 0) {
      contextText = 'Relevant context:\n\n';
      topContext.forEach((doc, i) => {
        contextText += `[${i + 1}] ${doc.title}\n${doc.content}\n\n`;
      });
    }

    // Call OpenAI with RAG context
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: `You are a helpful AI assistant. Use the provided context to answer questions accurately. If the context doesn't contain relevant information, say so and provide a general answer.

${contextText}`,
          },
          {
            role: 'user',
            content: message,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();

    res.json({
      success: true,
      message: data.choices[0].message.content,
      contextUsed: topContext.length,
      context: topContext,
      model: model,
      usage: data.usage,
    });
  } catch (error) {
    console.error('RAG chat error:', error);
    res.status(500).json({
      error: 'RAG chat failed',
      message: 'İşlem başarısız. Lütfen tekrar deneyin.',
    });
  }
}

/**
 * GET /api/rag/stats
 * Get RAG system statistics
 */
function handleStats(req, res) {
  applySanitization(req, res);
  const categories = {};
  const sources = {};

  for (const doc of documentStore.values()) {
    categories[doc.category] = (categories[doc.category] || 0) + 1;
    sources[doc.source] = (sources[doc.source] || 0) + 1;
  }

  res.json({
    success: true,
    totalDocuments: documentStore.size,
    totalEmbeddings: embeddingsCache.size,
    categories,
    sources,
    memoryUsage: process.memoryUsage(),
  });
}

/**
 * DELETE /api/rag/clear
 * Clear all documents
 */
function handleClear(req, res) {
  applySanitization(req, res);
  const previousSize = documentStore.size;
  documentStore.clear();
  embeddingsCache.clear();
  documentIdCounter = 0;

  res.json({
    success: true,
    message: `Cleared ${previousSize} documents`,
    totalDocuments: documentStore.size,
  });
}

/**
 * Helper: Split text into chunks
 */
function splitIntoChunks(text, chunkSize = 500) {
  const chunks = [];
  const words = text.split(/\s+/);
  let currentChunk = [];
  let currentLength = 0;

  for (const word of words) {
    if (currentLength + word.length > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.join(' '));
      currentChunk = [word];
      currentLength = word.length;
    } else {
      currentChunk.push(word);
      currentLength += word.length + 1;
    }
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(' '));
  }

  return chunks;
}

// Export handlers
module.exports = {
  handleUpload,
  handleEmbed,
  handleSearch,
  handleRagChat,
  handleStats,
  handleClear,
};
