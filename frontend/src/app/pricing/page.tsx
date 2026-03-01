'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@utils/auth-store';
import { getApiClient } from '@utils/api-client';

interface Plan {
  key: string;
  name: string;
  price: number;
  monthlyCredits: number;
  features: string[];
  popular: boolean;
}

export default function PricingPage() {
  const { user, workspace } = useAuthStore();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const api = getApiClient();
        const res = await api.get('/api/billing/plans');
        setPlans(res.data.plans);
      } catch {
        // Fallback static plans if API not available
        setPlans([
          {
            key: 'free',
            name: 'Free',
            price: 0,
            monthlyCredits: 100,
            features: ['100 credits/month', '1 workspace', 'Basic exports', 'Standard quality'],
            popular: false,
          },
          {
            key: 'starter',
            name: 'Starter',
            price: 29,
            monthlyCredits: 1000,
            features: ['1,000 credits/month', '3 workspaces', 'All export formats', 'HD quality', 'Priority support'],
            popular: false,
          },
          {
            key: 'pro',
            name: 'Pro',
            price: 79,
            monthlyCredits: 5000,
            features: ['5,000 credits/month', 'Unlimited workspaces', 'All export formats', '4K quality', 'White label', 'API access', 'Priority support'],
            popular: true,
          },
          {
            key: 'enterprise',
            name: 'Enterprise',
            price: 299,
            monthlyCredits: 25000,
            features: ['25,000 credits/month', 'Unlimited everything', 'Custom AI models', 'Dedicated support', 'SLA guarantee', 'Custom integrations'],
            popular: false,
          },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const handleSubscribe = async (planKey: string) => {
    if (!user) {
      window.location.href = `/signup?plan=${planKey}`;
      return;
    }

    if (planKey === 'free') return;

    setCheckoutLoading(planKey);
    setError('');

    try {
      const api = getApiClient();
      const res = await api.post('/api/billing/checkout', {
        plan: planKey,
        successUrl: `${window.location.origin}/dashboard?upgraded=true`,
        cancelUrl: `${window.location.origin}/pricing`,
      });
      window.location.href = res.data.url;
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to start checkout. Please try again.');
      setCheckoutLoading(null);
    }
  };

  const handleManageBilling = async () => {
    try {
      const api = getApiClient();
      const res = await api.post('/api/billing/portal', {
        returnUrl: `${window.location.origin}/settings`,
      });
      window.location.href = res.data.url;
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to open billing portal.');
    }
  };

  const currentPlan = workspace?.plan || 'free';

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white">
      {/* Header */}
      <nav className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          PhotoshootAI
        </Link>
        <div className="flex items-center gap-4">
          {user ? (
            <Link href="/dashboard" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-semibold transition-colors">
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-slate-300 hover:text-white text-sm">Log In</Link>
              <Link href="/signup" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-semibold transition-colors">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-20">
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4">
            Simple,{' '}
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Transparent
            </span>{' '}
            Pricing
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Pay only for what you use. Credits reset monthly. Cancel anytime.
          </p>
        </div>

        {error && (
          <div className="max-w-md mx-auto mb-8 p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-300 text-center">
            {error}
          </div>
        )}

        {/* Current plan indicator */}
        {user && currentPlan !== 'free' && (
          <div className="max-w-sm mx-auto mb-8 p-3 bg-blue-900/30 border border-blue-700 rounded-lg text-center">
            <p className="text-blue-300 text-sm">
              Current plan: <span className="font-bold capitalize">{currentPlan}</span>
            </p>
            <button
              onClick={handleManageBilling}
              className="mt-2 text-xs text-blue-400 hover:text-blue-300 underline"
            >
              Manage Subscription
            </button>
          </div>
        )}

        {/* Plans grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {plans.map((plan) => {
              const isCurrentPlan = currentPlan === plan.key;
              const isPopular = plan.popular;

              return (
                <div
                  key={plan.key}
                  className={`relative rounded-2xl p-8 flex flex-col ${
                    isPopular
                      ? 'bg-gradient-to-b from-blue-900/60 to-purple-900/60 border-2 border-blue-500 shadow-2xl shadow-blue-500/20'
                      : 'bg-slate-800/50 border border-slate-700'
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full text-xs font-bold uppercase tracking-wide">
                      Most Popular
                    </div>
                  )}

                  {isCurrentPlan && (
                    <div className="absolute -top-4 right-4 px-3 py-1 bg-green-600 rounded-full text-xs font-bold">
                      Current
                    </div>
                  )}

                  <div className="mb-6">
                    <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold">${plan.price}</span>
                      {plan.price > 0 && <span className="text-slate-400">/mo</span>}
                    </div>
                    <p className="text-slate-400 text-sm mt-1">
                      {plan.monthlyCredits.toLocaleString()} credits/month
                    </p>
                  </div>

                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                        <svg className="w-4 h-4 text-green-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleSubscribe(plan.key)}
                    disabled={isCurrentPlan || checkoutLoading === plan.key}
                    className={`w-full py-3 rounded-xl font-semibold transition-all ${
                      isCurrentPlan
                        ? 'bg-slate-600 text-slate-400 cursor-default'
                        : isPopular
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg'
                        : 'bg-slate-700 hover:bg-slate-600 text-white'
                    }`}
                  >
                    {checkoutLoading === plan.key
                      ? 'Loading...'
                      : isCurrentPlan
                      ? 'Current Plan'
                      : plan.price === 0
                      ? 'Get Started Free'
                      : `Subscribe — $${plan.price}/mo`}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Credit explanation */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">How Credits Work</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: '🖼️', label: 'Background Removal', credits: '50 credits' },
              { icon: '🎨', label: 'Environment Generation', credits: '100 credits' },
              { icon: '📦', label: 'Export Package', credits: '25 credits' },
            ].map((item) => (
              <div key={item.label} className="p-6 bg-slate-800/50 border border-slate-700 rounded-xl text-center">
                <div className="text-3xl mb-3">{item.icon}</div>
                <p className="font-semibold mb-1">{item.label}</p>
                <p className="text-blue-400 font-bold">{item.credits}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-20 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              {
                q: 'Do credits roll over?',
                a: 'Credits reset at the start of each billing cycle and do not roll over. This keeps plans affordable for everyone.',
              },
              {
                q: 'Can I upgrade or downgrade anytime?',
                a: 'Yes. You can change your plan at any time. Upgrades take effect immediately, downgrades apply at the end of the billing period.',
              },
              {
                q: 'Is there a free trial?',
                a: 'The Free plan is your trial — use it as long as you like with 100 credits per month.',
              },
              {
                q: 'What payment methods are accepted?',
                a: 'We accept all major credit and debit cards via Stripe. Enterprise customers can also pay by invoice.',
              },
            ].map((item) => (
              <details key={item.q} className="group p-5 bg-slate-800/50 border border-slate-700 rounded-xl">
                <summary className="cursor-pointer font-semibold text-slate-200 flex items-center justify-between">
                  {item.q}
                  <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="mt-3 text-slate-400 text-sm leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-20 text-center">
          <div className="inline-block px-10 py-10 bg-gradient-to-r from-blue-900/40 to-purple-900/40 border border-blue-700/50 rounded-2xl">
            <h2 className="text-2xl font-bold mb-3">Ready to transform your product photos?</h2>
            <p className="text-slate-400 mb-6">Join thousands of brands already using PhotoshootAI.</p>
            <Link
              href={user ? '/generate' : '/signup'}
              className="inline-block px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-xl font-semibold transition-all shadow-lg"
            >
              {user ? 'Start Generating' : 'Get Started for Free'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
