import OpenAI from 'openai';
import { logger } from '@/lib/utils/logger';

// OpenRouter uses OpenAI-compatible API
const openrouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    'X-Title': 'Personal AI Growth Agent',
  },
  timeout: 60000, // 60 seconds
});

export interface LLMOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

const DEFAULT_MODEL = 'anthropic/claude-3.5-sonnet'; // You can change to 'openai/gpt-4o' or 'meta-llama/llama-3.1-70b-instruct'
const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_MAX_TOKENS = 2000;

export async function generateText(
  prompt: string,
  options: LLMOptions = {}
): Promise<string> {
  const startTime = Date.now();
  const model = options.model || DEFAULT_MODEL;
  const temperature = options.temperature || DEFAULT_TEMPERATURE;
  const maxTokens = options.maxTokens || DEFAULT_MAX_TOKENS;

  try {
    logger.info(`LLM Request: model=${model}, promptLength=${prompt.length}`);

    const response = await openrouter.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: 'You are an expert SaaS marketing strategist and content creator. Respond with high-quality, actionable content.' },
        { role: 'user', content: prompt }
      ],
      temperature,
      max_tokens: maxTokens,
    });

    const content = response.choices[0]?.message?.content || '';
    const duration = Date.now() - startTime;

    logger.info(`LLM Response: model=${model}, duration=${duration}ms, tokens=${response.usage?.total_tokens || 0}`);

    return content;
  } catch (error) {
    logger.error('LLM generation failed', { error, model });
    throw new Error(`OpenRouter API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Streaming version for real-time UI feedback
export async function generateTextStream(
  prompt: string,
  onChunk: (chunk: string) => void,
  options: LLMOptions = {}
): Promise<string> {
  const model = options.model || DEFAULT_MODEL;
  const temperature = options.temperature || DEFAULT_TEMPERATURE;

  try {
    const stream = await openrouter.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: 'You are an expert SaaS marketing strategist and content creator.' },
        { role: 'user', content: prompt }
      ],
      temperature,
      stream: true,
    });

    let fullContent = '';
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        fullContent += content;
        onChunk(content);
      }
    }

    return fullContent;
  } catch (error) {
    logger.error('LLM streaming failed', { error, model });
    throw new Error(`OpenRouter streaming error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
      }
