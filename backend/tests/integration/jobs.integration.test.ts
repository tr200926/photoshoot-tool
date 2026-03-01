/**
 * Integration tests for the jobs API endpoints.
 * Mocks Bull queues to avoid Redis dependency.
 * Requires a running PostgreSQL database.
 */

import request from 'supertest';
import sharp from 'sharp';

// Mock Bull queues before importing app (avoids Redis connection attempt)
jest.mock('../../src/services/queueService', () => ({
  getBackgroundRemovalQueue: jest.fn(() => ({
    add: jest.fn().mockResolvedValue({ id: 'mock-bull-job-id' }),
    process: jest.fn(),
    on: jest.fn(),
    close: jest.fn(),
  })),
  getEnvironmentGenerationQueue: jest.fn(() => ({
    add: jest.fn().mockResolvedValue({ id: 'mock-bull-job-id' }),
    process: jest.fn(),
    on: jest.fn(),
    close: jest.fn(),
  })),
  getExportQueue: jest.fn(() => ({
    add: jest.fn().mockResolvedValue({ id: 'mock-bull-job-id' }),
    process: jest.fn(),
    on: jest.fn(),
    close: jest.fn(),
  })),
  closeQueues: jest.fn(),
}));

// Also mock the export service to avoid S3 fetching in tests
jest.mock('../../src/services/exportService', () => ({
  exportAssetVariants: jest.fn().mockResolvedValue(Buffer.from('PK\x03\x04fake-zip-content')),
  FORMAT_SPECS: {
    square: { label: 'Square 1:1', width: 1080, height: 1080 },
    portrait: { label: 'Portrait 4:5', width: 1080, height: 1350 },
    stories: { label: 'Stories 9:16', width: 1080, height: 1920 },
  },
}));

import app from '../../src/index';

let authToken: string;
let testAssetId: string;
let testJobId: string;

const testEmail = `jobs-test-${Date.now()}@example.com`;

const createTestImageBuffer = async (): Promise<Buffer> =>
  sharp({
    create: { width: 800, height: 800, channels: 3, background: { r: 100, g: 150, b: 200 } },
  })
    .png()
    .toBuffer();

describe('Jobs API', () => {
  beforeAll(async () => {
    // Sign up
    const signupRes = await request(app)
      .post('/api/auth/signup')
      .send({ email: testEmail, name: 'Jobs Test User', password: 'jobspass123', workspaceName: 'Jobs Workspace' });

    authToken = signupRes.body.token;

    // Upload a test asset to use in job tests
    const imageBuffer = await createTestImageBuffer();
    const uploadRes = await request(app)
      .post('/api/assets/upload')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('file', imageBuffer, { filename: 'job-test-product.png', contentType: 'image/png' });

    testAssetId = uploadRes.body.asset?.id;
  });

  describe('GET /api/jobs/meta/options', () => {
    it('should return available environments, angles, and formats', async () => {
      const res = await request(app)
        .get('/api/jobs/meta/options')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.environments)).toBe(true);
      expect(Array.isArray(res.body.angles)).toBe(true);
      expect(Array.isArray(res.body.formats)).toBe(true);
      expect(res.body.environments.length).toBe(5);
      expect(res.body.angles.length).toBe(3);

      // Verify structure
      expect(res.body.environments[0]).toHaveProperty('key');
      expect(res.body.environments[0]).toHaveProperty('name');
    });
  });

  describe('GET /api/jobs', () => {
    it('should return job list for workspace', async () => {
      const res = await request(app)
        .get('/api/jobs')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.jobs)).toBe(true);
      expect(res.body.pagination).toBeDefined();
    });

    it('should require authentication', async () => {
      const res = await request(app).get('/api/jobs');
      expect(res.status).toBe(401);
    });

    it('should support filtering by status', async () => {
      const res = await request(app)
        .get('/api/jobs?status=pending')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('POST /api/jobs/background-removal', () => {
    it('should create a background removal job', async () => {
      if (!testAssetId) return;

      const res = await request(app)
        .post('/api/jobs/background-removal')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ assetId: testAssetId });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.job).toBeDefined();
      expect(res.body.job.jobType).toBe('background-removal');
      expect(res.body.job.status).toBe('pending');
      expect(res.body.job.creditsUsed).toBe(50);

      testJobId = res.body.job.id;
    });

    it('should require assetId', async () => {
      const res = await request(app)
        .post('/api/jobs/background-removal')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error?.code).toBe('VALIDATION_ERROR');
    });

    it('should reject non-existent assetId', async () => {
      const res = await request(app)
        .post('/api/jobs/background-removal')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ assetId: 'non-existent-asset-id' });

      expect(res.status).toBe(404);
      expect(res.body.error?.code).toBe('ASSET_NOT_FOUND');
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .post('/api/jobs/background-removal')
        .send({ assetId: testAssetId });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/jobs/environment-generation', () => {
    it('should create environment generation jobs', async () => {
      if (!testAssetId) return;

      const res = await request(app)
        .post('/api/jobs/environment-generation')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          assetId: testAssetId,
          environment: 'white-studio',
          angles: ['front', 'forty-five'],
          lightingIntensity: 60,
          colorTone: 10,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.jobs)).toBe(true);
      expect(res.body.jobs.length).toBe(2); // one per angle
      expect(res.body.jobs[0].jobType).toBe('environment-generation');
      expect(res.body.jobs[0].creditsUsed).toBe(100);
    });

    it('should reject invalid environment key', async () => {
      if (!testAssetId) return;

      const res = await request(app)
        .post('/api/jobs/environment-generation')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ assetId: testAssetId, environment: 'invalid-env', angles: ['front'] });

      expect(res.status).toBe(400);
      expect(res.body.error?.code).toBe('VALIDATION_ERROR');
    });

    it('should require assetId', async () => {
      const res = await request(app)
        .post('/api/jobs/environment-generation')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ environment: 'white-studio', angles: ['front'] });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/jobs/:jobId', () => {
    it('should return job details', async () => {
      if (!testJobId) return;

      const res = await request(app)
        .get(`/api/jobs/${testJobId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.job.id).toBe(testJobId);
      expect(res.body.job.jobType).toBe('background-removal');
    });

    it('should return 404 for non-existent job', async () => {
      const res = await request(app)
        .get('/api/jobs/non-existent-job-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error?.code).toBe('JOB_NOT_FOUND');
    });
  });

  describe('POST /api/jobs/:jobId/cancel', () => {
    it('should cancel a pending job', async () => {
      if (!testJobId) return;

      const res = await request(app)
        .post(`/api/jobs/${testJobId}/cancel`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('cancelled');
    });

    it('should not allow cancelling an already-failed job', async () => {
      if (!testJobId) return;

      const res = await request(app)
        .post(`/api/jobs/${testJobId}/cancel`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error?.code).toBe('INVALID_JOB_STATE');
    });

    it('should return 404 for non-existent job', async () => {
      const res = await request(app)
        .post('/api/jobs/non-existent-id/cancel')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/jobs/export', () => {
    it('should return a ZIP buffer for valid export request', async () => {
      if (!testAssetId) return;

      const res = await request(app)
        .post('/api/jobs/export')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ assetId: testAssetId, formats: ['square', 'portrait'], scale: 1 });

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('application/zip');
      expect(res.headers['content-disposition']).toContain('export-');
    });

    it('should reject invalid format keys', async () => {
      if (!testAssetId) return;

      const res = await request(app)
        .post('/api/jobs/export')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ assetId: testAssetId, formats: ['invalid-format'] });

      expect(res.status).toBe(400);
    });

    it('should require assetId', async () => {
      const res = await request(app)
        .post('/api/jobs/export')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ formats: ['square'] });

      expect(res.status).toBe(400);
    });
  });
});
