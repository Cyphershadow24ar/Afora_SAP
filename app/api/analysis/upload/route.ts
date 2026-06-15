// Task 9.1: POST /api/analysis/upload
import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import DatabaseService from '@/lib/db/connection';
import { ProductRepository } from '@/lib/db/repositories/ProductRepository';
import { AnalysisRepository } from '@/lib/db/repositories/AnalysisRepository';
import { ServiceFactory } from '@/lib/services/ServiceFactory';
import { SecondLifeEngine } from '@/lib/services/SecondLifeEngine';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(req: NextRequest) {
  try {
    // Parse multipart/form-data
    const formData = await req.formData();
    const barcode = formData.get('barcode') as string;
    const imageFiles: File[] = [];

    // Collect image files
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('image') && value instanceof File) {
        imageFiles.push(value);
      }
    }

    // Validate barcode
    if (!barcode || typeof barcode !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Barcode is required',
        },
        { status: 400 }
      );
    }

    // Validate image count
    if (imageFiles.length < 3 || imageFiles.length > 5) {
      return NextResponse.json(
        {
          success: false,
          error: `Please provide 3-5 images. You provided ${imageFiles.length}.`,
        },
        { status: 400 }
      );
    }

    // Validate each image
    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];

      // Check file type
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          {
            success: false,
            error: `Image ${i + 1} has unsupported format. Please use JPEG, PNG, or WebP.`,
          },
          { status: 400 }
        );
      }

      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          {
            success: false,
            error: `Image ${i + 1} exceeds 10MB size limit.`,
          },
          { status: 400 }
        );
      }
    }

    // Lookup product
    const db = await DatabaseService.connect();
    const productRepo = new ProductRepository(db);
    const product = await productRepo.findByBarcode(barcode);

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          error: 'Product not found. Please verify the barcode.',
        },
        { status: 400 }
      );
    }

    // Generate an id used only to organize uploaded images in storage.
    // The authoritative analysis id is the MongoDB _id returned by create().
    const storageId = new ObjectId().toString();

    // Upload images via StorageService
    const storageService = ServiceFactory.getStorageService();
    let imageUrls: string[];
    try {
      const uploadResults = await storageService.uploadImages(imageFiles, storageId);
      imageUrls = uploadResults.map((r) => r.url);
    } catch (error) {
      console.error('Image upload error:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Image upload failed. Please try again.',
        },
        { status: 500 }
      );
    }

    // Phase 1-2: AI inspection (product match + advanced visual inspection)
    const aiService = ServiceFactory.getAIService();
    let inspection;
    try {
      inspection = await aiService.inspectReturn(product.originalImageUrl, imageUrls, {
        productName: product.productName,
        brand: product.brand,
        category: product.category,
        originalPrice: product.originalPrice,
        originalImageUrl: product.originalImageUrl,
      });
    } catch (error) {
      console.error('AI inspection error:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Analysis failed. Please try again.',
        },
        { status: 500 }
      );
    }

    const { productMatch, visualInspection } = inspection;
    const analysisRepo = new AnalysisRepository(db);

    // Phase 1 rejection: returned product does not match the reference product.
    if (productMatch.similarityScore < 60) {
      const aiAnalysis = {
        conditionGrade: visualInspection.condition,
        confidenceScore: visualInspection.confidence,
        defectsDetected: visualInspection.issues,
        analysisSummary: `Product-match validation failed (similarity ${productMatch.similarityScore}%). ${productMatch.reason}`,
      };
      const recommendation = {
        action: 'Manual Review' as const,
        reasoning:
          'Returned product does not match the reference product. Routed to manual review (possible wrong item).',
        estimatedValue: 0,
        sustainabilityScore: 0,
      };

      let rejectedId: string;
      try {
        const created = await analysisRepo.create({
          barcode: product.barcode,
          productId: product.productId,
          productName: product.productName,
          category: product.category,
          originalPrice: product.originalPrice,
          imageUrls,
          aiAnalysis,
          recommendation,
          productMatch,
          visualInspection,
          wrongProduct: true,
        });
        rejectedId = created._id!.toString();
      } catch (error) {
        console.error('Database save error:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to save analysis. Please try again.' },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          analysisId: rejectedId,
          wrongProduct: true,
          productMatch,
          visualInspection,
          analysis: aiAnalysis,
          recommendation,
        },
        { status: 200 }
      );
    }

    // Phases 3-6: deterministic Second-Life decision (costs, markets, paths, best).
    const engine = new SecondLifeEngine();
    const decision = engine.decide(product, visualInspection, productMatch);

    // Save complete Analysis Record to MongoDB
    let analysisId: string;
    try {
      const created = await analysisRepo.create({
        barcode: product.barcode,
        productId: product.productId,
        productName: product.productName,
        category: product.category,
        originalPrice: product.originalPrice,
        imageUrls,
        aiAnalysis: decision.aiAnalysis,
        recommendation: decision.recommendation,
        productMatch,
        visualInspection,
        costEstimate: decision.costEstimate,
        marketValue: decision.marketValue,
        nextLifeOptions: decision.nextLifeOptions,
        bestRecommendation: decision.bestRecommendation,
        wrongProduct: false,
      });
      // Use the authoritative MongoDB _id as the analysis id
      analysisId = created._id!.toString();
    } catch (error) {
      console.error('Database save error:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to save analysis. Please try again.',
        },
        { status: 500 }
      );
    }

    // Return success with full Second-Life decision
    return NextResponse.json(
      {
        success: true,
        analysisId,
        wrongProduct: false,
        productMatch,
        visualInspection,
        analysis: decision.aiAnalysis,
        recommendation: decision.recommendation,
        costEstimate: decision.costEstimate,
        marketValue: decision.marketValue,
        nextLifeOptions: decision.nextLifeOptions,
        bestRecommendation: decision.bestRecommendation,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Analysis upload error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'A system error occurred. Please try again.',
      },
      { status: 500 }
    );
  }
}
