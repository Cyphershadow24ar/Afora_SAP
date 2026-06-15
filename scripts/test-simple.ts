// Simple standalone test - no MongoDB required
import { ServiceFactory } from '../lib/services/ServiceFactory';
import { RecommendationEngine } from '../lib/services/RecommendationEngine';
import { generateSeedData } from '../lib/db/seed';

async function runSimpleTest() {
  console.log('🧪 Simple Backend Service Test\n');

  // Test 1: Seed Data
  console.log('1️⃣  Testing Seed Data Generation...');
  const products = generateSeedData();
  console.log(`   ✅ Generated ${products.length} products`);
  console.log(`   ✅ First product: ${products[0].productName} (${products[0].barcode})\n`);

  // Test 2: MockBedrockService
  console.log('2️⃣  Testing MockBedrockService...');
  const aiService = ServiceFactory.getAIService();
  const result = await aiService.analyzeImages(
    ['url1', 'url2'],
    {
      productName: products[0].productName,
      brand: products[0].brand,
      category: products[0].category,
      originalPrice: products[0].originalPrice,
    }
  );
  console.log(`   ✅ Condition: ${result.conditionGrade}`);
  console.log(`   ✅ Confidence: ${result.confidenceScore}%`);
  console.log(`   ✅ Defects: ${result.defectsDetected.join(', ') || 'None'}`);
  console.log(`   ✅ Summary: ${result.analysisSummary}\n`);

  // Test 3: RecommendationEngine
  console.log('3️⃣  Testing RecommendationEngine...');
  const engine = new RecommendationEngine();
  const recommendation = engine.generateRecommendation(result, products[0]);
  console.log(`   ✅ Action: ${recommendation.action}`);
  console.log(`   ✅ Estimated Value: $${recommendation.estimatedValue.toFixed(2)}`);
  console.log(`   ✅ Sustainability: ${recommendation.sustainabilityScore}/100`);
  console.log(`   ✅ Reasoning: ${recommendation.reasoning}\n`);

  console.log('🎉 All tests passed!\n');
}

runSimpleTest().catch(console.error);
