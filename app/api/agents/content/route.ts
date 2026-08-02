import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/infrastructure/supabase/server';
import { contentAgent } from '@/lib/agents/content-agent';
import { draftsRepo } from '@/lib/infrastructure/supabase/repositories';
import { logger } from '@/lib/utils/logger';
import { z } from 'zod';

// GET: Fetch drafts
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const status = request.nextUrl.searchParams.get('status');
    const platform = request.nextUrl.searchParams.get('platform');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20');

    let query = supabase
      .from('content_drafts')
      .select()
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status) {
      const isApproved = status === 'approved';
      query = query.eq('approved', isApproved);
    }

    if (platform) {
      query = query.eq('platform', platform);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Content API: Fetch drafts failed', { error });
      return NextResponse.json({ error: 'Failed to fetch drafts' }, { status: 500 });
    }

    return NextResponse.json({
      data,
      count: data.length,
    });
  } catch (error) {
    logger.error('Content API GET error', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Generate a new draft
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const schema = z.object({
      topic: z.string().min(1),
      platform: z.enum(['twitter', 'linkedin', 'reddit', 'instagram', 'producthunt']),
      tone: z.enum(['professional', 'casual', 'inspirational', 'educational', 'funny']).optional(),
      additionalContext: z.string().optional(),
      generateVariations: z.boolean().optional(),
      variationCount: z.number().min(1).max(5).optional(),
    });

    const { 
      topic, 
      platform, 
      tone, 
      additionalContext, 
      generateVariations = false,
      variationCount = 3,
    } = schema.parse(body);

    let drafts = [];

    if (generateVariations) {
      // Generate multiple variations
      const variationDrafts = await contentAgent.generateVariations(
        topic,
        platform,
        Math.min(variationCount, 5)
      );

      // Save each variation
      for (const draft of variationDrafts) {
        const saved = await draftsRepo.create({
          platform: draft.platform,
          rawContent: draft.rawContent,
          variants: draft.variants || [],
          approved: false,
          created_by: user.id,
        });
        drafts.push(saved);
      }
    } else {
      // Generate single draft
      const draft = await contentAgent.generateDraft(topic, platform, {
        tone,
        additionalContext,
      });

      const saved = await draftsRepo.create({
        platform: draft.platform,
        rawContent: draft.rawContent,
        variants: draft.variants || [],
        approved: false,
        created_by: user.id,
      });
      drafts.push(saved);
    }

    logger.info('Content API: Drafts generated', {
      userId: user.id,
      topic,
      platform,
      count: drafts.length,
    });

    return NextResponse.json({
      success: true,
      data: drafts,
      count: drafts.length,
    });
  } catch (error) {
    logger.error('Content API POST error', { error });
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// PUT: Update a draft (approve, edit, etc.)
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
      content: z.string().optional(),
      approved: z.boolean().optional(),
      feedback: z.string().optional(),
    });

    const { id, content, approved, feedback } = schema.parse(body);

    const updateData: any = {};
    if (content !== undefined) updateData.raw_content = content;
    if (approved !== undefined) {
      updateData.approved = approved;
      if (approved) updateData.approved_at = new Date().toISOString();
    }
    if (feedback !== undefined) updateData.feedback = feedback;

    const { data, error } = await supabase
      .from('content_drafts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('Content API: Update draft failed', { error });
      return NextResponse.json({ error: 'Failed to update draft' }, { status: 500 });
    }

    logger.info('Content API: Draft updated', { id, userId: user.id });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    logger.error('Content API PUT error', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Delete a draft
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
      .from('content_drafts')
      .delete()
      .eq('id', id);

    if (error) {
      logger.error('Content API: Delete draft failed', { error });
      return NextResponse.json({ error: 'Failed to delete draft' }, { status: 500 });
    }

    logger.info('Content API: Draft deleted', { id, userId: user.id });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Content API DELETE error', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
