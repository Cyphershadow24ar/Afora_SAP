'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/Header';
import type { ProductRecord } from '@/lib/types';

function ProductPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const barcode = searchParams.get('barcode');

  const [product, setProduct] = useState<ProductRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  // Backward compatibility: fall back to a placeholder if the original image
  // is missing (records without originalImageUrl) or fails to load.
  const [refImageFailed, setRefImageFailed] = useState(false);
  const [refImageLoading, setRefImageLoading] = useState(true);

  useEffect(() => {
    if (!barcode) {
      router.push('/scan');
      return;
    }

    const fetchProduct = async () => {
      try {
        const res = await fetch('/api/products/lookup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ barcode }),
        });

        const data = await res.json();

        if (!data.success) {
          setError(data.error);
          setLoading(false);
          return;
        }

        setProduct(data.product);
        setLoading(false);
      } catch (err) {
        setError('Failed to load product');
        setLoading(false);
      }
    };

    fetchProduct();
  }, [barcode, router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (images.length + files.length > 5) {
      setUploadError('Maximum 5 images allowed');
      return;
    }

    // Validate each file
    for (const file of files) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setUploadError(`${file.name}: Unsupported format. Use JPEG, PNG, or WebP.`);
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setUploadError(`${file.name}: File too large (max 10MB)`);
        return;
      }
    }

    setImages([...images, ...files]);
    setUploadError('');
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    setUploadError('');
  };

  const handleUpload = async () => {
    if (images.length < 3) {
      setUploadError('Please capture at least 3 images');
      return;
    }

    setUploading(true);
    setUploadError('');

    try {
      const formData = new FormData();
      formData.append('barcode', barcode!);
      images.forEach((img, i) => {
        formData.append(`image${i}`, img);
      });

      const res = await fetch('/api/analysis/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!data.success) {
        setUploadError(data.error);
        setUploading(false);
        return;
      }

      router.push(`/result/${data.analysisId}`);
    } catch (err) {
      setUploadError('Upload failed. Please try again.');
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amazon-orange mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading product...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="max-w-md mx-auto px-4 pt-10">
          <div className="bg-white dark:bg-amazon-dark rounded-2xl shadow-lg p-8 text-center space-y-4 border border-gray-100 dark:border-gray-700">
            <div className="text-red-500 text-5xl">⚠️</div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Error</h2>
            <p className="text-gray-600 dark:text-gray-300">{error || 'Product not found'}</p>
            <Link href="/scan" className="inline-block bg-amazon-orange text-white px-6 py-3 rounded-xl hover:bg-amazon-orange/90 transition-colors">
              Try Again
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />

      <div className="max-w-2xl mx-auto px-4 pt-8 pb-24 space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/scan" className="text-sm font-medium text-amazon-orange hover:underline">
            ← Back to Scan
          </Link>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amazon-orange/10 dark:bg-amazon-orange/20 rounded-full text-sm font-medium text-amazon-orange">
            Step 2 of 4
          </div>
        </div>

        {/* Product Info */}
        <div className="bg-white dark:bg-amazon-dark rounded-2xl shadow-lg p-6 space-y-4 border border-gray-100 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{product.productName}</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Brand:</span>
              <p className="font-semibold text-gray-900 dark:text-white">{product.brand}</p>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Category:</span>
              <p className="font-semibold text-gray-900 dark:text-white">{product.category}</p>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Barcode:</span>
              <p className="font-mono font-semibold text-gray-900 dark:text-white">{product.barcode}</p>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Original Price:</span>
              <p className="font-semibold text-green-600 dark:text-green-400">${product.originalPrice.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Original Product Image (original/new condition) */}
        {/* FUTURE: this originalImageUrl will be sent to BedrockService for
            original-vs-returned comparison (damage, missing components,
            cosmetic defects). Display only for now. */}
        <div className="bg-white dark:bg-amazon-dark rounded-2xl shadow-lg p-6 space-y-4 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Original Product Image</h3>
            <span className="text-xs font-medium px-3 py-1 rounded-full bg-amazon-orange/10 dark:bg-amazon-orange/20 text-amazon-orange">
              Original / New Condition
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Compare the returned item against the original product image.
          </p>
          <div className="relative rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-amazon-bg overflow-hidden">
            {product.originalImageUrl && !refImageFailed ? (
              <>
                {refImageLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-amazon-bg">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amazon-orange"></div>
                  </div>
                )}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={product.originalImageUrl}
                  alt={`${product.productName} (original)`}
                  className="w-full h-56 object-contain bg-white dark:bg-white/5"
                  onLoad={() => setRefImageLoading(false)}
                  onError={() => {
                    setRefImageLoading(false);
                    setRefImageFailed(true);
                  }}
                />
              </>
            ) : (
              <div className="w-full h-56 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 gap-2">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm">No original image available</span>
              </div>
            )}
          </div>
        </div>

        {/* Image Capture */}
        <div className="bg-white dark:bg-amazon-dark rounded-2xl shadow-lg p-6 space-y-4 border border-gray-100 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Returned Product Images</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">Take 3-5 photos of the returned product</p>

          <div className="space-y-4">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              capture="environment"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-3 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-amazon-orange/10 file:text-amazon-orange hover:file:bg-amazon-orange/20 cursor-pointer"
              disabled={uploading || images.length >= 5}
            />

            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {images.map((img, idx) => (
                  <div key={idx} className="relative group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={URL.createObjectURL(img)}
                      alt={`Preview ${idx + 1}`}
                      className="w-full h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                    />
                    <button
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 text-xs hover:bg-red-600 transition-colors"
                      aria-label={`Remove image ${idx + 1}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-300">
                {images.length} / 5 images
                {images.length < 3 && <span className="text-red-500 dark:text-red-400 ml-2">(min 3 required)</span>}
              </span>
            </div>

            {uploadError && (
              <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-4">
                <p className="text-red-700 dark:text-red-400 text-sm">{uploadError}</p>
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={uploading || images.length < 3 || images.length > 5}
              className="w-full bg-amazon-orange hover:bg-amazon-orange/90 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white font-semibold py-4 rounded-xl transition-all transform hover:scale-[1.02] disabled:hover:scale-100 shadow-md hover:shadow-lg"
            >
              {uploading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                  Analyzing...
                </span>
              ) : (
                'Upload & Analyze'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


export default function ProductPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amazon-orange mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    }>
      <ProductPageContent />
    </Suspense>
  );
}
