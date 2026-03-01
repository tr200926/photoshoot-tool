'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@utils/auth-store';
import { useRequireAuth } from '@hooks/useAuth';
import { getApiClient } from '@utils/api-client';
import type { Workspace, Asset } from '@types/index';

export default function DashboardPage() {
  const router = useRouter();
  const isReady = useRequireAuth();
  const { user, workspace, logout } = useAuthStore();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isReady) return;

    const fetchAssets = async () => {
      try {
        setIsLoading(true);
        const apiClient = getApiClient();
        const response = await apiClient.get('/api/assets', {
          params: { limit: 12, offset: 0 },
        });
        setAssets(response.data.assets || []);
      } catch (err) {
        console.error('Failed to fetch assets:', err);
        setError('Failed to load assets');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssets();
  }, [isReady]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setError('');
      const apiClient = getApiClient();
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.post('/api/assets/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Add the new asset to the list
      if (response.data.asset) {
        setAssets((prev) => [response.data.asset, ...prev]);
      }
    } catch (err) {
      console.error('Upload failed:', err);
      setError('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleEditClick = (asset: Asset) => {
    setEditingAsset(asset);
  };

  const handleDeleteClick = async (assetId: string) => {
    if (!window.confirm('Are you sure you want to delete this asset?')) return;

    try {
      setIsDeleting(assetId);
      setError('');
      const apiClient = getApiClient();
      await apiClient.delete(`/api/assets/${assetId}`);
      setAssets((prev) => prev.filter((a) => a.id !== assetId));
    } catch (err) {
      console.error('Delete failed:', err);
      setError('Failed to delete asset. Please try again.');
    } finally {
      setIsDeleting(null);
    }
  };

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <nav className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                🎨 AI Creative Engine
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">{workspace?.name}</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-slate-700 dark:text-slate-300">{user?.name}</span>
              <button
                onClick={() => {
                  logout();
                  router.push('/');
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Your Assets</h2>
            <p className="text-slate-600 dark:text-slate-400">Manage and process your product images</p>
          </div>
          <button
            onClick={handleUploadClick}
            disabled={isUploading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors font-semibold"
          >
            {isUploading ? '⏳ Uploading...' : '⬆️ Upload Image'}
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-slate-600 dark:text-slate-400">Loading assets...</p>
          </div>
        ) : assets.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-12 text-center">
            <p className="text-xl text-slate-600 dark:text-slate-400 mb-4">No assets yet</p>
            <p className="text-slate-500 dark:text-slate-500 mb-6">Upload your first product image to get started</p>
            <button
              onClick={handleUploadClick}
              disabled={isUploading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors font-semibold"
            >
              {isUploading ? '⏳ Uploading...' : 'Upload Your First Image'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assets.map((asset) => (
              <div
                key={asset.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="aspect-square bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center overflow-hidden">
                  {asset.originalUrl ? (
                    <img
                      src={asset.originalUrl}
                      alt={asset.originalFileName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : null}
                  {!asset.originalUrl && (
                    <div className="text-center">
                      <div className="text-4xl mb-2">📸</div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">No image</p>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-slate-900 dark:text-white truncate">{asset.originalFileName}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {asset.width}x{asset.height}
                  </p>
                  <div className="mt-4 flex space-x-2">
                    <button
                      onClick={() => handleEditClick(asset)}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClick(asset.id)}
                      disabled={isDeleting === asset.id}
                      className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
                    >
                      {isDeleting === asset.id ? '⏳' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Edit Modal */}
      {editingAsset && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-900 rounded-lg max-w-md w-full mx-4 p-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Edit Asset</h2>
            <div className="mb-4">
              <div className="w-full h-48 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                {editingAsset.originalUrl ? (
                  <img
                    src={editingAsset.originalUrl}
                    alt={editingAsset.originalFileName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : null}
                {!editingAsset.originalUrl && (
                  <div className="text-center">
                    <div className="text-6xl mb-2">📸</div>
                    <p className="text-slate-600 dark:text-slate-400">No image uploaded</p>
                  </div>
                )}
              </div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Filename
              </label>
              <input
                type="text"
                defaultValue={editingAsset.originalFileName}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg dark:bg-slate-800 dark:text-white"
                onChange={(e) => {
                  setEditingAsset({ ...editingAsset, originalFileName: e.target.value });
                }}
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setEditingAsset(null)}
                className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    const apiClient = getApiClient();
                    await apiClient.patch(`/api/assets/${editingAsset.id}`, {
                      originalFileName: editingAsset.originalFileName,
                    });
                    setAssets((prev) =>
                      prev.map((a) => (a.id === editingAsset.id ? editingAsset : a))
                    );
                    setEditingAsset(null);
                  } catch (err) {
                    console.error('Update failed:', err);
                    setError('Failed to update asset.');
                  }
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
