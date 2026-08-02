import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/infrastructure/supabase/server';
import { plannerAgent } from '@/lib/agents/planner-agent';
import { ceoAgent } from '@/lib/agents/ceo-agent';
import { analyticsRepo } from '@/lib/infrastructure/supabase/repositories';
import { logger } from '@/lib/utils/logger';
import { z } from 'zod';

// GET: Get today's plan or plan for a specific date
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const date = request.nextUrl.searchParams.get('date') || new Date().toISOString().split('T')[0];

    // Fetch plan from schedules table
    const { data, error } = await supabase
      .from('schedules')
      .select()
      .eq('date', date)
      .eq('generated_by', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      logger.error('Planner API: Fetch failed', { error });
      return NextResponse.json({ error: 'Failed to fetch plan' }, { status: 500 });
    }

    return NextResponse.json({
      plan: data?.plan || null,
      approved: data?.approved || false,
      date,
    });
  } catch (error) {
    logger.error('Planner API GET error', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Generate a new daily plan
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

    // Step 1: Get CEO decision
    const trends = await supabase
      .from('trends')
      .select()
      .order('opportunity_score', { ascending: false })
      .limit(10);

    const analytics = await analyticsRepo.getLastNDays(7);

    const decision = await ceoAgent.makeDailyDecision(
      trends.data || [],
      analytics,
      targetDate
    );

    // Step 2: Create plan from decision
    const plan = await plannerAgent.createDailyPlan(decision, targetDate);

    return NextResponse.json({
      success: true,
      plan,
      decision,
    });
  } catch (error) {
    logger.error('Planner API POST error', { error });
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// PUT: Approve a plan
export async function PUT(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const schema = z.object({
      date: z.string(),
      approved: z.boolean(),
    });

    const { date, approved } = schema.parse(body);

    const { error } = await supabase
      .from('schedules')
      .update({ approved })
      .eq('date', date)
      .eq('generated_by', user.id);

    if (error) {
      logger.error('Planner API: Approve failed', { error });
      return NextResponse.json({ error: 'Failed to approve plan' }, { status: 500 });
    }

    return NextResponse.json({ success: true, approved });
  } catch (error) {
    logger.error('Planner API PUT error', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
      }
