import { generateText } from '@/lib/infrastructure/openrouter/client';
import { buildContentPrompt, PromptContext } from '@/lib/prompts';
import { ContentDraft, Platform } from '@/types';
import { logger } from '@/lib/utils/logger';

// Temporary Knowledge Agent interface until we implement it fully
// This will be replaced with actual Knowledge Agent later
interface IKnowledgeAgent {
  getBrandVoice(): Promise<string>;
  getTargetAudience(): Promise<string>;
  getProductFeatures(): Promise<string[]>;
}

class KnowledgeAgentMock implements IKnowledgeAgent {
  async getBrandVoice(): Promise<string> {
    return 'Authoritative, data-driven, yet accessible. Speak like a trusted advisor who simplifies complex topics.';
  }
  async getTargetAudience(): Promise<string> {
    return 'SaaS founders, indie hackers, and marketing professionals aged 25-45 who are tech-savvy and growth-oriented.';
  }
  async getProductFeatures(): Promise<string[]> {
    return ['AI-powered automation', 'Multi-platform content scheduling', 'Real-time analytics'];
  }
}

export class ContentAgent {
  private knowledgeAgent: IKnowledgeAgent;

  constructor(knowledgeAgent?: IKnowledgeAgent) {
    this.knowledgeAgent = knowledgeAgent || new KnowledgeAgentMock();
  }

  /**
   * Generate a content draft for a specific platform
   */
  async generateDraft(
    topic: string,
    platform: Platform,
    options?: {
      tone?: 'professional' | 'casual' | 'inspirational' | 'educational' | 'funny';
      additionalContext?: string;
    }
  ): Promise<ContentDraft> {
    try {
      logger.info(`ContentAgent: Generating draft for platform=${platform}, topic="${topic}"`);

      // Fetch knowledge
      const [brandVoice, targetAudience, productFeatures] = await Promise.all([
        this.knowledgeAgent.getBrandVoice(),
        this.knowledgeAgent.getTargetAudience(),
        this.knowledgeAgent.getProductFeatures(),
      ]);

      // Build prompt
      const context: PromptContext = {
        topic,
        platform,
        brandVoice,
        targetAudience,
        productFeatures,
        tone: options?.tone || 'educational',
        additionalContext: options?.additionalContext,
      };

      const prompt = buildContentPrompt(context);

      // Generate content
      const rawContent = await generateText(prompt, {
        temperature: 0.8,
        maxTokens: platform === 'twitter' ? 400 : 2000,
      });

      // Create draft object
      const draft: ContentDraft = {
        id: crypto.randomUUID(),
        platform,
        rawContent,
        variants: [], // Could generate alternatives in future
        approved: false,
        createdAt: new Date(),
      };

      logger.info(`ContentAgent: Draft generated successfully. Length=${rawContent.length}`);

      return draft;
    } catch (error) {
      logger.error('ContentAgent: Draft generation failed', { error, topic, platform });
      throw new Error(`Failed to generate draft: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate multiple variations of the same topic
   */
  async generateVariations(
    topic: string,
    platform: Platform,
    count: number = 3
  ): Promise<ContentDraft[]> {
    const drafts: ContentDraft[] = [];

    for (let i = 0; i < count; i++) {
      const draft = await this.generateDraft(topic, platform, {
        tone: i === 0 ? 'professional' : i === 1 ? 'casual' : 'inspirational',
        additionalContext: `Variation ${i + 1} of ${count}: Try a different angle or hook.`,
      });
      drafts.push(draft);
    }

    return drafts;
  }

  /**
   * Generate a Twitter thread (multiple tweets)
   */
  async generateTwitterThread(
    topic: string,
    numberOfTweets: number = 5
  ): Promise<ContentDraft> {
    const draft = await this.generateDraft(topic, 'twitter', {
      additionalContext: `This should be a thread of ${numberOfTweets} tweets. Each tweet should be separated by "---". The first tweet should hook the reader, and the last should include a call-to-action.`,
    });

    return draft;
  }

  /**
   * Generate a LinkedIn article (long-form)
   */
  async generateLinkedInArticle(topic: string): Promise<ContentDraft> {
    const draft = await this.generateDraft(topic, 'linkedin', {
      tone: 'professional',
      additionalContext: 'This is a long-form LinkedIn article (300-500 words). Include a compelling headline, subheadings, and a strong conclusion.',
    });

    return draft;
  }
}

// Export singleton instance
export const contentAgent = new ContentAgent();
