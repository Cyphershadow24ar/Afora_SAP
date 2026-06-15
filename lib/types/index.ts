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

// ---------------- Second-Life Decision Engine types ----------------

export type DamageSeverity = 'None' | 'Low' | 'Medium' | 'High' | 'Severe';

// Phase 1: product-match validation (original vs returned).
export interface ProductMatch {
  isSameProduct: boolean;
  similarityScore: number; // 0-100
  confidence: number; // 0-100
  reason: string;
}

// Phase 2: advanced visual inspection.
export interface VisualInspection {
  condition: ConditionGrade;
  damageSeverity: DamageSeverity;
  confidence: number; // 0-100
  issues: string[]; // scratches, dents, cracks, missing parts/accessories, packaging damage, dirt, water damage, functional risk
}

// Phase 3: cost estimation engine.
export interface CostEstimate {
  cleaningCost: number;
  repairCost: number;
  replacementCost: number;
  packagingCost: number;
  laborCost: number;
  logisticsCost: number;
  totalRefurbishmentCost: number;
}

// Phase 4: market value engine.
export interface MarketValue {
  currentMarketValue: number;
  refurbishedMarketValue: number;
  openBoxValue: number;
  liquidationValue: number;
  donationValue: number;
  recyclingValue: number;
  scrapValue: number;
}

// Phase 5: all possible next-life paths.
export type NextLifePath =
  | 'Restock as New'
  | 'Open Box Resale'
  | 'Refurbish & Resell'
  | 'Liquidation'
  | 'Donate'
  | 'Recycle';

export interface NextLifeOption {
  option: NextLifePath;
  requiredCost: number;
  expectedSellingPrice: number;
  expectedProfit: number;
  roiPercentage: number;
  confidenceScore: number; // 0-100
  sustainabilityScore: number; // 0-100
  feasible: boolean;
}

// Phase 6: best next-life selection with multi-factor scoring.
export interface BestRecommendation {
  bestRecommendation: NextLifePath;
  reason: string;
  combinedScore: number; // 0-100
  profitScore: number; // 0-100
  sustainabilityScore: number; // 0-100
  riskScore: number; // 0-100 (higher = safer)
  customerSatisfactionScore: number; // 0-100
  operationalComplexityScore: number; // 0-100 (higher = simpler)
}

// What the AI service returns from a return inspection (Phases 1-2).
export interface ReturnInspection {
  productMatch: ProductMatch;
  visualInspection: VisualInspection;
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

  // --- Second-Life Decision Engine (optional for backward compatibility) ---
  productMatch?: ProductMatch;
  visualInspection?: VisualInspection;
  costEstimate?: CostEstimate;
  marketValue?: MarketValue;
  nextLifeOptions?: NextLifeOption[];
  bestRecommendation?: BestRecommendation;
  wrongProduct?: boolean; // true when product-match validation rejected the return
}

// Supporting types
export interface ProductContext {
  productName: string;
  brand: string;
  category: string;
  originalPrice: number;
  originalImageUrl?: string;
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
  wrongProductCount: number;
}
