import { db } from '../db/database';
import { LLMAdapter } from './llmAdapter';

export interface RagChunk {
  id: string;
  category: 'product' | 'policy' | 'faq' | 'promotion';
  title: string;
  text: string;
  vector?: number[];
  metadata?: Record<string, unknown>;
}

export interface RagSearchResult {
  chunk: RagChunk;
  score: number;
}

export class RagService {
  private static chunks: RagChunk[] = [];
  private static isInitialized = false;
  private static isIndexing = false;
  private static queryVectorCache = new Map<string, number[]>();

  /**
   * Computes cosine similarity between two vectors.
   */
  private static cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length || vecA.length === 0) return 0;
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dot += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : dot / denom;
  }

  /**
   * Index knowledge base once (Products, Commercial Policy, Store FAQ, Promotions)
   * Vector computations are cached in memory and never re-indexed on subsequent requests.
   */
  public static async initializeIndex(): Promise<void> {
    if (this.isInitialized || this.isIndexing) return;
    this.isIndexing = true;

    try {
      const chunksToEmbed: RagChunk[] = [];

      // 1. Index Products
      const products = db.listProducts();
      for (const p of products) {
        const variantsDesc = p.variants
          .map((v) => `${v.size} ${v.color} (${v.stockQuantity} en stock)`)
          .join(', ');
        chunksToEmbed.push({
          id: `product-${p.id}`,
          category: 'product',
          title: p.name,
          text: `Produit: ${p.name}. Catégorie: ${p.category}. Prix de base: ${p.basePriceMAD} MAD. Description: ${p.description}. Variantes: ${variantsDesc}.`,
          metadata: { productId: p.id, basePriceMAD: p.basePriceMAD },
        });
      }

      // 2. Index Commercial Policy
      const policy = db.getCommercialPolicy();
      const policySections = policy.split(/\n(?=#{1,3}\s)/).filter((s) => s.trim().length > 0);
      policySections.forEach((section, idx) => {
        const firstLine = section.split('\n')[0].replace(/^#+\s*/, '').trim();
        chunksToEmbed.push({
          id: `policy-${idx}`,
          category: 'policy',
          title: firstLine || `Politique commerciale ${idx + 1}`,
          text: section.trim(),
        });
      });

      // 3. Index Store FAQ
      const faq = db.getStoreFaq();
      const faqSections = faq.split(/\n(?=#{1,3}\s)/).filter((s) => s.trim().length > 0);
      faqSections.forEach((section, idx) => {
        const rawFirstLine = section.split('\n')[0].replace(/^#+\s*/, '').trim();
        const cleanFirstLine = rawFirstLine.replace(/^FAQ\s*[-:]?\s*/i, '');
        const title = `FAQ - ${cleanFirstLine || `Boutique ${idx + 1}`}`;
        chunksToEmbed.push({
          id: `faq-${idx}`,
          category: 'faq',
          title,
          text: section.trim(),
        });
      });

      // 4. Index Promotions
      const promotions = db.getPromotions();
      for (const promo of promotions) {
        chunksToEmbed.push({
          id: `promo-${promo.ref}`,
          category: 'promotion',
          title: `Promotion ${promo.ref} - ${promo.modele}`,
          text: `Promotion ${promo.ref}: Modèle ${promo.modele}. Prix promo: ${promo.prixPromoMAD} MAD (au lieu de ${promo.prixNormalMAD} MAD). Conditions: ${promo.condition}. Du ${promo.debut} au ${promo.fin}.`,
          metadata: { promoRef: promo.ref, prixPromoMAD: promo.prixPromoMAD },
        });
      }

      // Compute embeddings in batches using embedder-small-3
      const texts = chunksToEmbed.map((c) => c.text);
      const batchSize = 25;
      for (let i = 0; i < texts.length; i += batchSize) {
        const batchTexts = texts.slice(i, i + batchSize);
        const vectors = await LLMAdapter.getEmbeddings(batchTexts);
        if (vectors && vectors.length === batchTexts.length) {
          for (let j = 0; j < vectors.length; j++) {
            chunksToEmbed[i + j].vector = vectors[j];
          }
        }
      }

      this.chunks = chunksToEmbed;
      this.isInitialized = true;
    } catch (err) {
      console.warn('[RagService] Embeddings indexing fell back to keyword indexing:', err);
      this.isInitialized = true; // Still mark initialized to avoid infinite retries
    } finally {
      this.isIndexing = false;
    }
  }

  /**
   * Search knowledge base using semantic embeddings with fallback to keyword scoring.
   */
  public static async search(query: string, options: {
    limit?: number;
    category?: 'product' | 'policy' | 'faq' | 'promotion';
    minScore?: number;
  } = {}): Promise<RagSearchResult[]> {
    if (!this.isInitialized) {
      await this.initializeIndex();
    }

    const limit = options.limit || 3;
    const minScore = options.minScore || 0.25;
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return [];

    let filteredChunks = this.chunks;
    if (options.category) {
      filteredChunks = filteredChunks.filter((c) => c.category === options.category);
    }

    // Try semantic search with embedder-small-3
    try {
      let queryVec = this.queryVectorCache.get(trimmedQuery);
      if (!queryVec) {
        const queryVecs = await LLMAdapter.getEmbeddings([trimmedQuery]);
        if (queryVecs && queryVecs.length > 0) {
          queryVec = queryVecs[0];
          this.queryVectorCache.set(trimmedQuery, queryVec);
          // Keep query cache under 200 queries
          if (this.queryVectorCache.size > 200) {
            const firstKey = this.queryVectorCache.keys().next().value;
            if (firstKey) this.queryVectorCache.delete(firstKey);
          }
        }
      }

      if (queryVec) {
        const terms = trimmedQuery.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
        const scored: RagSearchResult[] = [];
        for (const chunk of filteredChunks) {
          if (chunk.vector && chunk.vector.length > 0) {
            const cosSim = this.cosineSimilarity(queryVec, chunk.vector);
            const lowerTitle = chunk.title.toLowerCase();
            const lowerText = chunk.text.toLowerCase();
            let kwMatches = 0;
            for (const t of terms) {
              if (lowerTitle.includes(t)) kwMatches += 2;
              else if (lowerText.includes(t)) kwMatches += 1;
            }
            const maxPossible = terms.length * 2;
            const kwRatio = maxPossible > 0 ? kwMatches / maxPossible : 0;
            const score = (cosSim * 0.3) + (kwRatio * 0.7);
            if (score >= minScore || kwMatches > 0) {
              scored.push({ chunk, score });
            }
          }
        }

        if (scored.length > 0) {
          return scored
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
        }
      }
    } catch (err) {
      console.warn('[RagService] Semantic search query failed, using keyword fallback:', err);
    }

    // Keyword fallback
    const terms = trimmedQuery.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
    const keywordScored: RagSearchResult[] = filteredChunks.map((chunk) => {
      const lower = (chunk.title + ' ' + chunk.text).toLowerCase();
      let matchCount = 0;
      for (const t of terms) {
        if (lower.includes(t)) matchCount++;
      }
      return {
        chunk,
        score: terms.length > 0 ? matchCount / terms.length : 0,
      };
    });

    return keywordScored
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
}
