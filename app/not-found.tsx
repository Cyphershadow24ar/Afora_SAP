import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-amazon-dark rounded-2xl shadow-lg p-8 text-center space-y-4 border border-gray-100 dark:border-gray-700">
        <div className="text-6xl font-bold text-amazon-orange">404</div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Page Not Found</h2>
        <p className="text-gray-600 dark:text-gray-300">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href="/"
          className="inline-block bg-amazon-orange hover:bg-amazon-orange/90 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
