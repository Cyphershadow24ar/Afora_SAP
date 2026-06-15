'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import type { DashboardStats, AnalysisRecord } from '@/lib/types';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentItems, setRecentItems] = useState<AnalysisRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboard = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/dashboard');
      const data = await res.json();

      if (!data.success) {
        setError(data.error);
        setLoading(false);
        return;
      }

      setStats(data.stats);
      setRecentItems(data.recentItems);
      setLoading(false);
    } catch (err) {
      setError('Failed to load dashboard');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amazon-orange mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="max-w-md mx-auto px-4 pt-10">
          <div className="bg-white dark:bg-amazon-dark rounded-2xl shadow-lg p-8 text-center space-y-4 border border-gray-100 dark:border-gray-700">
            <div className="text-red-500 text-5xl">⚠️</div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Error</h2>
            <p className="text-gray-600 dark:text-gray-300">{error || 'Failed to load dashboard'}</p>
            <button
              onClick={fetchDashboard}
              className="inline-block bg-amazon-orange text-white px-6 py-3 rounded-xl hover:bg-amazon-orange/90 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (stats.totalItems === 0) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="max-w-4xl mx-auto px-4 pt-8 space-y-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>

          <div className="bg-white dark:bg-amazon-dark rounded-2xl shadow-lg p-12 text-center space-y-4 border border-gray-100 dark:border-gray-700">
            <div className="text-6xl">📦</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">No Items Processed Yet</h2>
            <p className="text-gray-600 dark:text-gray-300">Start processing returns to see analytics here</p>
            <Link
              href="/scan"
              className="inline-block bg-amazon-orange text-white px-6 py-3 rounded-xl hover:bg-amazon-orange/90 transition-colors mt-4"
            >
              Process First Item
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const actionColors: Record<string, string> = {
    Restock: 'bg-green-500',
    'Resell New': 'bg-green-500',
    'Open Box Resale': 'bg-blue-500',
    Refurbish: 'bg-yellow-500',
    'Manual Review': 'bg-orange-500',
    Donate: 'bg-purple-500',
    Recycle: 'bg-gray-500',
  };

  return (
    <div className="min-h-screen">
      <Header />

      <div className="max-w-5xl mx-auto px-4 pt-8 pb-24 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">Returns processing analytics</p>
          </div>
          <button
            onClick={fetchDashboard}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-amazon-dark border-2 border-gray-200 dark:border-gray-600 hover:border-amazon-orange dark:hover:border-amazon-orange rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-amazon-dark rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amazon-orange/10 dark:bg-amazon-orange/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-amazon-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Items</div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalItems}</div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-amazon-dark rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Recovery Value</div>
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  ${stats.totalEstimatedValue.toFixed(0)}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-amazon-dark rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Avg Sustainability</div>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className="bg-green-500 h-3 rounded-full transition-all"
                  style={{ width: `${stats.averageSustainabilityScore}%` }}
                ></div>
              </div>
              <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats.averageSustainabilityScore.toFixed(0)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Breakdown */}
        <div className="bg-white dark:bg-amazon-dark rounded-2xl shadow-lg p-6 space-y-4 border border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Action Breakdown</h2>
          <div className="space-y-3">
            {Object.entries(stats.actionBreakdown).map(([action, count]) => (
              count > 0 && (
                <div key={action} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${actionColors[action]}`}></div>
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-gray-700 dark:text-gray-300">{action}</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{count}</span>
                  </div>
                  <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${actionColors[action]}`}
                      style={{ width: `${(count / stats.totalItems) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )
            ))}
          </div>
        </div>

        {/* Recent Items */}
        <div className="bg-white dark:bg-amazon-dark rounded-2xl shadow-lg p-6 space-y-4 border border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Items</h2>
          <div className="space-y-3 max-h-[32rem] overflow-y-auto">
            {recentItems.map((item) => (
              <Link
                key={item._id?.toString()}
                href={`/result/${item._id?.toString()}`}
                className="block p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-amazon-orange dark:hover:border-amazon-orange hover:bg-amazon-orange/5 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">{item.productName}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{item.category}</div>
                  </div>
                  <div className="text-right">
                    <div className={`inline-block px-3 py-1 rounded-lg text-sm font-semibold text-white ${actionColors[item.recommendation.action]}`}>
                      {item.recommendation.action}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-center pt-4">
          <Link
            href="/scan"
            className="bg-amazon-orange hover:bg-amazon-orange/90 text-white font-semibold py-4 px-8 rounded-xl transition-all transform hover:scale-[1.02] shadow-md hover:shadow-lg"
          >
            Process New Return
          </Link>
        </div>
      </div>
    </div>
  );
}
