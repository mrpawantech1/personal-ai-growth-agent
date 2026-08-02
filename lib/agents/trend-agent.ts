import { logger } from '@/lib/utils/logger';
import { createClient } from '@/lib/infrastructure/supabase/client';
import { eventsRepo } from '@/lib/infrastructure/supabase/repositories';
import { Trend } from '@/types';
import { generateText } from '@/lib/infrastructure/openrouter/client';
import { buildTrendAnalysisPrompt } from '@/lib/prompts';

export class TrendAgent {
  /**
   * Main method: Scan all sources and save trends
   */
  async scanAllSources(): Promise<Trend[]> {
    logger.info('TrendAgent: Starting full scan');

    try {
      // Fetch from all sources
      const [redditTrends, productHuntTrends, twitterTrends] = await Promise.all([
        this.fetchRedditTrends(),
        this.fetchProductHuntTrends(),
        this.fetchTwitterTrends(),
      ]);

      const allTrends = [...redditTrends, ...productHuntTrends, ...twitterTrends];

      // Rank trends using AI
      const rankedTrends = await this.rankTrends(allTrends);

      // Save to database
      const savedTrends = await this.saveTrends(rankedTrends);

      // Emit event
      await eventsRepo.create({
        type: 'trends:updated',
        payload: { count: savedTrends.length, sources: ['reddit', 'producthunt', 'twitter'] },
        status: 'pending',
        retryCount: 0,
      });

      logger.info('TrendAgent: Scan complete', { count: savedTrends.length });
      return savedTrends;
    } catch (error) {
      logger.error('TrendAgent: Scan failed', { error });
      throw new Error(`Trend scan failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Fetch trends from Reddit (r/SaaS, r/startups, r/entrepreneur)
   */
  private async fetchRedditTrends(): Promise<Partial<Trend>[]> {
    try {
      const subreddits = ['SaaS', 'startups', 'entrepreneur'];
      const allPosts: any[] = [];

      for (const sub of subreddits) {
        const url = `https://www.reddit.com/r/${sub}/hot.json?limit=25`;
        const response = await fetch(url, {
          headers: { 'User-Agent': 'PersonalAI-GrowthAgent/1.0' },
        });

        if (!response.ok) continue;

        const data = await response.json();
        const posts = data.data?.children || [];
        allPosts.push(...posts);
      }

      // Extract keywords from titles
      const trends = allPosts.map((post: any) => {
        const title = post.data.title || '';
        return {
          keyword: title.substring(0, 100),
          source: 'reddit' as const,
          volume: post.data.score || 0,
          sentiment: 0.5, // default
          metadata: {
            url: `https://reddit.com${post.data.permalink}`,
            author: post.data.author,
            comments: post.data.num_comments,
          },
        };
      });

      logger.info('TrendAgent: Reddit fetch complete', { count: trends.length });
      return trends.slice(0, 30);
    } catch (error) {
      logger.warn('TrendAgent: Reddit fetch failed', { error });
      return [];
    }
  }

  /**
   * Fetch trends from Product Hunt (via unofficial RSS/API)
   * For MVP, we use a mock/static list, but we'll make it extensible
   */
  private async fetchProductHuntTrends(): Promise<Partial<Trend>[]> {
    try {
      // Using a free RSS to JSON proxy for Product Hunt
      const url = 'https://api.rss2json.com/v1/api.json?rss_url=https://www.producthunt.com/feed';
      const response = await fetch(url);

      if (!response.ok) {
        logger.warn('Product Hunt API failed, using mock data');
        return this.getMockProductHuntTrends();
      }

      const data = await response.json();
      const items = data.items || [];

      return items.slice(0, 10).map((item: any) => ({
        keyword: item.title || 'Product Hunt Product',
        source: 'producthunt' as const,
        volume: 100 + Math.floor(Math.random() * 500),
        sentiment: 0.7,
        metadata: {
          url: item.link,
          description: item.description?.substring(0, 200) || '',
        },
      }));
    } catch (error) {
      logger.warn('TrendAgent: Product Hunt fetch failed, using mock', { error });
      return this.getMockProductHuntTrends();
    }
  }

  private getMockProductHuntTrends(): Partial<Trend>[] {
    return [
      { keyword: 'AI-Powered Analytics Dashboard', source: 'producthunt' as const, volume: 450, sentiment: 0.8 },
      { keyword: 'No-Code Automation Platform', source: 'producthunt' as const, volume: 380, sentiment: 0.75 },
      { keyword: 'Remote Team Collaboration Tool', source: 'producthunt' as const, volume: 290, sentiment: 0.7 },
    ];
  }

  /**
   * Fetch trends from Twitter (using trending topics)
   * Since Twitter API v2 requires paid tier for trending, we use mock data
   */
  private async fetchTwitterTrends(): Promise<Partial<Trend>[]> {
    // In production, use Twitter API v2: /2/trends/place
    // For MVP, return mock data
    return [
      { keyword: '#AIinSaaS', source: 'twitter' as const, volume: 28400, sentiment: 0.82 },
      { keyword: '#GrowthHacking', source: 'twitter' as const, volume: 15300, sentiment: 0.58 },
      { keyword: '#IndieHackers', source: 'twitter' as const, volume: 9300, sentiment: 0.68 },
      { keyword: '#NoCode', source: 'twitter' as const, volume: 12000, sentiment: 0.72 },
      { keyword: '#SaaSFounders', source: 'twitter' as const, volume: 8700, sentiment: 0.65 },
    ];
  }

  /**
   * Rank trends using AI/LLM
   */
  private async rankTrends(rawTrends: Partial<Trend>[]): Promise<Partial<Trend>[]> {
    if (rawTrends.length === 0) return [];

    try {
      // Prepare data for AI
      const trendData = rawTrends.map(t => ({
        keyword: t.keyword,
        source: t.source,
        volume: t.volume || 0,
      }));

      const brandContext = 'SaaS growth marketing company targeting founders and indie hackers';
      const prompt = buildTrendAnalysisPrompt(trendData as any, brandContext);

      const response = await generateText(prompt, {
        temperature: 0.5,
        maxTokens: 1000,
      });

      // Parse AI response
      const ranked = JSON.parse(response) as Array<{
        keyword: string;
        score: number;
        reasoning: string;
        angle: string;
      }>;

      // Map scores back to trends
      const scoredTrends = rawTrends.map(t => {
        const match = ranked.find(r => r.keyword === t.keyword);
        return {
          ...t,
          opportunity_score: match?.score || Math.random() * 60 + 20,
          metadata: {
            ...t.metadata,
            reasoning: match?.reasoning || 'No specific reasoning provided',
            angle: match?.angle || 'General topic',
          },
        };
      });

      // Sort by opportunity score (highest first)
      scoredTrends.sort((a, b) => (b.opportunity_score || 0) - (a.opportunity_score || 0));

      return scoredTrends;
    } catch (error) {
      logger.warn('TrendAgent: AI ranking failed, using heuristic ranking', { error });

      // Fallback: heuristic ranking based on volume
      return rawTrends
        .map(t => ({
          ...t,
          opportunity_score: Math.min((t.volume || 0) / 300, 95),
        }))
        .sort((a, b) => (b.opportunity_score || 0) - (a.opportunity_score || 0));
    }
  }

  /**
   * Save trends to database (avoid duplicates by checking keyword and source)
   */
  private async saveTrends(trends: Partial<Trend>[]): Promise<Trend[]> {
    const supabase = createClient();
    const saved: Trend[] = [];

    for (const trend of trends) {
      if (!trend.keyword || !trend.source) continue;

      // Check for existing trend in last 24 hours
      const { data: existing } = await supabase
        .from('trends')
        .select()
        .eq('keyword', trend.keyword)
        .eq('source', trend.source)
        .gte('detected_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .limit(1);

      if (existing && existing.length > 0) {
        // Update existing trend
        const { data, error } = await supabase
          .from('trends')
          .update({
            volume: trend.volume || 0,
            sentiment: trend.sentiment || 0.5,
            opportunity_score: trend.opportunity_score || 0,
            metadata: trend.metadata || {},
          })
          .eq('id', existing[0].id)
          .select()
          .single();

        if (!error && data) {
          saved.push(data as Trend);
        }
      } else {
        // Insert new trend
        const { data, error } = await supabase
          .from('trends')
          .insert({
            keyword: trend.keyword,
            source: trend.source,
            volume: trend.volume || 0,
            sentiment: trend.sentiment || 0.5,
            opportunity_score: trend.opportunity_score || 0,
            metadata: trend.metadata || {},
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          })
          .select()
          .single();

        if (!error && data) {
          saved.push(data as Trend);
        }
      }
    }

    return saved;
  }

  /**
   * Get top trends from database
   */
  async getTopTrends(limit: number = 10): Promise<Trend[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('trends')
      .select()
      .order('opportunity_score', { ascending: false })
      .limit(limit)
      .gt('expires_at', new Date().toISOString());

    if (error) {
      logger.error('TrendAgent: Get top trends failed', { error });
      return [];
    }

    return data as Trend[];
  }
}

// Export singleton
export const trendAgent = new TrendAgent();
