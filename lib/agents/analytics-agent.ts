import { analyticsRepo, postsRepo } from '@/lib/infrastructure/supabase/repositories';
import { AnalyticsDaily, Post, Platform } from '@/types';
import { logger } from '@/lib/utils/logger';
import { generateText } from '@/lib/infrastructure/openrouter/client';
import { eventsRepo } from '@/lib/infrastructure/supabase/repositories';

export class AnalyticsAgent {
  /**
   * Aggregate daily analytics from posts
   */
  async aggregateDaily(date: Date): Promise<AnalyticsDaily> {
    try {
      logger.info('AnalyticsAgent: Aggregating daily analytics', { date });

      // Get all posts for the day
      const posts = await postsRepo.findByDateRange(
        new Date(date.setHours(0, 0, 0, 0)),
        new Date(date.setHours(23, 59, 59, 999))
      );

      // Group by platform
      const grouped = this.groupByPlatform(posts);

      // Calculate metrics per platform
      const results: AnalyticsDaily[] = [];
      for (const [platform, platformPosts] of Object.entries(grouped)) {
        const metrics = this.calculateMetrics(platformPosts);
        const bestTime = this.findBestTime(platformPosts);

        // Generate AI summary
        const summary = await this.generateInsight(platform as Platform, metrics, platformPosts);

        const entry: Omit<AnalyticsDaily, 'id' | 'createdAt'> = {
          date,
          platform: platform as Platform,
          totalPosts: platformPosts.length,
          totalEngagement: metrics.totalEngagement,
          avgEngagement: metrics.avgEngagement,
          bestTime: bestTime || 'Unknown',
          topPerforming: metrics.topPerforming,
          summary,
        };

        const saved = await analyticsRepo.saveDaily(entry);
        results.push(saved);
      }

      // Emit event
      await eventsRepo.create({
        type: 'analytics:aggregated',
        payload: { date: date.toISOString(), results },
        status: 'pending',
        retryCount: 0,
      });

      logger.info('AnalyticsAgent: Aggregation complete', { platformCount: results.length });

      return results[0] || this.emptyAnalytics(date);
    } catch (error) {
      logger.error('AnalyticsAgent: Aggregation failed', { error });
      throw new Error(`Analytics aggregation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private groupByPlatform(posts: Post[]): Record<string, Post[]> {
    return posts.reduce((acc, post) => {
      if (!acc[post.platform]) acc[post.platform] = [];
      acc[post.platform].push(post);
      return acc;
    }, {} as Record<string, Post[]>);
  }

  private calculateMetrics(posts: Post[]) {
    let totalEngagement = 0;
    let topPerforming: string[] = [];
    let maxEngagement = 0;

    posts.forEach(post => {
      const eng = post.performance?.likes || 0 + post.performance?.shares || 0 + post.performance?.comments || 0;
      totalEngagement += eng;
      if (eng > maxEngagement) {
        maxEngagement = eng;
        topPerforming = [post.id];
      } else if (eng === maxEngagement && eng > 0) {
        topPerforming.push(post.id);
      }
    });

    return {
      totalEngagement,
      avgEngagement: posts.length > 0 ? totalEngagement / posts.length : 0,
      topPerforming: topPerforming.slice(0, 5),
    };
  }

  private findBestTime(posts: Post[]): string | null {
    // Group by hour
    const hours: Record<number, { count: number; engagement: number }> = {};
    posts.forEach(post => {
      if (!post.publishedAt) return;
      const hour = new Date(post.publishedAt).getHours();
      if (!hours[hour]) hours[hour] = { count: 0, engagement: 0 };
      hours[hour].count++;
      hours[hour].engagement += post.performance?.likes || 0 + post.performance?.shares || 0 + post.performance?.comments || 0;
    });

    // Find hour with best engagement per post
    let bestHour: number | null = null;
    let bestScore = 0;
    for (const [hour, data] of Object.entries(hours)) {
      const score = data.count > 0 ? data.engagement / data.count : 0;
      if (score > bestScore) {
        bestScore = score;
        bestHour = parseInt(hour);
      }
    }

    return bestHour !== null ? `${String(bestHour).padStart(2, '0')}:00` : null;
  }

  private async generateInsight(
    platform: Platform,
    metrics: { totalEngagement: number; avgEngagement: number; topPerforming: string[] },
    posts: Post[]
  ): Promise<string> {
    if (posts.length === 0) {
      return `No posts on ${platform} today. Try posting to increase engagement.`;
    }

    try {
      const prompt = `
Analyze this ${platform} performance data and provide a 1-2 sentence actionable insight:

Posts: ${posts.length}
Total Engagement: ${metrics.totalEngagement}
Average Engagement: ${metrics.avgEngagement.toFixed(2)}
Top Performing Post ID: ${metrics.topPerforming[0] || 'None'}

Insight should be specific, actionable, and mention what to do differently.
`;

      const insight = await generateText(prompt, {
        temperature: 0.5,
        maxTokens: 100,
      });

      return insight.trim();
    } catch (error) {
      logger.warn('AnalyticsAgent: Insight generation failed', { error });
      return `Posted ${posts.length} times on ${platform} with avg engagement ${metrics.avgEngagement.toFixed(2)}.`;
    }
  }

  private emptyAnalytics(date: Date): AnalyticsDaily {
    return {
      id: crypto.randomUUID(),
      date,
      platform: 'twitter',
      totalPosts: 0,
      totalEngagement: 0,
      avgEngagement: 0,
      bestTime: 'Unknown',
      topPerforming: [],
      summary: 'No data available for this date.',
    };
  }

  /**
   * Get recommendations for improvement
   */
  async getRecommendations(days: number = 7): Promise<string[]> {
    const analytics = await analyticsRepo.getLastNDays(days);
    if (analytics.length === 0) return ['Start posting to get analytics data.'];

    const prompt = `
Based on this ${days}-day analytics data, give 3 specific recommendations to improve engagement:

${analytics.map(a => `${a.date}: ${a.totalPosts} posts, avg engagement ${a.avgEngagement}`).join('\n')}

Return as JSON array of strings.
`;

    try {
      const response = await generateText(prompt, {
        temperature: 0.6,
        maxTokens: 300,
      });
      return JSON.parse(response);
    } catch (error) {
      return ['Post more consistently.', 'Experiment with different posting times.', 'Engage with your audience in comments.'];
    }
  }
}

export const analyticsAgent = new AnalyticsAgent();
