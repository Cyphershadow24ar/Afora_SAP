// Task 8.1: POST /api/products/lookup
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import DatabaseService from '@/lib/db/connection';
import { ProductRepository } from '@/lib/db/repositories/ProductRepository';

const ProductLookupSchema = z.object({
  barcode: z
    .string()
    .min(1, 'Barcode is required')
    .max(100, 'Barcode too long')
    .regex(/^[a-zA-Z0-9-_]+$/, 'Invalid barcode format'),
});

export async function POST(req: NextRequest) {
  try {
    // Parse and validate request body
    const body = await req.json();
    const validation = ProductLookupSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error.issues[0].message,
        },
        { status: 400 }
      );
    }

    const { barcode } = validation.data;

    // Connect to MongoDB
    const db = await DatabaseService.connect();
    const productRepo = new ProductRepository(db);

    // Query product by barcode
    const product = await productRepo.findByBarcode(barcode);

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          error: 'Product not found. Please verify the barcode and try again.',
        },
        { status: 400 }
      );
    }

    // Return product (full document, including originalImageUrl reference image)
    return NextResponse.json(
      {
        success: true,
        product,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Product lookup error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'A system error occurred. Please try again.',
      },
      { status: 500 }
    );
  }
}
