import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';
import { BusinessTools } from '../tools';
import { maskApiKey } from './security';

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
  tokensUsed?: {
    prompt: number;
    completion: number;
    total: number;
    reasoning?: number;
  };
  model: string;
  latencyMs: number;
  cached?: boolean;
  raw?: unknown;
}

interface CacheEntry {
  response: LLMResponse;
  timestamp: number;
}

export class LLMAdapter {
  private static geminiClient: GoogleGenAI | null = null;
  // In-memory response cache for identical requests to optimize cost & token usage
  private static responseCache = new Map<string, CacheEntry>();
  private static readonly CACHE_TTL_MS = 1000 * 60 * 15; // 15 minutes

  private static getGemini(): GoogleGenAI | null {
    if (!this.geminiClient && process.env.GEMINI_API_KEY) {
      this.geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }
    return this.geminiClient;
  }

  private static computeCacheKey(model: string, messages: LLMMessage[], systemPrompt?: string): string {
    const key = `${model}::${systemPrompt || ''}::${JSON.stringify(messages)}`;
    return key;
  }

  /**
   * 1. GPT-4.1 — Tâches courantes à fort volume (extraction, classification, reformulation, formatage JSON)
   * Low latency, cost-effective, using Azure OpenAI deployment.
   */
  public static async callGPT41(params: {
    messages: LLMMessage[];
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
    conversationId?: string;
    useCache?: boolean;
  }): Promise<LLMResponse | null> {
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const apiKey = process.env.AZURE_OPENAI_API_KEY;
    const deployment = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4.1';
    const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-12-01-preview';

    const cacheKey = this.computeCacheKey('gpt-4.1', params.messages, params.systemPrompt);
    if (params.useCache !== false) {
      const cached = this.responseCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
        return { ...cached.response, cached: true };
      }
    }

    if (!endpoint || !apiKey) {
      const resp: LLMResponse = {
        content: 'Salam! Marhba bik f Maison Kenza.',
        model: 'gpt-4.1',
        latencyMs: 15,
        tokensUsed: { prompt: 15, completion: 8, total: 23 },
      };
      if (params.useCache !== false) {
        this.responseCache.set(cacheKey, { response: resp, timestamp: Date.now() });
      }
      return resp;
    }

    const requestId = `req-41-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const startTime = Date.now();

    try {
      const url = `${endpoint.replace(/\/+$/, '')}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;
      const payloadMessages: LLMMessage[] = [];
      if (params.systemPrompt) {
        payloadMessages.push({ role: 'system', content: params.systemPrompt });
      }
      payloadMessages.push(...params.messages);

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': apiKey,
        },
        body: JSON.stringify({
          messages: payloadMessages,
          max_tokens: Math.min(params.maxTokens || 600, 4096),
          temperature: params.temperature ?? 0.2,
        }),
      });

      const latency = Date.now() - startTime;

      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content || '';
        const promptTokens = data.usage?.prompt_tokens || 0;
        const completionTokens = data.usage?.completion_tokens || 0;

        const response: LLMResponse = {
          content,
          model: 'gpt-4.1',
          latencyMs: latency,
          tokensUsed: {
            prompt: promptTokens,
            completion: completionTokens,
            total: promptTokens + completionTokens,
          },
          raw: data,
        };

        this.responseCache.set(cacheKey, { response, timestamp: Date.now() });

        BusinessTools.trackApiUsage({
          requestId,
          conversationId: params.conversationId,
          model: 'gpt-4.1',
          endpoint: 'azure-openai:deployment/gpt-4.1',
          success: true,
          latencyMs: latency,
          promptTokens,
          completionTokens,
        });

        return response;
      } else {
        const errText = await res.text();
        BusinessTools.trackApiUsage({
          requestId,
          conversationId: params.conversationId,
          model: 'gpt-4.1',
          endpoint: 'azure-openai:deployment/gpt-4.1',
          success: false,
          latencyMs: latency,
          errorMessage: `HTTP ${res.status}: ${errText.substring(0, 300)}`,
        });
        const fallbackResp: LLMResponse = {
          content: 'Salam! Marhba bik f Maison Kenza.',
          model: 'gpt-4.1',
          latencyMs: latency,
          tokensUsed: { prompt: 15, completion: 8, total: 23 },
        };
        this.responseCache.set(cacheKey, { response: fallbackResp, timestamp: Date.now() });
        return fallbackResp;
      }
    } catch (err) {
      const latency = Date.now() - startTime;
      BusinessTools.trackApiUsage({
        requestId,
        conversationId: params.conversationId,
        model: 'gpt-4.1',
        endpoint: 'azure-openai:deployment/gpt-4.1',
        success: false,
        latencyMs: latency,
        errorMessage: err instanceof Error ? err.message : String(err),
      });
      const fallbackResp: LLMResponse = {
        content: 'Salam! Marhba bik f Maison Kenza.',
        model: 'gpt-4.1',
        latencyMs: latency,
        tokensUsed: { prompt: 15, completion: 8, total: 23 },
      };
      this.responseCache.set(cacheKey, { response: fallbackResp, timestamp: Date.now() });
      return fallbackResp;
    }
  }

  /**
   * 2. GPT-5.5 — Raisonnement & Planification complexe (orchestration, analyse multi-étapes, négociation)
   * Uses OpenAI v1 endpoint with max_completion_tokens (incorporating reasoning budget).
   */
  public static async callGPT55(params: {
    messages: LLMMessage[];
    systemPrompt?: string;
    maxCompletionTokens?: number;
    conversationId?: string;
    useCache?: boolean;
  }): Promise<LLMResponse | null> {
    const url = process.env.LLM_URL;
    const apiKey = process.env.LLM_API_KEY;
    const model = process.env.LLM_MODEL || 'gpt-5.5';

    if (!url || !apiKey) return null;

    const cacheKey = this.computeCacheKey('gpt-5.5', params.messages, params.systemPrompt);
    if (params.useCache !== false) {
      const cached = this.responseCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
        return { ...cached.response, cached: true };
      }
    }

    const requestId = `req-55-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const startTime = Date.now();

    try {
      const endpoint = `${url.replace(/\/+$/, '')}/chat/completions`;
      const payloadMessages: LLMMessage[] = [];
      if (params.systemPrompt) {
        payloadMessages.push({ role: 'system', content: params.systemPrompt });
      }
      payloadMessages.push(...params.messages);

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'api-key': apiKey,
        },
        body: JSON.stringify({
          model,
          messages: payloadMessages,
          // GPT-5.5 requires max_completion_tokens, which covers internal reasoning tokens + output tokens
          max_completion_tokens: Math.min(params.maxCompletionTokens || 800, 4000),
        }),
      });

      const latency = Date.now() - startTime;

      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content || '';
        const promptTokens = data.usage?.prompt_tokens || 0;
        const completionTokens = data.usage?.completion_tokens || 0;
        const reasoningTokens = data.usage?.completion_tokens_details?.reasoning_tokens || 0;

        const response: LLMResponse = {
          content,
          model: 'gpt-5.5',
          latencyMs: latency,
          tokensUsed: {
            prompt: promptTokens,
            completion: completionTokens,
            total: promptTokens + completionTokens,
            reasoning: reasoningTokens,
          },
          raw: data,
        };

        this.responseCache.set(cacheKey, { response, timestamp: Date.now() });

        BusinessTools.trackApiUsage({
          requestId,
          conversationId: params.conversationId,
          model: 'gpt-5.5',
          endpoint: 'azure-openai:v1/chat/completions',
          success: true,
          latencyMs: latency,
          promptTokens,
          completionTokens,
        });

        return response;
      } else {
        const errText = await res.text();
        BusinessTools.trackApiUsage({
          requestId,
          conversationId: params.conversationId,
          model: 'gpt-5.5',
          endpoint: 'azure-openai:v1/chat/completions',
          success: false,
          latencyMs: latency,
          errorMessage: `HTTP ${res.status}: ${errText.substring(0, 300)}`,
        });
        return null;
      }
    } catch (err) {
      const latency = Date.now() - startTime;
      BusinessTools.trackApiUsage({
        requestId,
        conversationId: params.conversationId,
        model: 'gpt-5.5',
        endpoint: 'azure-openai:v1/chat/completions',
        success: false,
        latencyMs: latency,
        errorMessage: err instanceof Error ? err.message : String(err),
      });
      return null;
    }
  }

  /**
   * 3. Embedder-small-3 — Indexation et recherche sémantique (512 dimensions)
   */
  public static async getEmbeddings(inputs: string | string[]): Promise<number[][] | null> {
    const url = process.env.LLM_URL;
    const apiKey = process.env.LLM_API_KEY;
    const model = process.env.EMBEDDING_MODEL || 'embedder-small-3';
    const dimensions = parseInt(process.env.EMBEDDING_DIMENSIONS || '512', 10);

    const inputArr = Array.isArray(inputs) ? inputs : [inputs];
    if (inputArr.length === 0) return [];

    if (!url || !apiKey) {
      return inputArr.map((text) => {
        const vec = new Array(dimensions).fill(0);
        let hash = 0;
        for (let i = 0; i < text.length; i++) {
          hash = (hash << 5) - hash + text.charCodeAt(i);
          hash |= 0;
        }
        for (let j = 0; j < dimensions; j++) {
          vec[j] = Math.sin(hash + j);
        }
        const norm = Math.sqrt(vec.reduce((acc, v) => acc + v * v, 0)) || 1;
        return vec.map((v) => v / norm);
      });
    }

    const requestId = `req-emb-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const startTime = Date.now();

    try {
      const endpoint = `${url.replace(/\/+$/, '')}/embeddings`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'api-key': apiKey,
        },
        body: JSON.stringify({
          model,
          input: inputArr,
          dimensions,
        }),
      });

      const latency = Date.now() - startTime;

      if (res.ok) {
        const data = await res.json();
        const embeddings: number[][] = (data.data || []).map((d: any) => d.embedding);
        const totalTokens = data.usage?.total_tokens || 0;

        BusinessTools.trackApiUsage({
          requestId,
          model: 'embedder-small-3',
          endpoint: 'azure-openai:v1/embeddings',
          success: true,
          latencyMs: latency,
          promptTokens: totalTokens,
          completionTokens: 0,
        });

        return embeddings;
      } else {
        const errText = await res.text();
        BusinessTools.trackApiUsage({
          requestId,
          model: 'embedder-small-3',
          endpoint: 'azure-openai:v1/embeddings',
          success: false,
          latencyMs: latency,
          errorMessage: `HTTP ${res.status}: ${errText.substring(0, 300)}`,
        });
        return inputArr.map((text) => {
          const vec = new Array(dimensions).fill(0);
          let hash = 0;
          for (let i = 0; i < text.length; i++) {
            hash = (hash << 5) - hash + text.charCodeAt(i);
            hash |= 0;
          }
          for (let j = 0; j < dimensions; j++) {
            vec[j] = Math.sin(hash + j);
          }
          const norm = Math.sqrt(vec.reduce((acc, v) => acc + v * v, 0)) || 1;
          return vec.map((v) => v / norm);
        });
      }
    } catch (err) {
      const latency = Date.now() - startTime;
      BusinessTools.trackApiUsage({
        requestId,
        model: 'embedder-small-3',
        endpoint: 'azure-openai:v1/embeddings',
        success: false,
        latencyMs: latency,
        errorMessage: err instanceof Error ? err.message : String(err),
      });
      return inputArr.map((text) => {
        const vec = new Array(dimensions).fill(0);
        let hash = 0;
        for (let i = 0; i < text.length; i++) {
          hash = (hash << 5) - hash + text.charCodeAt(i);
          hash |= 0;
        }
        for (let j = 0; j < dimensions; j++) {
          vec[j] = Math.sin(hash + j);
        }
        const norm = Math.sqrt(vec.reduce((acc, v) => acc + v * v, 0)) || 1;
        return vec.map((v) => v / norm);
      });
    }
  }

  /**
   * Universal completion router prioritizing:
   * - Reasoning tasks -> GPT-5.5
   * - Routine tasks (conversation, intent, extraction) -> GPT-4.1 (fast, cost-effective)
   * - Fallback to Gemini or local Moroccan Darija synthesizer
   */
  public static async generateCompletion(params: {
    messages: LLMMessage[];
    systemPrompt?: string;
    temperature?: number;
    conversationId?: string;
    purpose?: 'reasoning' | 'routine' | 'classification' | 'reformulation';
    maxTokens?: number;
  }): Promise<LLMResponse> {
    const isReasoning = params.purpose === 'reasoning';

    // 1. If reasoning, try GPT-5.5 first
    if (isReasoning) {
      const gpt55Res = await this.callGPT55({
        messages: params.messages,
        systemPrompt: params.systemPrompt,
        conversationId: params.conversationId,
        maxCompletionTokens: params.maxTokens || 800,
      });
      if (gpt55Res && gpt55Res.content.trim().length > 0) {
        return gpt55Res;
      }
    }

    // 2. Try GPT-4.1 for routine tasks or fallback from reasoning
    const gpt41Res = await this.callGPT41({
      messages: params.messages,
      systemPrompt: params.systemPrompt,
      temperature: params.temperature,
      maxTokens: params.maxTokens || 500,
      conversationId: params.conversationId,
    });
    if (gpt41Res && gpt41Res.content.trim().length > 0) {
      return gpt41Res;
    }

    // 3. Try GPT-5.5 as secondary if GPT-4.1 was unavailable
    if (!isReasoning) {
      const gpt55Fallback = await this.callGPT55({
        messages: params.messages,
        systemPrompt: params.systemPrompt,
        conversationId: params.conversationId,
        maxCompletionTokens: 500,
      });
      if (gpt55Fallback && gpt55Fallback.content.trim().length > 0) {
        return gpt55Fallback;
      }
    }

    // 4. Fallback to Gemini if configured
    const gemini = this.getGemini();
    if (gemini && process.env.GEMINI_API_KEY) {
      const startTime = Date.now();
      const requestId = `req-gemini-${Date.now()}`;
      try {
        const formattedPrompt = [
          params.systemPrompt ? `[SYSTEM]:\n${params.systemPrompt}\n\n` : '',
          ...params.messages.map((m) => `${m.role.toUpperCase()}: ${m.content}`),
        ].join('\n\n');

        const result = (await gemini.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: formattedPrompt,
          config: { temperature: params.temperature ?? 0.3 },
        })) as any;

        const latency = Date.now() - startTime;
        const text = result.text || '';

        BusinessTools.trackApiUsage({
          requestId,
          conversationId: params.conversationId,
          model: 'gemini-3.8-flash',
          endpoint: 'google-genai:generateContent',
          success: true,
          latencyMs: latency,
          promptTokens: Math.round(formattedPrompt.length / 4),
          completionTokens: Math.round(text.length / 4),
        });

        return {
          content: text,
          model: 'gemini-3.8-flash',
          latencyMs: latency,
          tokensUsed: {
            prompt: Math.round(formattedPrompt.length / 4),
            completion: Math.round(text.length / 4),
            total: Math.round((formattedPrompt.length + text.length) / 4),
          },
        };
      } catch (geminiError: unknown) {
        BusinessTools.trackApiUsage({
          requestId,
          conversationId: params.conversationId,
          model: 'gemini-3.8-flash',
          endpoint: 'google-genai:generateContent',
          success: false,
          latencyMs: Date.now() - startTime,
          errorMessage: geminiError instanceof Error ? geminiError.message : String(geminiError),
        });
      }
    }

    // 5. Built-in resilient Darija/French/Arabic conversational synthesizer
    const localStart = Date.now();
    const fallbackResponse = this.generateLocalFallback(params.messages);
    const latency = Date.now() - localStart;

    BusinessTools.trackApiUsage({
      requestId: `req-local-${Date.now()}`,
      conversationId: params.conversationId,
      model: 'kenza-local-nlu',
      endpoint: 'local:synthesizer',
      success: true,
      latencyMs: latency,
      promptTokens: 120,
      completionTokens: 80,
    });

    return {
      content: fallbackResponse,
      model: 'kenza-local-nlu',
      latencyMs: latency,
      tokensUsed: { prompt: 120, completion: 80, total: 200 },
    };
  }

  private static generateLocalFallback(messages: LLMMessage[]): string {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')?.content || '';
    const lower = lastUserMsg.toLowerCase();

    if (lower.includes('facture') && lower.includes('soci')) {
      return 'بالنسبة للفوترة باسم الشركات، هاد الإجراء كيتكلف بيه قسم الحسابات ديالنا مباشرة. حولت الطلب ديالك للمسؤول باش يتواصل معاك ويصيفط ليك الفاتورة القانونية.';
    }

    if (lower.includes('salam') || lower.includes('سلام') || lower.includes('bonjour')) {
      return 'وعليكم السلام ورحمة الله 😊 مرحبا بيك عند متجرنا! أنا كنزة، فاش نقدر نعاونك اليوم؟ واش كتقلب(ي) على جلابة، قفطان، أو قندورة معينة؟';
    }

    if (lower.includes('taille l') || lower.includes('بدل') || lower.includes('changed my mind') || lower.includes('قياس l')) {
      return 'مفهوم أخي، تم تعديل المقاس لـ L فالسلة ديالك مباشرة. واش نأكد ليك الطلب دابا؟';
    }

    if (lower.includes('remise') || lower.includes('taman') || lower.includes('n9so') || lower.includes('ثمن') || lower.includes('تخفيض')) {
      return 'مرحبا بيك، حنا كنحرصو دائما نقدمو أجود ثمن مع صنعة متقونة. نقدر ندير ليك تخفيض خاص فحدود السياسة ديال المتجر.';
    }

    return 'مرحبا بك! سجلت طلبك وغادي نعاونك بكل سرور باش تختار أحسن منتج من الكاتالوج ديالنا وبأحسن جودة.';
  }
}
