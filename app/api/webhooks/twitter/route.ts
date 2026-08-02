import { NextRequest, NextResponse } from 'next/server';
import { commentAgent, CommentContext } from '@/lib/agents/comment-agent';
import { logger } from '@/lib/utils/logger';
import { z } from 'zod';

// Twitter webhook payload schema (simplified for MVP)
const twitterWebhookSchema = z.object({
  for_user_id: z.string(),
  tweet_create_events: z.array(
    z.object({
      id: z.string(),
      text: z.string(),
      author_id: z.string(),
      in_reply_to_status_id: z.string().optional(),
      referenced_tweets: z
        .array(
          z.object({
            type: z.string(),
            id: z.string(),
          })
        )
        .optional(),
      created_at: z.string(),
    })
  ),
});

export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret (security)
    const authHeader = request.headers.get('authorization');
    const expectedSecret = process.env.TWITTER_WEBHOOK_SECRET;
    if (expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    logger.info('Twitter webhook received', { body: JSON.stringify(body).substring(0, 200) });

    // Parse and validate
    const result = twitterWebhookSchema.safeParse(body);
    if (!result.success) {
      logger.warn('Twitter webhook validation failed', { errors: result.error.errors });
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const { tweet_create_events } = result.data;

    // Process each tweet
    for (const tweet of tweet_create_events) {
      // Check if this is a reply to us (we need to fetch our own tweet to get context)
      // For MVP, we'll just check if it's a reply or mention
      const isReply = tweet.in_reply_to_status_id !== undefined;
      const isMention = tweet.text.includes('@') && tweet.text.includes('@' + process.env.TWITTER_USERNAME);

      if (isReply || isMention) {
        // In production, fetch the original post text using Twitter API
        // For now, we use a placeholder
        const originalPost = 'Original post content placeholder'; // TODO: Fetch actual post

        const context: CommentContext = {
          originalPost,
          commentText: tweet.text,
          threadContext: isReply ? 'This is a reply to our tweet.' : 'This is a mention.',
          platform: 'twitter',
          authorUsername: `@user_${tweet.author_id}`,
          postUrl: `https://twitter.com/i/web/status/${tweet.id}`,
        };

        // Generate reply draft
        await commentAgent.generateReply(context);
      }
    }

    return NextResponse.json({ status: 'success' }, { status: 200 });
  } catch (error) {
    logger.error('Twitter webhook error', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Twitter webhook requires GET for CRC (Challenge-Response Check)
export async function GET(request: NextRequest) {
  const crcToken = request.nextUrl.searchParams.get('crc_token');
  if (!crcToken) {
    return NextResponse.json({ error: 'Missing crc_token' }, { status: 400 });
  }

  // In production, compute HMAC SHA-256 of crc_token using your consumer secret
  // For MVP, just echo back
  const responseToken = Buffer.from(crcToken).toString('base64');
  return NextResponse.json({ response_token: `sha256=${responseToken}` });
}
