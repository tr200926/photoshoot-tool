import { AppError } from '../../src/middleware/errorHandler';

describe('AppError', () => {
  it('should create an error with message, status code, and error code', () => {
    const err = new AppError('Test error', 400, 'TEST_ERROR');
    expect(err.message).toBe('Test error');
    expect(err.statusCode).toBe(400);
    expect(err.errorCode).toBe('TEST_ERROR');
    expect(err).toBeInstanceOf(Error);
  });

  it('should default status code to 500', () => {
    const err = new AppError('Internal error');
    expect(err.statusCode).toBe(500);
  });

  it('should have name AppError', () => {
    const err = new AppError('Test');
    expect(err.name).toBe('AppError');
  });

  it('should be instance of Error', () => {
    const err = new AppError('Test');
    expect(err instanceof Error).toBe(true);
  });
});
