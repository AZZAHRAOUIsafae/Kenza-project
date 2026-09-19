import OpenAI from 'openai';

/**
 * Client LLM connecté à l'endpoint Numeos (spécification compatible OpenAI v1).
 * Optimisé pour la compréhension et génération de Darija marocaine authentique,
 * de l'arabe classique et du français.
 */

const NUMEOS_BASE_URL = process.env.NUMEOS_BASE_URL || 'https://api.numeos.ai/v1';
const NUMEOS_API_KEY = process.env.NUMEOS_API_KEY || 'dummy_token_numeos';
export const NUMEOS_MODEL = process.env.NUMEOS_MODEL_NAME || 'numeos-darija-v1';

export const numeosClient = new OpenAI({
  baseURL: NUMEOS_BASE_URL,
  apiKey: NUMEOS_API_KEY,
});

export interface NumeosChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function generateNumeosResponse(
  messages: NumeosChatMessage[],
  temperature = 0.4
): Promise<string> {
  try {
    const response = await numeosClient.chat.completions.create({
      model: NUMEOS_MODEL,
      messages,
      temperature,
      max_tokens: 600,
    });

    return response.choices[0]?.message?.content || 'Marhba bik f Maison Kenza !';
  } catch (error) {
    console.error('[Numeos Endpoint Error]', error);
    // Fallback gracieux si l'API externe est injoignable
    throw error;
  }
}
