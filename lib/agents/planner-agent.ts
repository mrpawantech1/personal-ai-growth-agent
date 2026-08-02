import { CEODecision } from './ceo-agent';
import { DailyPlan, ContentTask, Campaign } from '@/types';
import { eventsRepo } from '@/lib/infrastructure/supabase/repositories';
import { logger } from '@/lib/utils/logger';
import { generateText } from '@/lib/infrastructure/openrouter/client';

export class PlannerAgent {
  /**
   * Create a detailed daily plan from CEO decision
   */
  async createDailyPlan(decision: CEODecision, date: Date): Promise<DailyPlan> {
    try {
      logger.info('PlannerAgent: Creating daily plan', { date });

      // Convert CEO topics to content tasks with times
      const contentTasks: ContentTask[] = decision.contentTopics.map((topic, index) => ({
        topic: topic.topic,
        platform: topic.platform,
        suggestedTime: this.suggestTime(index, decision.contentTopics.length),
        tone: this.suggestTone(topic.platform),
        targetAudience: 'Primary audience',
        status: 'pending',
      }));

      // Build campaigns
      const campaigns: Campaign[] = decision.campaigns.map((name, index) => ({
        id: `camp_${Date.now()}_${index}`,
        name,
        description: `Auto-generated from CEO decision: ${name}`,
        startDate: date,
        status: 'active',
        goal: 'Increase brand awareness and engagement',
      }));

      const plan: DailyPlan = {
        date,
        priorities: decision.priorities,
        contentTasks,
        campaigns,
        goals: [
          'Publish 3-5 pieces of content',
          'Engage with 5 key industry conversations',
          'Monitor campaign performance',
        ],
      };

      // Store plan in database (schedules table)
      // Using direct insert since we don't have a repo for schedules yet
      const supabase = (await import('@/lib/infrastructure/supabase/client')).createClient();
      await supabase
        .from('schedules')
        .insert({
          date: date.toISOString().split('T')[0],
          plan: plan,
          generated_by: 'system', // Will be user ID in production
          approved: false,
        });

      // Emit event for Content Agent
      await eventsRepo.create({
        type: 'plan:create',
        payload: { plan, date: date.toISOString() },
        status: 'pending',
        retryCount: 0,
      });

      logger.info('PlannerAgent: Plan created successfully', { taskCount: contentTasks.length });

      return plan;
    } catch (error) {
      logger.error('PlannerAgent: Plan creation failed', { error });
      throw new Error(`Plan creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Suggest posting time based on slot index
   */
  private suggestTime(index: number, total: number): string {
    const slots = ['09:00', '11:00', '14:00', '16:00', '19:00'];
    if (total <= 3) return slots[index % 3];
    return slots[index % slots.length];
  }

  /**
   * Suggest tone based on platform
   */
  private suggestTone(platform: string): string {
    const map: Record<string, string> = {
      twitter: 'casual',
      linkedin: 'professional',
      reddit: 'educational',
      instagram: 'inspirational',
    };
    return map[platform] || 'educational';
  }

  /**
   * Generate weekly plan from multiple daily plans
   */
  async generateWeeklyPlan(startDate: Date): Promise<DailyPlan[]> {
    const plans: DailyPlan[] = [];
    // CEO will be run daily, so planner just aggregates
    return plans;
  }
}

export const plannerAgent = new PlannerAgent();
