'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import type { AnalysisRecord, NextLifeOption } from '@/lib/types';

const money = (n: number) => `$${n.toFixed(2)}`;

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
      } catch {
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

  const options = analysis.nextLifeOptions ?? [];
  const best = analysis.bestRecommendation;
  const bestOption = best ? options.find((o) => o.option === best.bestRecommendation) : undefined;

  // Chart maxima for proportional bars.
  const maxRevenue = Math.max(...options.map((o) => o.expectedSellingPrice), 1);
  const maxProfit = Math.max(...options.map((o) => Math.abs(o.expectedProfit)), 1);
  const maxRoi = Math.max(...options.map((o) => o.roiPercentage), 1);

  return (
    <div className="min-h-screen">
      <Header />

      <div className="max-w-4xl mx-auto px-4 pt-8 pb-24 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Second-Life Decision</h1>
          <Link href="/dashboard" className="text-sm font-medium text-amazon-orange hover:underline">
            Dashboard →
          </Link>
        </div>

        {/* Product summary */}
        <div className="bg-white dark:bg-amazon-dark rounded-2xl shadow-lg p-6 space-y-2 border border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{analysis.productName}</h2>
          <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-300">
            <span>{analysis.category}</span>
            <span>•</span>
            <span>Original price {money(analysis.originalPrice)}</span>
          </div>
        </div>

        {/* Wrong-product rejection */}
        {analysis.wrongProduct && (
          <div className="rounded-2xl border-2 border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-6 space-y-2">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-300 font-bold text-lg">
              <span>🚫</span> Wrong Product Detected
            </div>
            <p className="text-red-700/90 dark:text-red-300/90 text-sm">
              {analysis.productMatch?.reason} Similarity{' '}
              {analysis.productMatch?.similarityScore ?? 0}% (threshold 60%). This return was routed to
              manual review.
            </p>
          </div>
        )}

        {/* Phase 1: Product match */}
        {analysis.productMatch && !analysis.wrongProduct && (
          <div className="bg-white dark:bg-amazon-dark rounded-2xl shadow-lg p-6 space-y-3 border border-gray-100 dark:border-gray-700">
            <h3 className="font-bold text-gray-900 dark:text-white">Product Match Validation</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <Stat label="Same Product" value={analysis.productMatch.isSameProduct ? 'Yes' : 'No'} />
              <Stat label="Similarity" value={`${analysis.productMatch.similarityScore}%`} />
              <Stat label="Confidence" value={`${analysis.productMatch.confidence}%`} />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">{analysis.productMatch.reason}</p>
          </div>
        )}

        {/* Executive: BEST NEXT LIFE */}
        {best && bestOption && (
          <div className="rounded-3xl shadow-2xl p-8 space-y-5 text-white bg-gradient-to-br from-amazon-orange to-amber-600">
            <div className="text-white/80 text-sm font-medium uppercase tracking-wide">Best Next Life</div>
            <div className="text-4xl md:text-5xl font-bold">{best.bestRecommendation}</div>
            <p className="text-white/90">{best.reason}</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-5 border-t border-white/20">
              <Metric label="Expected Revenue" value={money(bestOption.expectedSellingPrice)} />
              <Metric label="Expected Cost" value={money(bestOption.requiredCost)} />
              <Metric label="Expected Profit" value={money(bestOption.expectedProfit)} />
              <Metric label="ROI" value={`${bestOption.roiPercentage}%`} />
              <Metric label="Sustainability" value={`${bestOption.sustainabilityScore}/100`} />
              <Metric label="Confidence" value={`${bestOption.confidenceScore}%`} />
            </div>
            <div className="text-white/80 text-sm">Combined decision score: {best.combinedScore}/100</div>
          </div>
        )}

        {/* Phase 2: Visual inspection */}
        {analysis.visualInspection && (
          <div className="bg-white dark:bg-amazon-dark rounded-2xl shadow-lg p-6 space-y-3 border border-gray-100 dark:border-gray-700">
            <h3 className="font-bold text-gray-900 dark:text-white">Visual Inspection</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <Stat label="Condition" value={analysis.visualInspection.condition} />
              <Stat label="Damage Severity" value={analysis.visualInspection.damageSeverity} />
              <Stat label="Confidence" value={`${analysis.visualInspection.confidence}%`} />
            </div>
            {analysis.visualInspection.issues.length > 0 ? (
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Detected issues</span>
                <ul className="mt-1 flex flex-wrap gap-2">
                  {analysis.visualInspection.issues.map((issue, i) => (
                    <li key={i} className="text-xs px-2 py-1 rounded-full bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-300">No significant issues detected.</p>
            )}
          </div>
        )}

        {/* Phase 7: Next Life Comparison Table */}
        {options.length > 0 && (
          <div className="bg-white dark:bg-amazon-dark rounded-2xl shadow-lg p-6 space-y-4 border border-gray-100 dark:border-gray-700 overflow-x-auto">
            <h3 className="font-bold text-gray-900 dark:text-white">Next Life Comparison</h3>
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  <th className="py-2 pr-3">Path</th>
                  <th className="py-2 px-3 text-right">Cost</th>
                  <th className="py-2 px-3 text-right">Revenue</th>
                  <th className="py-2 px-3 text-right">Profit</th>
                  <th className="py-2 px-3 text-right">ROI</th>
                  <th className="py-2 px-3 text-right">Sustain.</th>
                  <th className="py-2 px-3 text-right">Conf.</th>
                </tr>
              </thead>
              <tbody>
                {options.map((o) => {
                  const isBest = best?.bestRecommendation === o.option;
                  return (
                    <tr
                      key={o.option}
                      className={`border-b border-gray-100 dark:border-gray-800 ${
                        isBest ? 'bg-amazon-orange/10 dark:bg-amazon-orange/20 font-semibold' : ''
                      } ${o.feasible ? '' : 'opacity-50'}`}
                    >
                      <td className="py-2 pr-3 text-gray-900 dark:text-white">
                        {o.option}
                        {isBest && <span className="ml-2 text-xs text-amazon-orange">★ Best</span>}
                        {!o.feasible && <span className="ml-2 text-xs text-gray-400">(not viable)</span>}
                      </td>
                      <td className="py-2 px-3 text-right text-gray-700 dark:text-gray-300">{money(o.requiredCost)}</td>
                      <td className="py-2 px-3 text-right text-gray-700 dark:text-gray-300">{money(o.expectedSellingPrice)}</td>
                      <td className={`py-2 px-3 text-right ${o.expectedProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{money(o.expectedProfit)}</td>
                      <td className="py-2 px-3 text-right text-gray-700 dark:text-gray-300">{o.roiPercentage}%</td>
                      <td className="py-2 px-3 text-right text-gray-700 dark:text-gray-300">{o.sustainabilityScore}</td>
                      <td className="py-2 px-3 text-right text-gray-700 dark:text-gray-300">{o.confidenceScore}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Phase 8: Comparison charts */}
        {options.length > 0 && (
          <div className="grid md:grid-cols-2 gap-6">
            <ChartCard title="Revenue Comparison" options={options} value={(o) => o.expectedSellingPrice} max={maxRevenue} fmt={money} color="bg-aws-blue" best={best?.bestRecommendation} />
            <ChartCard title="Profit Comparison" options={options} value={(o) => o.expectedProfit} max={maxProfit} fmt={money} color="bg-green-500" best={best?.bestRecommendation} />
            <ChartCard title="Sustainability Comparison" options={options} value={(o) => o.sustainabilityScore} max={100} fmt={(n) => `${n}`} color="bg-emerald-500" best={best?.bestRecommendation} />
            <ChartCard title="ROI Comparison" options={options} value={(o) => o.roiPercentage} max={maxRoi} fmt={(n) => `${Math.round(n)}%`} color="bg-amazon-orange" best={best?.bestRecommendation} />
          </div>
        )}

        {/* Phases 3-4: Cost & Market breakdown */}
        {(analysis.costEstimate || analysis.marketValue) && (
          <div className="grid md:grid-cols-2 gap-6">
            {analysis.costEstimate && (
              <div className="bg-white dark:bg-amazon-dark rounded-2xl shadow-lg p-6 space-y-2 border border-gray-100 dark:border-gray-700">
                <h3 className="font-bold text-gray-900 dark:text-white">Cost Estimate</h3>
                <Row label="Cleaning" value={money(analysis.costEstimate.cleaningCost)} />
                <Row label="Repair" value={money(analysis.costEstimate.repairCost)} />
                <Row label="Replacement" value={money(analysis.costEstimate.replacementCost)} />
                <Row label="Packaging" value={money(analysis.costEstimate.packagingCost)} />
                <Row label="Labor" value={money(analysis.costEstimate.laborCost)} />
                <Row label="Logistics" value={money(analysis.costEstimate.logisticsCost)} />
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <Row label="Total Refurbishment" value={money(analysis.costEstimate.totalRefurbishmentCost)} bold />
                </div>
              </div>
            )}
            {analysis.marketValue && (
              <div className="bg-white dark:bg-amazon-dark rounded-2xl shadow-lg p-6 space-y-2 border border-gray-100 dark:border-gray-700">
                <h3 className="font-bold text-gray-900 dark:text-white">Market Value</h3>
                <Row label="Current (new)" value={money(analysis.marketValue.currentMarketValue)} />
                <Row label="Refurbished" value={money(analysis.marketValue.refurbishedMarketValue)} />
                <Row label="Open Box" value={money(analysis.marketValue.openBoxValue)} />
                <Row label="Liquidation" value={money(analysis.marketValue.liquidationValue)} />
                <Row label="Donation (tax)" value={money(analysis.marketValue.donationValue)} />
                <Row label="Recycling" value={money(analysis.marketValue.recyclingValue)} />
                <Row label="Scrap" value={money(analysis.marketValue.scrapValue)} />
              </div>
            )}
          </div>
        )}

        {/* Legacy fallback for older records without next-life options */}
        {options.length === 0 && !analysis.wrongProduct && (
          <div className="bg-white dark:bg-amazon-dark rounded-2xl shadow-lg p-6 space-y-2 border border-gray-100 dark:border-gray-700">
            <h3 className="font-bold text-gray-900 dark:text-white">Recommended Action</h3>
            <div className="text-2xl font-bold text-amazon-orange">{analysis.recommendation.action}</div>
            <p className="text-sm text-gray-600 dark:text-gray-300">{analysis.recommendation.reasoning}</p>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <Stat label="Estimated Value" value={money(analysis.recommendation.estimatedValue)} />
              <Stat label="Sustainability" value={`${analysis.recommendation.sustainabilityScore}/100`} />
            </div>
          </div>
        )}

        {/* Images */}
        <div className="bg-white dark:bg-amazon-dark rounded-2xl shadow-lg p-6 space-y-4 border border-gray-100 dark:border-gray-700">
          <h3 className="font-bold text-gray-900 dark:text-white">Returned Images</h3>
          <div className="grid grid-cols-3 gap-3">
            {analysis.imageUrls.map((url, idx) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={idx} src={url} alt={`Returned ${idx + 1}`} className="w-full h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-700" />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Link href="/scan" className="block bg-amazon-orange hover:bg-amazon-orange/90 text-white font-semibold py-4 rounded-xl text-center transition-all transform hover:scale-[1.02] shadow-md hover:shadow-lg">
            Process Another
          </Link>
          <Link href="/dashboard" className="block border-2 border-amazon-orange text-amazon-orange hover:bg-amazon-orange/10 font-semibold py-4 rounded-xl text-center transition-colors">
            View Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-gray-500 dark:text-gray-400 text-xs">{label}</div>
      <div className="font-semibold text-gray-900 dark:text-white">{value}</div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-white/80 text-xs">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className={bold ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}>{label}</span>
      <span className={bold ? 'font-bold text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}>{value}</span>
    </div>
  );
}

function ChartCard({
  title,
  options,
  value,
  max,
  fmt,
  color,
  best,
}: {
  title: string;
  options: NextLifeOption[];
  value: (o: NextLifeOption) => number;
  max: number;
  fmt: (n: number) => string;
  color: string;
  best?: string;
}) {
  return (
    <div className="bg-white dark:bg-amazon-dark rounded-2xl shadow-lg p-6 space-y-3 border border-gray-100 dark:border-gray-700">
      <h3 className="font-bold text-gray-900 dark:text-white">{title}</h3>
      <div className="space-y-2">
        {options.map((o) => {
          const v = value(o);
          const pct = Math.max(0, Math.min(100, (Math.abs(v) / max) * 100));
          return (
            <div key={o.option} className="text-xs">
              <div className="flex justify-between mb-0.5">
                <span className={`${best === o.option ? 'text-amazon-orange font-semibold' : 'text-gray-600 dark:text-gray-300'}`}>{o.option}</span>
                <span className="text-gray-700 dark:text-gray-300">{fmt(v)}</span>
              </div>
              <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className={`${best === o.option ? 'bg-amazon-orange' : color} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }}></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
