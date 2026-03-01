/**
 * Integration tests for the assets API endpoints.
 * Requires a running PostgreSQL database (uses TEST_DATABASE_URL or DATABASE_URL).
 * S3 upload is bypassed via the dev fallback (no AWS credentials needed).
 */

import request from 'supertest';
import sharp from 'sharp';
import app from '../../src/index';

let authToken: string;
let workspaceId: string;
let testAssetId: string;

const testEmail = `asset-test-${Date.now()}@example.com`;

// Create a minimal valid 800x800 PNG in memory for upload tests
const createTestImageBuffer = async (): Promise<Buffer> => {
  return sharp({
    create: { width: 800, height: 800, channels: 3, background: { r: 200, g: 200, b: 200 } },
  })
    .png()
    .toBuffer();
};

describe('Assets API', () => {
  beforeAll(async () => {
    // Sign up and get auth token
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: testEmail, name: 'Asset Test User', password: 'assetpass123', workspaceName: 'Asset Workspace' });

    if (res.status === 201) {
      authToken = res.body.token;
      workspaceId = res.body.workspace?.id;
    } else {
      // Login if already exists
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: testEmail, password: 'assetpass123' });
      authToken = loginRes.body.token;
    }
  });

  describe('GET /api/assets', () => {
    it('should return asset list for workspace', async () => {
      const res = await request(app)
        .get('/api/assets')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.assets)).toBe(true);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.total).toBeGreaterThanOrEqual(0);
    });

    it('should require authentication', async () => {
      const res = await request(app).get('/api/assets');
      expect(res.status).toBe(401);
    });

    it('should support pagination parameters', async () => {
      const res = await request(app)
        .get('/api/assets?limit=5&offset=0')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.pagination.limit).toBe(5);
      expect(res.body.pagination.offset).toBe(0);
    });
  });

  describe('POST /api/assets/upload', () => {
    it('should upload a valid image', async () => {
      const imageBuffer = await createTestImageBuffer();

      const res = await request(app)
        .post('/api/assets/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', imageBuffer, { filename: 'test-product.png', contentType: 'image/png' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.asset).toBeDefined();
      expect(res.body.asset.originalFileName).toBe('test-product.png');
      expect(res.body.asset.mimeType).toBe('image/png');
      expect(res.body.asset.status).toBe('uploaded');
      expect(res.body.qualityScore).toBeGreaterThanOrEqual(0);
      expect(res.body.qualityScore).toBeLessThanOrEqual(100);
      expect(res.body.message).toBeTruthy();

      // Save for subsequent tests
      testAssetId = res.body.asset.id;
    });

    it('should reject upload without authentication', async () => {
      const imageBuffer = await createTestImageBuffer();

      const res = await request(app)
        .post('/api/assets/upload')
        .attach('file', imageBuffer, { filename: 'test.png', contentType: 'image/png' });

      expect(res.status).toBe(401);
    });

    it('should reject non-image files', async () => {
      const textBuffer = Buffer.from('this is not an image');

      const res = await request(app)
        .post('/api/assets/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', textBuffer, { filename: 'test.txt', contentType: 'text/plain' });

      expect(res.status).toBe(400);
    });

    it('should reject images below 800x800', async () => {
      const smallBuffer = await sharp({
        create: { width: 400, height: 400, channels: 3, background: { r: 200, g: 200, b: 200 } },
      })
        .png()
        .toBuffer();

      const res = await request(app)
        .post('/api/assets/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', smallBuffer, { filename: 'small.png', contentType: 'image/png' });

      expect(res.status).toBe(400);
      expect(res.body.error?.code).toBe('IMAGE_TOO_SMALL');
    });
  });

  describe('GET /api/assets/:assetId', () => {
    it('should return asset details', async () => {
      if (!testAssetId) return;

      const res = await request(app)
        .get(`/api/assets/${testAssetId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.asset.id).toBe(testAssetId);
      expect(res.body.asset.variants).toBeDefined();
      expect(Array.isArray(res.body.asset.variants)).toBe(true);
    });

    it('should return 404 for non-existent asset', async () => {
      const res = await request(app)
        .get('/api/assets/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error?.code).toBe('ASSET_NOT_FOUND');
    });

    it('should require authentication', async () => {
      const res = await request(app).get('/api/assets/some-id');
      expect(res.status).toBe(401);
    });
  });

  describe('PATCH /api/assets/:assetId', () => {
    it('should update asset filename', async () => {
      if (!testAssetId) return;

      const res = await request(app)
        .patch(`/api/assets/${testAssetId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ originalFileName: 'renamed-product.png' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.asset.originalFileName).toBe('renamed-product.png');
    });

    it('should return 404 for non-existent asset', async () => {
      const res = await request(app)
        .patch('/api/assets/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ originalFileName: 'new-name.png' });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/assets/:assetId', () => {
    it('should delete an asset', async () => {
      if (!testAssetId) return;

      const res = await request(app)
        .delete(`/api/assets/${testAssetId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('deleted');
    });

    it('should return 404 after deletion', async () => {
      if (!testAssetId) return;

      const res = await request(app)
        .get(`/api/assets/${testAssetId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });

    it('should return 404 for non-existent asset', async () => {
      const res = await request(app)
        .delete('/api/assets/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });
  });
});
