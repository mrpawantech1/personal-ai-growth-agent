import { logger } from '@/lib/utils/logger';
import { ceoAgent } from '@/lib/agents/ceo-agent';
import { trendAgent } from '@/lib/agents/trend-agent';
import { analyticsAgent } from '@/lib/agents/analytics-agent';
import { eventsRepo } from '@/lib/infrastructure/supabase/repositories';
import { analyticsRepo } from '@/lib/infrastructure/supabase/repositories';
import { createClient } from '@/lib/infrastructure/supabase/client';

/**
 * Scheduler — Manages recurring agent tasks
 * These functions are designed to be called by Vercel Cron Jobs
 */

export class Scheduler {
  /**
   * Morning routine: CEO decision + Planner
   * Run at 8:00 AM daily
   */
  async morningRoutine() {
    logger.info('Scheduler: Starting morning routine');
    const startTime = Date.now();

    try {
      const supabase = createClient();
      const date = new Date();

      // Fetch trends
      const { data: trends } = await supabase
        .from('trends')
        .select()
        .order('opportunity_score', { ascending: false })
        .limit(10);

      // Fetch recent analytics
      const analytics = await analyticsRepo.getLastNDays(7);

      // CEO makes decision
      const decision = await ceoAgent.makeDailyDecision(
        trends || [],
        analytics,
        date
      );

      // Create plan
      await eventsRepo.create({
        type: 'ceo:decision',
        payload: { decision, date: date.toISOString() },
        status: 'pending',
        retryCount: 0,
      });

      const duration = Date.now() - startTime;
      logger.info('Scheduler: Morning routine completed', { duration });
    } catch (error) {
      logger.error('Scheduler: Morning routine failed', { error });
    }
  }

  /**
   * Trend scan: Scan for new trends
   * Run every 6 hours
   */
  async scanTrends() {
    logger.info('Scheduler: Starting trend scan');

    try {
      // Create event for trend agent
      await eventsRepo.create({
        type: 'trends:updated',
        payload: { scanTime: new Date().toISOString() },
        status: 'pending',
        retryCount: 0,
      });

      logger.info('Scheduler: Trend scan triggered');
    } catch (error) {
      logger.error('Scheduler: Trend scan failed', { error });
    }
  }

  /**
   * Analytics aggregation: Daily metrics
   * Run at 11:59 PM daily
   */
  async aggregateAnalytics() {
    logger.info('Scheduler: Starting analytics aggregation');

    try {
      const date = new Date();
      await analyticsAgent.aggregateDaily(date);

      logger.info('Scheduler: Analytics aggregation completed');
    } catch (error) {
      logger.error('Scheduler: Analytics aggregation failed', { error });
    }
  }

  /**
   * Cleanup: Delete old events and expired trends
   * Run weekly
   */
  async cleanup() {
    logger.info('Scheduler: Starting cleanup');

    try {
      const supabase = createClient();
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30); // 30 days old

      // Delete old completed events
      const { error: eventsError } = await supabase
        .from('events')
        .delete()
        .eq('status', 'completed')
        .lt('created_at', cutoff.toISOString());

      if (eventsError) {
        logger.warn('Scheduler: Cleanup events failed', { error: eventsError });
      }

      // Delete expired trends
      const { error: trendsError } = await supabase
        .from('trends')
        .delete()
        .lt('expires_at', new Date().toISOString());

      if (trendsError) {
        logger.warn('Scheduler: Cleanup trends failed', { error: trendsError });
      }

      logger.info('Scheduler: Cleanup completed');
    } catch (error) {
      logger.error('Scheduler: Cleanup failed', { error });
    }
  }

  /**
   * Hourly heartbeat: Check for stuck events and retry
   * Run every hour
   */
  async healthCheck() {
    logger.info('Scheduler: Running health check');

    try {
      const supabase = createClient();
      const stuckTime = new Date();
      stuckTime.setMinutes(stuckTime.getMinutes() - 30); // 30 minutes stuck

      // Find stuck events
      const { data: stuckEvents } = await supabase
        .from('events')
        .select()
        .eq('status', 'processing')
        .lt('created_at', stuckTime.toISOString())
        .limit(10);

      if (stuckEvents && stuckEvents.length > 0) {
        logger.warn('Scheduler: Found stuck events', { count: stuckEvents.length });

        // Reset them to pending
        for (const event of stuckEvents) {
          await eventsRepo.updateStatus(event.id, 'pending');
          logger.info('Scheduler: Reset stuck event', { id: event.id });
        }
      }

      logger.info('Scheduler: Health check completed');
    } catch (error) {
      logger.error('Scheduler: Health check failed', { error });
    }
  }
}

// Singleton instance
export const scheduler = new Scheduler();

// Export individual functions for Vercel Cron
export const morningRoutine = () => scheduler.morningRoutine();
export const scanTrends = () => scheduler.scanTrends();
export const aggregateAnalytics = () => scheduler.aggregateAnalytics();
export const cleanup = () => scheduler.cleanup();
export const healthCheck = () => scheduler.healthCheck();
