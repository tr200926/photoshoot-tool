/**
 * Component tests for the Login page.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock Next.js router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock Next.js Link
jest.mock('next/link', () => {
  return function Link({ href, children }: { href: string; children: React.ReactNode }) {
    return <a href={href}>{children}</a>;
  };
});

// Mock the auth store
const mockLogin = jest.fn();
jest.mock('@utils/auth-store', () => ({
  useAuthStore: jest.fn(() => ({
    login: mockLogin,
    isLoading: false,
    error: null,
  })),
}));

import LoginPage from '@/app/login/page';
import { useAuthStore } from '@utils/auth-store';

const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthStore.mockReturnValue({
      login: mockLogin,
      isLoading: false,
      error: null,
      signup: jest.fn(),
      logout: jest.fn(),
      user: null,
      workspace: null,
      token: null,
      setUser: jest.fn(),
      setWorkspace: jest.fn(),
      setToken: jest.fn(),
    });
  });

  it('should render login form', () => {
    render(<LoginPage />);

    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
  });

  it('should render Sign Up link', () => {
    render(<LoginPage />);

    const signUpLink = screen.getByRole('link', { name: /sign up/i });
    expect(signUpLink).toBeInTheDocument();
    expect(signUpLink).toHaveAttribute('href', '/signup');
  });

  it('should call login with entered credentials', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValueOnce(undefined);

    render(<LoginPage />);

    await user.type(screen.getByPlaceholderText('you@example.com'), 'test@example.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'password123');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('should redirect to dashboard on successful login', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValueOnce(undefined);

    render(<LoginPage />);

    await user.type(screen.getByPlaceholderText('you@example.com'), 'test@example.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'password123');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('should display error message on failed login', async () => {
    const user = userEvent.setup();
    mockLogin.mockRejectedValueOnce(new Error('Invalid credentials'));

    render(<LoginPage />);

    await user.type(screen.getByPlaceholderText('you@example.com'), 'bad@example.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'wrong');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  it('should display store-level error message', () => {
    mockUseAuthStore.mockReturnValueOnce({
      login: mockLogin,
      isLoading: false,
      error: 'Account locked',
      signup: jest.fn(),
      logout: jest.fn(),
      user: null,
      workspace: null,
      token: null,
      setUser: jest.fn(),
      setWorkspace: jest.fn(),
      setToken: jest.fn(),
    });

    render(<LoginPage />);
    expect(screen.getByText('Account locked')).toBeInTheDocument();
  });

  it('should show loading state during login', () => {
    mockUseAuthStore.mockReturnValueOnce({
      login: mockLogin,
      isLoading: true,
      error: null,
      signup: jest.fn(),
      logout: jest.fn(),
      user: null,
      workspace: null,
      token: null,
      setUser: jest.fn(),
      setWorkspace: jest.fn(),
      setToken: jest.fn(),
    });

    render(<LoginPage />);

    const button = screen.getByRole('button', { name: /logging in/i });
    expect(button).toBeDisabled();
  });
});
