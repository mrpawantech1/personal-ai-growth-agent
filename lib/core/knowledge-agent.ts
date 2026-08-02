import { createClient } from '@/lib/infrastructure/supabase/client';
import { KnowledgeEntry, KnowledgeCategory } from '@/types';
import { logger } from '@/lib/utils/logger';

export class KnowledgeAgent {
  /**
   * Get all knowledge for a specific category
   */
  async getCategory(category: KnowledgeCategory): Promise<KnowledgeEntry[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('knowledge')
      .select()
      .eq('category', category)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('KnowledgeAgent.getCategory failed', { error });
      return [];
    }

    return data as KnowledgeEntry[];
  }

  /**
   * Get a specific knowledge entry by key
   */
  async getByKey(category: KnowledgeCategory, key: string): Promise<KnowledgeEntry | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('knowledge')
      .select()
      .eq('category', category)
      .eq('key', key)
      .single();

    if (error) return null;
    return data as KnowledgeEntry;
  }

  /**
   * Set or update a knowledge entry
   */
  async set(category: KnowledgeCategory, key: string, value: string, metadata?: Record<string, any>): Promise<void> {
    const supabase = createClient();
    const existing = await this.getByKey(category, key);

    if (existing) {
      const { error } = await supabase
        .from('knowledge')
        .update({ value, metadata, updated_at: new Date().toISOString() })
        .eq('id', existing.id);

      if (error) {
        logger.error('KnowledgeAgent.set (update) failed', { error });
      }
    } else {
      const { error } = await supabase
        .from('knowledge')
        .insert({ category, key, value, metadata });

      if (error) {
        logger.error('KnowledgeAgent.set (insert) failed', { error });
      }
    }
  }

  // ============================================
  // CONVENIENCE METHODS (Used by CEO/Content Agents)
  // ============================================

  async getBrandVoice(): Promise<string> {
    const entry = await this.getByKey('brand_voice', 'tone');
    return entry?.value || 'Authoritative, data-driven, yet accessible.';
  }

  async getTargetAudience(): Promise<string> {
    const entry = await this.getByKey('audience_persona', 'primary');
    return entry?.value || 'SaaS founders and indie hackers aged 25-45.';
  }

  async getProductFeatures(): Promise<string[]> {
    const entries = await this.getCategory('product_features');
    return entries.map(e => e.value);
  }

  async getCompetitors(): Promise<string[]> {
    const entries = await this.getCategory('competitors');
    return entries.map(e => e.value);
  }

  async getFAQ(): Promise<{ question: string; answer: string }[]> {
    const entries = await this.getCategory('faq');
    return entries.map(e => {
      try {
        return JSON.parse(e.value);
      } catch {
        return { question: e.key, answer: e.value };
      }
    });
  }

  /**
   * Semantic search across knowledge base (using pgvector)
   * Requires pgvector extension enabled in Supabase
   */
  async search(query: string, limit: number = 5): Promise<KnowledgeEntry[]> {
    // Placeholder — will implement when we set up embeddings
    const supabase = createClient();
    const { data, error } = await supabase
      .from('knowledge')
      .select()
      .textSearch('value', query)
      .limit(limit);

    if (error) {
      logger.error('KnowledgeAgent.search failed', { error });
      return [];
    }

    return data as KnowledgeEntry[];
  }
}

export const knowledgeAgent = new KnowledgeAgent();
