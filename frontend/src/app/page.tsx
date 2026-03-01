'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@utils/auth-store';

const ENVIRONMENTS = [
  { label: 'White Studio', bg: 'bg-slate-100', color: 'text-slate-800' },
  { label: 'Luxury Marble', bg: 'bg-amber-50', color: 'text-amber-800' },
  { label: 'Outdoor Nature', bg: 'bg-green-100', color: 'text-green-800' },
  { label: 'Scandinavian', bg: 'bg-orange-50', color: 'text-orange-800' },
  { label: 'Dark Moody', bg: 'bg-slate-800', color: 'text-slate-200' },
];

const FEATURES = [
  {
    icon: '✂️',
    title: 'AI Background Removal',
    description:
      'Remove backgrounds in one click using state-of-the-art segmentation models. Pixel-perfect edges, no manual masking required.',
  },
  {
    icon: '🎨',
    title: '5 Professional Environments',
    description:
      'White Studio, Luxury Marble, Outdoor Nature, Scandinavian, Dark Moody — each with 3 camera angles and lighting controls.',
  },
  {
    icon: '📐',
    title: 'Multi-Format Export',
    description:
      'Export 1:1 square, 4:5 portrait, and 9:16 stories in 1x, 2x, and 4x resolutions. ZIP download with metadata CSV included.',
  },
  {
    icon: '⚡',
    title: 'Batch Processing',
    description:
      'Queue multiple environment generations simultaneously with our Redis-backed job system. Results delivered as they complete.',
  },
  {
    icon: '👥',
    title: 'Team Workspaces',
    description:
      'Invite collaborators with role-based permissions (admin, editor, viewer). Share assets and projects across your team.',
  },
  {
    icon: '📊',
    title: 'Usage Analytics',
    description:
      'Track credit usage, job success rates, and output volume with your workspace analytics dashboard.',
  },
];

const STEPS = [
  { num: '01', title: 'Upload Your Product', desc: 'Drag and drop your product photo. We accept PNG, JPG, WebP up to 50MB.' },
  { num: '02', title: 'Remove Background', desc: 'One click — our AI cleanly removes the background and saves a transparent PNG.' },
  { num: '03', title: 'Choose Environment', desc: 'Pick from 5 studio environments, 3 camera angles, and adjust lighting and tone.' },
  { num: '04', title: 'Export & Download', desc: 'Download a ZIP with all formats ready for your store, social, and ads.' },
];

const TESTIMONIALS = [
  {
    name: 'Sarah K.',
    role: 'E-commerce Director, Fashion Brand',
    quote:
      'We cut our photography budget by 70% in the first month. The white studio output is indistinguishable from a real shoot.',
  },
  {
    name: 'Marcus T.',
    role: 'Founder, DTC Skincare Brand',
    quote:
      'The dark moody environment makes our serums look premium. 5 environments means we never need to rent a studio again.',
  },
  {
    name: 'Priya N.',
    role: 'Creative Lead, Consumer Electronics',
    quote:
      'Batch processing 200 SKUs used to take two weeks. Now it takes an afternoon. The ROI was immediate.',
  },
];

export default function Home() {
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedToken = localStorage.getItem('auth_token');
    if (user || storedToken) {
      router.push('/dashboard');
    }
  }, [user, router]);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* ── Navigation ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            PhotoshootAI
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a>
            <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-slate-400 hover:text-white transition-colors px-3 py-2">
              Log In
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-sm font-semibold rounded-lg transition-all"
            >
              Start Free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-900/40 border border-blue-700/50 rounded-full text-blue-300 text-sm mb-8">
            <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
            AI-powered product photography
          </div>

          <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6">
            Studio-Quality Photos{' '}
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Without the Studio
            </span>
          </h1>

          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Upload any product photo. Remove the background in one click. Generate professional environments with AI.
            Export all formats in seconds.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link
              href="/signup"
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/25 text-lg"
            >
              Get Started Free →
            </Link>
            <Link
              href="/pricing"
              className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl transition-colors text-lg"
            >
              View Pricing
            </Link>
          </div>

          {/* Environment preview strips */}
          <div className="flex flex-wrap justify-center gap-2">
            {ENVIRONMENTS.map((env) => (
              <span
                key={env.label}
                className={`px-4 py-2 ${env.bg} ${env.color} rounded-full text-xs font-semibold`}
              >
                {env.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="py-24 px-6 border-t border-slate-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">From Upload to Export in 4 Steps</h2>
            <p className="text-slate-400 text-lg">No design skills required. No expensive equipment needed.</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {STEPS.map((step) => (
              <div key={step.num} className="relative">
                <div className="text-5xl font-black text-slate-800 mb-3">{step.num}</div>
                <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 px-6 border-t border-slate-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Everything You Need for Product Photography</h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">
              A complete AI studio — background removal, scene generation, and multi-format export.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="p-6 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-600 transition-colors"
              >
                <div className="text-3xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Environments showcase ── */}
      <section className="py-24 px-6 border-t border-slate-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">5 Professional Studio Environments</h2>
            <p className="text-slate-400 text-lg">Each with 3 camera angles and adjustable lighting.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { name: 'White Studio', desc: 'Clean commercial look', gradient: 'from-slate-100 to-slate-200', text: 'text-slate-700' },
              { name: 'Luxury Marble', desc: 'Upscale editorial style', gradient: 'from-amber-50 to-stone-100', text: 'text-stone-700' },
              { name: 'Outdoor Nature', desc: 'Organic lifestyle feel', gradient: 'from-green-200 to-emerald-100', text: 'text-green-800' },
              { name: 'Scandinavian', desc: 'Minimal hygge aesthetic', gradient: 'from-orange-50 to-amber-50', text: 'text-amber-700' },
              { name: 'Dark Moody', desc: 'Cinematic luxury noir', gradient: 'from-slate-800 to-slate-900', text: 'text-slate-300' },
            ].map((env) => (
              <div
                key={env.name}
                className={`rounded-xl p-6 bg-gradient-to-br ${env.gradient} flex flex-col justify-between min-h-36`}
              >
                <span className={`text-xs font-bold ${env.text} uppercase tracking-wide`}>{env.name}</span>
                <p className={`text-xs ${env.text} opacity-70 mt-2`}>{env.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-24 px-6 border-t border-slate-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Trusted by E-commerce Brands</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="p-6 bg-slate-900 border border-slate-800 rounded-xl">
                <p className="text-slate-300 leading-relaxed mb-6 italic">&ldquo;{t.quote}&rdquo;</p>
                <div>
                  <p className="font-semibold">{t.name}</p>
                  <p className="text-slate-500 text-sm">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing preview ── */}
      <section className="py-24 px-6 border-t border-slate-800">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">Start Free, Scale as You Grow</h2>
          <p className="text-slate-400 text-lg mb-10">
            100 free credits every month. No credit card required. Upgrade when you need more.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {[
              { plan: 'Free', price: '$0', credits: '100 credits' },
              { plan: 'Starter', price: '$29', credits: '1,000 credits' },
              { plan: 'Pro', price: '$79', credits: '5,000 credits', popular: true },
              { plan: 'Enterprise', price: '$299', credits: '25,000 credits' },
            ].map((p) => (
              <div
                key={p.plan}
                className={`p-4 rounded-xl border ${
                  p.popular
                    ? 'border-blue-500 bg-blue-900/20'
                    : 'border-slate-700 bg-slate-900'
                }`}
              >
                {p.popular && (
                  <div className="text-xs text-blue-400 font-bold mb-2">POPULAR</div>
                )}
                <div className="font-bold">{p.plan}</div>
                <div className="text-2xl font-black my-1">{p.price}<span className="text-sm font-normal text-slate-400">/mo</span></div>
                <div className="text-xs text-slate-400">{p.credits}</div>
              </div>
            ))}
          </div>

          <Link
            href="/pricing"
            className="inline-block px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-semibold transition-colors text-sm"
          >
            View Full Pricing Details →
          </Link>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-24 px-6 border-t border-slate-800">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-5xl font-bold mb-6">
            Start Creating{' '}
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Today
            </span>
          </h2>
          <p className="text-slate-400 text-xl mb-10">
            Join thousands of brands creating professional product photography with AI.
          </p>
          <Link
            href="/signup"
            className="inline-block px-12 py-5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-xl font-bold rounded-2xl transition-all shadow-2xl shadow-blue-500/30"
          >
            Get Started for Free →
          </Link>
          <p className="text-slate-500 text-sm mt-4">No credit card required. 100 free credits per month.</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-800 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                PhotoshootAI
              </h4>
              <p className="text-slate-500 text-sm leading-relaxed">
                Professional AI product photography for e-commerce brands.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-300 mb-4 text-sm">Product</h4>
              <ul className="space-y-2 text-slate-500 text-sm">
                <li><a href="#features" className="hover:text-slate-300 transition-colors">Features</a></li>
                <li><Link href="/pricing" className="hover:text-slate-300 transition-colors">Pricing</Link></li>
                <li><Link href="/signup" className="hover:text-slate-300 transition-colors">Sign Up</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-300 mb-4 text-sm">Platform</h4>
              <ul className="space-y-2 text-slate-500 text-sm">
                <li><Link href="/login" className="hover:text-slate-300 transition-colors">Log In</Link></li>
                <li><Link href="/dashboard" className="hover:text-slate-300 transition-colors">Dashboard</Link></li>
                <li><a href="/api/docs" className="hover:text-slate-300 transition-colors">API Docs</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-300 mb-4 text-sm">Legal</h4>
              <ul className="space-y-2 text-slate-500 text-sm">
                <li><span className="cursor-default">Privacy Policy</span></li>
                <li><span className="cursor-default">Terms of Service</span></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center text-slate-600 text-sm">
            © {new Date().getFullYear()} PhotoshootAI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
