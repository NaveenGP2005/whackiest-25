// Web Search Service for Place Research
// Uses DuckDuckGo API with CORS proxy, falls back to LLM knowledge

import type { WebSearchResult, PlaceSearchResults } from './place-research.types';
import { LLMProviderManager } from '../ai/providers';

// CORS proxy for browser-based requests
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';
const DUCKDUCKGO_API = 'https://api.duckduckgo.com/';

// Rate limiting
let lastSearchTime = 0;
const SEARCH_DELAY_MS = 1000; // 1 second between searches

/**
 * Wait to respect rate limits
 */
async function waitForRateLimit(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastSearchTime;
  if (elapsed < SEARCH_DELAY_MS) {
    await new Promise(r => setTimeout(r, SEARCH_DELAY_MS - elapsed));
  }
  lastSearchTime = Date.now();
}

/**
 * Search DuckDuckGo Instant Answer API
 * Returns structured results about a place
 */
async function searchDuckDuckGo(query: string): Promise<WebSearchResult[]> {
  await waitForRateLimit();

  const encodedQuery = encodeURIComponent(query);
  const apiUrl = `${DUCKDUCKGO_API}?q=${encodedQuery}&format=json&no_html=1&skip_disambig=1`;
  const proxyUrl = `${CORS_PROXY}${encodeURIComponent(apiUrl)}`;

  try {
    const response = await fetch(proxyUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`DuckDuckGo API error: ${response.status}`);
    }

    const data = await response.json();
    const results: WebSearchResult[] = [];

    // Main abstract (usually from Wikipedia)
    if (data.Abstract && data.AbstractText) {
      results.push({
        title: data.Heading || query,
        url: data.AbstractURL || '',
        snippet: data.AbstractText,
        displayUrl: data.AbstractSource || 'Wikipedia',
      });
    }

    // Related topics
    if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
      for (const topic of data.RelatedTopics.slice(0, 5)) {
        if (topic.Text && topic.FirstURL) {
          results.push({
            title: topic.Text.split(' - ')[0] || topic.Text.substring(0, 50),
            url: topic.FirstURL,
            snippet: topic.Text,
          });
        }
        // Handle nested topics (categories)
        if (topic.Topics && Array.isArray(topic.Topics)) {
          for (const subTopic of topic.Topics.slice(0, 2)) {
            if (subTopic.Text && subTopic.FirstURL) {
              results.push({
                title: subTopic.Text.split(' - ')[0] || subTopic.Text.substring(0, 50),
                url: subTopic.FirstURL,
                snippet: subTopic.Text,
              });
            }
          }
        }
      }
    }

    // Infobox data (structured info)
    if (data.Infobox && data.Infobox.content) {
      const infoSnippets = data.Infobox.content
        .filter((item: { label?: string; value?: string }) => item.label && item.value)
        .map((item: { label: string; value: string }) => `${item.label}: ${item.value}`)
        .join('. ');

      if (infoSnippets) {
        results.push({
          title: `${query} - Details`,
          url: data.AbstractURL || '',
          snippet: infoSnippets,
        });
      }
    }

    return results;
  } catch (error) {
    console.warn('[WebSearch] DuckDuckGo search failed:', error);
    return [];
  }
}

/**
 * Search using Serper.dev (Google Search API)
 * Free tier: 2,500 queries/month
 * Get API key at: https://serper.dev
 */
async function searchSerper(query: string): Promise<WebSearchResult[]> {
  const apiKey = import.meta.env.VITE_SERPER_API_KEY;

  if (!apiKey) {
    return [];
  }

  await waitForRateLimit();

  try {
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: query,
        num: 5,
      }),
    });

    if (!response.ok) {
      throw new Error(`Serper API error: ${response.status}`);
    }

    const data = await response.json();

    const results: WebSearchResult[] = [];

    // Add organic results
    if (data.organic) {
      for (const item of data.organic.slice(0, 5)) {
        results.push({
          title: item.title,
          url: item.link,
          snippet: item.snippet,
          displayUrl: item.displayLink,
        });
      }
    }

    // Add knowledge graph if available
    if (data.knowledgeGraph) {
      const kg = data.knowledgeGraph;
      if (kg.description) {
        results.unshift({
          title: kg.title || query,
          url: kg.website || '',
          snippet: kg.description,
          displayUrl: 'Knowledge Graph',
        });
      }
    }

    return results;
  } catch (error) {
    console.warn('[WebSearch] Serper search failed:', error);
    return [];
  }
}

/**
 * Search using Tavily API (AI-optimized search)
 * Free tier: 1,000 queries/month
 * Get API key at: https://tavily.com
 */
async function searchTavily(query: string): Promise<WebSearchResult[]> {
  const apiKey = import.meta.env.VITE_TAVILY_API_KEY;

  if (!apiKey) {
    return [];
  }

  await waitForRateLimit();

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        query: query,
        search_depth: 'basic',
        max_results: 5,
        include_answer: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`Tavily API error: ${response.status}`);
    }

    const data = await response.json();

    const results: WebSearchResult[] = [];

    // Add AI-generated answer if available
    if (data.answer) {
      results.push({
        title: `About: ${query}`,
        url: '',
        snippet: data.answer,
        displayUrl: 'Tavily AI',
      });
    }

    // Add search results
    if (data.results) {
      for (const item of data.results.slice(0, 4)) {
        results.push({
          title: item.title,
          url: item.url,
          snippet: item.content,
        });
      }
    }

    return results;
  } catch (error) {
    console.warn('[WebSearch] Tavily search failed:', error);
    return [];
  }
}

/**
 * Search using Google Custom Search (if API key available)
 * More comprehensive but requires API key
 */
async function searchGoogle(query: string): Promise<WebSearchResult[]> {
  const apiKey = import.meta.env.VITE_GOOGLE_SEARCH_API_KEY;
  const searchEngineId = import.meta.env.VITE_GOOGLE_SEARCH_ENGINE_ID;

  if (!apiKey || !searchEngineId) {
    return [];
  }

  await waitForRateLimit();

  try {
    const response = await fetch(
      `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${encodeURIComponent(query)}&num=5`
    );

    if (!response.ok) {
      throw new Error(`Google Search API error: ${response.status}`);
    }

    const data = await response.json();

    return (data.items || []).map((item: { title: string; link: string; snippet: string; displayLink?: string }) => ({
      title: item.title,
      url: item.link,
      snippet: item.snippet,
      displayUrl: item.displayLink,
    }));
  } catch (error) {
    console.warn('[WebSearch] Google search failed:', error);
    return [];
  }
}

/**
 * Use LLM to generate knowledge about a place from its training data
 * This is a fallback when web search fails or returns insufficient results
 */
async function getLLMKnowledge(placeName: string, region: string): Promise<WebSearchResult[]> {
  const llmManager = new LLMProviderManager();

  const prompt = {
    system: `You are a knowledgeable travel guide with extensive information about tourist destinations worldwide.
Provide accurate, factual information about places. If you're not certain about specific details, indicate that.
Return your response as a JSON object.`,
    user: `Provide detailed travel information about "${placeName}" in ${region}.

Return JSON with these exact fields:
{
  "description": "2-3 sentence description of the place",
  "bestTimeToVisit": "Best time of day/season to visit and why",
  "typicalDuration": "How long visitors typically spend (in minutes as number)",
  "openingHours": "Typical opening hours like '09:00-18:00' or 'Open 24 hours' or 'Varies'",
  "entryFee": "Entry fee in INR (number) or null if free",
  "highlights": "Top 3 things to see/do there",
  "nearbyAttractions": "2-3 nearby places worth visiting",
  "nearbyRestaurants": "2-3 popular restaurants nearby",
  "crowdInfo": "When it gets crowded vs quiet times",
  "tips": "1-2 practical tips for visitors"
}`
  };

  try {
    const response = await llmManager.executeWithFallback<{
      description: string;
      bestTimeToVisit: string;
      typicalDuration: number;
      openingHours: string;
      entryFee: number | null;
      highlights: string;
      nearbyAttractions: string;
      nearbyRestaurants: string;
      crowdInfo: string;
      tips: string;
    }>(prompt);

    if (response.success && response.data) {
      const data = response.data;

      // Convert LLM response to search results format
      return [
        {
          title: placeName,
          url: `https://www.google.com/search?q=${encodeURIComponent(placeName + ' ' + region)}`,
          snippet: data.description || `${placeName} is a popular destination in ${region}.`,
        },
        {
          title: `${placeName} - Visitor Information`,
          url: '',
          snippet: `Best time: ${data.bestTimeToVisit || 'Morning or evening'}. Duration: ${data.typicalDuration || 60} minutes. Hours: ${data.openingHours || 'Varies'}. ${data.entryFee ? `Entry: ₹${data.entryFee}` : 'Free entry'}.`,
        },
        {
          title: `${placeName} - Highlights & Tips`,
          url: '',
          snippet: `Highlights: ${data.highlights || 'Various attractions'}. Tips: ${data.tips || 'Carry water and comfortable shoes'}.`,
        },
        {
          title: `Near ${placeName} - Food & Attractions`,
          url: '',
          snippet: `Nearby restaurants: ${data.nearbyRestaurants || 'Local eateries available'}. Nearby attractions: ${data.nearbyAttractions || 'Other tourist spots in the area'}.`,
        },
        {
          title: `${placeName} - Crowd Information`,
          url: '',
          snippet: data.crowdInfo || 'Can get busy during peak tourist season and weekends.',
        },
      ];
    }
  } catch (error) {
    console.warn('[WebSearch] LLM knowledge extraction failed:', error);
  }

  return [];
}

/**
 * Main search function - combines multiple sources with smart fallback
 * Priority: Serper → Tavily → DuckDuckGo → Google → LLM Knowledge
 *
 * Note: Works WITHOUT any API keys using DuckDuckGo + LLM fallback
 */
export async function searchPlace(
  placeName: string,
  region: string,
  additionalTerms: string[] = []
): Promise<PlaceSearchResults> {
  const baseQuery = `${placeName} ${region}`;
  const travelQuery = `${baseQuery} travel guide ${additionalTerms.join(' ')}`.trim();

  console.log(`[WebSearch] Searching for: ${travelQuery}`);

  let results: WebSearchResult[] = [];
  let searchEngine: 'duckduckgo' | 'brave' | 'serper' = 'duckduckgo';

  // Try Serper first (best quality, if API key available)
  results = await searchSerper(travelQuery);
  if (results.length >= 3) {
    searchEngine = 'serper';
    console.log(`[WebSearch] Using Serper (${results.length} results)`);
  }

  // Try Tavily (AI-optimized, good for travel info)
  if (results.length < 3) {
    const tavilyResults = await searchTavily(travelQuery);
    results = [...results, ...tavilyResults];
    if (tavilyResults.length > 0) {
      console.log(`[WebSearch] Added Tavily results (${tavilyResults.length})`);
    }
  }

  // Try DuckDuckGo (free, no API key needed)
  if (results.length < 3) {
    const duckResults = await searchDuckDuckGo(travelQuery);
    results = [...results, ...duckResults];
    if (duckResults.length > 0) {
      console.log(`[WebSearch] Added DuckDuckGo results (${duckResults.length})`);
    }
  }

  // Try Google Custom Search (if configured)
  if (results.length < 3) {
    const googleResults = await searchGoogle(travelQuery);
    results = [...results, ...googleResults];
    if (googleResults.length > 0) {
      console.log(`[WebSearch] Added Google results (${googleResults.length})`);
    }
  }

  // Final fallback: LLM knowledge extraction
  if (results.length < 3) {
    console.log('[WebSearch] Using LLM knowledge fallback');
    const llmResults = await getLLMKnowledge(placeName, region);
    results = [...results, ...llmResults];
  }

  // Deduplicate by URL/title
  const seen = new Set<string>();
  results = results.filter(r => {
    const key = r.url || r.title;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  console.log(`[WebSearch] Found ${results.length} results for ${placeName}`);

  return {
    query: travelQuery,
    results: results.slice(0, 10), // Max 10 results
    totalResults: results.length,
    searchEngine,
  };
}

/**
 * Search for nearby restaurants/cafes around a location
 */
export async function searchNearbyFood(
  mainPlaceName: string,
  region: string
): Promise<WebSearchResult[]> {
  const query = `best restaurants cafes near ${mainPlaceName} ${region}`;

  console.log(`[WebSearch] Searching nearby food: ${query}`);

  // Try DuckDuckGo
  let results = await searchDuckDuckGo(query);

  // Supplement with LLM if needed
  if (results.length < 2) {
    const llmResults = await getLLMKnowledge(`restaurants near ${mainPlaceName}`, region);
    results = [...results, ...llmResults];
  }

  return results.slice(0, 5);
}

/**
 * Search for nearby attractions around a location
 */
export async function searchNearbyAttractions(
  mainPlaceName: string,
  region: string
): Promise<WebSearchResult[]> {
  const query = `tourist attractions places to visit near ${mainPlaceName} ${region}`;

  console.log(`[WebSearch] Searching nearby attractions: ${query}`);

  let results = await searchDuckDuckGo(query);

  if (results.length < 2) {
    const llmResults = await getLLMKnowledge(`attractions near ${mainPlaceName}`, region);
    results = [...results, ...llmResults];
  }

  return results.slice(0, 5);
}
