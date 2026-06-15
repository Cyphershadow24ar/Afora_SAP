// IAIAnalysisService interface and related types
import { AIAnalysisResult, ProductContext, ReturnInspection } from '@/lib/types';

export interface IAIAnalysisService {
  // Legacy single-pass condition analysis (kept for backward compatibility).
  analyzeImages(imageUrls: string[], productContext: ProductContext): Promise<AIAnalysisResult>;

  // Second-Life Decision Engine inspection (Phases 1-2):
  //   - Phase 1: product-match validation (original reference vs returned images)
  //   - Phase 2: advanced visual inspection (scratches, dents, cracks, missing
  //     parts/accessories, packaging damage, dirt, water damage, functional risk)
  // Returns machine-readable ProductMatch + VisualInspection. Downstream financial
  // path calculations are performed deterministically by the SecondLifeEngine.
  inspectReturn(
    originalImageUrl: string | undefined,
    returnedImageUrls: string[],
    productContext: ProductContext
  ): Promise<ReturnInspection>;
}
