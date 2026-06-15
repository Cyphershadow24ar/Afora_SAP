import { Header } from '@/components/Header';

type Badge = 'Coming Soon' | 'Future Vision';

interface Feature {
  title: string;
  badge: Badge;
  description: string;
  capabilities: string[];
  impact: string;
  iconPath: string;
  accent: string; // tailwind text color for the icon
  iconBg: string; // tailwind bg for the icon tile
}

const FEATURES: Feature[] = [
  {
    title: 'Personalized Purchase & Reorder Recommendations',
    badge: 'Coming Soon',
    description:
      'Leverage customer purchase history and behavioral patterns to recommend smarter purchasing decisions.',
    capabilities: [
      'Personalized recommendations',
      'Alternative product suggestions',
      'Reorder prediction',
      'Preference-based recommendations',
      'Reduced unnecessary returns',
    ],
    impact: 'Improve customer satisfaction and reduce return rates.',
    iconPath:
      'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z',
    accent: 'text-aws-blue',
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
  },
  {
    title: 'Seller & Product Return Intelligence',
    badge: 'Coming Soon',
    description: 'Detect products and sellers with unusually high return rates.',
    capabilities: [
      'Return trend analysis',
      'Seller quality scoring',
      'Product risk monitoring',
      'Automatic anomaly detection',
      'Seller alerting system',
    ],
    impact: 'Improve marketplace quality and reduce recurring return issues.',
    iconPath:
      'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    accent: 'text-amazon-orange',
    iconBg: 'bg-amazon-orange/10 dark:bg-amazon-orange/20',
  },
  {
    title: 'Voice Sentiment Analysis',
    badge: 'Future Vision',
    description:
      'Analyze customer voice feedback and support interactions to better understand return motivations.',
    capabilities: [
      'Sentiment detection',
      'Complaint analysis',
      'Return reason extraction',
      'Customer frustration indicators',
      'Decision support insights',
    ],
    impact: 'Improve customer experience and return decision accuracy.',
    iconPath:
      'M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z',
    accent: 'text-purple-600 dark:text-purple-400',
    iconBg: 'bg-purple-100 dark:bg-purple-900/30',
  },
];

interface Phase {
  phase: string;
  status: 'Completed' | 'Coming Soon' | 'Future Vision';
  title: string;
}

const ROADMAP: Phase[] = [
  { phase: 'Phase 1', status: 'Completed', title: 'AI-Powered Second-Life Recommendation Engine' },
  { phase: 'Phase 2', status: 'Completed', title: 'Profitability Intelligence' },
  { phase: 'Phase 3', status: 'Coming Soon', title: 'Personalized Shopping Intelligence' },
  { phase: 'Phase 4', status: 'Coming Soon', title: 'Seller Risk Monitoring' },
  { phase: 'Phase 5', status: 'Future Vision', title: 'Voice Sentiment Analysis' },
];

function badgeClasses(badge: Badge): string {
  return badge === 'Coming Soon'
    ? 'bg-amazon-orange/10 dark:bg-amazon-orange/20 text-amazon-orange'
    : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400';
}

export default function ComingSoonPage() {
  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-amazon-orange/10 via-white to-aws-blue/10 dark:from-amazon-dark dark:via-amazon-bg dark:to-amazon-dark py-16">
        <div className="max-w-5xl mx-auto px-4 text-center space-y-5">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amazon-orange/10 dark:bg-amazon-orange/20 rounded-full text-sm font-medium text-amazon-orange">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amazon-orange opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amazon-orange"></span>
            </span>
            Product Roadmap
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">
            Future Roadmap &amp; <span className="text-amazon-orange">Innovation Pipeline</span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            The current version implements AI-powered Second-Life Recommendations. The following
            capabilities represent the next evolution of the Afora Returns ecosystem.
          </p>
        </div>
      </section>

      {/* Feature cards */}
      <section className="py-16 bg-white dark:bg-amazon-dark">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-6">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl p-6 bg-gray-50 dark:bg-amazon-bg border border-gray-100 dark:border-gray-700 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 space-y-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${f.iconBg} transition-transform group-hover:scale-110`}>
                    <svg className={`w-7 h-7 ${f.accent}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={f.iconPath} />
                    </svg>
                  </div>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${badgeClasses(f.badge)}`}>
                    {f.badge}
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">{f.title}</h3>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{f.description}</p>
                </div>

                <ul className="space-y-2">
                  {f.capabilities.map((c) => (
                    <li key={c} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <svg className={`w-4 h-4 flex-shrink-0 ${f.accent}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {c}
                    </li>
                  ))}
                </ul>

                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Expected Impact</span>
                  <p className="mt-1 text-sm font-medium text-gray-800 dark:text-gray-200">{f.impact}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roadmap timeline */}
      <section className="py-16 bg-gray-50 dark:bg-amazon-bg">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Delivery Roadmap</h2>
            <p className="text-gray-600 dark:text-gray-300 mt-2">From today&apos;s engine to the full intelligence platform</p>
          </div>

          <ol className="relative border-l-2 border-gray-200 dark:border-gray-700 ml-3 space-y-8">
            {ROADMAP.map((p) => {
              const done = p.status === 'Completed';
              const future = p.status === 'Future Vision';
              return (
                <li key={p.phase} className="ml-6">
                  <span
                    className={`absolute -left-[11px] flex items-center justify-center w-5 h-5 rounded-full ring-4 ring-gray-50 dark:ring-amazon-bg ${
                      done ? 'bg-green-500' : future ? 'bg-purple-500' : 'bg-amazon-orange'
                    }`}
                  >
                    {done ? (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-white"></span>
                    )}
                  </span>

                  <div className="bg-white dark:bg-amazon-dark rounded-xl p-5 shadow-md border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">{p.phase}</span>
                      <span
                        className={`text-xs font-semibold px-3 py-1 rounded-full ${
                          done
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            : future
                            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                            : 'bg-amazon-orange/10 dark:bg-amazon-orange/20 text-amazon-orange'
                        }`}
                      >
                        {p.status}
                      </span>
                    </div>
                    <h3 className="mt-1 text-lg font-bold text-gray-900 dark:text-white">
                      {done ? '✓ ' : '○ '}
                      {p.title}
                    </h3>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white dark:bg-amazon-dark border-t border-gray-200 dark:border-gray-700 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>Afora Returns • Innovation Pipeline</p>
          <p className="mt-2">Roadmap items are illustrative and not yet implemented.</p>
        </div>
      </footer>
    </div>
  );
}
