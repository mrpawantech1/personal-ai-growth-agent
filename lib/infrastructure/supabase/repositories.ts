import { createClient } from './client';
import { Post, Event, AnalyticsDaily, ContentDraft, ApprovalItem } from '@/types';
import { logger } from '@/lib/utils/logger';

// ============================================
// POSTS REPOSITORY
// ============================================

export const postsRepo = {
  async create(post: Omit<Post, 'id' | 'createdAt' | 'updatedAt'>): Promise<Post> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('posts')
      .insert(post)
      .select()
      .single();

    if (error) {
      logger.error('PostsRepo.create failed', { error });
      throw new Error(`Failed to create post: ${error.message}`);
    }

    return data as Post;
  },

  async findById(id: string): Promise<Post | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('posts')
      .select()
      .eq('id', id)
      .single();

    if (error) return null;
    return data as Post;
  },

  async findByDateRange(startDate: Date, endDate: Date): Promise<Post[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('posts')
      .select()
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('PostsRepo.findByDateRange failed', { error });
      return [];
    }

    return data as Post[];
  },

  async updatePerformance(id: string, performance: Post['performance']): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from('posts')
      .update({ performance })
      .eq('id', id);

    if (error) {
      logger.error('PostsRepo.updatePerformance failed', { error });
    }
  },
};

// ============================================
// EVENTS REPOSITORY
// ============================================

export const eventsRepo = {
  async create(event: Omit<Event, 'id' | 'createdAt'>): Promise<Event> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('events')
      .insert(event)
      .select()
      .single();

    if (error) {
      logger.error('EventsRepo.create failed', { error });
      throw new Error(`Failed to create event: ${error.message}`);
    }

    return data as Event;
  },

  async getPending(limit: number = 10): Promise<Event[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('events')
      .select()
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) {
      logger.error('EventsRepo.getPending failed', { error });
      return [];
    }

    return data as Event[];
  },

  async updateStatus(id: string, status: Event['status']): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from('events')
      .update({ status, processed_at: status === 'completed' ? new Date().toISOString() : undefined })
      .eq('id', id);

    if (error) {
      logger.error('EventsRepo.updateStatus failed', { error });
    }
  },
};

// ============================================
// ANALYTICS REPOSITORY
// ============================================

export const analyticsRepo = {
  async getDaily(date: Date): Promise<AnalyticsDaily | null> {
    const supabase = createClient();
    const dateStr = date.toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('analytics_daily')
      .select()
      .eq('date', dateStr)
      .single();

    if (error) return null;
    return data as AnalyticsDaily;
  },

  async saveDaily(entry: Omit<AnalyticsDaily, 'id' | 'createdAt'>): Promise<AnalyticsDaily> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('analytics_daily')
      .insert(entry)
      .select()
      .single();

    if (error) {
      logger.error('AnalyticsRepo.saveDaily failed', { error });
      throw new Error(`Failed to save analytics: ${error.message}`);
    }

    return data as AnalyticsDaily;
  },

  async getLastNDays(days: number = 30): Promise<AnalyticsDaily[]> {
    const supabase = createClient();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const { data, error } = await supabase
      .from('analytics_daily')
      .select()
      .gte('date', cutoff.toISOString().split('T')[0])
      .order('date', { ascending: false });

    if (error) {
      logger.error('AnalyticsRepo.getLastNDays failed', { error });
      return [];
    }

    return data as AnalyticsDaily[];
  },
};

// ============================================
// DRAFTS REPOSITORY
// ============================================

export const draftsRepo = {
  async create(draft: Omit<ContentDraft, 'id' | 'createdAt'>): Promise<ContentDraft> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('content_drafts')
      .insert(draft)
      .select()
      .single();

    if (error) {
      logger.error('DraftsRepo.create failed', { error });
      throw new Error(`Failed to create draft: ${error.message}`);
    }

    return data as ContentDraft;
  },

  async getPendingApproval(): Promise<ContentDraft[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('content_drafts')
      .select()
      .eq('approved', false)
      .order('created_at', { ascending: true });

    if (error) {
      logger.error('DraftsRepo.getPendingApproval failed', { error });
      return [];
    }

    return data as ContentDraft[];
  },

  async approve(id: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from('content_drafts')
      .update({ approved: true, approved_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      logger.error('DraftsRepo.approve failed', { error });
    }
  },
};
