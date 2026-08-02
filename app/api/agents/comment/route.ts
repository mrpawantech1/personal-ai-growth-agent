import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/infrastructure/supabase/server';
import { commentAgent } from '@/lib/agents/comment-agent';
import { approvalRepo } from '@/lib/infrastructure/supabase/approval-repo';
import { logger } from '@/lib/utils/logger';
import { z } from 'zod';

// GET: Fetch comment drafts (pending approvals)
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const status = request.nextUrl.searchParams.get('status') || 'pending';
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20');

    let query = supabase
      .from('approval_queue')
      .select()
      .eq('target_type', 'reply')
      .eq('status', status)
      .order('created_at', { ascending: false })
      .limit(limit);

    const { data, error } = await query;

    if (error) {
      logger.error('Comment API: Fetch failed', { error });
      return NextResponse.json({ error: 'Failed to fetch comment drafts' }, { status: 500 });
    }

    return NextResponse.json({
      data,
      count: data.length,
    });
  } catch (error) {
    logger.error('Comment API GET error', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Generate a reply draft
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const schema = z.object({
      originalPost: z.string().min(1),
      commentText: z.string().min(1),
      platform: z.enum(['twitter', 'linkedin', 'reddit']),
      authorUsername: z.string().optional(),
      postUrl: z.string().url().optional(),
      threadContext: z.string().optional(),
    });

    const { originalPost, commentText, platform, authorUsername, postUrl, threadContext } = schema.parse(body);

    const result = await commentAgent.generateReply({
      originalPost,
      commentText,
      platform,
      authorUsername,
      postUrl,
      threadContext,
    });

    logger.info('Comment API: Reply draft generated', {
      userId: user.id,
      platform,
      approvalId: result.id,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Comment API POST error', { error });
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// PUT: Publish an approved reply
export async function PUT(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const schema = z.object({
      approvalId: z.string().uuid(),
    });

    const { approvalId } = schema.parse(body);

    // Check if item exists and is approved
    const item = await approvalRepo.findById(approvalId);
    if (!item) {
      return NextResponse.json({ error: 'Approval item not found' }, { status: 404 });
    }

    if (item.status !== 'approved') {
      return NextResponse.json({ error: 'Item is not approved' }, { status: 400 });
    }

    await commentAgent.publishReply(approvalId);

    logger.info('Comment API: Reply published', { approvalId, userId: user.id });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    logger.error('Comment API PUT error', { error });
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// DELETE: Delete a comment draft
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = request.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
    }

    await approvalRepo.delete(id);

    logger.info('Comment API: Draft deleted', { id, userId: user.id });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Comment API DELETE error', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
