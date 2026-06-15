// Database initialization script
import DatabaseService from './connection';
import { ProductRepository } from './repositories/ProductRepository';
import { AnalysisRepository } from './repositories/AnalysisRepository';
import { generateSeedData } from './seed';

export async function initializeDatabase(): Promise<void> {
  try {
    console.log('🔄 Initializing database...');
    
    const db = await DatabaseService.connect();
    
    // Initialize repositories
    const productRepo = new ProductRepository(db);
    const analysisRepo = new AnalysisRepository(db);
    
    // Create indexes
    await productRepo.createIndexes();
    await analysisRepo.createIndexes();
    
    // Check if products collection is empty
    const productCount = await productRepo.count();
    
    if (productCount === 0) {
      console.log('📦 Seeding products collection...');
      const seedData = generateSeedData();
      await productRepo.seedProducts(seedData);
      console.log(`✅ Seeded ${seedData.length} products`);
    } else {
      console.log(`✅ Products collection already contains ${productCount} products`);
    }
    
    console.log('✅ Database initialization complete');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}
