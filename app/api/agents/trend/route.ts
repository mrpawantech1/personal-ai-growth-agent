import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/infrastructure/supabase/server';
import { trendAgent } from '@/lib/agents/trend-agent';
import { logger } from '@/lib/utils/logger';
import { z } from 'zod';

// GET: Fetch trends
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20');
    const source = request.nextUrl.searchParams.get('source');
    const minScore = parseFloat(request.nextUrl.searchParams.get('minScore') || '0');

    let query = supabase
      .from('trends')
      .select()
      .order('opportunity_score', { ascending: false })
      .limit(limit)
      .gt('expires_at', new Date().toISOString());

    if (source) {
      query = query.eq('source', source);
    }

    if (minScore > 0) {
      query = query.gte('opportunity_score', minScore);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Trend API: Fetch failed', { error });
      return NextResponse.json({ error: 'Failed to fetch trends' }, { status: 500 });
    }

    return NextResponse.json({
      data,
      count: data.length,
    });
  } catch (error) {
    logger.error('Trend API GET error', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Trigger a trend scan
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const schema = z.object({
      force: z.boolean().optional(),
    });

    const { force } = schema.parse(body);

    // Check if a scan was done recently (within 1 hour)
    if (!force) {
      const { data: recent } = await supabase
        .from('trends')
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(1);

      if (recent && recent.length > 0) {
        const lastScan = new Date(recent[0].created_at);
        const now = new Date();
        const diff = now.getTime() - lastScan.getTime();
        if (diff < 60 * 60 * 1000) {
          return NextResponse.json({
            message: 'Scan already performed within the last hour. Use force=true to override.',
            lastScan: lastScan.toISOString(),
          }, { status: 429 });
        }
      }
    }

    // Trigger scan
    const trends = await trendAgent.scanAllSources();

    return NextResponse.json({
      success: true,
      data: trends,
      count: trends.length,
    });
  } catch (error) {
    logger.error('Trend API POST error', { error });
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
