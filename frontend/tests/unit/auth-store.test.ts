/**
 * Unit tests for the Zustand auth store.
 * Mocks fetch to avoid real network calls.
 */

import { act } from 'react';

// Must mock localStorage for jsdom
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(global, 'localStorage', { value: localStorageMock });

// Reset module between tests to get a fresh store
let useAuthStore: typeof import('@utils/auth-store').useAuthStore;

beforeEach(async () => {
  localStorageMock.clear();
  jest.resetModules();
  const mod = await import('@utils/auth-store');
  useAuthStore = mod.useAuthStore;
  // Reset store state
  useAuthStore.setState({ user: null, workspace: null, token: null, isLoading: false, error: null });
});

describe('useAuthStore', () => {
  describe('initial state', () => {
    it('should have null user, workspace, and token', () => {
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.workspace).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('login', () => {
    it('should set user and token on successful login', async () => {
      const mockUser = { id: 'u1', email: 'test@example.com', name: 'Test User' };
      const mockToken = 'jwt.token.here';
      const mockWorkspace = { id: 'w1', name: 'Test WS', slug: 'test-ws', plan: 'free' };

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: mockUser, token: mockToken, workspace: mockWorkspace }),
      } as Response);

      await act(async () => {
        await useAuthStore.getState().login('test@example.com', 'password123');
      });

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.token).toBe(mockToken);
      expect(state.workspace).toEqual(mockWorkspace);
      expect(state.isLoading).toBe(false);
      expect(localStorageMock.getItem('auth_token')).toBe(mockToken);
    });

    it('should set error on failed login', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: { message: 'Invalid credentials' } }),
      } as Response);

      await act(async () => {
        await expect(useAuthStore.getState().login('bad@example.com', 'wrong')).rejects.toThrow();
      });

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeTruthy();
    });

    it('should set isLoading during login', async () => {
      let resolveLogin: (v: unknown) => void;
      const loginPromise = new Promise((res) => { resolveLogin = res; });

      global.fetch = jest.fn().mockReturnValueOnce(loginPromise);

      const loginAction = useAuthStore.getState().login('test@example.com', 'password');
      expect(useAuthStore.getState().isLoading).toBe(true);

      // Resolve the promise
      resolveLogin!({ ok: true, json: async () => ({ user: { id: 'u1', email: 'test@example.com', name: 'Test' }, token: 'tok', workspace: null }) });
      await act(async () => { await loginAction.catch(() => {}); });
    });
  });

  describe('signup', () => {
    it('should set user and token on successful signup', async () => {
      const mockUser = { id: 'u2', email: 'new@example.com', name: 'New User' };
      const mockToken = 'new.jwt.token';
      const mockWorkspace = { id: 'w2', name: 'My Workspace', slug: 'my-workspace', plan: 'free' };

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: mockUser, token: mockToken, workspace: mockWorkspace }),
      } as Response);

      await act(async () => {
        await useAuthStore.getState().signup('new@example.com', 'New User', 'password123', 'My Workspace');
      });

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.token).toBe(mockToken);
      expect(localStorageMock.getItem('auth_token')).toBe(mockToken);
    });

    it('should throw on failed signup', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: { message: 'Email taken' } }),
      } as Response);

      await act(async () => {
        await expect(
          useAuthStore.getState().signup('taken@example.com', 'User', 'pass123')
        ).rejects.toThrow();
      });

      expect(useAuthStore.getState().user).toBeNull();
    });
  });

  describe('logout', () => {
    it('should clear user, workspace, and token', () => {
      useAuthStore.setState({
        user: { id: 'u1', email: 'test@example.com', name: 'Test' },
        token: 'some-token',
        workspace: { id: 'w1', name: 'WS', slug: 'ws', plan: 'free' },
      });
      localStorageMock.setItem('auth_token', 'some-token');

      useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.workspace).toBeNull();
      expect(localStorageMock.getItem('auth_token')).toBeNull();
    });
  });

  describe('setters', () => {
    it('should set user via setUser', () => {
      const user = { id: 'u3', email: 'u3@example.com', name: 'User 3' };
      useAuthStore.getState().setUser(user);
      expect(useAuthStore.getState().user).toEqual(user);
    });

    it('should set workspace via setWorkspace', () => {
      const workspace = { id: 'w3', name: 'WS3', slug: 'ws3', plan: 'pro' };
      useAuthStore.getState().setWorkspace(workspace);
      expect(useAuthStore.getState().workspace).toEqual(workspace);
    });

    it('should set token via setToken', () => {
      useAuthStore.getState().setToken('new-token-value');
      expect(useAuthStore.getState().token).toBe('new-token-value');
    });
  });
});
