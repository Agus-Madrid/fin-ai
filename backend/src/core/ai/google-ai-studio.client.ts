import { ServiceUnavailableException } from '@nestjs/common';
import { AiClient } from './ai.client';
import {
  ExtractedTransaction,
  GeminiGenerateContentResponse,
  GoogleAiStudioClientOptions,
  ModelExtractionPayload,
  ExtractStatementInput,
  ExtractStatementResult,
} from './interfaces';

export class GoogleAiStudioClient implements AiClient {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly apiBaseUrl: string;

  constructor(options: GoogleAiStudioClientOptions) {
    this.apiKey = options.apiKey.trim();
    this.model = options.model.trim();
    this.apiBaseUrl = (options.apiBaseUrl ?? 'https://generativelanguage.googleapis.com')
      .trim()
      .replace(/\/+$/, '');
  }

  async extractStatement(
    input: ExtractStatementInput,
  ): Promise<ExtractStatementResult> {
    const endpoint = `${this.apiBaseUrl}/v1beta/models/${encodeURIComponent(this.model)}:generateContent?key=${encodeURIComponent(this.apiKey)}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(this.buildRequestBody(input)),
    });

    if (!response.ok) {
      const responseBody = await response.text().catch(() => '');
      throw new ServiceUnavailableException(
        `Google AI Studio request failed with status ${response.status}${responseBody ? `: ${responseBody}` : ''}`,
      );
    }

    const data = (await response.json()) as GeminiGenerateContentResponse;
    const modelText = this.readModelText(data);
    const parsedPayload = this.parseModelPayload(modelText);

    const warnings = this.toWarnings(parsedPayload.warnings);
    const normalized = this.normalizeTransactions(parsedPayload.transactions);

    return {
      transactions: normalized.transactions,
      warnings: [...warnings, ...normalized.warnings],
    };
  }

  private buildRequestBody(input: ExtractStatementInput) {
    const prompt = this.buildExtractionPrompt(input.filename);

    return {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: prompt,
            },
            {
              inline_data: {
                mime_type: input.contentType,
                data: input.buffer.toString('base64'),
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: 'application/json',
      },
    };
  }

  private buildExtractionPrompt(filename: string): string {
    return [
      'You extract bank statement transactions from a PDF file.',
      `Filename: ${filename}`,
      'Return JSON only. No markdown.',
      'Expected JSON format:',
      '{',
      '  "transactions": [',
      '    {',
      '      "date": "YYYY-MM-DD",',
      '      "merchant": "string",',
      '      "amount": 123.45,',
      '      "currency": "UYU|USD|EUR|...",',
      '      "category": "string optional",',
      '      "confidence": 0.0',
      '    }',
      '  ],',
      '  "warnings": ["string"]',
      '}',
      'Rules:',
      '- Include only expense transactions.',
      '- Amount must be positive decimal number.',
      '- Skip rows that are not transactions.',
      '- If uncertain, add a warning.',
    ].join('\n');
  }

  private readModelText(response: GeminiGenerateContentResponse): string {
    const text =
      response.candidates?.[0]?.content?.parts?.find(
        (part) => typeof part.text === 'string' && part.text.trim().length > 0,
      )?.text ?? '';

    if (!text) {
      throw new ServiceUnavailableException(
        'Google AI Studio returned an empty response payload',
      );
    }

    return text;
  }

  private parseModelPayload(text: string): ModelExtractionPayload {
    try {
      const parsed = JSON.parse(text) as ModelExtractionPayload;
      if (!parsed || typeof parsed !== 'object') {
        return {};
      }

      return parsed;
    } catch {
      throw new ServiceUnavailableException(
        'Google AI Studio returned non-JSON output',
      );
    }
  }

  private toWarnings(rawWarnings: unknown): string[] {
    if (!Array.isArray(rawWarnings)) {
      return [];
    }

    return rawWarnings
      .map((warning) => (typeof warning === 'string' ? warning.trim() : ''))
      .filter((warning) => warning.length > 0);
  }

  private normalizeTransactions(rawTransactions: unknown): {
    transactions: ExtractedTransaction[];
    warnings: string[];
  } {
    if (!Array.isArray(rawTransactions)) {
      return {
        transactions: [],
        warnings: ['Model response did not include a valid transactions array.'],
      };
    }

    const warnings: string[] = [];
    const transactions: ExtractedTransaction[] = [];

    for (const row of rawTransactions) {
      if (!row || typeof row !== 'object') {
        warnings.push('Skipped invalid transaction row.');
        continue;
      }

      const candidate = row as Record<string, unknown>;
      const date = this.readStringField(candidate.date);
      const merchant = this.readStringField(candidate.merchant);
      const amount = this.readNumericField(candidate.amount);
      const currencyRaw = this.readStringField(candidate.currency);
      const category = this.readStringField(candidate.category) || undefined;
      const confidence = this.readNumericField(candidate.confidence, true);

      if (
        !date ||
        !merchant ||
        amount === null ||
        !Number.isFinite(amount) ||
        amount <= 0
      ) {
        warnings.push('Skipped transaction due to missing required fields.');
        continue;
      }

      const currency = currencyRaw ? currencyRaw.toUpperCase() : 'UYU';
      if (!currencyRaw) {
        warnings.push(
          `Missing currency for transaction "${merchant}" on "${date}". Defaulted to UYU.`,
        );
      }

      transactions.push({
        date,
        merchant,
        amount,
        currency,
        category,
        confidence: confidence ?? undefined,
      });
    }

    return { transactions, warnings };
  }

  private readStringField(value: unknown): string {
    if (typeof value !== 'string') {
      return '';
    }

    return value.trim();
  }

  private readNumericField(
    value: unknown,
    allowMissing = false,
  ): number | null {
    if (value === undefined || value === null) {
      return allowMissing ? null : Number.NaN;
    }

    const parsed =
      typeof value === 'number'
        ? value
        : typeof value === 'string'
          ? Number(value.replace(',', '.'))
          : Number.NaN;

    if (!Number.isFinite(parsed)) {
      return allowMissing ? null : Number.NaN;
    }

    return Math.round(parsed * 100) / 100;
  }
}
