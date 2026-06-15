// Task 6.1 & 6.2: Recommendation Engine with confidence-based logic
import { AIAnalysisResult, Recommendation, ProductRecord, RecommendationAction } from '@/lib/types';

export class RecommendationEngine {
  generateRecommendation(
    aiAnalysis: AIAnalysisResult,
    product: ProductRecord
  ): Recommendation {
    const { confidenceScore, conditionGrade, defectsDetected } = aiAnalysis;
    const { originalPrice } = product;

    // Apply confidence-based threshold rules
    if (confidenceScore > 90) {
      return this.createRestockRecommendation(originalPrice, conditionGrade);
    } else if (confidenceScore >= 80) {
      return this.createOpenBoxRecommendation(originalPrice);
    } else if (confidenceScore >= 70) {
      return this.createRefurbishRecommendation(originalPrice, defectsDetected);
    } else if (confidenceScore >= 60) {
      return this.createManualReviewRecommendation(originalPrice);
    } else {
      return this.createDonateRecycleRecommendation(originalPrice, conditionGrade);
    }
  }

  private createRestockRecommendation(
    originalPrice: number,
    conditionGrade: string
  ): Recommendation {
    const action: RecommendationAction = conditionGrade === 'Excellent' ? 'Restock' : 'Resell New';
    
    return {
      action,
      reasoning: 'Product is in excellent condition and can be restocked as new inventory or resold at near-full price.',
      estimatedValue: Math.round(originalPrice * 0.95 * 100) / 100, // 95% recovery
      sustainabilityScore: 95,
    };
  }

  private createOpenBoxRecommendation(originalPrice: number): Recommendation {
    return {
      action: 'Open Box Resale',
      reasoning: 'Product is in good condition with minor cosmetic issues. Suitable for discounted open-box resale.',
      estimatedValue: Math.round(originalPrice * 0.70 * 100) / 100, // 70% recovery
      sustainabilityScore: 85,
    };
  }

  private createRefurbishRecommendation(
    originalPrice: number,
    defects: string[]
  ): Recommendation {
    const defectText = defects.length > 0 
      ? ` Identified issues: ${defects.join(', ')}.` 
      : '';
    
    return {
      action: 'Refurbish',
      reasoning: `Product requires refurbishment.${defectText} Can be restored and resold after repairs.`,
      estimatedValue: Math.round(originalPrice * 0.50 * 100) / 100, // 50% recovery after refurb costs
      sustainabilityScore: 75,
    };
  }

  private createManualReviewRecommendation(originalPrice: number): Recommendation {
    return {
      action: 'Manual Review',
      reasoning: 'Product condition requires manual inspection by a specialist to determine the best disposition.',
      estimatedValue: Math.round(originalPrice * 0.40 * 100) / 100, // 40% recovery estimate
      sustainabilityScore: 60,
    };
  }

  private createDonateRecycleRecommendation(
    originalPrice: number,
    conditionGrade: string
  ): Recommendation {
    // Damaged items should be recycled, poor items can be donated
    if (conditionGrade === 'Damaged') {
      return {
        action: 'Recycle',
        reasoning: 'Product is damaged beyond economical repair. Recycling ensures proper material recovery and environmental responsibility.',
        estimatedValue: Math.round(originalPrice * 0.05 * 100) / 100, // 5% recovery
        sustainabilityScore: 30,
      };
    } else {
      return {
        action: 'Donate',
        reasoning: 'Product has low resale value but can still be useful. Donation extends product life and benefits the community.',
        estimatedValue: Math.round(originalPrice * 0.10 * 100) / 100, // 10% recovery (tax benefit)
        sustainabilityScore: 45,
      };
    }
  }
}
