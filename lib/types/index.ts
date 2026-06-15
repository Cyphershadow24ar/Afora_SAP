// Task 2.2: TypeScript interfaces for Product and Analysis documents
import { ObjectId } from 'mongodb';

// Product-related types
export type ProductCategory = 'Electronics' | 'Mobile Accessories' | 'Home & Kitchen' | 'Clothing' | 'Books';

export interface ProductRecord {
  _id?: ObjectId;
  barcode: string;
  productId: string;
  productName: string;
  brand: string;
  category: ProductCategory;
  originalPrice: number;
  description: string;
  // Original/new-condition reference image for the product. Canonical field.
  // Deterministic path convention: /reference-images/pid_{NNN}.jpeg
  // (resolved to the actual file on disk by the migration script).
  // FUTURE (BedrockService): originalImageUrl will be supplied to the AI service
  // alongside the returned-product images to enable:
  //   - Damage comparison (original vs returned)
  //   - Missing component detection
  //   - Cosmetic defect detection
  //   - Original vs returned image analysis

  // Comparison logic is intentionally NOT implemented yet; this only prepares
  // the data model/architecture.
  originalImageUrl: string;

}

// AI Analysis types
export type ConditionGrade = 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Damaged';

export interface AIAnalysisResult {
  conditionGrade: ConditionGrade;
  confidenceScore: number; // 0-100
  defectsDetected: string[];
  analysisSummary: string;
}

// Recommendation types
export type RecommendationAction = 
  | 'Restock' 
  | 'Resell New' 
  | 'Open Box Resale' 
  | 'Refurbish' 
  | 'Manual Review' 
  | 'Donate' 
  | 'Recycle';

export interface Recommendation {
  action: RecommendationAction;
  reasoning: string;
  estimatedValue: number;
  sustainabilityScore: number; // 0-100
}

// Analysis Record (complete record in database)
export interface AnalysisRecord {
  _id?: ObjectId;
  barcode: string;
  productId: string;
  productName: string;
  category: string;
  originalPrice: number;
  imageUrls: string[];
  aiAnalysis: AIAnalysisResult;
  recommendation: Recommendation;
  createdAt: Date;
  processedBy?: string; // Future: Worker ID
}

// Supporting types
export interface ProductContext {
  productName: string;
  brand: string;
  category: string;
  originalPrice: number;
}

export interface ImageUploadResult {
  key: string;
  url: string;
  size: number;
}

// Dashboard types
export interface DashboardStats {
  totalItems: number;
  actionBreakdown: Record<RecommendationAction, number>;
  totalEstimatedValue: number;
  averageSustainabilityScore: number;
}
