// Task 3.1 & 3.2: Generate 50 product records with category distribution and seeding script
import { ProductRecord, ProductCategory } from '@/lib/types';

// Category distribution: 15 Electronics, 10 Mobile Accessories, 10 Home & Kitchen, 10 Clothing, 5 Books
const categoryDistribution: Record<ProductCategory, number> = {
  'Electronics': 15,
  'Mobile Accessories': 10,
  'Home & Kitchen': 10,
  'Clothing': 10,
  'Books': 5,
};

// Price ranges by category
const priceRanges: Record<ProductCategory, [number, number]> = {
  'Electronics': [49.99, 299.99],
  'Mobile Accessories': [9.99, 49.99],
  'Home & Kitchen': [19.99, 149.99],
  'Clothing': [14.99, 89.99],
  'Books': [9.99, 29.99],
};

// Product templates by category
const productTemplates: Record<ProductCategory, Array<{ name: string; brand: string; description: string }>> = {
  'Electronics': [
    { name: 'Wireless Bluetooth Headphones', brand: 'TechAudio', description: 'Premium wireless headphones with active noise cancellation' },
    { name: '4K Ultra HD Smart TV 55"', brand: 'VisionTech', description: 'Smart TV with HDR support and built-in streaming apps' },
    { name: 'Laptop Computer 15.6" Display', brand: 'CompuPro', description: 'High-performance laptop with SSD storage' },
    { name: 'Digital Camera DSLR', brand: 'PhotoMaster', description: 'Professional DSLR camera with 24MP sensor' },
    { name: 'Wireless Gaming Mouse', brand: 'GameGear', description: 'Ergonomic wireless gaming mouse with RGB lighting' },
    { name: 'Portable Bluetooth Speaker', brand: 'SoundWave', description: 'Waterproof portable speaker with 12-hour battery' },
    { name: 'Tablet 10" Display', brand: 'TabletCo', description: 'Android tablet with high-resolution touchscreen' },
    { name: 'Smart Watch Fitness Tracker', brand: 'FitTech', description: 'Fitness smartwatch with heart rate monitor' },
    { name: 'Wireless Earbuds Pro', brand: 'AudioElite', description: 'True wireless earbuds with charging case' },
    { name: 'Mechanical Gaming Keyboard', brand: 'KeyMaster', description: 'RGB mechanical keyboard with custom switches' },
    { name: 'External Hard Drive 2TB', brand: 'DataVault', description: 'Portable external storage with USB 3.0' },
    { name: 'Webcam HD 1080p', brand: 'StreamView', description: 'High-definition webcam for video conferencing' },
    { name: 'Router Dual Band WiFi', brand: 'NetConnect', description: 'High-speed wireless router with parental controls' },
    { name: 'Power Bank 20000mAh', brand: 'ChargePlus', description: 'High-capacity portable charger with fast charging' },
    { name: 'E-Reader 6" Display', brand: 'BookTech', description: 'Digital e-reader with e-ink display' },
  ],
  'Mobile Accessories': [
    { name: 'Phone Case Protective Clear', brand: 'ShieldCase', description: 'Transparent protective case with shock absorption' },
    { name: 'Screen Protector Tempered Glass', brand: 'GlassGuard', description: 'Scratch-resistant tempered glass screen protector' },
    { name: 'USB-C Charging Cable 6ft', brand: 'CableLink', description: 'Durable braided USB-C charging cable' },
    { name: 'Car Phone Mount Magnetic', brand: 'AutoGrip', description: 'Magnetic dashboard phone mount for vehicles' },
    { name: 'Wireless Charging Pad', brand: 'ChargePad', description: 'Qi-compatible wireless charging station' },
    { name: 'Phone Ring Holder Stand', brand: 'GripStand', description: '360-degree rotating phone ring holder' },
    { name: 'Bluetooth Headset Single Ear', brand: 'CallTech', description: 'Hands-free Bluetooth headset for calls' },
    { name: 'PopSocket Phone Grip', brand: 'PopGrip', description: 'Collapsible phone grip and stand' },
    { name: 'Lightning to USB Cable', brand: 'AppleLink', description: 'MFi certified charging cable for iPhone' },
    { name: 'Selfie Stick with Tripod', brand: 'SelfiePro', description: 'Extendable selfie stick with Bluetooth remote' },
  ],
  'Home & Kitchen': [
    { name: 'Stainless Steel Cookware Set', brand: 'ChefMaster', description: '10-piece stainless steel pot and pan set' },
    { name: 'Blender High Speed 1000W', brand: 'BlendTech', description: 'Powerful blender for smoothies and shakes' },
    { name: 'Air Fryer 5 Quart', brand: 'FryEasy', description: 'Oil-free air fryer with digital controls' },
    { name: 'Coffee Maker Programmable', brand: 'BrewMaster', description: '12-cup programmable coffee maker with thermal carafe' },
    { name: 'Vacuum Cleaner Cordless', brand: 'CleanPro', description: 'Lightweight cordless stick vacuum' },
    { name: 'Kitchen Knife Set 15-Piece', brand: 'CutEdge', description: 'Professional knife set with storage block' },
    { name: 'Toaster 4-Slice Stainless', brand: 'ToastPro', description: 'Wide-slot toaster with bagel setting' },
    { name: 'Dish Drying Rack Bamboo', brand: 'EcoHome', description: 'Eco-friendly bamboo dish rack with utensil holder' },
    { name: 'Mixing Bowl Set Glass', brand: 'BowlCraft', description: 'Nesting glass mixing bowls with lids' },
    { name: 'Spice Rack Organizer 20-Jar', brand: 'SpiceStore', description: 'Revolving spice rack with labeled jars' },
  ],
  'Clothing': [
    { name: 'Men\'s Cotton T-Shirt Pack', brand: 'ComfortWear', description: 'Pack of 3 classic fit cotton t-shirts' },
    { name: 'Women\'s Yoga Pants Leggings', brand: 'ActiveFit', description: 'High-waisted athletic leggings with pockets' },
    { name: 'Denim Jeans Classic Fit', brand: 'DenimCo', description: 'Classic fit jeans with stretch fabric' },
    { name: 'Hoodie Sweatshirt Pullover', brand: 'CozyStyle', description: 'Soft fleece pullover hoodie' },
    { name: 'Running Shoes Athletic', brand: 'SpeedRun', description: 'Lightweight running shoes with cushioned sole' },
    { name: 'Winter Jacket Insulated', brand: 'WarmGuard', description: 'Water-resistant insulated winter coat' },
    { name: 'Baseball Cap Adjustable', brand: 'CapStyle', description: 'Cotton baseball cap with adjustable strap' },
    { name: 'Socks Cotton 6-Pack', brand: 'ComfortStep', description: 'Cushioned athletic socks' },
    { name: 'Button-Up Dress Shirt', brand: 'FormalFit', description: 'Wrinkle-resistant dress shirt' },
    { name: 'Sneakers Casual Canvas', brand: 'UrbanStep', description: 'Classic canvas sneakers' },
  ],
  'Books': [
    { name: 'The Art of Software Engineering', brand: 'TechPress', description: 'Comprehensive guide to modern software development' },
    { name: 'Sustainable Living: A Practical Guide', brand: 'GreenPublishing', description: 'Eco-friendly lifestyle tips and practices' },
    { name: 'Mystery of the Lost Artifact', brand: 'NovelHouse', description: 'Thrilling mystery adventure novel' },
    { name: 'Cooking for Beginners', brand: 'CulinaryBooks', description: 'Easy recipes for new home cooks' },
    { name: 'Mindfulness and Meditation', brand: 'WellnessPress', description: 'Guide to mindfulness practices' },
  ],
};

// Generate unique EAN-13 format barcodes
function generateBarcode(index: number): string {
  // Generate 13-digit EAN-13 barcodes starting from 1000000000001
  const baseNumber = 1000000000000 + index;
  return baseNumber.toString();
}

// Generate random price within category range
function generatePrice(category: ProductCategory): number {
  const [min, max] = priceRanges[category];
  const price = Math.random() * (max - min) + min;
  return Math.round(price * 100) / 100; // Round to 2 decimal places
}

// Canonical, deterministic original-image path for a product.
// Rule: extract the numeric portion of the productId (PROD-001 -> 001) and
// build /reference-images/pid_{NNN}.jpeg. The migration/seed-image script
// resolves this to the actual file on disk (real photo or generated vector).
export function getOriginalImageUrl(productId: string): string {
  const num = (productId.match(/(\d+)\s*$/)?.[1] || '0').padStart(3, '0');
  return `/reference-images/pid_${num}.jpeg`;
}

// Generate 50 product records
export function generateSeedData(): ProductRecord[] {
  const products: ProductRecord[] = [];
  let index = 1;

  for (const [category, count] of Object.entries(categoryDistribution)) {
    const templates = productTemplates[category as ProductCategory];
    
    for (let i = 0; i < count; i++) {
      const template = templates[i % templates.length];
      const productId = `PROD-${index.toString().padStart(3, '0')}`;

      products.push({
        barcode: generateBarcode(index),
        productId,
        productName: template.name,
        brand: template.brand,
        category: category as ProductCategory,
        originalPrice: generatePrice(category as ProductCategory),
        description: template.description,
        // Canonical deterministic path; resolved to the real file by migration.
        originalImageUrl: getOriginalImageUrl(productId),
      });

      index++;
    }
  }

  return products;
}
