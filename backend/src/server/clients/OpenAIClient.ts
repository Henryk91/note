import { ExternalServiceError } from '../utils/errors';
import logger from '../utils/logger';

export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenAICompletionRequest {
  model: string;
  messages: OpenAIMessage[];
  temperature?: number;
  max_tokens?: number;
}

export interface OpenAICompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: OpenAIMessage;
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface OpenAIClient {
  createChatCompletion(request: OpenAICompletionRequest): Promise<OpenAICompletionResponse>;
}

export class OpenAIClientImpl implements OpenAIClient {
  private apiKey: string;
  private baseURL: string;
  private timeout: number;

  constructor(apiKey: string, options?: { baseURL?: string; timeout?: number }) {
    if (!apiKey) {
      throw new Error('OpenAI API key is required');
    }
    this.apiKey = apiKey;
    this.baseURL = options?.baseURL || 'https://api.openai.com/v1';
    this.timeout = options?.timeout || 30000; // 30 seconds default
  }

  async createChatCompletion(request: OpenAICompletionRequest): Promise<OpenAICompletionResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorBody = await response.text().catch(() => 'Unknown error');
        logger.error({ status: response.status, body: errorBody }, 'OpenAI API request failed');
        throw new ExternalServiceError('OpenAI', new Error(`Status ${response.status}: ${errorBody}`));
      }

      const data = await response.json();
      return data as OpenAICompletionResponse;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof ExternalServiceError) {
        throw error;
      }

      if ((error as Error).name === 'AbortError') {
        logger.error({ timeout: this.timeout }, 'OpenAI API request timed out');
        throw new ExternalServiceError('OpenAI', new Error(`Timed out after ${this.timeout}ms`));
      }

      logger.error({ error }, 'OpenAI API request failed');
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
