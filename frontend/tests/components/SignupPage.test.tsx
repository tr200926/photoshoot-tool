/**
 * Component tests for the Signup page.
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
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
const mockSignup = jest.fn();
jest.mock('@utils/auth-store', () => ({
  useAuthStore: jest.fn(() => ({
    signup: mockSignup,
    isLoading: false,
    error: null,
  })),
}));

import SignupPage from '@/app/signup/page';
import { useAuthStore } from '@utils/auth-store';

const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

const defaultStoreState = {
  signup: mockSignup,
  login: jest.fn(),
  logout: jest.fn(),
  isLoading: false,
  error: null,
  user: null,
  workspace: null,
  token: null,
  setUser: jest.fn(),
  setWorkspace: jest.fn(),
  setToken: jest.fn(),
};

describe('SignupPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthStore.mockReturnValue(defaultStoreState);
  });

  it('should render signup form with all fields', () => {
    render(<SignupPage />);

    expect(screen.getByText('Get Started')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('John Doe')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('My Company')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
  });

  it('should render Log In link', () => {
    render(<SignupPage />);

    const logInLink = screen.getByRole('link', { name: /log in/i });
    expect(logInLink).toBeInTheDocument();
    expect(logInLink).toHaveAttribute('href', '/login');
  });

  it('should call signup with all fields', async () => {
    const user = userEvent.setup();
    mockSignup.mockResolvedValueOnce(undefined);

    render(<SignupPage />);

    await user.type(screen.getByPlaceholderText('John Doe'), 'Test User');
    await user.type(screen.getByPlaceholderText('you@example.com'), 'test@example.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'password123');
    await user.type(screen.getByPlaceholderText('My Company'), 'Test Co');
    await user.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(mockSignup).toHaveBeenCalledWith('test@example.com', 'Test User', 'password123', 'Test Co');
    });
  });

  it('should redirect to dashboard after successful signup', async () => {
    const user = userEvent.setup();
    mockSignup.mockResolvedValueOnce(undefined);

    render(<SignupPage />);

    await user.type(screen.getByPlaceholderText('John Doe'), 'Test User');
    await user.type(screen.getByPlaceholderText('you@example.com'), 'test@example.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'password123');
    await user.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('should reject password shorter than 8 characters', async () => {
    const user = userEvent.setup();

    render(<SignupPage />);

    await user.type(screen.getByPlaceholderText('John Doe'), 'Test User');
    await user.type(screen.getByPlaceholderText('you@example.com'), 'test@example.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'short');
    await user.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
    });

    expect(mockSignup).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should display error on failed signup', async () => {
    const user = userEvent.setup();
    mockSignup.mockRejectedValueOnce(new Error('Email already in use'));

    render(<SignupPage />);

    await user.type(screen.getByPlaceholderText('John Doe'), 'Test User');
    await user.type(screen.getByPlaceholderText('you@example.com'), 'taken@example.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'password123');
    await user.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText('Email already in use')).toBeInTheDocument();
    });
  });

  it('should show loading state during signup', () => {
    mockUseAuthStore.mockReturnValueOnce({
      ...defaultStoreState,
      isLoading: true,
    });

    render(<SignupPage />);

    const button = screen.getByRole('button', { name: /creating account/i });
    expect(button).toBeDisabled();
  });

  it('should display store-level error', () => {
    mockUseAuthStore.mockReturnValueOnce({
      ...defaultStoreState,
      error: 'Server error occurred',
    });

    render(<SignupPage />);
    expect(screen.getByText('Server error occurred')).toBeInTheDocument();
  });

  it('should show min length hint for password', () => {
    render(<SignupPage />);
    expect(screen.getByText('Min. 8 characters')).toBeInTheDocument();
  });
});
