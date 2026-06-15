// Task 11: MongoDB Atlas initialization and verification
// - Connects using MONGODB_URI
// - Creates indexes
// - Seeds 50 products if collection is empty
// - Verifies barcode 1000000000001 exists
// - Verifies ProductRepository and AnalysisRepository can access MongoDB

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import DatabaseService from '../lib/db/connection';
import { ProductRepository } from '../lib/db/repositories/ProductRepository';
import { AnalysisRepository } from '../lib/db/repositories/AnalysisRepository';
import { generateSeedData } from '../lib/db/seed';

// Minimal .env.local loader (no external dependency)
function loadEnvLocal() {
  const envPath = resolve(process.cwd(), '.env.local');
  if (!existsSync(envPath)) return;
  const content = readFileSync(envPath, 'utf-8');
  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

async function main() {
  loadEnvLocal();

  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI is not set (checked environment and .env.local)');
    process.exit(1);
  }

  // 1. Connect
  const db = await DatabaseService.connect();

  const productRepo = new ProductRepository(db);
  const analysisRepo = new AnalysisRepository(db);

  // 2. Create indexes
  await productRepo.createIndexes();
  await analysisRepo.createIndexes();

  // 3. Seed if empty
  const existingCount = await productRepo.count();
  let seededCount = 0;
  if (existingCount === 0) {
    const seedData = generateSeedData();
    await productRepo.seedProducts(seedData);
    seededCount = seedData.length;
  }
  const finalProductCount = await productRepo.count();

  // 4. Verify target barcode
  const targetBarcode = '1000000000001';
  const targetProduct = await productRepo.findByBarcode(targetBarcode);

  // 5. Verify repository access
  const allProducts = await productRepo.getAllProducts();
  const stats = await analysisRepo.getStatistics();

  // Gather collection + index metadata for reporting
  const collections = (await db.listCollections().toArray()).map((c) => c.name);
  const productIndexes = (await db.collection('products').indexes()).map((i) => i.name);
  const analysisIndexes = (await db.collection('analyses').indexes()).map((i) => i.name);

  // ---- Output ----
  console.log('\n================ TASK 11 RESULTS ================\n');

  console.log('Collections present:');
  collections.forEach((c) => console.log(`  - ${c}`));

  console.log('\nIndexes created (products):');
  productIndexes.forEach((i) => console.log(`  - ${i}`));
  console.log('Indexes created (analyses):');
  analysisIndexes.forEach((i) => console.log(`  - ${i}`));

  console.log('\nSeeding:');
  if (seededCount > 0) {
    console.log(`  - Seeded ${seededCount} products (collection was empty)`);
  } else {
    console.log(`  - Skipped seeding (collection already had ${existingCount} products)`);
  }
  console.log(`  - Total products in collection: ${finalProductCount}`);

  console.log('\nVerification:');
  console.log(
    `  - Barcode ${targetBarcode}: ${
      targetProduct ? `FOUND ("${targetProduct.productName}", ${targetProduct.category})` : 'NOT FOUND'
    }`
  );
  console.log(`  - ProductRepository.getAllProducts(): ${allProducts.length} products accessible`);
  console.log(
    `  - AnalysisRepository.getStatistics(): OK (totalItems=${stats.totalItems}, totalValue=$${stats.totalEstimatedValue.toFixed(
      2
    )})`
  );

  await DatabaseService.disconnect();

  const verificationOk = finalProductCount === 50 && !!targetProduct;
  console.log(`\nOverall: ${verificationOk ? '✅ PASS' : '❌ FAIL'}`);
  console.log('\n=================================================\n');

  process.exit(verificationOk ? 0 : 1);
}

main().catch((err) => {
  console.error('❌ Task 11 failed:', err);
  process.exit(1);
});
