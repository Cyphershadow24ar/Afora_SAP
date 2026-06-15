// Original product image migration + generation + backfill.
//
// Canonical field: originalImageUrl  (referenceImageUrl is removed/unset).
//
// Behavior (idempotent):
//   1. Scans public/reference-images/ and indexes files by product number.
//   2. For each product (PROD-NNN), resolves the best matching file:
//        - prefers a real raster photo (pid_NNN.jpeg/.jpg/.png/.webp, incl. double ext)
//        - then a generated vector (pid_NNN.svg)
//        - generates a themed vector if no file exists for that number
//        - falls back to /reference-images/default-product.svg only if all else fails
//   3. Sets originalImageUrl on every product document and unsets referenceImageUrl.
//
// Run: npx tsx scripts/seed-reference-images.ts

import { readFileSync, existsSync, mkdirSync, writeFileSync, readdirSync } from 'fs';
import { resolve } from 'path';
import DatabaseService from '../lib/db/connection';
import { ProductRepository } from '../lib/db/repositories/ProductRepository';
import { generateSeedData } from '../lib/db/seed';
import { ProductCategory } from '../lib/types';

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

const REF_DIR = resolve(process.cwd(), 'public', 'reference-images');
const DEFAULT_IMAGE = '/reference-images/default-product.svg';
const RASTER_EXT = ['.jpeg', '.jpg', '.png', '.webp'];

function productNumber(productId: string): number {
  const m = productId.match(/(\d+)\s*$/);
  return m ? parseInt(m[1], 10) : NaN;
}
function pad3(n: number): string {
  return n.toString().padStart(3, '0');
}

// Index existing files by product number -> list of filenames.
function indexFiles(): Map<number, string[]> {
  const map = new Map<number, string[]>();
  if (!existsSync(REF_DIR)) return map;
  for (const file of readdirSync(REF_DIR)) {
    const m = file.match(/^pid_(\d+)/i);
    if (!m) continue;
    const num = parseInt(m[1], 10);
    if (!map.has(num)) map.set(num, []);
    map.get(num)!.push(file);
  }
  return map;
}

// Pick the best file for a number: raster first, then svg.
function pickBest(files: string[] | undefined): string | null {
  if (!files || files.length === 0) return null;
  const raster = files.find((f) => RASTER_EXT.some((ext) => f.toLowerCase().includes(ext)));
  if (raster) return raster;
  const svg = files.find((f) => f.toLowerCase().endsWith('.svg'));
  return svg || files[0];
}

// ---- themed SVG generation (last resort, when no file exists for a number) ----
const THEMES: Record<ProductCategory, { bg: string; accent: string; label: string; glyph: string }> = {
  Electronics: { bg: '#EAF3FB', accent: '#146EB4', label: 'Electronics', glyph: '<rect x="210" y="120" width="180" height="115" rx="10"/><line x1="270" y1="250" x2="330" y2="250"/><line x1="300" y1="235" x2="300" y2="250"/>' },
  'Mobile Accessories': { bg: '#FFF4E0', accent: '#FF9900', label: 'Mobile Accessories', glyph: '<rect x="258" y="110" width="84" height="150" rx="14"/><line x1="288" y1="128" x2="312" y2="128"/><circle cx="300" cy="244" r="6"/>' },
  'Home & Kitchen': { bg: '#E7F5EE', accent: '#2E8B57', label: 'Home & Kitchen', glyph: '<rect x="240" y="135" width="100" height="105" rx="12"/><path d="M340 160 h22 a18 18 0 0 1 0 50 h-22"/><line x1="240" y1="135" x2="340" y2="135"/>' },
  Clothing: { bg: '#F2ECFC', accent: '#8B5CF6', label: 'Clothing', glyph: '<path d="M250 130 l-40 30 l24 28 l16 -12 v74 h100 v-74 l16 12 l24 -28 l-40 -30 l-30 0 a20 14 0 0 1 -40 0 z"/>' },
  Books: { bg: '#FBEFE3', accent: '#E07B39', label: 'Books', glyph: '<path d="M210 140 q45 -18 90 0 v100 q-45 -18 -90 0 z"/><path d="M390 140 q-45 -18 -90 0 v100 q45 -18 90 0 z"/>' },
};

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function wrap(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > maxChars && cur) { lines.push(cur.trim()); cur = w; }
    else cur = (cur + ' ' + w).trim();
  }
  if (cur) lines.push(cur.trim());
  return lines.slice(0, 4);
}
function buildSvg(productName: string, brand: string, category: ProductCategory): string {
  const t = THEMES[category];
  const lines = wrap(productName, 24);
  const startY = 312;
  const nameText = lines.map((l, i) => `<text x="300" y="${startY + i * 30}" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="24" font-weight="700" fill="#1f2937">${escapeXml(l)}</text>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400" role="img" aria-label="${escapeXml(productName)} original image">
  <rect width="600" height="400" fill="${t.bg}"/>
  <rect x="16" y="16" width="568" height="368" rx="20" fill="#ffffff"/>
  <g fill="none" stroke="${t.accent}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">${t.glyph}</g>
  <rect x="232" y="60" width="136" height="26" rx="13" fill="${t.accent}"/>
  <text x="300" y="78" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="14" font-weight="700" fill="#ffffff">${escapeXml(t.label.toUpperCase())}</text>
  ${nameText}
  <text x="300" y="${startY + lines.length * 30 + 8}" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="16" fill="${t.accent}">${escapeXml(brand)}</text>
</svg>`;
}

function buildDefaultSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400" role="img" aria-label="Default product image">
  <rect width="600" height="400" fill="#F3F4F6"/>
  <rect x="16" y="16" width="568" height="368" rx="20" fill="#ffffff"/>
  <g fill="none" stroke="#9CA3AF" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"><rect x="220" y="140" width="160" height="120" rx="10"/><path d="M240 250 l40 -40 a8 8 0 0 1 11 0 l30 30 l25 -25 a8 8 0 0 1 11 0 l23 23"/><circle cx="260" cy="175" r="10"/></g>
  <text x="300" y="320" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="22" font-weight="700" fill="#374151">Product Image</text>
</svg>`;
}

async function main() {
  loadEnvLocal();

  const products = generateSeedData();
  mkdirSync(REF_DIR, { recursive: true });

  // Ensure a default fallback image always exists.
  writeFileSync(resolve(REF_DIR, 'default-product.svg'), buildDefaultSvg(), 'utf-8');

  const fileIndex = indexFiles();

  let real = 0, vector = 0, generated = 0, defaulted = 0;
  const assignments: { productId: string; originalImageUrl: string }[] = [];
  const missing: string[] = [];

  for (const p of products) {
    const num = productNumber(p.productId);
    const best = pickBest(fileIndex.get(num));

    let url: string;
    if (best) {
      url = `/reference-images/${best}`;
      if (best.toLowerCase().endsWith('.svg')) vector++;
      else real++;
    } else {
      // No file for this number — generate a themed vector.
      try {
        const name = `pid_${pad3(num)}.svg`;
        writeFileSync(resolve(REF_DIR, name), buildSvg(p.productName, p.brand, p.category), 'utf-8');
        url = `/reference-images/${name}`;
        generated++;
      } catch {
        url = DEFAULT_IMAGE;
        defaulted++;
        missing.push(p.productId);
      }
    }
    assignments.push({ productId: p.productId, originalImageUrl: url });
  }

  console.log(`Resolved: ${real} real photos, ${vector} vector, ${generated} generated, ${defaulted} default.`);

  if (!process.env.MONGODB_URI) {
    console.log('MONGODB_URI not set — assets prepared but DB not migrated.');
    process.exit(0);
  }

  const db = await DatabaseService.connect();
  const collection = db.collection('products');

  let modified = 0;
  for (const a of assignments) {
    const res = await collection.updateOne(
      { productId: a.productId },
      { $set: { originalImageUrl: a.originalImageUrl }, $unset: { referenceImageUrl: '' } }
    );
    modified += res.modifiedCount;
  }

  const productRepo = new ProductRepository(db);
  const total = await productRepo.count();

  console.log('\n=============== ORIGINAL IMAGE MIGRATION ===============');
  console.log(`Total products:           ${total}`);
  console.log(`Real photos:              ${real}`);
  console.log(`Vector images:            ${vector}`);
  console.log(`Generated this run:       ${generated}`);
  console.log(`Defaulted (missing):      ${defaulted}`);
  console.log(`DB documents modified:    ${modified}`);
  if (missing.length) console.log(`Missing products: ${missing.join(', ')}`);
  console.log('========================================================\n');

  await DatabaseService.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('Original image migration failed:', err);
  process.exit(1);
});
