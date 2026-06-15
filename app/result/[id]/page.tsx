'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import type { AnalysisRecord } from '@/lib/types';

export default function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const [analysis, setAnalysis] = useState<AnalysisRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [id, setId] = useState<string>('');

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (!id) return;

    const fetchAnalysis = async () => {
      try {
        const res = await fetch(`/api/analysis/${id}`);
        const data = await res.json();

        if (!data.success) {
          setError(data.error);
          setLoading(false);
          return;
        }

        setAnalysis(data.analysis);
        setLoading(false);
      } catch (err) {
        setError('Failed to load analysis');
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amazon-orange mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading results...</p>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="max-w-md mx-auto px-4 pt-10">
          <div className="bg-white dark:bg-amazon-dark rounded-2xl shadow-lg p-8 text-center space-y-4 border border-gray-100 dark:border-gray-700">
            <div className="text-red-500 text-5xl">⚠️</div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Error</h2>
            <p className="text-gray-600 dark:text-gray-300">{error || 'Analysis not found'}</p>
            <Link href="/scan" className="inline-block bg-amazon-orange text-white px-6 py-3 rounded-xl hover:bg-amazon-orange/90 transition-colors">
              Process Another Item
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const gradeColors: Record<string, string> = {
    Excellent: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700',
    Good: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700',
    Fair: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700',
    Poor: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700',
    Damaged: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700',
  };

  const actionGradients: Record<string, string> = {
    Restock: 'from-green-500 to-green-600',
    'Resell New': 'from-green-500 to-emerald-600',
    'Open Box Resale': 'from-blue-500 to-aws-blue',
    Refurbish: 'from-yellow-500 to-amber-600',
    'Manual Review': 'from-orange-500 to-amazon-orange',
    Donate: 'from-purple-500 to-purple-600',
    Recycle: 'from-gray-500 to-gray-600',
  };

  const actionGradient = actionGradients[analysis.recommendation.action] || 'from-gray-500 to-gray-600';

  return (
    <div className="min-h-screen">
      <Header />

      <div className="max-w-2xl mx-auto px-4 pt-8 pb-24 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analysis Results</h1>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amazon-orange/10 dark:bg-amazon-orange/20 rounded-full text-sm font-medium text-amazon-orange">
            Step 4 of 4
          </div>
        </div>

        {/* DOMINANT Recommendation Card */}
        <div className={`rounded-3xl shadow-2xl p-8 space-y-5 text-white bg-gradient-to-br ${actionGradient}`}>
          <div className="flex items-center gap-2 text-white/80 text-sm font-medium uppercase tracking-wide">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Recommended Action
          </div>

          <div className="text-4xl md:text-5xl font-bold">{analysis.recommendation.action}</div>

          <p className="text-white/90 text-lg leading-relaxed">{analysis.recommendation.reasoning}</p>

          <div className="grid grid-cols-2 gap-4 pt-5 border-t border-white/20">
            <div>
              <span className="text-white/80 text-sm">Estimated Recovery Value</span>
              <p className="text-3xl font-bold mt-1">${analysis.recommendation.estimatedValue.toFixed(2)}</p>
            </div>
            <div>
              <span className="text-white/80 text-sm">Sustainability Score</span>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 bg-white/30 rounded-full h-2.5">
                  <div
                    className="bg-white h-2.5 rounded-full transition-all"
                    style={{ width: `${analysis.recommendation.sustainabilityScore}%` }}
                  ></div>
                </div>
                <span className="text-xl font-bold">{analysis.recommendation.sustainabilityScore}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Product Info */}
        <div className="bg-white dark:bg-amazon-dark rounded-2xl shadow-lg p-6 space-y-3 border border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{analysis.productName}</h2>
          <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-300">
            <span>{analysis.category}</span>
            <span>•</span>
            <span>${analysis.originalPrice.toFixed(2)}</span>
          </div>
        </div>

        {/* AI Analysis */}
        <div className="bg-white dark:bg-amazon-dark rounded-2xl shadow-lg p-6 space-y-4 border border-gray-100 dark:border-gray-700">
          <h3 className="font-bold text-gray-900 dark:text-white">AI Analysis</h3>

          <div className="space-y-4">
            <div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Condition Grade</span>
              <div className={`inline-block px-4 py-2 rounded-lg border-2 font-semibold mt-1 ml-0 block w-fit ${gradeColors[analysis.aiAnalysis.conditionGrade]}`}>
                {analysis.aiAnalysis.conditionGrade}
              </div>
            </div>

            <div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Confidence Score</span>
              <div className="flex items-center gap-3 mt-1">
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div
                    className="bg-amazon-orange h-3 rounded-full transition-all"
                    style={{ width: `${analysis.aiAnalysis.confidenceScore}%` }}
                  ></div>
                </div>
                <span className="font-bold text-lg text-gray-900 dark:text-white">{analysis.aiAnalysis.confidenceScore}%</span>
              </div>
            </div>

            {analysis.aiAnalysis.defectsDetected.length > 0 && (
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Defects Detected</span>
                <ul className="mt-1 list-disc list-inside text-sm text-gray-700 dark:text-gray-300">
                  {analysis.aiAnalysis.defectsDetected.map((defect, idx) => (
                    <li key={idx}>{defect}</li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Summary</span>
              <p className="mt-1 text-gray-700 dark:text-gray-300">{analysis.aiAnalysis.analysisSummary}</p>
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="bg-white dark:bg-amazon-dark rounded-2xl shadow-lg p-6 space-y-4 border border-gray-100 dark:border-gray-700">
          <h3 className="font-bold text-gray-900 dark:text-white">Captured Images</h3>
          <div className="grid grid-cols-3 gap-3">
            {analysis.imageUrls.map((url, idx) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={idx}
                src={url}
                alt={`Product image ${idx + 1}`}
                className="w-full h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
              />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Link
            href="/scan"
            className="block bg-amazon-orange hover:bg-amazon-orange/90 text-white font-semibold py-4 rounded-xl text-center transition-all transform hover:scale-[1.02] shadow-md hover:shadow-lg"
          >
            Process Another
          </Link>
          <Link
            href="/dashboard"
            className="block border-2 border-amazon-orange text-amazon-orange hover:bg-amazon-orange/10 font-semibold py-4 rounded-xl text-center transition-colors"
          >
            View Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
