import { OpenAI } from 'openai';
import { ExternalServiceError } from '../utils/errors';
import logger from '../utils/logger';

// Adapter Pattern: Define our interface
export interface OpenAICompletionRequest {
  model: string;
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  temperature?: number;
  max_tokens?: number;
}

export interface OpenAICompletionResponse {
  choices: Array<{
    message: { content: string | null };
  }>;
}

export interface OpenAIClient {
  createChatCompletion(request: OpenAICompletionRequest): Promise<OpenAICompletionResponse>;
}

export class OpenAIClientImpl implements OpenAIClient {
  private client: OpenAI;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('OpenAI API key is required');
    }
    this.client = new OpenAI({ apiKey });
  }

  async createChatCompletion(request: OpenAICompletionRequest): Promise<OpenAICompletionResponse> {
    try {
      const response = await this.client.chat.completions.create({
        model: request.model,
        messages: request.messages,
        temperature: request.temperature,
        max_tokens: request.max_tokens,
      });

      return {
        choices: response.choices.map((c) => ({
          message: { content: c.message.content },
        })),
      };
    } catch (error) {
      logger.error({ error }, 'OpenAI API request failed');
      // Wrap SDK errors
      throw new ExternalServiceError('OpenAI', error instanceof Error ? error : new Error(String(error)));
    }
  }
}

// Singleton instance
let openAIClient: OpenAIClient | null = null;

export function getOpenAIClient(): OpenAIClient {
  if (!openAIClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    openAIClient = new OpenAIClientImpl(apiKey);
  }
  return openAIClient;
}

// For testing purposes
export function setOpenAIClient(client: OpenAIClient): void {
  openAIClient = client;
}
