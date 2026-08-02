import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/infrastructure/supabase/server';
import { analyticsAgent } from '@/lib/agents/analytics-agent';
import { analyticsRepo } from '@/lib/infrastructure/supabase/repositories';
import { logger } from '@/lib/utils/logger';
import { z } from 'zod';

// GET: Fetch analytics data
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const days = parseInt(request.nextUrl.searchParams.get('days') || '7');
    const platform = request.nextUrl.searchParams.get('platform');

    let query = supabase
      .from('analytics_daily')
      .select()
      .order('date', { ascending: false })
      .limit(days);

    if (platform) {
      query = query.eq('platform', platform);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Analytics API: Fetch failed', { error });
      return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
    }

    // Get recommendations
    const recommendations = await analyticsAgent.getRecommendations(days);

    // Calculate summary stats
    const totalPosts = data.reduce((sum, d) => sum + d.total_posts, 0);
    const totalEngagement = data.reduce((sum, d) => sum + d.total_engagement, 0);
    const avgEngagement = data.length > 0 ? totalEngagement / data.length : 0;

    return NextResponse.json({
      data,
      summary: {
        totalPosts,
        totalEngagement,
        avgEngagement,
        days: data.length,
      },
      recommendations,
    });
  } catch (error) {
    logger.error('Analytics API GET error', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Trigger daily aggregation
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
    });

    const { date } = schema.parse(body);
    const targetDate = date ? new Date(date) : new Date();

    const result = await analyticsAgent.aggregateDaily(targetDate);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Analytics API POST error', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET: Get best posting times (special endpoint)
export async function PUT(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const schema = z.object({
      platform: z.string().optional(),
    });

    const { platform } = schema.parse(body);

    let query = supabase
      .from('analytics_daily')
      .select('best_time, total_engagement, platform')
      .order('total_engagement', { ascending: false });

    if (platform) {
      query = query.eq('platform', platform);
    }

    const { data, error } = await query.limit(20);

    if (error) {
      logger.error('Analytics API: Best times failed', { error });
      return NextResponse.json({ error: 'Failed to fetch best times' }, { status: 500 });
    }

    // Group by time and average engagement
    const timeMap: Record<string, { total: number; count: number }> = {};
    data.forEach(d => {
      if (!d.best_time) return;
      const time = d.best_time.split(':').slice(0, 2).join(':');
      if (!timeMap[time]) timeMap[time] = { total: 0, count: 0 };
      timeMap[time].total += d.total_engagement;
      timeMap[time].count += 1;
    });

    const bestTimes = Object.entries(timeMap)
      .map(([time, { total, count }]) => ({
        time,
        avgEngagement: count > 0 ? total / count : 0,
      }))
      .sort((a, b) => b.avgEngagement - a.avgEngagement)
      .slice(0, 5);

    return NextResponse.json({ bestTimes });
  } catch (error) {
    logger.error('Analytics API PUT error', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
      }
