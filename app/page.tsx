import Link from 'next/link';
import { Header } from '@/components/Header';

export default function Home() {
  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-amazon-orange/10 via-white to-aws-blue/10 dark:from-amazon-dark dark:via-amazon-bg dark:to-amazon-dark py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center space-y-8 max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amazon-orange/10 dark:bg-amazon-orange/20 rounded-full text-sm font-medium text-amazon-orange">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amazon-orange opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amazon-orange"></span>
              </span>
              Amazon HackOn Season 6 - AI Demo Platform
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white">
              AI-Powered Returns
              <span className="block text-amazon-orange">Intelligence Platform</span>
            </h1>

            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Transform returned products into profitable second-life opportunities using AI-powered inspection and recovery optimization.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link
                href="/scan"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-amazon-orange hover:bg-amazon-orange/90 rounded-xl transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Start Processing Returns
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>

              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-gray-900 dark:text-white bg-white dark:bg-amazon-dark border-2 border-gray-300 dark:border-gray-600 hover:border-amazon-orange dark:hover:border-amazon-orange rounded-xl transition-all shadow-md hover:shadow-lg"
              >
                View Dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-20 bg-white dark:bg-amazon-dark">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center space-y-4 p-6 rounded-2xl bg-gray-50 dark:bg-amazon-bg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">AI-Powered Inspection</h3>
              <p className="text-gray-600 dark:text-gray-300">Amazon Bedrock vision AI analyzes product condition with 85%+ accuracy</p>
            </div>

            <div className="text-center space-y-4 p-6 rounded-2xl bg-gray-50 dark:bg-amazon-bg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 mx-auto bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Instant Recommendations</h3>
              <p className="text-gray-600 dark:text-gray-300">Get actionable recovery strategies in seconds, not days</p>
            </div>

            <div className="text-center space-y-4 p-6 rounded-2xl bg-gray-50 dark:bg-amazon-bg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 mx-auto bg-amazon-orange/20 dark:bg-amazon-orange/30 rounded-2xl flex items-center justify-center">
                <svg className="w-8 h-8 text-amazon-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Maximize Recovery Value</h3>
              <p className="text-gray-600 dark:text-gray-300">Optimize every return for profitability and sustainability</p>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="py-20 bg-gray-50 dark:bg-amazon-bg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Simple 4-Step Workflow</h2>
            <p className="text-gray-600 dark:text-gray-300 mt-2">From scan to decision in under 60 seconds</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: '1', title: 'Scan Barcode', icon: 'M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z' },
              { step: '2', title: 'Capture Images', icon: 'M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z M15 13a3 3 0 11-6 0 3 3 0 016 0z' },
              { step: '3', title: 'AI Analysis', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
              { step: '4', title: 'Get Decision', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
            ].map((item, idx) => (
              <div key={idx} className="relative">
                <div className="bg-white dark:bg-amazon-dark rounded-2xl p-6 text-center space-y-4 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
                  <div className="w-12 h-12 mx-auto bg-amazon-orange/10 dark:bg-amazon-orange/20 rounded-xl flex items-center justify-center text-2xl font-bold text-amazon-orange">
                    {item.step}
                  </div>
                  <svg className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                  </svg>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{item.title}</h3>
                </div>
                {idx < 3 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-0.5 bg-amazon-orange/30"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-amazon-orange text-white">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <h2 className="text-4xl font-bold">Ready to Transform Your Returns?</h2>
          <p className="text-xl text-white/90">Start processing returns with AI-powered intelligence today</p>
          <Link
            href="/scan"
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-amazon-orange bg-white hover:bg-gray-100 rounded-xl transition-all transform hover:scale-105 shadow-xl"
          >
            Get Started Now
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white dark:bg-amazon-dark border-t border-gray-200 dark:border-gray-700 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>Demo Mode • Using MockStorageService & MockBedrockService</p>
          <p className="mt-2">Amazon HackOn Season 6 • AI-Powered Returns Platform</p>
        </div>
      </footer>
    </div>
  );
}
