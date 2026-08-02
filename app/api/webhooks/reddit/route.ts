import { NextRequest, NextResponse } from 'next/server';
import { commentAgent, CommentContext } from '@/lib/agents/comment-agent';
import { logger } from '@/lib/utils/logger';
import { z } from 'zod';

const redditWebhookSchema = z.object({
  type: z.string(),
  data: z.object({
    id: z.string(),
    name: z.string(),
    author: z.string(),
    body: z.string(),
    parent_id: z.string(),
    created_utc: z.number(),
  }),
});

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const expectedSecret = process.env.REDDIT_WEBHOOK_SECRET;
    if (expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    logger.info('Reddit webhook received', { body: JSON.stringify(body).substring(0, 200) });

    const result = redditWebhookSchema.safeParse(body);
    if (!result.success) {
      logger.warn('Reddit webhook validation failed', { errors: result.error.errors });
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const { data } = result.data;

    // Only process if it's a reply to our post/comment
    // In production, check if parent_id belongs to us
    const isReplyToUs = true; // TODO: Implement check

    if (isReplyToUs && data.body) {
      const context: CommentContext = {
        originalPost: 'Reddit post content placeholder', // TODO: Fetch from API
        commentText: data.body,
        threadContext: 'Reddit comment in our thread.',
        platform: 'reddit',
        authorUsername: `/u/${data.author}`,
        postUrl: `https://reddit.com/comments/${data.id}`,
      };

      await commentAgent.generateReply(context);
    }

    return NextResponse.json({ status: 'success' }, { status: 200 });
  } catch (error) {
    logger.error('Reddit webhook error', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
