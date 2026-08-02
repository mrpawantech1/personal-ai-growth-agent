import { logger } from '@/lib/utils/logger';

interface LinkedInConfig {
  accessToken: string;
  personId: string;
}

export class LinkedInClient {
  private config: LinkedInConfig;
  private baseUrl = 'https://api.linkedin.com/v2';

  constructor(config: LinkedInConfig) {
    this.config = config;
  }

  async postArticle(content: string, title?: string): Promise<{ id: string }> {
    try {
      logger.info('LinkedInClient: Posting article', { length: content.length });

      const url = `${this.baseUrl}/ugcPosts`;
      const body = {
        author: `urn:li:person:${this.config.personId}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: content,
            },
            shareMediaCategory: 'NONE',
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
        },
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`LinkedIn API error: ${JSON.stringify(error)}`);
      }

      const data = await response.json();
      logger.info('LinkedInClient: Post published', { id: data.id });
      return { id: data.id };
    } catch (error) {
      logger.error('LinkedInClient: Post failed', { error });
      throw error;
    }
  }

  async getComments(postId: string): Promise<any[]> {
    // Implementation for fetching comments
    logger.warn('LinkedInClient: getComments not fully implemented');
    return [];
  }

  async reply(commentId: string, text: string): Promise<any> {
    try {
      const url = `${this.baseUrl}/comments`;
      const body = {
        actor: `urn:li:person:${this.config.personId}`,
        message: {
          text: text,
        },
        parentComment: `urn:li:comment:${commentId}`,
        object: `urn:li:comment:${commentId}`,
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`LinkedIn reply error: ${JSON.stringify(error)}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('LinkedInClient: Reply failed', { error });
      throw error;
    }
  }
}

export function createLinkedInClient(): LinkedInClient {
  return new LinkedInClient({
    accessToken: process.env.LINKEDIN_ACCESS_TOKEN!,
    personId: process.env.LINKEDIN_PERSON_ID!,
  });
}
