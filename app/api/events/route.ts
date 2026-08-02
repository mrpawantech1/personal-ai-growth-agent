import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/infrastructure/supabase/server';
import { eventsRepo } from '@/lib/infrastructure/supabase/repositories';
import { logger } from '@/lib/utils/logger';
import { z } from 'zod';
import { EventType } from '@/types';

// GET: Fetch events (pending or by type)
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const type = request.nextUrl.searchParams.get('type') as EventType | null;
    const status = request.nextUrl.searchParams.get('status') || 'pending';
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '10');

    let query = supabase
      .from('events')
      .select()
      .eq('status', status)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Events API: Fetch failed', { error });
      return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
    }

    return NextResponse.json({
      data,
      count: data.length,
    });
  } catch (error) {
    logger.error('Events API GET error', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create a new event
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const schema = z.object({
      type: z.enum([
        'ceo:decision',
        'plan:create',
        'schedule:ready',
        'draft:ready',
        'trends:updated',
        'analytics:aggregated',
        'content:published',
        'comment:drafted',
      ]),
      payload: z.record(z.any()),
    });

    const { type, payload } = schema.parse(body);

    const event = await eventsRepo.create({
      type,
      payload,
      status: 'pending',
      retryCount: 0,
    });

    logger.info('Events API: Event created', { type, id: event.id });

    return NextResponse.json({
      success: true,
      data: event,
    });
  } catch (error) {
    logger.error('Events API POST error', { error });
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// PUT: Update event status (mark as processing/completed/failed)
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
      status: z.enum(['pending', 'processing', 'completed', 'failed']),
    });

    const { id, status } = schema.parse(body);

    await eventsRepo.updateStatus(id, status);

    logger.info('Events API: Event status updated', { id, status });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Events API PUT error', { error });
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// DELETE: Delete an event (cleanup)
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

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);

    if (error) {
      logger.error('Events API: Delete failed', { error });
      return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
    }

    logger.info('Events API: Event deleted', { id });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Events API DELETE error', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
