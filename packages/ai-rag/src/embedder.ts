export interface EmbeddingRequest {
  text: string;
  model?: string;
}

export interface EmbeddingResponse {
  embedding: number[];
  model: string;
  dimensions: number;
}

export class EmbeddingService {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl: string = 'https://api.openai.com/v1') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  /**
   * Generate embeddings using OpenAI
   */
  async embed(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    const model = request.model || 'text-embedding-3-small';

    const response = await fetch(`${this.baseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        input: request.text,
        model,
      }),
    });

    if (!response.ok) {
      throw new Error(`Embedding API error: ${response.status} ${await response.text()}`);
    }

    const data: any = await response.json();
    const embedding = data.data[0].embedding;

    return {
      embedding,
      model,
      dimensions: embedding.length,
    };
  }

  /**
   * Batch embed multiple texts
   */
  async embedBatch(texts: string[], model?: string): Promise<EmbeddingResponse[]> {
    const batchSize = 100; // OpenAI limit
    const results: EmbeddingResponse[] = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);

      const response = await fetch(`${this.baseUrl}/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          input: batch,
          model: model || 'text-embedding-3-small',
        }),
      });

      if (!response.ok) {
        throw new Error(`Batch embedding error: ${response.status}`);
      }

      const data: any = await response.json();

      for (const item of data.data) {
        results.push({
          embedding: item.embedding,
          model: model || 'text-embedding-3-small',
          dimensions: item.embedding.length,
        });
      }
    }

    return results;
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  static cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have same length');
    }

    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      magnitudeA += a[i] * a[i];
      magnitudeB += b[i] * b[i];
    }

    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);

    if (magnitudeA === 0 || magnitudeB === 0) {
      return 0;
    }

    return dotProduct / (magnitudeA * magnitudeB);
  }
}
