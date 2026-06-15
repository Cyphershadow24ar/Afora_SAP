// Task 5.2: MockBedrockService with deterministic mock logic
import { IAIAnalysisService } from './IAIAnalysisService';
import {
  AIAnalysisResult,
  ProductContext,
  ConditionGrade,
  ReturnInspection,
  DamageSeverity,
} from '@/lib/types';

export class MockBedrockService implements IAIAnalysisService {
  // Base confidence scores by category
  private categoryConfidence: Record<string, number> = {
    'Electronics': 85,
    'Mobile Accessories': 82,
    'Home & Kitchen': 78,
    'Clothing': 75,
    'Books': 88,
  };

  // Defect lists per category
  private defectsByCategory: Record<string, string[]> = {
    'Electronics': [
      'Screen scratches',
      'Battery wear',
      'Button malfunction',
      'Port damage',
      'Cosmetic dents',
      'Discolored casing',
    ],
    'Mobile Accessories': [
      'Cable fraying',
      'Case discoloration',
      'Loose fit',
      'Missing components',
      'Adhesive wear',
    ],
    'Home & Kitchen': [
      'Stains',
      'Minor rust',
      'Chipped edges',
      'Discoloration',
      'Worn coating',
    ],
    'Clothing': [
      'Fabric pilling',
      'Loose threads',
      'Minor stains',
      'Fading',
      'Stretched elastic',
    ],
    'Books': [
      'Cover wear',
      'Page yellowing',
      'Spine creasing',
      'Minor water damage',
      'Torn pages',
    ],
  };

  async analyzeImages(
    imageUrls: string[],
    productContext: ProductContext
  ): Promise<AIAnalysisResult> {
    // Simulate API latency (100-300ms)
    await this.delay(100 + Math.random() * 200);

    // Base confidence on category
    const baseConfidence = this.categoryConfidence[productContext.category] || 80;

    // Add randomness (-10 to +10)
    const confidenceScore = Math.min(
      100,
      Math.max(0, baseConfidence + (Math.random() * 20 - 10))
    );

    // Determine condition grade based on confidence
    const conditionGrade = this.getConditionGrade(confidenceScore);

    // Select random defects if not Excellent
    const defectsDetected =
      conditionGrade === 'Excellent'
        ? []
        : this.selectRandomDefects(productContext.category, Math.floor(Math.random() * 3));

    // Generate summary
    const analysisSummary = this.generateSummary(conditionGrade, defectsDetected);

    return {
      conditionGrade,
      confidenceScore: Math.round(confidenceScore),
      defectsDetected,
      analysisSummary,
    };
  }

  private getConditionGrade(confidence: number): ConditionGrade {
    if (confidence >= 90) return 'Excellent';
    if (confidence >= 75) return 'Good';
    if (confidence >= 60) return 'Fair';
    if (confidence >= 40) return 'Poor';
    return 'Damaged';
  }

  private selectRandomDefects(category: string, count: number): string[] {
    const defects = this.defectsByCategory[category] || [];
    const shuffled = [...defects].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  private generateSummary(grade: ConditionGrade, defects: string[]): string {
    if (grade === 'Excellent') {
      return 'Product is in excellent condition with no visible defects. Appears like new.';
    }

    const defectText =
      defects.length > 0 ? ` Identified issues: ${defects.join(', ')}.` : '';
    
    const gradeDescriptions: Record<ConditionGrade, string> = {
      'Excellent': 'excellent',
      'Good': 'good overall condition with minor wear',
      'Fair': 'fair condition with noticeable signs of use',
      'Poor': 'poor condition with significant wear',
      'Damaged': 'damaged condition requiring attention',
    };

    return `Product shows ${gradeDescriptions[grade]}.${defectText}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Second-Life inspection (mock): deterministic product-match + visual inspection.
  async inspectReturn(
    _originalImageUrl: string | undefined,
    imageUrls: string[],
    productContext: ProductContext
  ): Promise<ReturnInspection> {
    await this.delay(100 + Math.random() * 200);

    const baseConfidence = this.categoryConfidence[productContext.category] || 80;
    const confidenceScore = Math.min(100, Math.max(0, baseConfidence + (Math.random() * 20 - 10)));
    const condition = this.getConditionGrade(confidenceScore);

    const issues =
      condition === 'Excellent'
        ? []
        : this.selectRandomDefects(productContext.category, 1 + Math.floor(Math.random() * 2));

    const damageSeverity = this.severityForGrade(condition);

    // Mock match: assume returned matches reference with high similarity.
    const similarityScore = Math.round(85 + Math.random() * 12);

    return {
      productMatch: {
        isSameProduct: similarityScore >= 60,
        similarityScore,
        confidence: Math.round(confidenceScore),
        reason:
          similarityScore >= 60
            ? 'Returned product matches the reference product.'
            : 'Returned product does not match the reference product.',
      },
      visualInspection: {
        condition,
        damageSeverity,
        confidence: Math.round(confidenceScore),
        issues,
      },
    };
  }

  private severityForGrade(grade: ConditionGrade): DamageSeverity {
    switch (grade) {
      case 'Excellent':
        return 'None';
      case 'Good':
        return 'Low';
      case 'Fair':
        return 'Medium';
      case 'Poor':
        return 'High';
      case 'Damaged':
        return 'Severe';
    }
  }
}
