'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/Header';

export default function ScanPage() {
  const router = useRouter();
  const [barcode, setBarcode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcode.trim()) {
      setError('Please enter a barcode');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/products/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode: barcode.trim() }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Product not found');
        setLoading(false);
        return;
      }

      router.push(`/product?barcode=${encodeURIComponent(barcode.trim())}`);
    } catch (err) {
      setError('Network error. Please check your connection.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Header />

      <div className="max-w-md mx-auto px-4 pt-10 pb-16 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amazon-orange/10 dark:bg-amazon-orange/20 rounded-full text-sm font-medium text-amazon-orange">
            Step 1 of 4
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white pt-2">Scan Product</h1>
          <p className="text-gray-600 dark:text-gray-300">Enter the product barcode to begin</p>
        </div>

        <div className="bg-white dark:bg-amazon-dark rounded-2xl shadow-lg p-8 space-y-6 border border-gray-100 dark:border-gray-700">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-amazon-orange/10 dark:bg-amazon-orange/20 rounded-2xl flex items-center justify-center">
              <svg className="w-8 h-8 text-amazon-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="barcode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Barcode
              </label>
              <input
                id="barcode"
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-amazon-bg border-2 border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-amazon-orange dark:focus:border-amazon-orange text-lg transition-colors"
                placeholder="Enter barcode (e.g., 1000000000001)"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-4">
                <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amazon-orange hover:bg-amazon-orange/90 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white font-semibold py-4 rounded-xl transition-all transform hover:scale-[1.02] disabled:hover:scale-100 shadow-md hover:shadow-lg"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                  Looking up...
                </span>
              ) : (
                'Lookup Product'
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              Try: 1000000000001 through 1000000000050
            </p>
          </div>
        </div>

        <div className="text-center">
          <Link href="/dashboard" className="text-sm font-medium text-amazon-orange hover:underline">
            View Dashboard →
          </Link>
        </div>
      </div>
    </div>
  );
}
