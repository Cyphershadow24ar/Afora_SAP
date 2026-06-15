// Task 2.4: AnalysisRepository with CRUD and aggregation methods
import { Collection, Db, ObjectId } from 'mongodb';
import { AnalysisRecord, DashboardStats, RecommendationAction } from '@/lib/types';

export class AnalysisRepository {
  private collection: Collection<AnalysisRecord>;

  constructor(db: Db) {
    this.collection = db.collection<AnalysisRecord>('analyses');
  }

  async create(record: Omit<AnalysisRecord, '_id' | 'createdAt'>): Promise<AnalysisRecord> {
    const doc: Omit<AnalysisRecord, '_id'> = {
      ...record,
      createdAt: new Date(),
    };

    const result = await this.collection.insertOne(doc as AnalysisRecord);
    return { ...doc, _id: result.insertedId };
  }

  async findById(id: string): Promise<AnalysisRecord | null> {
    if (!ObjectId.isValid(id)) {
      return null;
    }
    return await this.collection.findOne({ _id: new ObjectId(id) });
  }

  async getRecentAnalyses(limit: number = 100): Promise<AnalysisRecord[]> {
    return await this.collection
      .find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
  }

  async getStatistics(): Promise<DashboardStats> {
    // Use aggregation pipeline to compute statistics efficiently
    const stats = await this.collection.aggregate([
      {
        $facet: {
          totalCount: [{ $count: 'count' }],
          actionBreakdown: [
            { $group: { _id: '$recommendation.action', count: { $sum: 1 } } }
          ],
          valueAndSustainability: [
            {
              $group: {
                _id: null,
                totalValue: { $sum: '$recommendation.estimatedValue' },
                avgSustainability: { $avg: '$recommendation.sustainabilityScore' }
              }
            }
          ],
          wrongProduct: [
            { $match: { wrongProduct: true } },
            { $count: 'count' }
          ]
        }
      }
    ]).toArray();

    const result = stats[0];

    // Extract total items
    const totalItems = result.totalCount[0]?.count || 0;

    // Build action breakdown map
    const actionBreakdown: Record<RecommendationAction, number> = {
      'Restock': 0,
      'Resell New': 0,
      'Open Box Resale': 0,
      'Refurbish': 0,
      'Manual Review': 0,
      'Donate': 0,
      'Recycle': 0,
    };

    result.actionBreakdown.forEach((item: { _id: RecommendationAction; count: number }) => {
      actionBreakdown[item._id] = item.count;
    });

    // Extract totals
    const valueAndSustainability = result.valueAndSustainability[0] || {};
    const totalEstimatedValue = valueAndSustainability.totalValue || 0;
    const averageSustainabilityScore = valueAndSustainability.avgSustainability || 0;
    const wrongProductCount = result.wrongProduct[0]?.count || 0;

    return {
      totalItems,
      actionBreakdown,
      totalEstimatedValue,
      averageSustainabilityScore: Math.round(averageSustainabilityScore * 100) / 100,
      wrongProductCount,
    };
  }

  async createIndexes(): Promise<void> {
    // Create descending index on createdAt for recent items query
    await this.collection.createIndex({ createdAt: -1 });

    // Create non-unique index on recommendation.action for dashboard aggregation
    await this.collection.createIndex({ 'recommendation.action': 1 });

    // Create non-unique index on barcode for product history queries
    await this.collection.createIndex({ barcode: 1 });

    console.log('✅ Analysis collection indexes created');
  }
}
