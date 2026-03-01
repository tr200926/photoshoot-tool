'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@utils/auth-store';
import { useRequireAuth } from '@hooks/useAuth';
import { getApiClient } from '@utils/api-client';

interface Project {
  id: string;
  name: string;
  description?: string;
  isArchived: boolean;
  createdAt: string;
  _count: { assets: number };
}

export default function ProjectsPage() {
  const router = useRouter();
  const isReady = useRequireAuth();
  const { logout } = useAuthStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const fetchProjects = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await getApiClient().get('/api/projects');
      setProjects(res.data.projects || []);
    } catch {
      setError('Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { if (isReady) fetchProjects(); }, [isReady, fetchProjects]);

  const createProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      setIsCreating(true);
      setError('');
      const res = await getApiClient().post('/api/projects', { name: newName, description: newDesc });
      setProjects(prev => [res.data.project, ...prev]);
      setNewName('');
      setNewDesc('');
      setShowCreate(false);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to create project');
    } finally {
      setIsCreating(false);
    }
  };

  const deleteProject = async (id: string) => {
    if (!window.confirm('Delete this project? Assets will not be deleted.')) return;
    try {
      await getApiClient().delete(`/api/projects/${id}`);
      setProjects(prev => prev.filter(p => p.id !== id));
    } catch {
      setError('Failed to delete project');
    }
  };

  if (!isReady) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">AI Creative Engine</Link>
            <div className="hidden md:flex gap-1">
              <Link href="/dashboard" className="px-3 py-1.5 text-sm text-slate-500">Assets</Link>
              <Link href="/generate" className="px-3 py-1.5 text-sm text-slate-500">Generate</Link>
              <Link href="/projects" className="px-3 py-1.5 text-sm font-semibold text-blue-600">Projects</Link>
              <Link href="/settings" className="px-3 py-1.5 text-sm text-slate-500">Settings</Link>
            </div>
          </div>
          <button onClick={() => { logout(); router.push('/'); }} className="px-3 py-1.5 text-sm text-slate-600">Logout</button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Projects</h2>
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            New Project
          </button>
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">{error}</div>}

        {/* Create modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Create Project</h3>
              <form onSubmit={createProject} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name *</label>
                  <input type="text" value={newName} onChange={e => setNewName(e.target.value)} required
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Summer Collection" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                  <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} rows={2}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    placeholder="Optional description" />
                </div>
                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={() => setShowCreate(false)} className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-lg text-sm">Cancel</button>
                  <button type="submit" disabled={isCreating} className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
                    {isCreating ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto" /></div>
        ) : projects.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-16 text-center">
            <div className="text-5xl mb-4">📁</div>
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">No projects yet</h3>
            <p className="text-slate-500 text-sm mb-6">Organize your assets into projects</p>
            <button onClick={() => setShowCreate(true)} className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium">Create First Project</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map(project => (
              <div key={project.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-slate-800 dark:text-slate-200">{project.name}</h3>
                    {project.description && <p className="text-sm text-slate-500 mt-0.5">{project.description}</p>}
                  </div>
                  <button onClick={() => deleteProject(project.id)} className="text-slate-300 hover:text-red-500 text-lg leading-none">×</button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">{project._count.assets} asset{project._count.assets !== 1 ? 's' : ''}</span>
                  <Link href={`/dashboard?projectId=${project.id}`} className="text-sm text-blue-600 hover:text-blue-700 font-medium">View →</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
