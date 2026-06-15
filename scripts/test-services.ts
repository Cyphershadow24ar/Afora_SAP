// Test script for verifying service implementations
import { ServiceFactory } from '../lib/services/ServiceFactory';
import { RecommendationEngine } from '../lib/services/RecommendationEngine';
import { ProductContext, AIAnalysisResult } from '../lib/types';

async function testMockServices() {
  console.log('🧪 Testing Mock Services\n');

  // Test AI Analysis Service
  console.log('📊 Testing MockBedrockService...');
  const aiService = ServiceFactory.getAIService();

  const productContext: ProductContext = {
    productName: 'Wireless Bluetooth Headphones',
    brand: 'TechAudio',
    category: 'Electronics' as const,
    originalPrice: 79.99,
  };

  // Simulate image URLs (mock service doesn't actually use them)
  const imageUrls = ['mock-url-1', 'mock-url-2', 'mock-url-3'];

  const aiResult = await aiService.analyzeImages(imageUrls, productContext);
  
  console.log('✅ AI Analysis Result:');
  console.log(`   Condition Grade: ${aiResult.conditionGrade}`);
  console.log(`   Confidence Score: ${aiResult.confidenceScore}%`);
  console.log(`   Defects: ${aiResult.defectsDetected.join(', ') || 'None'}`);
  console.log(`   Summary: ${aiResult.analysisSummary}\n`);

  // Test Recommendation Engine
  console.log('💡 Testing RecommendationEngine...');
  const recommendationEngine = new RecommendationEngine();
  
  const recommendation = recommendationEngine.generateRecommendation(
    aiResult,
    {
      barcode: '1234567890123',
      productId: 'PROD-001',
      productName: productContext.productName,
      brand: productContext.brand,
      category: 'Electronics',
      originalPrice: productContext.originalPrice,
      description: 'Test product',
      originalImageUrl: '/reference-images/pid_001.jpeg',
    }
  );

  console.log('✅ Recommendation:');
  console.log(`   Action: ${recommendation.action}`);
  console.log(`   Reasoning: ${recommendation.reasoning}`);
  console.log(`   Estimated Value: $${recommendation.estimatedValue.toFixed(2)}`);
  console.log(`   Sustainability Score: ${recommendation.sustainabilityScore}/100\n`);

  console.log('✅ All service tests passed!');
}

// Run tests
testMockServices().catch(console.error);
