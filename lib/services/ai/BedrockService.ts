// Production Amazon Bedrock implementation of IAIAnalysisService (Nova Lite).
//
// Uses the Bedrock Converse API with multimodal (text + image) input to evaluate
// the condition of a returned product. Returns an AIAnalysisResult; the downstream
// RecommendationEngine continues to derive the recommendation, so the existing
// interface and API contracts are unchanged.
//
// Configuration (environment):
//   AWS_REGION              (e.g. ap-south-1)
//   BEDROCK_MODEL_ID        (e.g. amazon.nova-lite-v1:0)
//   AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY (standard AWS credential chain)

import {
  BedrockRuntimeClient,
  ConverseCommand,
  type ContentBlock,
  type ImageFormat,
} from '@aws-sdk/client-bedrock-runtime';
import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { IAIAnalysisService } from './IAIAnalysisService';
import {
  AIAnalysisResult,
  ProductContext,
  ConditionGrade,
  DamageSeverity,
  ReturnInspection,
} from '@/lib/types';

const DEFAULT_MODEL_ID = 'amazon.nova-lite-v1:0';
const ALLOWED_GRADES: ConditionGrade[] = ['Excellent', 'Good', 'Fair', 'Poor', 'Damaged'];
const ALLOWED_SEVERITIES: DamageSeverity[] = ['None', 'Low', 'Medium', 'High', 'Severe'];
const MAX_IMAGES = 5;

interface LoadedImage {
  format: ImageFormat;
  bytes: Uint8Array;
}

export class BedrockService implements IAIAnalysisService {
  private readonly client: BedrockRuntimeClient;
  private readonly modelId: string;

  constructor() {
    const region = process.env.AWS_REGION;
    if (!region) {
      throw new Error('BedrockService misconfigured. Missing environment variable: AWS_REGION');
    }
    this.modelId = process.env.BEDROCK_MODEL_ID || DEFAULT_MODEL_ID;
    this.client = new BedrockRuntimeClient({ region });
    console.log('[Bedrock] Service initialized');
  }

  async analyzeImages(
    imageUrls: string[],
    productContext: ProductContext
  ): Promise<AIAnalysisResult> {
    console.log('[Bedrock] Starting analysis');

    try {
      // Load image bytes (from S3 presigned URLs or data URLs).
      const images = await this.loadImages(imageUrls.slice(0, MAX_IMAGES));

      const content: ContentBlock[] = [
        { text: this.buildPrompt(productContext) },
        ...images.map(
          (img): ContentBlock => ({
            image: { format: img.format, source: { bytes: img.bytes } },
          })
        ),
      ];

      console.log(`[Bedrock] Invoking model ${this.modelId}`);
      const response = await this.client.send(
        new ConverseCommand({
          modelId: this.modelId,
          messages: [{ role: 'user', content }],
          inferenceConfig: { maxTokens: 1024, temperature: 0.2 },
        })
      );
      console.log('[Bedrock] Response received');

      const text =
        response.output?.message?.content?.find((c) => 'text' in c && c.text)?.text ?? '';

      const result = this.parseResponse(text, productContext);
      console.log('[Bedrock] Analysis completed');
      return result;
    } catch (error) {
      console.error('[Bedrock] Error', error);
      // Surface as a generic failure; the API route maps this to a 500 response.
      throw new Error('Bedrock analysis failed');
    }
  }

  // ---------------- prompt ----------------
  private buildPrompt(ctx: ProductContext): string {
    return `You are an expert product-returns inspector for an e-commerce warehouse.
Evaluate the condition of a RETURNED product using the attached image(s) and the product metadata.

Product metadata:
- Name: ${ctx.productName}
- Brand: ${ctx.brand}
- Category: ${ctx.category}
- Original price (USD): ${ctx.originalPrice}

Instructions:
- Inspect the returned product image(s) against the expected new/original condition for this product.
- Detect cosmetic damage, missing components, and visible wear.
- Estimate resale suitability and assign a confidence score (0-100).
- Assign a sustainability score (0-100) reflecting reuse vs. disposal preference.
- conditionGrade MUST be one of: Excellent, Good, Fair, Poor, Damaged.
- recommendation.action MUST be one of: Restock, Resell New, Open Box Resale, Refurbish, Manual Review, Donate, Recycle.

Respond with ONLY valid JSON (no markdown, no commentary) in EXACTLY this shape:
{
  "conditionGrade": "Excellent",
  "confidenceScore": 95,
  "defectsDetected": [],
  "analysisSummary": "",
  "recommendation": {
    "action": "",
    "reasoning": "",
    "estimatedValue": 0,
    "sustainabilityScore": 0
  }
}`;
  }

  // ---------------- image loading ----------------
  private async loadImages(urls: string[]): Promise<LoadedImage[]> {
    const loaded: LoadedImage[] = [];
    for (const url of urls) {
      try {
        if (url.startsWith('data:')) {
          loaded.push(this.parseDataUrl(url));
        } else {
          const res = await fetch(url);
          if (!res.ok) {
            console.error(`[Bedrock] Error fetching image (${res.status})`);
            continue;
          }
          const bytes = new Uint8Array(await res.arrayBuffer());
          const ct = res.headers.get('content-type') || '';
          loaded.push({ format: this.detectFormat(url, ct), bytes });
        }
      } catch (err) {
        console.error('[Bedrock] Error loading image', err);
      }
    }
    if (loaded.length === 0) {
      throw new Error('No images could be loaded for analysis');
    }
    return loaded;
  }

  private parseDataUrl(dataUrl: string): LoadedImage {
    const match = dataUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.*)$/);
    if (!match) throw new Error('Invalid data URL');
    const mime = match[1];
    const bytes = new Uint8Array(Buffer.from(match[2], 'base64'));
    return { format: this.mimeToFormat(mime), bytes };
  }

  private detectFormat(url: string, contentType: string): ImageFormat {
    if (contentType.includes('png')) return 'png';
    if (contentType.includes('webp')) return 'webp';
    if (contentType.includes('gif')) return 'gif';
    if (contentType.includes('jpeg') || contentType.includes('jpg')) return 'jpeg';
    // Fall back to file extension (ignore any query string on presigned URLs).
    const path = url.split('?')[0].toLowerCase();
    if (path.endsWith('.png')) return 'png';
    if (path.endsWith('.webp')) return 'webp';
    if (path.endsWith('.gif')) return 'gif';
    return 'jpeg';
  }

  private mimeToFormat(mime: string): ImageFormat {
    if (mime.includes('png')) return 'png';
    if (mime.includes('webp')) return 'webp';
    if (mime.includes('gif')) return 'gif';
    return 'jpeg';
  }

  // ---------------- response parsing ----------------
  private parseResponse(text: string, ctx: ProductContext): AIAnalysisResult {
    const json = this.extractJson(text);
    if (!json) {
      console.error('[Bedrock] Error: could not parse model response, using fallback');
      return this.fallback();
    }

    const confidenceScore = this.clampScore(
      typeof json.confidenceScore === 'number' ? json.confidenceScore : Number(json.confidenceScore),
      65
    );

    const conditionGrade = this.coerceGrade(json.conditionGrade, confidenceScore);

    const defectsDetected = Array.isArray(json.defectsDetected)
      ? json.defectsDetected.filter((d: unknown) => typeof d === 'string').slice(0, 10)
      : [];

    const analysisSummary =
      typeof json.analysisSummary === 'string' && json.analysisSummary.trim().length > 0
        ? json.analysisSummary.trim()
        : `Condition assessed as ${conditionGrade} for ${ctx.productName}.`;

    return { conditionGrade, confidenceScore, defectsDetected, analysisSummary };
  }

  // Extract a JSON object from possibly fenced / noisy model output.
  private extractJson(text: string): Record<string, unknown> | null {
    if (!text) return null;
    let cleaned = text.trim();
    // Strip markdown code fences if present.
    cleaned = cleaned.replace(/```(?:json)?/gi, '').trim();
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) return null;
    try {
      return JSON.parse(cleaned.slice(start, end + 1));
    } catch {
      return null;
    }
  }

  private clampScore(value: number, fallback: number): number {
    if (typeof value !== 'number' || Number.isNaN(value)) return fallback;
    return Math.max(0, Math.min(100, Math.round(value)));
  }

  private coerceGrade(value: unknown, confidence: number): ConditionGrade {
    if (typeof value === 'string') {
      const match = ALLOWED_GRADES.find((g) => g.toLowerCase() === value.trim().toLowerCase());
      if (match) return match;
    }
    // Derive from confidence if the model returned an invalid grade.
    if (confidence >= 90) return 'Excellent';
    if (confidence >= 75) return 'Good';
    if (confidence >= 60) return 'Fair';
    if (confidence >= 40) return 'Poor';
    return 'Damaged';
  }

  // Safe fallback that routes to Manual Review via the RecommendationEngine.
  private fallback(): AIAnalysisResult {
    return {
      conditionGrade: 'Fair',
      confidenceScore: 65,
      defectsDetected: [],
      analysisSummary:
        'Automated analysis could not be completed reliably. Manual review recommended.',
    };
  }

  // ================= Second-Life inspection (Phases 1-2) =================
  async inspectReturn(
    originalImageUrl: string | undefined,
    returnedImageUrls: string[],
    productContext: ProductContext
  ): Promise<ReturnInspection> {
    console.log('[Bedrock] Starting analysis');
    try {
      const original = originalImageUrl ? await this.loadOne(originalImageUrl) : null;

      const returned: LoadedImage[] = [];
      for (const url of returnedImageUrls.slice(0, MAX_IMAGES)) {
        const img = await this.loadOne(url);
        if (img) returned.push(img);
      }
      if (returned.length === 0) {
        throw new Error('No returned images could be loaded for inspection');
      }

      const content: ContentBlock[] = [
        { text: this.buildInspectionPrompt(productContext, !!original) },
      ];
      if (original) {
        content.push({ text: 'REFERENCE (original / new-condition) product image:' });
        content.push({ image: { format: original.format, source: { bytes: original.bytes } } });
      }
      content.push({ text: 'RETURNED product image(s):' });
      for (const img of returned) {
        content.push({ image: { format: img.format, source: { bytes: img.bytes } } });
      }

      console.log(`[Bedrock] Invoking model ${this.modelId}`);
      const response = await this.client.send(
        new ConverseCommand({
          modelId: this.modelId,
          messages: [{ role: 'user', content }],
          inferenceConfig: { maxTokens: 1024, temperature: 0.2 },
        })
      );
      console.log('[Bedrock] Response received');

      const text =
        response.output?.message?.content?.find((c) => 'text' in c && c.text)?.text ?? '';
      const result = this.parseInspection(text, !!original);
      console.log('[Bedrock] Analysis completed');
      return result;
    } catch (error) {
      console.error('[Bedrock] Error', error);
      throw new Error('Bedrock inspection failed');
    }
  }

  private buildInspectionPrompt(ctx: ProductContext, hasOriginal: boolean): string {
    return `You are an expert e-commerce returns inspector. Analyze the RETURNED product image(s)${
      hasOriginal ? ' against the REFERENCE (original/new) image' : ''
    } and the product metadata.

Product metadata:
- Name: ${ctx.productName}
- Brand: ${ctx.brand}
- Category: ${ctx.category}
- Original price (USD): ${ctx.originalPrice}

Tasks:
1) Product match: decide whether the returned item is the SAME product as ${
      hasOriginal ? 'the reference image' : 'the product described above'
    }. Provide similarityScore (0-100) and confidence (0-100).
2) Visual inspection: detect scratches, dents, cracks, missing parts, missing accessories, packaging damage, dirt, water damage, and functional risk indicators. Assign a condition grade and a damage severity.

Constraints:
- condition MUST be one of: Excellent, Good, Fair, Poor, Damaged.
- damageSeverity MUST be one of: None, Low, Medium, High, Severe.
- issues MUST be a list of short strings (empty if none).

Respond with ONLY valid JSON (no markdown, no commentary) EXACTLY in this shape:
{
  "productMatch": { "isSameProduct": true, "similarityScore": 94, "confidence": 92, "reason": "" },
  "visualInspection": { "condition": "Good", "damageSeverity": "Low", "confidence": 89, "issues": [] }
}`;
  }

  private parseInspection(text: string, hasOriginal: boolean): ReturnInspection {
    const json = this.extractJson(text);
    if (!json) {
      console.error('[Bedrock] Error: could not parse inspection response, using fallback');
      return this.inspectionFallback(hasOriginal);
    }

    const pmRaw = (json.productMatch ?? {}) as Record<string, unknown>;
    const viRaw = (json.visualInspection ?? {}) as Record<string, unknown>;

    const similarityScore = this.clampScore(Number(pmRaw.similarityScore), hasOriginal ? 70 : 100);
    const matchConfidence = this.clampScore(Number(pmRaw.confidence), 60);
    const isSameProduct =
      typeof pmRaw.isSameProduct === 'boolean' ? pmRaw.isSameProduct : similarityScore >= 60;

    const visConfidence = this.clampScore(Number(viRaw.confidence), 65);
    const condition = this.coerceGrade(viRaw.condition, visConfidence);
    const damageSeverity = this.coerceSeverity(viRaw.damageSeverity, condition);
    const issues = Array.isArray(viRaw.issues)
      ? (viRaw.issues as unknown[]).filter((i) => typeof i === 'string').slice(0, 15) as string[]
      : [];

    return {
      productMatch: {
        isSameProduct,
        similarityScore,
        confidence: matchConfidence,
        reason:
          typeof pmRaw.reason === 'string' && pmRaw.reason.trim()
            ? (pmRaw.reason as string).trim()
            : isSameProduct
            ? 'Returned product matches the reference product.'
            : 'Returned product does not match the reference product.',
      },
      visualInspection: { condition, damageSeverity, confidence: visConfidence, issues },
    };
  }

  private inspectionFallback(hasOriginal: boolean): ReturnInspection {
    return {
      productMatch: {
        isSameProduct: true,
        similarityScore: hasOriginal ? 70 : 100,
        confidence: 50,
        reason: 'Automated match could not be computed reliably; defaulting to match.',
      },
      visualInspection: {
        condition: 'Fair',
        damageSeverity: 'Medium',
        confidence: 60,
        issues: [],
      },
    };
  }

  private coerceSeverity(value: unknown, condition: ConditionGrade): DamageSeverity {
    if (typeof value === 'string') {
      const match = ALLOWED_SEVERITIES.find((s) => s.toLowerCase() === value.trim().toLowerCase());
      if (match) return match;
    }
    const byGrade: Record<ConditionGrade, DamageSeverity> = {
      Excellent: 'None',
      Good: 'Low',
      Fair: 'Medium',
      Poor: 'High',
      Damaged: 'Severe',
    };
    return byGrade[condition];
  }

  // Load a single image from a public path ("/..."), data URL, or http(s) URL.
  // Returns null for unsupported formats (e.g. SVG) or load failures.
  private async loadOne(url: string): Promise<LoadedImage | null> {
    try {
      if (url.startsWith('data:')) return this.parseDataUrl(url);

      if (url.startsWith('/')) {
        const clean = url.split('?')[0];
        if (clean.toLowerCase().endsWith('.svg')) return null; // unsupported by the model
        const filePath = resolve(process.cwd(), 'public', clean.replace(/^\//, ''));
        const buf = await readFile(filePath);
        return { format: this.detectFormat(clean, ''), bytes: new Uint8Array(buf) };
      }

      const res = await fetch(url);
      if (!res.ok) return null;
      const bytes = new Uint8Array(await res.arrayBuffer());
      return { format: this.detectFormat(url, res.headers.get('content-type') || ''), bytes };
    } catch (err) {
      console.error('[Bedrock] Error loading image', err);
      return null;
    }
  }
}
