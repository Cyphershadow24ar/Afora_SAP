// Second-Life Decision Engine (Phases 3-6).
//
// Deterministic, auditable financial modelling. Given a product and the AI
// visual inspection, it computes: cost estimate, market values, ALL next-life
// paths (cost/revenue/profit/ROI/sustainability/confidence), and selects the
// best path via multi-factor scoring. No randomness, no LLM money math.

import {
  ProductRecord,
  ProductMatch,
  VisualInspection,
  CostEstimate,
  MarketValue,
  NextLifeOption,
  NextLifePath,
  BestRecommendation,
  ConditionGrade,
  DamageSeverity,
  AIAnalysisResult,
  Recommendation,
  RecommendationAction,
} from '@/lib/types';

export interface SecondLifeDecision {
  costEstimate: CostEstimate;
  marketValue: MarketValue;
  nextLifeOptions: NextLifeOption[];
  bestRecommendation: BestRecommendation;
  // Backward-compatible projections for existing record fields / dashboard.
  aiAnalysis: AIAnalysisResult;
  recommendation: Recommendation;
}

const round2 = (n: number) => Math.round(n * 100) / 100;
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

// Fraction of original price required to repair, by damage severity.
const REPAIR_FRACTION: Record<DamageSeverity, number> = {
  None: 0,
  Low: 0.05,
  Medium: 0.12,
  High: 0.25,
  Severe: 0.45,
};

// Resale value multiplier (vs. original price) by condition grade.
const CONDITION_RESALE_MULT: Record<ConditionGrade, number> = {
  Excellent: 0.95,
  Good: 0.8,
  Fair: 0.6,
  Poor: 0.4,
  Damaged: 0.2,
};

// Customer-satisfaction score by path (how happy a buyer/operation is with it).
const CUSTOMER_SAT: Record<NextLifePath, number> = {
  'Restock as New': 95,
  'Open Box Resale': 85,
  'Refurbish & Resell': 80,
  Liquidation: 55,
  Donate: 60,
  Recycle: 50,
};

// Operational simplicity score by path (higher = simpler to execute).
const OP_SIMPLICITY: Record<NextLifePath, number> = {
  'Restock as New': 95,
  'Open Box Resale': 85,
  'Refurbish & Resell': 45,
  Liquidation: 70,
  Donate: 75,
  Recycle: 80,
};

// Sustainability score by path (reuse preferred over disposal).
const SUSTAINABILITY: Record<NextLifePath, number> = {
  'Restock as New': 70,
  'Open Box Resale': 80,
  'Refurbish & Resell': 95,
  Liquidation: 60,
  Donate: 100,
  Recycle: 85,
};

export class SecondLifeEngine {
  // ---------------- Phase 3: cost estimation ----------------
  estimateCosts(product: ProductRecord, inspection: VisualInspection): CostEstimate {
    const p = product.originalPrice;
    const issues = inspection.issues.map((i) => i.toLowerCase());
    const hasMissing = issues.some((i) => i.includes('missing'));

    const cleaningCost = round2(clamp(p * 0.03, 2, 30));
    const repairCost = round2(p * REPAIR_FRACTION[inspection.damageSeverity]);
    const replacementCost = round2(hasMissing ? clamp(p * 0.1, 5, 60) : 0);
    const packagingCost = round2(clamp(p * 0.02, 1, 15));
    const laborCost = round2(clamp(p * 0.05, 5, 40));
    const logisticsCost = round2(clamp(p * 0.03, 3, 25));

    const totalRefurbishmentCost = round2(
      cleaningCost + repairCost + replacementCost + packagingCost + laborCost + logisticsCost
    );

    return {
      cleaningCost,
      repairCost,
      replacementCost,
      packagingCost,
      laborCost,
      logisticsCost,
      totalRefurbishmentCost,
    };
  }

  // ---------------- Phase 4: market value ----------------
  estimateMarketValue(product: ProductRecord, inspection: VisualInspection): MarketValue {
    const p = product.originalPrice;
    const condMult = CONDITION_RESALE_MULT[inspection.condition];

    return {
      currentMarketValue: round2(p),
      refurbishedMarketValue: round2(p * clamp(condMult + 0.25, 0, 0.9)),
      openBoxValue: round2(p * condMult * 0.9),
      liquidationValue: round2(p * 0.35),
      donationValue: round2(p * 0.1), // tax-benefit equivalent
      recyclingValue: round2(p * 0.05),
      scrapValue: round2(p * 0.03),
    };
  }

  // ---------------- Phase 5: all next-life paths ----------------
  computeOptions(
    product: ProductRecord,
    inspection: VisualInspection,
    productMatch: ProductMatch,
    cost: CostEstimate,
    market: MarketValue
  ): NextLifeOption[] {
    const condition = inspection.condition;
    const severity = inspection.damageSeverity;
    const baseConfidence = Math.round((inspection.confidence + productMatch.confidence) / 2);

    const option = (
      path: NextLifePath,
      requiredCost: number,
      expectedSellingPrice: number,
      feasible: boolean,
      confidenceAdj: number
    ): NextLifeOption => {
      const profit = round2(expectedSellingPrice - requiredCost);
      const roi =
        requiredCost > 0 ? round2((profit / requiredCost) * 100) : profit > 0 ? 100 : 0;
      return {
        option: path,
        requiredCost: round2(requiredCost),
        expectedSellingPrice: round2(expectedSellingPrice),
        expectedProfit: profit,
        roiPercentage: roi,
        confidenceScore: clamp(Math.round(baseConfidence * confidenceAdj), 0, 100),
        sustainabilityScore: SUSTAINABILITY[path],
        feasible,
      };
    };

    const lightHandling = round2(cost.cleaningCost + cost.packagingCost);
    const openBoxCost = round2(cost.cleaningCost + cost.packagingCost + cost.laborCost);
    const disposalLogistics = round2(cost.logisticsCost);

    return [
      // Restock as New: only valid for like-new, matching products.
      option(
        'Restock as New',
        cost.packagingCost,
        market.currentMarketValue,
        productMatch.isSameProduct && condition === 'Excellent' && severity === 'None',
        1.0
      ),
      // Open Box Resale: minor cosmetic wear.
      option(
        'Open Box Resale',
        openBoxCost,
        market.openBoxValue,
        productMatch.isSameProduct && (condition === 'Excellent' || condition === 'Good'),
        0.95
      ),
      // Refurbish & Resell: repairable wear/damage (not beyond economical repair).
      option(
        'Refurbish & Resell',
        cost.totalRefurbishmentCost,
        market.refurbishedMarketValue,
        productMatch.isSameProduct &&
          condition !== 'Excellent' &&
          severity !== 'Severe',
        0.9
      ),
      // Liquidation: always available as a bulk-recovery fallback.
      option('Liquidation', disposalLogistics, market.liquidationValue, true, 0.85),
      // Donate: low resale value but high sustainability.
      option('Donate', lightHandling, market.donationValue, true, 0.8),
      // Recycle: end-of-life material recovery.
      option('Recycle', disposalLogistics, market.recyclingValue, true, 0.8),
    ];
  }

  // ---------------- Phase 6: best next-life selection ----------------
  selectBest(options: NextLifeOption[]): BestRecommendation {
    const feasible = options.filter((o) => o.feasible);
    const pool = feasible.length > 0 ? feasible : options;

    const maxProfit = Math.max(...pool.map((o) => o.expectedProfit), 1);

    let best: NextLifeOption | null = null;
    let bestScore = -Infinity;
    let bestBreakdown = {
      profitScore: 0,
      sustainabilityScore: 0,
      riskScore: 0,
      customerSatisfactionScore: 0,
      operationalComplexityScore: 0,
    };

    for (const o of pool) {
      const profitScore = clamp(Math.round((o.expectedProfit / maxProfit) * 100), 0, 100);
      const sustainabilityScore = o.sustainabilityScore;
      const riskScore = o.confidenceScore; // higher confidence = lower risk
      const customerSatisfactionScore = CUSTOMER_SAT[o.option];
      const operationalComplexityScore = OP_SIMPLICITY[o.option];

      const combined =
        profitScore * 0.35 +
        sustainabilityScore * 0.25 +
        riskScore * 0.15 +
        customerSatisfactionScore * 0.15 +
        operationalComplexityScore * 0.1;

      if (combined > bestScore) {
        bestScore = combined;
        best = o;
        bestBreakdown = {
          profitScore,
          sustainabilityScore,
          riskScore,
          customerSatisfactionScore,
          operationalComplexityScore,
        };
      }
    }

    const chosen = best as NextLifeOption;
    return {
      bestRecommendation: chosen.option,
      reason: `Selected "${chosen.option}" — profit $${chosen.expectedProfit.toFixed(
        2
      )} (ROI ${chosen.roiPercentage}%), sustainability ${chosen.sustainabilityScore}/100, confidence ${chosen.confidenceScore}%.`,
      combinedScore: Math.round(bestScore),
      ...bestBreakdown,
    };
  }

  // ---------------- Orchestration ----------------
  decide(
    product: ProductRecord,
    inspection: VisualInspection,
    productMatch: ProductMatch
  ): SecondLifeDecision {
    const costEstimate = this.estimateCosts(product, inspection);
    const marketValue = this.estimateMarketValue(product, inspection);
    const nextLifeOptions = this.computeOptions(
      product,
      inspection,
      productMatch,
      costEstimate,
      marketValue
    );
    const bestRecommendation = this.selectBest(nextLifeOptions);

    const aiAnalysis: AIAnalysisResult = {
      conditionGrade: inspection.condition,
      confidenceScore: inspection.confidence,
      defectsDetected: inspection.issues,
      analysisSummary: `Condition ${inspection.condition} (damage: ${inspection.damageSeverity}). ${
        inspection.issues.length > 0
          ? `Issues: ${inspection.issues.join(', ')}.`
          : 'No significant issues detected.'
      }`,
    };

    const bestOption = nextLifeOptions.find(
      (o) => o.option === bestRecommendation.bestRecommendation
    ) as NextLifeOption;

    const recommendation: Recommendation = {
      action: this.toRecommendationAction(bestRecommendation.bestRecommendation),
      reasoning: bestRecommendation.reason,
      estimatedValue: Math.max(0, bestOption.expectedProfit),
      sustainabilityScore: bestOption.sustainabilityScore,
    };

    return { costEstimate, marketValue, nextLifeOptions, bestRecommendation, aiAnalysis, recommendation };
  }

  // Map the richer next-life path to the legacy RecommendationAction enum.
  private toRecommendationAction(path: NextLifePath): RecommendationAction {
    switch (path) {
      case 'Restock as New':
        return 'Restock';
      case 'Open Box Resale':
        return 'Open Box Resale';
      case 'Refurbish & Resell':
        return 'Refurbish';
      case 'Liquidation':
        return 'Manual Review';
      case 'Donate':
        return 'Donate';
      case 'Recycle':
        return 'Recycle';
    }
  }
}
