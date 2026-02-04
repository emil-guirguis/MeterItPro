/**
 * AI-Powered Meter Insights - Embeddings Service
 * Generates and manages semantic embeddings for device metadata
 */

import { DeviceEmbedding, EmbeddingSearchResult } from './types';
import { AIServiceUnavailableError, toAIServiceError } from './errors';
import { getCache, generateEmbeddingsCacheKey } from './cache';
import { getAIServiceConfig } from './config';

/**
 * EmbeddingsService for semantic search on device metadata
 */
export class EmbeddingsService {
  private openaiApiKey: string;
  private embeddingDimensions = 1536; // OpenAI embedding dimension
  private cache = getCache();
  private cacheTtlMs: number;

  constructor() {
    const config = getAIServiceConfig();
    this.openaiApiKey = config.openaiApiKey;
    this.cacheTtlMs = 24 * 60 * 60 * 1000; // 24 hours
  }

  /**
   * Generates an embedding for text
   */
  async generateEmbedding(text: string): Promise<number[]> {
    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty');
    }

    // Check cache first
    const cacheKey = `embedding:${this.hashText(text)}`;
    const cached = this.cache.get<number[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const embedding = await this.callOpenAIEmbeddings(text);
      
      // Cache the embedding
      this.cache.set(cacheKey, embedding, this.cacheTtlMs);
      
      return embedding;
    } catch (error) {
      throw toAIServiceError(error);
    }
  }

  /**
   * Generates embeddings for device metadata
   */
  async generateDeviceEmbedding(
    deviceId: string,
    tenantId: string,
    name: string,
    type: string,
    location: string
  ): Promise<DeviceEmbedding> {
    const metadata = `${name} ${type} ${location}`.trim();
    const embedding = await this.generateEmbedding(metadata);

    return {
      id: `${deviceId}-embedding`,
      deviceId,
      tenantId,
      embedding,
      metadata,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Searches for similar embeddings
   */
  async searchSimilar(
    queryText: string,
    embeddings: DeviceEmbedding[],
    topK: number = 10,
    threshold: number = 0.5
  ): Promise<EmbeddingSearchResult[]> {
    const queryEmbedding = await this.generateEmbedding(queryText);

    // Calculate similarity scores
    const results: EmbeddingSearchResult[] = embeddings
      .map((emb) => ({
        deviceId: emb.deviceId,
        similarity: this.cosineSimilarity(queryEmbedding, emb.embedding),
        metadata: emb.metadata,
      }))
      .filter((result) => result.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);

    return results;
  }

  /**
   * Calculates cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same length');
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

  /**
   * Calls OpenAI Embeddings API
   */
  private async callOpenAIEmbeddings(text: string): Promise<number[]> {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text,
        encoding_format: 'float',
      }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new AIServiceUnavailableError('Invalid OpenAI API key');
      }
      if (response.status === 429) {
        throw new AIServiceUnavailableError('OpenAI rate limit exceeded');
      }
      if (response.status >= 500) {
        throw new AIServiceUnavailableError('OpenAI service error');
      }
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.data || !data.data[0] || !data.data[0].embedding) {
      throw new Error('Invalid embedding response from OpenAI');
    }

    return data.data[0].embedding;
  }

  /**
   * Hashes text for cache key generation
   */
  private hashText(text: string): string {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Validates embedding dimensions
   */
  validateEmbeddingDimensions(embedding: number[]): boolean {
    return embedding.length === this.embeddingDimensions;
  }

  /**
   * Gets embedding dimensions
   */
  getEmbeddingDimensions(): number {
    return this.embeddingDimensions;
  }
}
