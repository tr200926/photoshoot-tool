'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@utils/auth-store';
import { useRequireAuth } from '@hooks/useAuth';
import { getApiClient } from '@utils/api-client';

export default function SettingsPage() {
  const router = useRouter();
  const isReady = useRequireAuth();
  const { user, workspace, logout } = useAuthStore();
  const [workspaceData, setWorkspaceData] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [wsName, setWsName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('editor');
  const [isInviting, setIsInviting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchWorkspace = useCallback(async () => {
    try {
      const [wsRes, analyticsRes] = await Promise.all([
        getApiClient().get('/api/workspaces/current'),
        getApiClient().get('/api/workspaces/current/analytics'),
      ]);
      setWorkspaceData(wsRes.data.workspace);
      setWsName(wsRes.data.workspace.name);
      setAnalytics(analyticsRes.data.analytics);
    } catch { setError('Failed to load workspace'); }
  }, []);

  useEffect(() => { if (isReady) fetchWorkspace(); }, [isReady, fetchWorkspace]);

  const saveWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      setError('');
      await getApiClient().put('/api/workspaces/current', { name: wsName });
      setMessage('Workspace updated');
      setTimeout(() => setMessage(''), 3000);
    } catch { setError('Failed to save'); } finally { setIsSaving(false); }
  };

  const inviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsInviting(true);
      setError('');
      await getApiClient().post('/api/workspaces/current/members/invite', { email: inviteEmail, role: inviteRole });
      setMessage(`Invited ${inviteEmail}`);
      setInviteEmail('');
      fetchWorkspace();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Invite failed');
    } finally { setIsInviting(false); }
  };

  const removeMember = async (userId: string) => {
    if (!window.confirm('Remove this member?')) return;
    try {
      await getApiClient().delete(`/api/workspaces/current/members/${userId}`);
      fetchWorkspace();
    } catch (err: any) { setError(err.response?.data?.error?.message || 'Remove failed'); }
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
              <Link href="/projects" className="px-3 py-1.5 text-sm text-slate-500">Projects</Link>
              <Link href="/settings" className="px-3 py-1.5 text-sm font-semibold text-blue-600">Settings</Link>
            </div>
          </div>
          <button onClick={() => { logout(); router.push('/'); }} className="px-3 py-1.5 text-sm text-slate-600">Logout</button>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h2>

        {message && <div className="p-3 bg-green-50 border border-green-200 rounded text-green-600 text-sm">{message}</div>}
        {error && <div className="p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">{error}</div>}

        {/* Workspace */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-4">Workspace Settings</h3>
          <form onSubmit={saveWorkspace} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Workspace Name</label>
              <input type="text" value={wsName} onChange={e => setWsName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-500 mb-1">Plan</label>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium capitalize">{workspaceData?.plan || 'free'}</span>
              </div>
            </div>
            <button type="submit" disabled={isSaving} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Usage */}
        {analytics && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-4">Usage</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600 dark:text-slate-400">Credits</span>
                  <span className="font-medium">{analytics.credits.used} / {analytics.credits.monthly}</span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full">
                  <div
                    className="h-2 bg-blue-500 rounded-full"
                    style={{ width: `${Math.min(100, (analytics.credits.used / analytics.credits.monthly) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1">{analytics.credits.remaining} credits remaining</p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                  <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">{analytics.assets.total}</p>
                  <p className="text-xs text-slate-500">Total Assets</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                  <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">{analytics.jobs.completed}</p>
                  <p className="text-xs text-slate-500">Generations</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Team Members */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-4">Team Members</h3>
          {workspaceData?.members && (
            <div className="space-y-2 mb-4">
              {workspaceData.members.map((m: any) => (
                <div key={m.id} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{m.user.name}</p>
                    <p className="text-xs text-slate-400">{m.user.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 bg-slate-200 dark:bg-slate-700 rounded capitalize">{m.role}</span>
                    {m.user.id !== user?.id && (
                      <button onClick={() => removeMember(m.user.id)} className="text-red-400 hover:text-red-600 text-xs">Remove</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          <form onSubmit={inviteMember} className="flex gap-2">
            <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} required placeholder="Email address"
              className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}
              className="px-2 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
              <option value="admin">Admin</option>
            </select>
            <button type="submit" disabled={isInviting} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
              {isInviting ? '...' : 'Invite'}
            </button>
          </form>
        </div>

        {/* Account */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-4">Account</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Name</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">{user?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Email</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">{user?.email}</span>
            </div>
          </div>
          <button
            onClick={() => { logout(); router.push('/'); }}
            className="mt-4 px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-50"
          >
            Sign Out
          </button>
        </div>
      </main>
    </div>
  );
}
