// Validates the original-image system end to end.
//
// Checks:
//   - Every product has an originalImageUrl
//   - The referenced file exists on disk under public/
//   - No broken image paths
//   - Reports real (raster) vs generated (vector) coverage and any missing images
//
// Run: npx tsx scripts/validate-reference-images.ts

import { readFileSync, existsSync, readdirSync } from 'fs';
import { resolve } from 'path';
import DatabaseService from '../lib/db/connection';
import { ProductRepository } from '../lib/db/repositories/ProductRepository';

function loadEnvLocal() {
  const envPath = resolve(process.cwd(), '.env.local');
  if (!existsSync(envPath)) return;
  for (const rawLine of readFileSync(envPath, 'utf-8').split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

const PUBLIC_DIR = resolve(process.cwd(), 'public');
const REF_DIR = resolve(PUBLIC_DIR, 'reference-images');

async function main() {
  loadEnvLocal();

  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is not set.');
    process.exit(1);
  }

  const db = await DatabaseService.connect();
  const productRepo = new ProductRepository(db);
  const products = await productRepo.getAllProducts();

  const totalImageFiles = existsSync(REF_DIR) ? readdirSync(REF_DIR).length : 0;

  let withUrl = 0;
  let missingUrl = 0;
  let realImages = 0;
  let generatedImages = 0;
  let brokenPaths = 0;

  const problems: string[] = [];

  for (const p of products) {
    const url = (p as { originalImageUrl?: string }).originalImageUrl;

    if (!url) {
      missingUrl++;
      problems.push(`${p.productId}: missing originalImageUrl`);
      continue;
    }
    withUrl++;

    // Resolve the public path from the URL (strip leading slash).
    const filePath = resolve(PUBLIC_DIR, url.replace(/^\//, ''));
    if (!existsSync(filePath)) {
      brokenPaths++;
      problems.push(`${p.productId}: file not found for ${url}`);
      continue;
    }

    if (url.toLowerCase().endsWith('.svg')) generatedImages++;
    else realImages++;
  }

  await DatabaseService.disconnect();

  // Spotlight: explicitly confirm the products required by the verification phase.
  const spotlightIds = ['PROD-001', 'PROD-003', 'PROD-009', 'PROD-027', 'PROD-048'];
  console.log('\n--------------- SPOTLIGHT PRODUCTS ---------------');
  for (const id of spotlightIds) {
    const prod = products.find((p) => p.productId === id) as
      | { productId: string; productName: string; originalImageUrl?: string }
      | undefined;
    if (!prod) {
      console.log(`  ${id}: NOT FOUND in products`);
      continue;
    }
    const url = prod.originalImageUrl;
    const ok = url ? existsSync(resolve(PUBLIC_DIR, url.replace(/^\//, ''))) : false;
    console.log(`  ${id} | ${url ?? 'MISSING'} | fileExists=${ok}`);
  }
  console.log('--------------------------------------------------');

  console.log('\n============== REFERENCE IMAGE VALIDATION ==============');
  console.log(`Total products:            ${products.length}`);
  console.log(`Total image files on disk: ${totalImageFiles}`);
  console.log(`Real photos (raster):      ${realImages}`);
  console.log(`Generated images (vector): ${generatedImages}`);
  console.log(`Products missing URL:      ${missingUrl}`);
  console.log(`Broken paths:              ${brokenPaths}`);
  console.log('=======================================================');

  if (problems.length > 0) {
    console.log('\nIssues:');
    problems.forEach((p) => console.log(`  - ${p}`));
  }

  const ok = missingUrl === 0 && brokenPaths === 0 && withUrl === products.length;
  console.log(`\nValidation: ${ok ? '✅ PASS' : '❌ FAIL'}\n`);
  process.exit(ok ? 0 : 1);
}

main().catch((err) => {
  console.error('Validation failed:', err);
  process.exit(1);
});
