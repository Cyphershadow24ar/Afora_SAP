// Task 10.2: GET /api/dashboard
import { NextRequest, NextResponse } from 'next/server';
import DatabaseService from '@/lib/db/connection';
import { AnalysisRepository } from '@/lib/db/repositories/AnalysisRepository';

export async function GET(_req: NextRequest) {
  try {
    // Connect to MongoDB
    const db = await DatabaseService.connect();
    const analysisRepo = new AnalysisRepository(db);

    // Calculate dashboard statistics
    const stats = await analysisRepo.getStatistics();

    // Retrieve 100 most recent analyses
    const recentItems = await analysisRepo.getRecentAnalyses(100);

    // Return dashboard data
    return NextResponse.json(
      {
        success: true,
        stats,
        recentItems,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Dashboard error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'A system error occurred. Please try again.',
      },
      { status: 500 }
    );
  }
}
