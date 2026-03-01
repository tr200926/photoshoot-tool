import sharp from 'sharp';
import { validateImage, getAssetQualityScore } from '../../src/modules/assets/uploadService';

const createTestImageBuffer = async (width: number, height: number): Promise<Buffer> => {
  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 128, g: 64, b: 192 },
    },
  })
    .jpeg()
    .toBuffer();
};

describe('Upload Service', () => {
  describe('validateImage', () => {
    it('should accept valid image (>=800x800)', async () => {
      const buf = await createTestImageBuffer(1200, 900);
      const result = await validateImage(buf);
      expect(result.width).toBe(1200);
      expect(result.height).toBe(900);
    });

    it('should reject image below minimum size', async () => {
      const buf = await createTestImageBuffer(400, 300);
      await expect(validateImage(buf)).rejects.toThrow('too small');
    });

    it('should reject image exactly at minimum width but below min height', async () => {
      const buf = await createTestImageBuffer(800, 400);
      await expect(validateImage(buf)).rejects.toThrow('too small');
    });

    it('should accept minimum valid size (800x800)', async () => {
      const buf = await createTestImageBuffer(800, 800);
      const result = await validateImage(buf);
      expect(result.width).toBe(800);
      expect(result.height).toBe(800);
    });
  });

  describe('getAssetQualityScore', () => {
    it('should return a score between 0 and 100', async () => {
      const buf = await createTestImageBuffer(1000, 1000);
      const score = await getAssetQualityScore(buf);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should return a number', async () => {
      const buf = await createTestImageBuffer(1000, 1000);
      const score = await getAssetQualityScore(buf);
      expect(typeof score).toBe('number');
    });
  });
});
