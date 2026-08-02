import { NextRequest, NextResponse } from 'next/server';
import { commentAgent, CommentContext } from '@/lib/agents/comment-agent';
import { logger } from '@/lib/utils/logger';
import { z } from 'zod';

const linkedinWebhookSchema = z.object({
  event: z.object({
    type: z.string(),
    created_at: z.number(),
    author: z.object({
      id: z.string(),
    }),
    commentary: z.string().optional(),
    object: z.object({
      id: z.string(),
      urn: z.string(),
    }),
  }),
});

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const expectedSecret = process.env.LINKEDIN_WEBHOOK_SECRET;
    if (expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    logger.info('LinkedIn webhook received', { body: JSON.stringify(body).substring(0, 200) });

    const result = linkedinWebhookSchema.safeParse(body);
    if (!result.success) {
      logger.warn('LinkedIn webhook validation failed', { errors: result.error.errors });
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const { event } = result.data;

    // Only process comments (commentary field exists)
    if (event.commentary && event.type === 'comment') {
      const context: CommentContext = {
        originalPost: 'LinkedIn post content placeholder', // TODO: Fetch from API
        commentText: event.commentary,
        threadContext: 'LinkedIn comment on our post.',
        platform: 'linkedin',
        authorUsername: `linkedin_user_${event.author.id}`,
        postUrl: `https://linkedin.com/feed/update/${event.object.urn}`,
      };

      await commentAgent.generateReply(context);
    }

    return NextResponse.json({ status: 'success' }, { status: 200 });
  } catch (error) {
    logger.error('LinkedIn webhook error', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
