// OpenRouter Provider - Access to Grok and other models via OpenRouter
import type { LLMProviderName, LLMPrompt, LLMResponse } from '../types';

// OpenRouter API endpoint (OpenAI-compatible)
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export class OpenRouterProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  get name(): LLMProviderName {
    return 'openrouter';
  }

  async sendRequest<T>(prompt: LLMPrompt): Promise<LLMResponse<T>> {
    const startTime = Date.now();

    try {
      const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin, // Required by OpenRouter
          'X-Title': 'WanderForge', // Optional - shows in OpenRouter dashboard
        },
        body: JSON.stringify({
          model: 'x-ai/grok-3-mini-beta', // Grok 3 Mini - fast and capable
          messages: [
            { role: 'system', content: prompt.system },
            { role: 'user', content: prompt.user }
          ],
          temperature: 0.3, // Low for precise extraction
          max_tokens: 4096,
          response_format: { type: 'json_object' }, // Force JSON output
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const textContent = data.choices?.[0]?.message?.content;

      if (!textContent) {
        throw new Error('No content in OpenRouter response');
      }

      // Parse JSON from response
      const parsed = this.parseJSONResponse<T>(textContent);

      if (!parsed) {
        throw new Error('Failed to parse JSON from OpenRouter response');
      }

      return {
        success: true,
        data: parsed,
        provider: 'openrouter',
        latencyMs: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: 'openrouter',
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
