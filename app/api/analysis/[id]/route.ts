// Task 10.1: GET /api/analysis/[id]
import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import DatabaseService from '@/lib/db/connection';
import { AnalysisRepository } from '@/lib/db/repositories/AnalysisRepository';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid analysis ID format',
        },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const db = await DatabaseService.connect();
    const analysisRepo = new AnalysisRepository(db);

    // Query analysis by ID
    const analysis = await analysisRepo.findById(id);

    if (!analysis) {
      return NextResponse.json(
        {
          success: false,
          error: 'Analysis not found',
        },
        { status: 404 }
      );
    }

    // Return analysis record
    return NextResponse.json(
      {
        success: true,
        analysis,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Analysis retrieval error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'A system error occurred. Please try again.',
      },
      { status: 500 }
    );
  }
}
