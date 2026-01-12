/**
 * AI Features for MedInvest
 * - Content moderation
 * - Post summarization
 * - Deal analysis
 * - Smart search
 * - Personalized recommendations
 */

import OpenAI from 'openai';

function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn('OpenAI API key not configured - AI features will be limited');
    return null;
  }
  return new OpenAI({ apiKey });
}

export interface ModerationResult {
  flagged: boolean;
  categories: {
    harassment: boolean;
    hate: boolean;
    selfHarm: boolean;
    sexual: boolean;
    violence: boolean;
    spam: boolean;
    misinformation: boolean;
  };
  confidence: number;
  action: 'allow' | 'flag' | 'block';
  reason?: string;
}

export async function moderateContent(content: string): Promise<ModerationResult> {
  const openai = getOpenAIClient();
  if (!openai) {
    return {
      flagged: false,
      categories: {
        harassment: false,
        hate: false,
        selfHarm: false,
        sexual: false,
        violence: false,
        spam: false,
        misinformation: false,
      },
      confidence: 0,
      action: 'allow',
    };
  }
  
  try {
    const moderation = await openai.moderations.create({
      input: content,
    });
    
    const result = moderation.results[0];
    const healthcareCheck = await analyzeHealthcareContent(content);
    
    return {
      flagged: result.flagged || healthcareCheck.flagged,
      categories: {
        harassment: result.categories.harassment,
        hate: result.categories.hate,
        selfHarm: result.categories['self-harm'],
        sexual: result.categories.sexual,
        violence: result.categories.violence,
        spam: healthcareCheck.isSpam,
        misinformation: healthcareCheck.isMisinformation,
      },
      confidence: Math.max(...Object.values(result.category_scores)),
      action: determineAction(result, healthcareCheck),
      reason: healthcareCheck.reason,
    };
  } catch (error) {
    console.error('Moderation error:', error);
    return {
      flagged: false,
      categories: {
        harassment: false,
        hate: false,
        selfHarm: false,
        sexual: false,
        violence: false,
        spam: false,
        misinformation: false,
      },
      confidence: 0,
      action: 'allow',
    };
  }
}

async function analyzeHealthcareContent(content: string) {
  const openai = getOpenAIClient();
  if (!openai) return { flagged: false, isSpam: false, isMisinformation: false };
  
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are a healthcare content moderator. Analyze the following content for:
1. Medical misinformation (dangerous health claims, anti-vaccine content, etc.)
2. Spam or promotional content
3. Unverified medical advice that could be harmful

Respond in JSON format:
{
  "flagged": boolean,
  "isSpam": boolean,
  "isMisinformation": boolean,
  "reason": "explanation if flagged"
}`
        },
        {
          role: 'user',
          content,
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 200,
    });
    
    return JSON.parse(response.choices[0].message.content || '{}');
  } catch {
    return { flagged: false, isSpam: false, isMisinformation: false };
  }
}

function determineAction(modResult: any, healthcareCheck: any): 'allow' | 'flag' | 'block' {
  if (modResult.categories.hate || modResult.categories['self-harm'] || healthcareCheck.isMisinformation) {
    return 'block';
  }
  if (modResult.flagged || healthcareCheck.flagged) {
    return 'flag';
  }
  return 'allow';
}

export interface PostSummary {
  summary: string;
  keyPoints: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
  topics: string[];
}

export async function summarizePost(content: string): Promise<PostSummary> {
  const openai = getOpenAIClient();
  if (!openai) {
    return { summary: '', keyPoints: [], sentiment: 'neutral', topics: [] };
  }
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: `Summarize healthcare investment content. Return JSON:
{
  "summary": "2-3 sentence summary",
  "keyPoints": ["key point 1", "key point 2"],
  "sentiment": "positive" | "negative" | "neutral",
  "topics": ["topic1", "topic2"]
}`
      },
      {
        role: 'user',
        content,
      },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 300,
  });
  
  return JSON.parse(response.choices[0].message.content || '{}');
}

export interface DealAnalysis {
  riskLevel: 'low' | 'medium' | 'high';
  strengths: string[];
  concerns: string[];
  marketAnalysis: string;
  recommendation: string;
  keyMetrics: {
    name: string;
    value: string;
    assessment: string;
  }[];
}

export async function analyzeDeal(dealInfo: {
  title: string;
  description: string;
  stage: string;
  targetRaise: number;
  sector: string;
}): Promise<DealAnalysis> {
  const openai = getOpenAIClient();
  if (!openai) {
    return { riskLevel: 'medium', strengths: [], concerns: [], marketAnalysis: '', recommendation: '', keyMetrics: [] };
  }
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: `You are a healthcare investment analyst. Analyze the deal and provide structured analysis in JSON:
{
  "riskLevel": "low" | "medium" | "high",
  "strengths": ["strength1", "strength2"],
  "concerns": ["concern1", "concern2"],
  "marketAnalysis": "brief market context",
  "recommendation": "investment recommendation",
  "keyMetrics": [{"name": "metric", "value": "value", "assessment": "good/bad/neutral"}]
}`
      },
      {
        role: 'user',
        content: JSON.stringify(dealInfo),
      },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 500,
  });
  
  return JSON.parse(response.choices[0].message.content || '{}');
}

export interface SearchEnhancement {
  expandedQuery: string;
  suggestedFilters: string[];
  relatedTerms: string[];
}

export async function enhanceSearch(query: string): Promise<SearchEnhancement> {
  const openai = getOpenAIClient();
  if (!openai) {
    return { expandedQuery: query, suggestedFilters: [], relatedTerms: [] };
  }
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: `Enhance healthcare investment search queries. Return JSON:
{
  "expandedQuery": "expanded search query with medical/investment synonyms",
  "suggestedFilters": ["filter1", "filter2"],
  "relatedTerms": ["term1", "term2"]
}`
      },
      {
        role: 'user',
        content: query,
      },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 200,
  });
  
  return JSON.parse(response.choices[0].message.content || '{}');
}

export interface Recommendation {
  id: string;
  type: 'deal' | 'post' | 'user' | 'room';
  score: number;
  reason: string;
}

export async function getRecommendations(userContext: {
  interests: string[];
  recentActivity: string[];
  specialty?: string;
}): Promise<Recommendation[]> {
  const openai = getOpenAIClient();
  if (!openai) return [];
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: `Generate personalized healthcare investment recommendations. Return JSON array:
[{
  "id": "item_id",
  "type": "deal" | "post" | "user" | "room",
  "score": 0.0-1.0,
  "reason": "why recommended"
}]`
      },
      {
        role: 'user',
        content: JSON.stringify(userContext),
      },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 400,
  });
  
  const result = JSON.parse(response.choices[0].message.content || '{}');
  return result.recommendations || [];
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function chatWithAssistant(
  messages: ChatMessage[],
  userContext?: { specialty?: string; investorType?: string }
): Promise<string> {
  const systemPrompt = `You are MedInvest AI, a helpful assistant for healthcare investing.
${userContext?.specialty ? `User specialty: ${userContext.specialty}` : ''}
${userContext?.investorType ? `Investor type: ${userContext.investorType}` : ''}

Help users with:
- Understanding healthcare investment opportunities
- Explaining medical/biotech concepts
- Navigating the MedInvest platform
- Investment analysis and due diligence

Be professional, accurate, and helpful. If unsure about medical advice, recommend consulting professionals.`;

  const openai = getOpenAIClient();
  if (!openai) {
    return 'AI assistant is not available. Please try again later.';
  }

  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    ],
    max_tokens: 500,
    temperature: 0.7,
  });
  
  return response.choices[0].message.content || 'I apologize, I could not generate a response.';
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const openai = getOpenAIClient();
  if (!openai) return [];
  
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });
  
  return response.data[0].embedding;
}

export const AIService = {
  moderateContent,
  summarizePost,
  analyzeDeal,
  enhanceSearch,
  getRecommendations,
  chatWithAssistant,
  generateEmbedding,
};

export default AIService;
