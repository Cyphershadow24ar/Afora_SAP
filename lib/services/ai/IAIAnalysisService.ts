// Task 5.1: IAIAnalysisService interface and related types
import { AIAnalysisResult, ProductContext } from '@/lib/types';

export interface IAIAnalysisService {
  analyzeImages(imageUrls: string[], productContext: ProductContext): Promise<AIAnalysisResult>;
}

// FUTURE (BedrockService): a real implementation will additionally accept the
// product's originalImageUrl (reference/new-condition image) to perform
// original-vs-returned comparison — damage comparison, missing component
// detection, and cosmetic defect detection. The interface signature is left
// unchanged for now; this comment only documents the planned architecture.
// Comparison logic is intentionally NOT implemented yet.
