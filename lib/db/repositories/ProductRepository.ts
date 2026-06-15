// Task 2.3: ProductRepository with barcode lookup and seeding
import { Collection, Db } from 'mongodb';
import { ProductRecord } from '@/lib/types';

export class ProductRepository {
  private collection: Collection<ProductRecord>;

  constructor(db: Db) {
    this.collection = db.collection<ProductRecord>('products');
  }

  // Returns the complete product document, including originalImageUrl
  // (the reference image used by the product page and, in future, by BedrockService
  // for original-vs-returned comparison). No field projection is applied.
  async findByBarcode(barcode: string): Promise<ProductRecord | null> {
    return await this.collection.findOne({ barcode });
  }

  async seedProducts(products: ProductRecord[]): Promise<void> {
    await this.collection.insertMany(products);
  }

  // Returns full product documents, including originalImageUrl.
  async getAllProducts(): Promise<ProductRecord[]> {
    return await this.collection.find({}).toArray();
  }

  async createIndexes(): Promise<void> {
    // Create unique index on barcode for fast lookup
    await this.collection.createIndex({ barcode: 1 }, { unique: true });
    
    // Create non-unique index on category for analytics
    await this.collection.createIndex({ category: 1 });
    
    console.log('✅ Product collection indexes created');
  }

  async count(): Promise<number> {
    return await this.collection.countDocuments();
  }
}
