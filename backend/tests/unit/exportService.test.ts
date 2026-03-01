import sharp from 'sharp';
import { resizeForFormat, generateExportFormats, buildZipBuffer, FORMAT_SPECS } from '../../src/services/exportService';

const createTestImageBuffer = async (width = 1200, height = 1200): Promise<Buffer> => {
  return sharp({
    create: { width, height, channels: 3, background: { r: 100, g: 150, b: 200 } },
  })
    .jpeg()
    .toBuffer();
};

describe('Export Service', () => {
  describe('FORMAT_SPECS', () => {
    it('should define square format', () => {
      expect(FORMAT_SPECS.square.width).toBe(1080);
      expect(FORMAT_SPECS.square.height).toBe(1080);
    });

    it('should define portrait format', () => {
      expect(FORMAT_SPECS.portrait.width).toBe(1080);
      expect(FORMAT_SPECS.portrait.height).toBe(1350);
    });

    it('should define stories format', () => {
      expect(FORMAT_SPECS.stories.width).toBe(1080);
      expect(FORMAT_SPECS.stories.height).toBe(1920);
    });
  });

  describe('resizeForFormat', () => {
    it('should resize to square 1:1', async () => {
      const buf = await createTestImageBuffer();
      const result = await resizeForFormat(buf, 'square', 1);
      const meta = await sharp(result).metadata();
      expect(meta.width).toBe(1080);
      expect(meta.height).toBe(1080);
    });

    it('should resize to portrait 4:5', async () => {
      const buf = await createTestImageBuffer();
      const result = await resizeForFormat(buf, 'portrait', 1);
      const meta = await sharp(result).metadata();
      expect(meta.width).toBe(1080);
      expect(meta.height).toBe(1350);
    });

    it('should resize to stories 9:16', async () => {
      const buf = await createTestImageBuffer();
      const result = await resizeForFormat(buf, 'stories', 1);
      const meta = await sharp(result).metadata();
      expect(meta.width).toBe(1080);
      expect(meta.height).toBe(1920);
    });

    it('should apply 2x scale', async () => {
      const buf = await createTestImageBuffer();
      const result = await resizeForFormat(buf, 'square', 2);
      const meta = await sharp(result).metadata();
      expect(meta.width).toBe(2160);
      expect(meta.height).toBe(2160);
    });
  });

  describe('generateExportFormats', () => {
    it('should generate multiple formats', async () => {
      const buf = await createTestImageBuffer();
      const results = await generateExportFormats(buf, ['square', 'portrait']);
      expect(results).toHaveProperty('square');
      expect(results).toHaveProperty('portrait');
      expect(Buffer.isBuffer(results.square)).toBe(true);
      expect(Buffer.isBuffer(results.portrait)).toBe(true);
    });
  });

  describe('buildZipBuffer', () => {
    it('should create a valid ZIP buffer', async () => {
      const files = [
        { name: 'test1.jpg', buffer: Buffer.from('image1') },
        { name: 'test2.jpg', buffer: Buffer.from('image2') },
      ];
      const zip = await buildZipBuffer(files);
      expect(Buffer.isBuffer(zip)).toBe(true);
      expect(zip.length).toBeGreaterThan(0);
      // ZIP magic number: PK\x03\x04
      expect(zip[0]).toBe(0x50);
      expect(zip[1]).toBe(0x4b);
    });
  });
});
