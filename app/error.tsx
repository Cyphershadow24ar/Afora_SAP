'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log for debugging; never expose sensitive details to the user.
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-amazon-dark rounded-2xl shadow-lg p-8 text-center space-y-4 border border-gray-100 dark:border-gray-700">
        <div className="text-5xl">⚠️</div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Something went wrong</h2>
        <p className="text-gray-600 dark:text-gray-300">
          A system error occurred. Please try again.
        </p>
        <div className="flex gap-3 justify-center pt-2">
          <button
            onClick={reset}
            className="bg-amazon-orange hover:bg-amazon-orange/90 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="border-2 border-amazon-orange text-amazon-orange hover:bg-amazon-orange/10 font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
