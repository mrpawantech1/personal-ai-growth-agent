import { logger } from '@/lib/utils/logger';

interface RedditConfig {
  clientId: string;
  clientSecret: string;
  accessToken: string;
  userAgent: string;
}

export class RedditClient {
  private config: RedditConfig;
  private baseUrl = 'https://oauth.reddit.com';

  constructor(config: RedditConfig) {
    this.config = config;
  }

  async postComment(parentId: string, text: string): Promise<{ id: string }> {
    try {
      logger.info('RedditClient: Posting comment', { length: text.length });

      const url = `${this.baseUrl}/api/comment`;
      const body = new URLSearchParams({
        thing_id: parentId,
        text: text,
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'User-Agent': this.config.userAgent,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Reddit API error: ${JSON.stringify(error)}`);
      }

      const data = await response.json();
      const commentId = data.json?.data?.things?.[0]?.data?.id || 'unknown';
      logger.info('RedditClient: Comment posted', { id: commentId });
      return { id: commentId };
    } catch (error) {
      logger.error('RedditClient: Comment failed', { error });
      throw error;
    }
  }

  async getThreadComments(threadId: string): Promise<any[]> {
    try {
      const url = `${this.baseUrl}/comments/${threadId}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'User-Agent': this.config.userAgent,
        },
      });

      if (!response.ok) {
        throw new Error(`Reddit fetch failed: ${response.status}`);
      }

      const data = await response.json();
      return data[1]?.data?.children || [];
    } catch (error) {
      logger.error('RedditClient: Get comments failed', { error });
      return [];
    }
  }

  async reply(commentId: string, text: string): Promise<any> {
    return this.postComment(`t1_${commentId}`, text);
  }
}

export function createRedditClient(): RedditClient {
  return new RedditClient({
    clientId: process.env.REDDIT_CLIENT_ID!,
    clientSecret: process.env.REDDIT_CLIENT_SECRET!,
    accessToken: process.env.REDDIT_ACCESS_TOKEN!,
    userAgent: 'PersonalAI-GrowthAgent/1.0 (by u/yourusername)',
  });
}
