import { logger } from '@/lib/utils/logger';

interface TwitterConfig {
  bearerToken: string;
  apiKey: string;
  apiSecret: string;
  accessToken?: string;
  accessSecret?: string;
}

export class TwitterClient {
  private config: TwitterConfig;
  private baseUrl = 'https://api.twitter.com/2';

  constructor(config: TwitterConfig) {
    this.config = config;
  }

  async postTweet(text: string, replyToId?: string): Promise<{ id: string; text: string }> {
    try {
      logger.info('TwitterClient: Posting tweet', { length: text.length, replyToId });

      const url = `${this.baseUrl}/tweets`;
      const body: any = { text };

      if (replyToId) {
        body.reply = { in_reply_to_tweet_id: replyToId };
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.bearerToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Twitter API error: ${JSON.stringify(error)}`);
      }

      const data = await response.json();
      logger.info('TwitterClient: Tweet posted', { id: data.data.id });
      return data.data;
    } catch (error) {
      logger.error('TwitterClient: Post failed', { error });
      throw error;
    }
  }

  async getMentions(): Promise<any[]> {
    // Implementation for fetching mentions
    // Requires user context and OAuth 1.0a
    logger.warn('TwitterClient: getMentions not fully implemented');
    return [];
  }

  async reply(tweetId: string, text: string): Promise<any> {
    return this.postTweet(text, tweetId);
  }
}

export function createTwitterClient(): TwitterClient {
  return new TwitterClient({
    bearerToken: process.env.TWITTER_BEARER_TOKEN!,
    apiKey: process.env.TWITTER_API_KEY!,
    apiSecret: process.env.TWITTER_API_SECRET!,
  });
}
