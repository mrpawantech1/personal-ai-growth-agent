import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/infrastructure/supabase/server';
import { logger } from '@/lib/utils/logger';

// GET: Fetch notifications
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50');
    const read = request.nextUrl.searchParams.get('read');

    let query = supabase
      .from('notifications')
      .select()
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (read === 'true') {
      query = query.eq('read', true);
    } else if (read === 'false') {
      query = query.eq('read', false);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Notifications API: Fetch failed', { error });
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }

    const unreadCount = data?.filter(n => !n.read).length || 0;

    return NextResponse.json({
      data: data || [],
      count: data?.length || 0,
      unreadCount,
    });
  } catch (error) {
    logger.error('Notifications API GET error', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create a notification
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const schema = z.object({
      type: z.enum(['trend', 'approval', 'plan', 'analytics', 'content', 'system']),
      title: z.string().min(1),
      description: z.string().min(1),
      action: z.string().optional(),
      link: z.string().optional(),
    });

    const { type, title, description, action, link } = schema.parse(body);

    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: user.id,
        type,
        title,
        description,
        action,
        link,
        read: false,
      })
      .select()
      .single();

    if (error) {
      logger.error('Notifications API: Create failed', { error });
      return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    logger.error('Notifications API POST error', { error });
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// PUT: Mark notification as read (or mark all read)
export async function PUT(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const schema = z.object({
      id: z.string().uuid().optional(),
      markAll: z.boolean().optional(),
    });

    const { id, markAll } = schema.parse(body);

    if (markAll) {
      // Mark all as read
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) {
        logger.error('Notifications API: Mark all read failed', { error });
        return NextResponse.json({ error: 'Failed to mark all as read' }, { status: 500 });
      }

      return NextResponse.json({ success: true, markedAll: true });
    }

    if (!id) {
      return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
    }

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      logger.error('Notifications API: Mark read failed', { error });
      return NextResponse.json({ error: 'Failed to mark as read' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Notifications API PUT error', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Delete a notification (or clear all)
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = request.nextUrl.searchParams.get('id');
    const clearAll = request.nextUrl.searchParams.get('clearAll') === 'true';

    if (clearAll) {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        logger.error('Notifications API: Clear all failed', { error });
        return NextResponse.json({ error: 'Failed to clear notifications' }, { status: 500 });
      }

      return NextResponse.json({ success: true, clearedAll: true });
    }

    if (!id) {
      return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
    }

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      logger.error('Notifications API: Delete failed', { error });
      return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Notifications API DELETE error', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Import zod
import { z } from 'zod';
