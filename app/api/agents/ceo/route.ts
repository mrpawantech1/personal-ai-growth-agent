import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/infrastructure/supabase/server';
import { ceoAgent } from '@/lib/agents/ceo-agent';
import { analyticsRepo } from '@/lib/infrastructure/supabase/repositories';
import { logger } from '@/lib/utils/logger';
import { z } from 'zod';

// GET: Fetch latest CEO decisions (or a specific one)
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '5');

    // Fetch CEO decisions from events table
    const { data, error } = await supabase
      .from('events')
      .select()
      .eq('type', 'ceo:decision')
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('CEO API: Fetch failed', { error });
      return NextResponse.json({ error: 'Failed to fetch decisions' }, { status: 500 });
    }

    return NextResponse.json({
      data: data.map(d => ({
        id: d.id,
        decision: d.payload.decision,
        date: d.payload.date,
        createdAt: d.created_at,
      })),
      count: data.length,
    });
  } catch (error) {
    logger.error('CEO API GET error', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Trigger a new CEO decision
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const schema = z.object({
      date: z.string().optional(),
      useStoredData: z.boolean().optional().default(true),
    });

    const { date, useStoredData } = schema.parse(body);
    const targetDate = date ? new Date(date) : new Date();

    let trends = [];
    let analytics = [];

    if (useStoredData) {
      // Fetch stored trends and analytics
      const { data: trendsData } = await supabase
        .from('trends')
        .select()
        .order('opportunity_score', { ascending: false })
        .limit(10)
        .gt('expires_at', new Date().toISOString());

      trends = trendsData || [];

      analytics = await analyticsRepo.getLastNDays(7);
    }

    // If no trends found, trigger a trend scan first (or use mock)
    if (trends.length === 0) {
      logger.warn('CEO API: No trends found, using empty trends. Consider running trend scan first.');
    }

    // Make decision
    const decision = await ceoAgent.makeDailyDecision(trends, analytics, targetDate);

    return NextResponse.json({
      success: true,
      decision,
      date: targetDate.toISOString(),
      dataUsed: {
        trendsCount: trends.length,
        analyticsDays: analytics.length,
      },
    });
  } catch (error) {
    logger.error('CEO API POST error', { error });
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// PUT: Quick decision (for real-time opportunities)
export async function PUT(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const schema = z.object({
      opportunity: z.string().min(1),
      context: z.string().min(1),
    });

    const { opportunity, context } = schema.parse(body);

    const result = await ceoAgent.quickDecision(opportunity, context);

    return NextResponse.json({
      success: true,
      decision: result,
    });
  } catch (error) {
    logger.error('CEO API PUT error', { error });
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
