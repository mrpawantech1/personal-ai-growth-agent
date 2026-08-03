import { Platform, KnowledgeEntry } from '@/types';

// ============================================
// HONESTY RULE - Applied to ALL prompts
// ============================================
const HONESTY_RULE = `CRITICAL INSTRUCTION: 
- You are an assistant helping a solo founder.
- If you do NOT know a specific fact, say "I don't have that information."
- NEVER invent statistics, product features, pricing, or user feedback.
- NEVER guarantee results like "this will go viral" or "this will increase sales."
- Base your response ONLY on the context provided below.
- If the context is insufficient, clearly state that.`;

// ============================================
// PROMPT TEMPLATES
// ============================================

export interface PromptContext {
  topic: string;
  platform: Platform;
  brandVoice: string;
  targetAudience: string;
  productFeatures?: string[];
  tone?: 'professional' | 'casual' | 'inspirational' | 'educational' | 'funny';
  additionalContext?: string;
}

export function buildContentPrompt(context: PromptContext): string {
  const { topic, platform, brandVoice, targetAudience, productFeatures, tone = 'educational' } = context;

  const platformSpecificGuidelines = {
    twitter: `
      - Max 280 characters (tweet) or thread of 3-5 tweets (if thread)
      - Use hashtags (2-3 max)
      - Hook in first 2 lines
      - If thread: each tweet must add value, end with call-to-action
      - No emoji overload (max 2-3)
    `,
    linkedin: `
      - Professional yet conversational
      - 150-300 words ideal
      - Start with a hook (question or bold statement)
      - Break into short paragraphs (2-3 sentences max per paragraph)
      - End with a question to drive engagement
    `,
    reddit: `
      - Conversational, community-first tone
      - Avoid self-promotion; focus on providing value
      - 100-500 words depending on subreddit
      - Include a TL;DR at the end for long posts
    `,
    instagram: `
      - Inspirational or storytelling format
      - 50-150 words
      - Use line breaks for readability
      - Include 3-5 relevant hashtags at the end
    `,
    producthunt: `
      - Exciting, launch-oriented tone
      - 200-400 words
      - Hook: What problem does it solve?
      - Include key features, pricing, and a "Why now?" section
    `
  };

  const productContext = productFeatures && productFeatures.length > 0
    ? `\nProduct Features you can mention: ${productFeatures.join(', ')}`
    : '\nNo specific product features provided — focus on general SaaS growth tactics.';

  return `
${HONESTY_RULE}

You are a world-class SaaS marketing copywriter. Write content for **${platform.toUpperCase()}** based on the following:

## Topic:
${topic}

## Target Audience:
${targetAudience}

## Brand Voice (strictly follow this):
"${brandVoice}"

## Tone:
${tone}

## Platform-Specific Guidelines:
${platformSpecificGuidelines[platform] || platformSpecificGuidelines.twitter}

${productContext}

## Additional Context:
${context.additionalContext || 'None provided.'}

## Output Format:
- Return ONLY the post content. No meta-commentary.
- Do NOT include "Here is your post" or similar intros.
- For threads, separate each tweet with "---"
- Make it engaging, actionable, and aligned with the brand voice.

Generate the post now.
`;
}

export function buildTrendAnalysisPrompt(
  rawTrends: { keyword: string; source: string; volume: number }[],
  brandContext: string
): string {
  return `
${HONESTY_RULE}

You are a SaaS growth strategist. Analyze these raw trends and rank them by opportunity for a SaaS company:

## Brand Context:
${brandContext}

## Raw Trends:
${rawTrends.map(t => `- ${t.keyword} (source: ${t.source}, volume: ${t.volume})`).join('\n')}

## Your Task:
For each trend, provide:
1. **Opportunity Score** (0-100): How relevant is this trend to our SaaS?
2. **Reasoning**: Why is this a good/bad opportunity?
3. **Suggested Content Angle**: How could we leverage this trend?

Return as JSON array:
[
  { "keyword": "...", "score": 85, "reasoning": "...", "angle": "..." },
  ...
]

Return ONLY valid JSON.
`;
}

export function buildCommentReplyPrompt(
  originalPost: string,
  commentText: string,
  threadContext: string,
  brandVoice: string
): string {
  return `
${HONESTY_RULE}

You are a thoughtful SaaS founder. Draft a reply to this comment:

## Original Post:
${originalPost}

## Comment to Reply:
${commentText}

## Thread Context:
${threadContext}

## Brand Voice:
"${brandVoice}"

## Guidelines:
- Be genuine, not salesy
- Add value — answer the question or acknowledge the point
- Keep it concise (50-150 words max)
- If it's a criticism, respond with empathy and a solution-oriented mindset
- End with a question or invitation to continue the conversation

Return ONLY the reply text. No meta-commentary.
`;
    }
