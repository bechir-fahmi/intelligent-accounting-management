import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);

  async generateQueryEmbedding(query: string): Promise<number[] | null> {
    try {
      this.logger.log(`🔍 Generating embedding for query: "${query}"`);
      
      // Create a temporary text file with the query to send to your ML API
      // Since your API expects a file, we'll create a simple text content
      const formData = new (require('form-data'))();
      
      // Create a buffer with the query text
      const queryBuffer = Buffer.from(query, 'utf-8');
      formData.append('file', queryBuffer, {
        filename: 'query.txt',
        contentType: 'text/plain'
      });

      this.logger.log('📡 Calling ML API at http://localhost:8000/classify');
      
      const response = await axios.post('http://localhost:8000/classify', formData, {
        headers: formData.getHeaders(),
        timeout: 10000, // 10 second timeout
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });

      this.logger.log('✅ ML API response received');

      if (response.data && response.data.document_embedding) {
        this.logger.log(`✅ Embedding generated successfully (${response.data.document_embedding.length} dimensions)`);
        return response.data.document_embedding;
      }

      this.logger.warn(`⚠️ No embedding returned for query: ${query}`);
      return null;
    } catch (error) {
      this.logger.error(`❌ Failed to generate embedding for query: ${query}`, error.message);
      if (error.response) {
        this.logger.error('ML API Error Response:', error.response.data);
      }
      return null;
    }
  }

  // Calculate cosine similarity between two vectors (fallback if needed)
  cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }

  // Convert array to pgvector format
  arrayToVector(embedding: number[]): string {
    return `[${embedding.join(',')}]`;
  }

  // Validate embedding dimensions
  validateEmbedding(embedding: number[]): boolean {
    return Array.isArray(embedding) && embedding.length === 384 && embedding.every(val => typeof val === 'number');
  }
}