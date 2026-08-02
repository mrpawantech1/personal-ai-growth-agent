import { generateText } from '@/lib/infrastructure/openrouter/client';
import { knowledgeAgent } from '@/lib/core/knowledge-agent';
import { Trend, AnalyticsDaily } from '@/types';
import { logger } from '@/lib/utils/logger';
import { eventsRepo } from '@/lib/infrastructure/supabase/repositories';

export interface CEODecision {
  priorities: string[];
  contentTopics: { topic: string; platform: 'twitter' | 'linkedin' | 'reddit'; urgency: number }[];
  campaigns: string[];
  ignoreTrends: string[];
}

export class CEOAgent {
  /**
   * Make daily strategic decisions based on trends and analytics
   */
  async makeDailyDecision(
    trends: Trend[],
    analytics: AnalyticsDaily[],
    date: Date
  ): Promise<CEODecision> {
    try {
      logger.info('CEOAgent: Making daily decision', { date });

      // Fetch knowledge
      const [brandVoice, audience, competitors] = await Promise.all([
        knowledgeAgent.getBrandVoice(),
        knowledgeAgent.getTargetAudience(),
        knowledgeAgent.getCompetitors(),
      ]);

      // Prepare data for LLM
      const topTrends = trends
        .sort((a, b) => b.opportunityScore - a.opportunityScore)
        .slice(0, 10)
        .map(t => `${t.keyword} (score: ${t.opportunityScore}, source: ${t.source})`)
        .join('\n');

      const recentPerformance = analytics
        .slice(0, 7)
        .map(a => `${a.date.toISOString().split('T')[0]}: ${a.totalPosts} posts, avg engagement ${a.avgEngagement}`)
        .join('\n');

      const prompt = `
You are the CEO of a SaaS company. Make strategic marketing decisions for today.

## Brand Voice:
"${brandVoice}"

## Target Audience:
${audience}

## Top Competitors:
${competitors.join(', ') || 'None listed'}

## Top Trends Right Now:
${topTrends}

## Recent Performance (Last 7 Days):
${recentPerformance}

## Your Task:
Decide the following for TODAY:
1. **Priorities** (3-5 strategic priorities for the day)
2. **Content Topics** (3-5 topics to create content about, with platform and urgency 0-100)
3. **Campaigns** (Any specific campaigns to run or continue)
4. **Trends to Ignore** (Which trends are distractions?)

Return ONLY valid JSON:
{
  "priorities": ["string"],
  "contentTopics": [{ "topic": "string", "platform": "twitter|linkedin|reddit", "urgency": 0 }],
  "campaigns": ["string"],
  "ignoreTrends": ["string"]
}

Be decisive. Focus on high-impact activities. Prioritize trends with high opportunity scores.
`;

      const response = await generateText(prompt, {
        temperature: 0.6, // More deterministic for decision making
        maxTokens: 1500,
      });

      // Parse JSON response
      const decision = JSON.parse(response) as CEODecision;

      // Log the decision
      logger.info('CEOAgent: Decision made', { decision });

      // Emit event for Planner to pick up
      await eventsRepo.create({
        type: 'ceo:decision',
        payload: { decision, date: date.toISOString() },
        status: 'pending',
        retryCount: 0,
      });

      return decision;
    } catch (error) {
      logger.error('CEOAgent: Decision failed', { error });
      throw new Error(`CEO decision failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Quick decision for emergency/real-time opportunities
   */
  async quickDecision(opportunity: string, context: string): Promise<string> {
    const prompt = `
Quick decision needed! Should we act on this opportunity?

Opportunity: "${opportunity}"
Context: "${context}"

Brand Voice: "${await knowledgeAgent.getBrandVoice()}"

Respond with ONLY "YES" or "NO" and a one-sentence reason.
`;

    const response = await generateText(prompt, {
      temperature: 0.3,
      maxTokens: 100,
    });

    return response;
  }
}

export const ceoAgent = new CEOAgent();
