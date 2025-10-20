import { encoding_for_model } from 'tiktoken';

export interface ChunkOptions {
  maxTokens?: number;
  overlap?: number;
  separator?: string;
}

export interface DocumentChunk {
  content: string;
  index: number;
  tokenCount: number;
  startChar: number;
  endChar: number;
}

export class DocumentChunker {
  private encoder: any;

  constructor() {
    // Use cl100k_base encoding (GPT-4, GPT-3.5-turbo)
    this.encoder = encoding_for_model('gpt-4o');
  }

  /**
   * Chunk a document into smaller pieces with overlap
   */
  chunk(content: string, options: ChunkOptions = {}): DocumentChunk[] {
    const {
      maxTokens = 512,
      overlap = 50,
      separator = '\n\n',
    } = options;

    // First split by separator (e.g., paragraphs)
    const sections = content.split(separator).filter(s => s.trim().length > 0);

    const chunks: DocumentChunk[] = [];
    let currentChunk: string[] = [];
    let currentTokens = 0;
    let chunkIndex = 0;
    let charPosition = 0;

    for (const section of sections) {
      const sectionTokens = this.countTokens(section);

      // If single section exceeds maxTokens, split by sentences
      if (sectionTokens > maxTokens) {
        const sentences = this.splitIntoSentences(section);
        for (const sentence of sentences) {
          const sentenceTokens = this.countTokens(sentence);

          if (currentTokens + sentenceTokens > maxTokens && currentChunk.length > 0) {
            // Save current chunk
            const chunkText = currentChunk.join(' ');
            const startChar = charPosition - chunkText.length;
            chunks.push({
              content: chunkText,
              index: chunkIndex++,
              tokenCount: currentTokens,
              startChar,
              endChar: charPosition,
            });

            // Keep overlap
            const overlapText = this.getLastTokens(chunkText, overlap);
            currentChunk = [overlapText];
            currentTokens = this.countTokens(overlapText);
          }

          currentChunk.push(sentence);
          currentTokens += sentenceTokens;
          charPosition += sentence.length + 1;
        }
      } else {
        // Section fits, check if adding it exceeds maxTokens
        if (currentTokens + sectionTokens > maxTokens && currentChunk.length > 0) {
          // Save current chunk
          const chunkText = currentChunk.join(separator);
          const startChar = charPosition - chunkText.length;
          chunks.push({
            content: chunkText,
            index: chunkIndex++,
            tokenCount: currentTokens,
            startChar,
            endChar: charPosition,
          });

          // Keep overlap
          const overlapText = this.getLastTokens(chunkText, overlap);
          currentChunk = [overlapText];
          currentTokens = this.countTokens(overlapText);
        }

        currentChunk.push(section);
        currentTokens += sectionTokens;
        charPosition += section.length + separator.length;
      }
    }

    // Add remaining chunk
    if (currentChunk.length > 0) {
      const chunkText = currentChunk.join(separator);
      const startChar = charPosition - chunkText.length;
      chunks.push({
        content: chunkText,
        index: chunkIndex,
        tokenCount: currentTokens,
        startChar,
        endChar: charPosition,
      });
    }

    return chunks;
  }

  /**
   * Count tokens in text
   */
  countTokens(text: string): number {
    try {
      return this.encoder.encode(text).length;
    } catch (e) {
      // Fallback: rough estimate (1 token ≈ 4 chars)
      return Math.ceil(text.length / 4);
    }
  }

  /**
   * Split text into sentences
   */
  private splitIntoSentences(text: string): string[] {
    // Simple sentence splitter (can be improved with NLP)
    return text
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  /**
   * Get last N tokens from text
   */
  private getLastTokens(text: string, tokenCount: number): string {
    try {
      const tokens = this.encoder.encode(text);
      const lastTokens = tokens.slice(-tokenCount);
      return this.encoder.decode(lastTokens);
    } catch (e) {
      // Fallback: return last N*4 characters
      return text.slice(-(tokenCount * 4));
    }
  }

  /**
   * Clean up resources
   */
  free(): void {
    this.encoder.free();
  }
}
