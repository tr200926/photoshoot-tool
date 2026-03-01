'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@utils/auth-store';
import { useRequireAuth } from '@hooks/useAuth';
import { getApiClient } from '@utils/api-client';
import type { Asset } from '@/types/index';

export default function DashboardPage() {
  const router = useRouter();
  const isReady = useRequireAuth();
  const { user, workspace, logout } = useAuthStore();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [uploadMessage, setUploadMessage] = useState('');
  const [analytics, setAnalytics] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchAssets = useCallback(async () => {
    try {
      setIsLoading(true);
      const api = getApiClient();
      const response = await api.get('/api/assets', { params: { limit: 20, offset: 0 } });
      setAssets(response.data.assets || []);
    } catch {
      setError('Failed to load assets');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchAnalytics = useCallback(async () => {
    try {
      const api = getApiClient();
      const response = await api.get('/api/workspaces/current/analytics');
      setAnalytics(response.data.analytics);
    } catch {
      // Analytics are non-critical
    }
  }, []);

  useEffect(() => {
    if (!isReady) return;
    fetchAssets();
    fetchAnalytics();
  }, [isReady, fetchAssets, fetchAnalytics]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploading(true);
      setError('');
      setUploadMessage('');
      const api = getApiClient();
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post('/api/assets/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (response.data.asset) {
        setAssets(prev => [response.data.asset, ...prev]);
        setUploadMessage(response.data.message || 'Uploaded successfully');
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (assetId: string) => {
    if (!window.confirm('Delete this asset?')) return;
    try {
      setIsDeleting(assetId);
      await getApiClient().delete(`/api/assets/${assetId}`);
      setAssets(prev => prev.filter(a => a.id !== assetId));
    } catch {
      setError('Failed to delete asset');
    } finally {
      setIsDeleting(null);
    }
  };

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

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
              <Link href="/dashboard" className="px-3 py-1.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md">Assets</Link>
              <Link href="/generate" className="px-3 py-1.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md">Generate</Link>
              <Link href="/projects" className="px-3 py-1.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md">Projects</Link>
              <Link href="/settings" className="px-3 py-1.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md">Settings</Link>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600 dark:text-slate-400 hidden sm:block">{workspace?.name}</span>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{user?.name}</span>
            <button
              onClick={() => { logout(); router.push('/'); }}
              className="px-3 py-1.5 text-sm bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        {analytics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Assets', value: analytics.assets.total },
              { label: 'Jobs Completed', value: analytics.jobs.completed },
              { label: 'Success Rate', value: `${analytics.jobs.successRate}%` },
              { label: 'Credits Remaining', value: analytics.credits.remaining },
            ].map(stat => (
              <div key={stat.label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4">
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Your Assets</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Upload product images to get started</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/generate"
              className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950 text-sm font-medium"
            >
              Generate
            </Link>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
            >
              {isUploading ? 'Uploading...' : 'Upload Image'}
            </button>
          </div>
        </div>

        <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFileChange} className="hidden" />

        {uploadMessage && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded text-green-700 dark:text-green-400 text-sm">
            {uploadMessage}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Asset Grid */}
        {isLoading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto" />
            <p className="mt-4 text-slate-500">Loading assets...</p>
          </div>
        ) : assets.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-16 text-center">
            <div className="text-5xl mb-4">📸</div>
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">No assets yet</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6">Upload your first product image to start generating creatives</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Upload Your First Image
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {assets.map(asset => (
              <div key={asset.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden hover:shadow-md transition-shadow group">
                <div className="aspect-square bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
                  {asset.originalUrl ? (
                    <img src={asset.originalUrl} alt={asset.originalFileName} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-400 text-3xl">📦</div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  <span className={`absolute top-2 right-2 px-2 py-0.5 text-xs rounded-full font-medium ${
                    asset.status === 'ready' ? 'bg-green-100 text-green-700' :
                    asset.status === 'processing' ? 'bg-yellow-100 text-yellow-700' :
                    asset.status === 'failed' ? 'bg-red-100 text-red-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>{asset.status}</span>
                </div>
                <div className="p-3">
                  <p className="font-medium text-slate-800 dark:text-slate-200 truncate text-sm">{asset.originalFileName}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{asset.width}×{asset.height} · {(asset.fileSize / 1024).toFixed(0)} KB</p>
                  <div className="flex gap-2 mt-3">
                    <Link
                      href={`/generate?assetId=${asset.id}`}
                      className="flex-1 text-center px-2 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 font-medium"
                    >
                      Generate
                    </Link>
                    <button
                      onClick={() => setSelectedAsset(asset)}
                      className="px-2 py-1.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs rounded hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleDelete(asset.id)}
                      disabled={isDeleting === asset.id}
                      className="px-2 py-1.5 border border-red-200 text-red-500 text-xs rounded hover:bg-red-50 disabled:opacity-50"
                    >
                      {isDeleting === asset.id ? '...' : 'Del'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Asset detail modal */}
      {selectedAsset && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setSelectedAsset(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-lg w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white truncate pr-4">{selectedAsset.originalFileName}</h2>
              <button onClick={() => setSelectedAsset(null)} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
            </div>
            {selectedAsset.originalUrl && (
              <img src={selectedAsset.originalUrl} alt={selectedAsset.originalFileName} className="w-full rounded-lg mb-4 max-h-64 object-contain bg-slate-100" />
            )}
            <div className="grid grid-cols-2 gap-3 text-sm mb-4">
              <div><span className="text-slate-500">Size</span><p className="font-medium">{selectedAsset.width}×{selectedAsset.height}</p></div>
              <div><span className="text-slate-500">File Size</span><p className="font-medium">{(selectedAsset.fileSize / 1024).toFixed(0)} KB</p></div>
              <div><span className="text-slate-500">Status</span><p className="font-medium capitalize">{selectedAsset.status}</p></div>
              <div><span className="text-slate-500">Variants</span><p className="font-medium">{selectedAsset.variants?.length || 0}</p></div>
            </div>
            <Link
              href={`/generate?assetId=${selectedAsset.id}`}
              className="w-full block text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Generate Creatives →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
