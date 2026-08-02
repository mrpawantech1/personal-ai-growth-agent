import { NextRequest, NextResponse } from 'next/server';
import { approvalRepo } from '@/lib/infrastructure/supabase/approval-repo';
import { commentAgent } from '@/lib/agents/comment-agent';
import { logger } from '@/lib/utils/logger';
import { createServerClient } from '@/lib/infrastructure/supabase/server';
import { z } from 'zod';

// GET: List all pending approvals
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pending = await approvalRepo.getPending();

    return NextResponse.json({
      items: pending,
      count: pending.length,
    });
  } catch (error) {
    logger.error('Approval GET error', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: Approve or reject an approval item
export async function PUT(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const schema = z.object({
      id: z.string().uuid(),
      action: z.enum(['approve', 'reject']),
      feedback: z.string().optional(),
    });

    const result = schema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { id, action, feedback } = result.data;

    // Get the approval item
    const item = await approvalRepo.findById(id);
    if (!item) {
      return NextResponse.json({ error: 'Approval item not found' }, { status: 404 });
    }

    if (item.status !== 'pending') {
      return NextResponse.json({ error: 'Item already processed' }, { status: 400 });
    }

    if (action === 'approve') {
      // Update status to approved
      await approvalRepo.updateStatus(id, 'approved', user.id, feedback);

      // If it's a reply, publish it
      if (item.targetType === 'reply') {
        await commentAgent.publishReply(id);
      }

      // If it's a post, we would schedule/publish it here
      // For now, just log

      logger.info('Approval approved', { id, userId: user.id });
    } else {
      // Reject
      await approvalRepo.updateStatus(id, 'rejected', user.id, feedback);
      logger.info('Approval rejected', { id, userId: user.id });
    }

    return NextResponse.json({ status: 'success' });
  } catch (error) {
    logger.error('Approval PUT error', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Delete an approval item (optional, for rejected items cleanup)
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = request.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    await approvalRepo.delete(id);

    return NextResponse.json({ status: 'success' });
  } catch (error) {
    logger.error('Approval DELETE error', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
