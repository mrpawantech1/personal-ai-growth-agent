import { createClient } from './client';
import { ApprovalItem, ApprovalStatus } from '@/types';
import { logger } from '@/lib/utils/logger';

export const approvalRepo = {
  /**
   * Create a new approval item
   */
  async create(item: Omit<ApprovalItem, 'id' | 'createdAt'>): Promise<ApprovalItem> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('approval_queue')
      .insert(item)
      .select()
      .single();

    if (error) {
      logger.error('ApprovalRepo.create failed', { error });
      throw new Error(`Failed to create approval item: ${error.message}`);
    }

    return data as ApprovalItem;
  },

  /**
   * Get all pending approval items
   */
  async getPending(): Promise<ApprovalItem[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('approval_queue')
      .select()
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) {
      logger.error('ApprovalRepo.getPending failed', { error });
      return [];
    }

    return data as ApprovalItem[];
  },

  /**
   * Get a single approval item by ID
   */
  async findById(id: string): Promise<ApprovalItem | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('approval_queue')
      .select()
      .eq('id', id)
      .single();

    if (error) return null;
    return data as ApprovalItem;
  },

  /**
   * Approve or reject an item
   */
  async updateStatus(
    id: string,
    status: ApprovalStatus,
    reviewedBy: string,
    feedback?: string
  ): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from('approval_queue')
      .update({
        status,
        reviewed_by: reviewedBy,
        reviewed_at: new Date().toISOString(),
        ...(feedback && { feedback }),
      })
      .eq('id', id);

    if (error) {
      logger.error('ApprovalRepo.updateStatus failed', { error });
      throw new Error(`Failed to update approval status: ${error.message}`);
    }
  },

  /**
   * Delete an approval item (e.g., if rejected or cancelled)
   */
  async delete(id: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from('approval_queue')
      .delete()
      .eq('id', id);

    if (error) {
      logger.error('ApprovalRepo.delete failed', { error });
    }
  },
};
