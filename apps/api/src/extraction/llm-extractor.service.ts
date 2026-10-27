import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface ExtractedFields {
  summary: string;
  eligibilitySummary?: string;
  benefitAmountMin?: number;
  benefitAmountMax?: number;
  currency?: string;
  confidence: number;
}

@Injectable()
export class LlmExtractorService {
  private readonly logger = new Logger(LlmExtractorService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Selectively uses an LLM for complex unstructured text extraction.
   * If no LLM API key is configured, uses a deterministic rule-based heuristic fallback.
   */
  async extractUnstructuredFields(rawText: string, title?: string): Promise<ExtractedFields> {
    const geminiKey = this.configService.get<string>('GEMINI_API_KEY');
    const openaiKey = this.configService.get<string>('OPENAI_API_KEY');

    // 1. If Gemini API key is configured
    if (geminiKey) {
      try {
        return await this.callGemini(rawText, geminiKey);
      } catch (err: any) {
        this.logger.warn(`Gemini extraction failed: ${err.message}. Falling back to deterministic rules.`);
      }
    }

    // 2. If OpenAI API key is configured
    if (openaiKey) {
      try {
        return await this.callOpenAi(rawText, openaiKey);
      } catch (err: any) {
        this.logger.warn(`OpenAI extraction failed: ${err.message}. Falling back to deterministic rules.`);
      }
    }

    // 3. Deterministic heuristic fallback (zero cost, 100% reliable)
    return this.deterministicFallback(rawText, title);
  }

  private deterministicFallback(rawText: string, title?: string): ExtractedFields {
    // 1. Generate clean summary from first 300 chars
    const summary = rawText.slice(0, 300).replace(/\s+/g, ' ').trim();

    // 2. Extract potential grant/subsidy amount using regex (e.g. ₹50 Lakhs, Rs. 10,00,000, 1 Crore)
    let minAmount: number | undefined;
    let maxAmount: number | undefined;
    let currency = 'INR';

    const lakhMatch = rawText.match(/(?:Rs\.?|INR|₹)?\s*(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|lac|lacs)/i);
    const croreMatch = rawText.match(/(?:Rs\.?|INR|₹)?\s*(\d+(?:\.\d+)?)\s*(?:crore|crores|cr)/i);

    if (croreMatch) {
      maxAmount = parseFloat(croreMatch[1]) * 10000000;
    } else if (lakhMatch) {
      maxAmount = parseFloat(lakhMatch[1]) * 100000;
    }

    // 3. Extract eligibility sentences
    const eligibilitySentences: string[] = [];
    const sentences = rawText.split(/[.!?]+/);
    for (const s of sentences) {
      const lower = s.toLowerCase();
      if (lower.includes('eligible') || lower.includes('criteria') || lower.includes('dpiit') || lower.includes('registered')) {
        eligibilitySentences.push(s.trim());
      }
      if (eligibilitySentences.length >= 2) break;
    }

    return {
      summary: summary || title || 'Announcement details available on official portal.',
      eligibilitySummary: eligibilitySentences.join('. ') || undefined,
      benefitAmountMin: minAmount,
      benefitAmountMax: maxAmount,
      currency,
      confidence: 0.85,
    };
  }

  private async callGemini(rawText: string, apiKey: string): Promise<ExtractedFields> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const prompt = `Analyze this Indian startup opportunity text and return a valid JSON object with fields:
- summary: string (under 50 words)
- eligibilitySummary: string or null
- benefitAmountMin: number or null
- benefitAmountMax: number or null
- currency: "INR"

Text:
"""
${rawText.slice(0, 4000)}
"""`;

    const res = await axios.post(url, {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' },
    }, { timeout: 10000 });

    const rawJson = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsed = JSON.parse(rawJson);
    return {
      summary: parsed.summary,
      eligibilitySummary: parsed.eligibilitySummary || undefined,
      benefitAmountMin: parsed.benefitAmountMin || undefined,
      benefitAmountMax: parsed.benefitAmountMax || undefined,
      currency: parsed.currency || 'INR',
      confidence: 0.95,
    };
  }

  private async callOpenAi(rawText: string, apiKey: string): Promise<ExtractedFields> {
    const res = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Extract startup grant/opportunity details into JSON.' },
          { role: 'user', content: rawText.slice(0, 4000) },
        ],
        response_format: { type: 'json_object' },
      },
      {
        headers: { Authorization: `Bearer ${apiKey}` },
        timeout: 10000,
      },
    );

    const parsed = JSON.parse(res.data.choices[0].message.content);
    return {
      summary: parsed.summary || rawText.slice(0, 200),
      eligibilitySummary: parsed.eligibilitySummary || undefined,
      benefitAmountMin: parsed.benefitAmountMin || undefined,
      benefitAmountMax: parsed.benefitAmountMax || undefined,
      currency: parsed.currency || 'INR',
      confidence: 0.95,
    };
  }
}
