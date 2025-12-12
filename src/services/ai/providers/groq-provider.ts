// Groq Provider - Fast LLM using Llama 3.1 70B
import type { LLMProviderName, LLMPrompt, LLMResponse } from '../types';

// Groq uses OpenAI-compatible API
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export class GroqProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  get name(): LLMProviderName {
    return 'groq';
  }

  async sendRequest<T>(prompt: LLMPrompt): Promise<LLMResponse<T>> {
    const startTime = Date.now();

    try {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',  // Latest Llama 3.3 - best for extraction
          messages: [
            { role: 'system', content: prompt.system },
            { role: 'user', content: prompt.user }
          ],
          temperature: 0.3,  // Low for precise extraction
          max_tokens: 4096,
          response_format: { type: 'json_object' },  // Force JSON output
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Groq API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const textContent = data.choices?.[0]?.message?.content;

      if (!textContent) {
        throw new Error('No content in Groq response');
      }

      // Parse JSON from response
      const parsed = this.parseJSONResponse<T>(textContent);

      if (!parsed) {
        throw new Error('Failed to parse JSON from Groq response');
      }

      return {
        success: true,
        data: parsed,
        provider: 'groq',
        latencyMs: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: 'groq',
        latencyMs: Date.now() - startTime,
      };
    }
  }

  private parseJSONResponse<T>(text: string): T | null {
    // Remove markdown code blocks if present
    let jsonStr = text.trim();

    // Handle ```json ... ``` or ``` ... ```
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    try {
      return JSON.parse(jsonStr);
    } catch {
      // Try to find JSON object in the text
      const objectMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (objectMatch) {
        try {
          return JSON.parse(objectMatch[0]);
        } catch {
          return null;
        }
      }
      return null;
    }
  }
}
