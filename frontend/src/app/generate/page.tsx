'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@utils/auth-store';
import { useRequireAuth } from '@hooks/useAuth';
import { getApiClient } from '@utils/api-client';
import type { Asset, GenerationJob } from '@/types/index';

const ENVIRONMENTS = [
  { key: 'white-studio', name: 'White Studio', emoji: '⬜', desc: 'Clean minimal professional' },
  { key: 'luxury-marble', name: 'Luxury Marble', emoji: '🏛️', desc: 'Premium upscale aesthetic' },
  { key: 'outdoor-nature', name: 'Outdoor Nature', emoji: '🌿', desc: 'Fresh organic lifestyle' },
  { key: 'minimal-scandinavian', name: 'Scandinavian', emoji: '🪵', desc: 'Modern minimalist' },
  { key: 'dark-moody', name: 'Dark Moody', emoji: '🌑', desc: 'Sophisticated dramatic' },
];

const ANGLES = [
  { key: 'front', name: 'Front View', desc: '0° straight on' },
  { key: 'forty-five', name: '45° Angle', desc: 'Three-quarter view' },
  { key: 'top-down', name: 'Top Down', desc: 'Overhead flat lay' },
];

function GeneratePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isReady = useRequireAuth();
  const { user, workspace, logout } = useAuthStore();

  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [selectedEnvironment, setSelectedEnvironment] = useState('white-studio');
  const [selectedAngles, setSelectedAngles] = useState<string[]>(['front']);
  const [lightingIntensity, setLightingIntensity] = useState(50);
  const [colorTone, setColorTone] = useState(0);
  const [jobs, setJobs] = useState<GenerationJob[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'setup' | 'results'>('setup');

  const assetId = searchParams.get('assetId');

  const fetchAssets = useCallback(async () => {
    try {
      const api = getApiClient();
      const res = await api.get('/api/assets', { params: { limit: 50 } });
      const list: Asset[] = res.data.assets || [];
      setAssets(list);
      if (assetId) {
        const found = list.find(a => a.id === assetId);
        if (found) setSelectedAsset(found);
      } else if (list.length > 0) {
        setSelectedAsset(list[0]);
      }
    } catch {
      setError('Failed to load assets');
    }
  }, [assetId]);

  const fetchJobs = useCallback(async (aid: string) => {
    try {
      const api = getApiClient();
      const res = await api.get('/api/jobs', {
        params: { assetId: aid, limit: 20 },
      });
      setJobs(res.data.jobs || []);
    } catch {}
  }, []);

  useEffect(() => {
    if (!isReady) return;
    fetchAssets();
  }, [isReady, fetchAssets]);

  useEffect(() => {
    if (!selectedAsset) return;
    fetchJobs(selectedAsset.id);
    const interval = setInterval(() => fetchJobs(selectedAsset.id), 5000);
    return () => clearInterval(interval);
  }, [selectedAsset, fetchJobs]);

  const toggleAngle = (key: string) => {
    setSelectedAngles(prev =>
      prev.includes(key) ? prev.filter(a => a !== key) : [...prev, key],
    );
  };

  const handleRemoveBackground = async () => {
    if (!selectedAsset) return;
    try {
      setIsRemovingBg(true);
      setError('');
      const api = getApiClient();
      await api.post('/api/jobs/background-removal', { assetId: selectedAsset.id });
      await fetchJobs(selectedAsset.id);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to start background removal');
    } finally {
      setIsRemovingBg(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedAsset || selectedAngles.length === 0) return;
    try {
      setIsGenerating(true);
      setError('');
      const api = getApiClient();
      await api.post('/api/jobs/environment-generation', {
        assetId: selectedAsset.id,
        environment: selectedEnvironment,
        angles: selectedAngles,
        lightingIntensity,
        colorTone,
      });
      await fetchJobs(selectedAsset.id);
      setActiveTab('results');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = async () => {
    if (!selectedAsset) return;
    try {
      const api = getApiClient();
      const res = await api.post(
        '/api/jobs/export',
        { assetId: selectedAsset.id, formats: ['square', 'portrait', 'stories'], scale: 1 },
        { responseType: 'blob' },
      );
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `export-${selectedAsset.id}.zip`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch {
      setError('Export failed');
    }
  };

  const completedJobs = jobs.filter(j => j.status === 'completed');
  const pendingJobs = jobs.filter(j => ['pending', 'processing'].includes(j.status));
  const hasTransparentBg = selectedAsset?.variants?.some(v => v.type === 'transparent-bg');

  if (!isReady) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Nav */}
      <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AI Creative Engine
            </Link>
            <div className="hidden md:flex gap-1">
              <Link href="/dashboard" className="px-3 py-1.5 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400">Assets</Link>
              <Link href="/generate" className="px-3 py-1.5 text-sm font-semibold text-blue-600">Generate</Link>
              <Link href="/projects" className="px-3 py-1.5 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400">Projects</Link>
              <Link href="/settings" className="px-3 py-1.5 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400">Settings</Link>
            </div>
          </div>
          <button onClick={() => { logout(); router.push('/'); }} className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-800">Logout</button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── LEFT: Controls ────────────────────────────────────── */}
          <div className="lg:col-span-1 space-y-4">

            {/* Asset selector */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
              <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">1. Select Product Image</h3>
              {assets.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-slate-500 text-sm mb-3">No assets yet</p>
                  <Link href="/dashboard" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">Upload Image</Link>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                  {assets.map(asset => (
                    <button
                      key={asset.id}
                      onClick={() => setSelectedAsset(asset)}
                      className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                        selectedAsset?.id === asset.id
                          ? 'border-blue-500'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-400'
                      }`}
                    >
                      {asset.originalUrl ? (
                        <img src={asset.originalUrl} alt={asset.originalFileName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400 text-xs">No img</div>
                      )}
                    </button>
                  ))}
                </div>
              )}
              {selectedAsset && (
                <div className="mt-3 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <p className="text-xs text-slate-600 dark:text-slate-400 truncate">{selectedAsset.originalFileName}</p>
                  <p className="text-xs text-slate-400">{selectedAsset.width}×{selectedAsset.height}</p>
                </div>
              )}
            </div>

            {/* Background Removal */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
              <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-1">2. Remove Background</h3>
              <p className="text-xs text-slate-400 mb-3">AI removes background in seconds</p>
              {hasTransparentBg ? (
                <div className="flex items-center gap-2 text-green-600 text-sm">
                  <span>✓</span>
                  <span>Background removed</span>
                </div>
              ) : (
                <button
                  onClick={handleRemoveBackground}
                  disabled={!selectedAsset || isRemovingBg}
                  className="w-full px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm font-medium"
                >
                  {isRemovingBg ? 'Processing...' : 'Remove Background'}
                </button>
              )}
            </div>

            {/* Environment */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
              <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">3. Choose Environment</h3>
              <div className="space-y-2">
                {ENVIRONMENTS.map(env => (
                  <button
                    key={env.key}
                    onClick={() => setSelectedEnvironment(env.key)}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-lg border text-left transition-colors ${
                      selectedEnvironment === env.key
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-xl">{env.emoji}</span>
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{env.name}</p>
                      <p className="text-xs text-slate-400">{env.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Camera Angles */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
              <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">4. Camera Angles</h3>
              <div className="space-y-2">
                {ANGLES.map(angle => (
                  <button
                    key={angle.key}
                    onClick={() => toggleAngle(angle.key)}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-lg border text-left ${
                      selectedAngles.includes(angle.key)
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                      selectedAngles.includes(angle.key) ? 'border-blue-500 bg-blue-500' : 'border-slate-300'
                    }`}>
                      {selectedAngles.includes(angle.key) && <span className="text-white text-xs">✓</span>}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{angle.name}</p>
                      <p className="text-xs text-slate-400">{angle.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Lighting */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
              <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">5. Lighting & Tone</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Soft</span>
                    <span>Lighting Intensity</span>
                    <span>Dramatic</span>
                  </div>
                  <input type="range" min={0} max={100} value={lightingIntensity} onChange={e => setLightingIntensity(+e.target.value)}
                    className="w-full accent-blue-600" />
                  <p className="text-xs text-center text-slate-400 mt-1">{lightingIntensity}%</p>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Cool</span>
                    <span>Color Tone</span>
                    <span>Warm</span>
                  </div>
                  <input type="range" min={-50} max={50} value={colorTone} onChange={e => setColorTone(+e.target.value)}
                    className="w-full accent-orange-400" />
                  <p className="text-xs text-center text-slate-400 mt-1">{colorTone > 0 ? `+${colorTone}` : colorTone}</p>
                </div>
              </div>
            </div>

            {/* Generate Button */}
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-600 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={!selectedAsset || selectedAngles.length === 0 || isGenerating}
              className="w-full py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 font-semibold text-sm"
            >
              {isGenerating
                ? 'Generating...'
                : `Generate ${selectedAngles.length} Image${selectedAngles.length > 1 ? 's' : ''}`}
            </button>
          </div>

          {/* ── RIGHT: Results ────────────────────────────────────── */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              {/* Tabs */}
              <div className="flex border-b border-slate-200 dark:border-slate-800">
                {[{ key: 'setup', label: 'Preview' }, { key: 'results', label: `Results (${completedJobs.length})` }].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`px-4 py-3 text-sm font-medium ${
                      activeTab === tab.key
                        ? 'border-b-2 border-blue-600 text-blue-600'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
                {pendingJobs.length > 0 && (
                  <div className="ml-auto flex items-center px-4 gap-2">
                    <div className="animate-spin w-3 h-3 border-b-2 border-blue-500 rounded-full" />
                    <span className="text-xs text-slate-500">{pendingJobs.length} processing...</span>
                  </div>
                )}
              </div>

              <div className="p-6">
                {activeTab === 'setup' ? (
                  <div className="text-center py-8">
                    {selectedAsset ? (
                      <div>
                        <div className="relative inline-block mb-4">
                          <img
                            src={selectedAsset.originalUrl}
                            alt={selectedAsset.originalFileName}
                            className="max-h-64 max-w-full rounded-lg object-contain mx-auto"
                          />
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 text-sm">
                          Selected: <span className="font-medium">{selectedAsset.originalFileName}</span>
                        </p>
                        <p className="text-slate-400 text-xs mt-1">
                          Will generate in <strong>{ENVIRONMENTS.find(e => e.key === selectedEnvironment)?.name}</strong> environment
                          for {selectedAngles.length} angle{selectedAngles.length > 1 ? 's' : ''}
                        </p>
                        {selectedAsset.variants?.length > 0 && (
                          <div className="mt-6">
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Existing Variants ({selectedAsset.variants.length})</p>
                            <div className="grid grid-cols-3 gap-2">
                              {selectedAsset.variants.slice(0, 6).map(v => (
                                <div key={v.id} className="aspect-square bg-slate-100 dark:bg-slate-800 rounded overflow-hidden">
                                  <img src={v.url} alt={v.type} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <div className="text-6xl mb-4">🎨</div>
                        <p className="text-slate-500">Select a product image to get started</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    {completedJobs.length === 0 && pendingJobs.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="text-5xl mb-4">✨</div>
                        <p className="text-slate-500 mb-2">No generations yet</p>
                        <p className="text-slate-400 text-sm">Configure and click Generate</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Pending jobs */}
                        {pendingJobs.map(job => (
                          <div key={job.id} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center gap-3">
                            <div className="animate-spin w-5 h-5 border-b-2 border-blue-500 rounded-full flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 capitalize">{job.jobType.replace('-', ' ')}</p>
                              <p className="text-xs text-slate-400">{job.status}... {job.progress}%</p>
                            </div>
                          </div>
                        ))}
                        {/* Completed jobs */}
                        {completedJobs.length > 0 && (
                          <>
                            <div className="flex justify-between items-center">
                              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{completedJobs.length} generated image{completedJobs.length > 1 ? 's' : ''}</p>
                              <button
                                onClick={handleExport}
                                className="px-4 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 font-medium"
                              >
                                Download All (ZIP)
                              </button>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              {completedJobs.map(job => (
                                <div key={job.id} className="rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 relative group">
                                  {job.resultUrl ? (
                                    <img src={job.resultUrl} alt={job.jobType} className="w-full aspect-square object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                  ) : (
                                    <div className="aspect-square flex items-center justify-center text-slate-400 text-sm">No preview</div>
                                  )}
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-end">
                                    <div className="w-full p-2 translate-y-full group-hover:translate-y-0 transition-transform">
                                      {job.resultUrl && (
                                        <a href={job.resultUrl} download className="block text-center text-xs bg-white text-slate-800 rounded px-2 py-1 font-medium">Download</a>
                                      )}
                                    </div>
                                  </div>
                                  <div className="p-2">
                                    <p className="text-xs text-slate-500 capitalize">{job.jobType.replace(/-/g, ' ')}</p>
                                    {job.parameters && (
                                      <p className="text-xs text-slate-400">{(job.parameters as any).environment} · {(job.parameters as any).angle}</p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function GeneratePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" /></div>}>
      <GeneratePageContent />
    </Suspense>
  );
}
