/**
 * Unit tests for the Axios API client utility.
 */

// Mock axios before imports
jest.mock('axios', () => {
  const mockInterceptors = {
    request: { use: jest.fn() },
    response: { use: jest.fn() },
  };
  const mockInstance = {
    interceptors: mockInterceptors,
    get: jest.fn(),
    post: jest.fn(),
  };
  return {
    default: {
      create: jest.fn(() => mockInstance),
    },
    __esModule: true,
  };
});

import axios from 'axios';

describe('API Client', () => {
  beforeEach(() => {
    jest.resetModules();
    (axios.create as jest.Mock).mockClear();
  });

  describe('initializeApiClient', () => {
    it('should create axios instance with base URL', async () => {
      const { initializeApiClient } = await import('@utils/api-client');
      initializeApiClient();

      expect(axios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: expect.stringContaining('localhost'),
          headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
        })
      );
    });

    it('should include Authorization header when token is provided', async () => {
      const { initializeApiClient } = await import('@utils/api-client');
      initializeApiClient('test-token-123');

      expect(axios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token-123',
          }),
        })
      );
    });

    it('should not include Authorization header when no token provided', async () => {
      const { initializeApiClient } = await import('@utils/api-client');
      initializeApiClient();

      const callArgs = (axios.create as jest.Mock).mock.calls[0][0];
      expect(callArgs.headers.Authorization).toBeUndefined();
    });

    it('should register request and response interceptors', async () => {
      const mockInstance = (axios.create as jest.Mock)();
      const { initializeApiClient } = await import('@utils/api-client');
      initializeApiClient();

      expect(mockInstance.interceptors.request.use).toHaveBeenCalled();
      expect(mockInstance.interceptors.response.use).toHaveBeenCalled();
    });
  });

  describe('getApiClient', () => {
    it('should return an axios instance', async () => {
      const { getApiClient } = await import('@utils/api-client');
      const client = getApiClient();
      expect(client).toBeDefined();
    });

    it('should initialize client if not already initialized', async () => {
      jest.resetModules();
      const { getApiClient } = await import('@utils/api-client');
      getApiClient();
      expect(axios.create).toHaveBeenCalled();
    });
  });
});
