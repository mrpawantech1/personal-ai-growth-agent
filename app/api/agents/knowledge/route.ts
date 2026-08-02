import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/infrastructure/supabase/server';
import { knowledgeAgent } from '@/lib/core/knowledge-agent';
import { logger } from '@/lib/utils/logger';
import { z } from 'zod';
import { KnowledgeCategory } from '@/types';

// GET: Fetch knowledge entries
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const category = request.nextUrl.searchParams.get('category') as KnowledgeCategory | null;
    const key = request.nextUrl.searchParams.get('key');
    const search = request.nextUrl.searchParams.get('search');

    // Search query
    if (search) {
      const results = await knowledgeAgent.search(search);
      return NextResponse.json({ data: results });
    }

    // Get specific entry by key
    if (category && key) {
      const entry = await knowledgeAgent.getByKey(category, key);
      return NextResponse.json({ data: entry });
    }

    // Get category
    if (category) {
      const entries = await knowledgeAgent.getCategory(category);
      return NextResponse.json({ data: entries });
    }

    // Get all (limited)
    const { data, error } = await supabase
      .from('knowledge')
      .select()
      .order('category', { ascending: true })
      .limit(100);

    if (error) {
      logger.error('Knowledge API: Fetch all failed', { error });
      return NextResponse.json({ error: 'Failed to fetch knowledge' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    logger.error('Knowledge API GET error', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create or update a knowledge entry
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const schema = z.object({
      category: z.enum(['brand_voice', 'product_features', 'pricing', 'competitors', 'audience_persona', 'faq', 'past_campaigns', 'writing_style']),
      key: z.string().min(1),
      value: z.string().min(1),
      metadata: z.record(z.any()).optional(),
    });

    const { category, key, value, metadata } = schema.parse(body);

    await knowledgeAgent.set(category as KnowledgeCategory, key, value, metadata);

    // Fetch the created/updated entry
    const entry = await knowledgeAgent.getByKey(category as KnowledgeCategory, key);

    logger.info('Knowledge API: Entry saved', { category, key, userId: user.id });

    return NextResponse.json({
      success: true,
      data: entry,
    });
  } catch (error) {
    logger.error('Knowledge API POST error', { error });
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// DELETE: Delete a knowledge entry
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
      .from('knowledge')
      .delete()
      .eq('id', id);

    if (error) {
      logger.error('Knowledge API: Delete failed', { error });
      return NextResponse.json({ error: 'Failed to delete entry' }, { status: 500 });
    }

    logger.info('Knowledge API: Entry deleted', { id, userId: user.id });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Knowledge API DELETE error', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
  }
