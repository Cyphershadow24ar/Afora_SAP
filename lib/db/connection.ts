// Task 2.1: Database connection manager with connection pooling
import { MongoClient, Db } from 'mongodb';

class DatabaseService {
  private static client: MongoClient | null = null;
  private static db: Db | null = null;

  static async connect(): Promise<Db> {
    if (this.db) {
      return this.db;
    }
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI environment variable is not defined');
    }

    try {
      // Initialize MongoDB client with connection pooling and security settings
      this.client = new MongoClient(uri, {
        minPoolSize: 2,
        maxPoolSize: 10,
        retryWrites: true,
        tls: true,
        connectTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      await this.client.connect();
      
      const dbName = process.env.MONGODB_DB_NAME || 'afora-returns';
      this.db = this.client.db(dbName);

      // Sanitize URI for logging (remove credentials)
      const sanitizedUri = uri.replace(/\/\/.*:.*@/, '//***:***@');
      console.log(`✅ Connected to MongoDB: ${sanitizedUri} (database: ${dbName})`);

      return this.db;
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error);
      throw error;
    }
  }

  static async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
      console.log('✅ Disconnected from MongoDB');
    }
  }

  static getDb(): Db {
    if (!this.db) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.db;
  }
}

export default DatabaseService;
