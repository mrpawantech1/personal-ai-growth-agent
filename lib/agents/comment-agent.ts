import { generateText } from '@/lib/infrastructure/openrouter/client';
import { buildCommentReplyPrompt } from '@/lib/prompts';
import { knowledgeAgent } from '@/lib/core/knowledge-agent';
import { approvalRepo } from '@/lib/infrastructure/supabase/approval-repo';
import { logger } from '@/lib/utils/logger';
import { ApprovalItem } from '@/types';

export interface CommentContext {
  originalPost: string;
  commentText: string;
  threadContext?: string;
  platform: 'twitter' | 'linkedin' | 'reddit';
  authorUsername?: string;
  postUrl?: string;
}

export class CommentAgent {
  /**
   * Generate a thoughtful reply draft for a comment/mention
   */
  async generateReply(context: CommentContext): Promise<ApprovalItem> {
    try {
      logger.info('CommentAgent: Generating reply', {
        platform: context.platform,
        author: context.authorUsername,
      });

      // Fetch brand voice from knowledge
      const brandVoice = await knowledgeAgent.getBrandVoice();

      // Build prompt
      const prompt = buildCommentReplyPrompt(
        context.originalPost,
        context.commentText,
        context.threadContext || 'No additional thread context.',
        brandVoice
      );

      // Generate draft
      const draftContent = await generateText(prompt, {
        temperature: 0.7,
        maxTokens: 300,
      });

      // Create approval item
      const approvalItem: Omit<ApprovalItem, 'id' | 'createdAt'> = {
        targetType: 'reply',
        targetId: `reply_${Date.now()}`, // Will be replaced with actual reply ID when published
        draftContent,
        context: {
          platform: context.platform,
          originalPost: context.originalPost,
          commentText: context.commentText,
          authorUsername: context.authorUsername,
          postUrl: context.postUrl,
          threadContext: context.threadContext,
        },
        status: 'pending',
      };

      // Save to approval queue
      const saved = await approvalRepo.create(approvalItem);

      logger.info('CommentAgent: Reply draft saved for approval', {
        id: saved.id,
        platform: context.platform,
      });

      return saved;
    } catch (error) {
      logger.error('CommentAgent: Reply generation failed', { error, context });
      throw new Error(`Failed to generate reply: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate replies for multiple comments in a thread
   */
  async generateBulkReplies(
    comments: { originalPost: string; commentText: string; authorUsername?: string }[],
    platform: CommentContext['platform']
  ): Promise<ApprovalItem[]> {
    const results: ApprovalItem[] = [];

    for (const comment of comments) {
      try {
        const item = await this.generateReply({
          originalPost: comment.originalPost,
          commentText: comment.commentText,
          platform,
          authorUsername: comment.authorUsername,
        });
        results.push(item);

        // Rate limiting: small delay between generations
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        logger.warn('CommentAgent: Bulk reply failed for one comment', {
          error,
          commentText: comment.commentText.substring(0, 50),
        });
      }
    }

    logger.info('CommentAgent: Bulk replies generated', {
      total: results.length,
      platform,
    });

    return results;
  }

  /**
   * Publish an approved reply (called by approval API)
   */
  async publishReply(approvalId: string): Promise<void> {
    try {
      const item = await approvalRepo.findById(approvalId);
      if (!item) {
        throw new Error('Approval item not found');
      }

      if (item.status !== 'approved') {
        throw new Error('Item is not approved');
      }

      // Here we would call the actual social API to post the reply
      // For now, we just log it
      logger.info('CommentAgent: Publishing reply', {
        approvalId,
        content: item.draftContent.substring(0, 50),
        platform: item.context.platform,
      });

      // TODO: Implement actual social API publishing
      // const socialClient = getSocialClient(item.context.platform);
      // await socialClient.reply(item.context.originalPost, item.draftContent);

      // Update target_id with real ID after publishing
      // await approvalRepo.updateStatus(approvalId, 'published', 'system');

      logger.info('CommentAgent: Reply published successfully', { approvalId });
    } catch (error) {
      logger.error('CommentAgent: Publish reply failed', { error, approvalId });
      throw new Error(`Failed to publish reply: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const commentAgent = new CommentAgent();
