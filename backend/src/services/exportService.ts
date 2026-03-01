import sharp from 'sharp';
import archiver from 'archiver';
import axios from 'axios';
import { Writable } from 'stream';
import { getPrismaClient } from '@config/database';
import { AppError } from '@middleware/errorHandler';

const prisma = getPrismaClient();

export const FORMAT_SPECS = {
  square: { width: 1080, height: 1080, label: '1:1 Square', platforms: 'Instagram Feed, Catalog' },
  portrait: { width: 1080, height: 1350, label: '4:5 Portrait', platforms: 'Instagram Stories, Pinterest' },
  stories: { width: 1080, height: 1920, label: '9:16 Stories', platforms: 'TikTok, Reels, YouTube Shorts' },
} as const;

export type FormatKey = keyof typeof FORMAT_SPECS;

export const resizeForFormat = async (
  imageBuffer: Buffer,
  format: FormatKey,
  scale: 1 | 2 | 4 = 1,
): Promise<Buffer> => {
  const spec = FORMAT_SPECS[format];
  const targetW = spec.width * scale;
  const targetH = spec.height * scale;

  return sharp(imageBuffer)
    .resize(targetW, targetH, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 },
      position: 'centre',
    })
    .jpeg({ quality: 95 })
    .toBuffer();
};

export const generateExportFormats = async (
  imageBuffer: Buffer,
  formats: FormatKey[],
  scale: 1 | 2 | 4 = 1,
): Promise<Record<string, Buffer>> => {
  const results: Record<string, Buffer> = {};

  await Promise.all(
    formats.map(async (fmt) => {
      results[fmt] = await resizeForFormat(imageBuffer, fmt, scale);
    }),
  );

  return results;
};

export const buildZipBuffer = async (
  files: { name: string; buffer: Buffer }[],
): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];

    const writable = new Writable({
      write(chunk, _encoding, callback) {
        chunks.push(chunk);
        callback();
      },
    });

    const archive = archiver('zip', { zlib: { level: 6 } });

    archive.on('error', reject);
    writable.on('finish', () => resolve(Buffer.concat(chunks)));

    archive.pipe(writable);

    for (const file of files) {
      archive.append(file.buffer, { name: file.name });
    }

    archive.finalize();
  });
};

export const exportAssetVariants = async (
  assetId: string,
  workspaceId: string,
  variantIds: string[],
  formats: FormatKey[],
  scale: 1 | 2 | 4 = 1,
): Promise<Buffer> => {
  const asset = await prisma.asset.findUnique({
    where: { id: assetId },
    include: { variants: true },
  });

  if (!asset) throw new AppError('Asset not found', 404, 'ASSET_NOT_FOUND');
  if (asset.workspaceId !== workspaceId) throw new AppError('Unauthorized', 403, 'FORBIDDEN');

  const selectedVariants = variantIds.length > 0
    ? asset.variants.filter(v => variantIds.includes(v.id))
    : asset.variants;

  if (selectedVariants.length === 0) throw new AppError('No variants found', 404, 'NO_VARIANTS');

  const zipFiles: { name: string; buffer: Buffer }[] = [];

  for (const variant of selectedVariants) {
    try {
      const resp = await axios.get(variant.url, { responseType: 'arraybuffer' });
      const sourceBuffer = Buffer.from(resp.data);
      const exportedFormats = await generateExportFormats(sourceBuffer, formats, scale);

      for (const [fmt, buf] of Object.entries(exportedFormats)) {
        const scaleStr = scale > 1 ? `@${scale}x` : '';
        zipFiles.push({
          name: `${asset.originalFileName.replace(/\.[^.]+$/, '')}_${variant.type}_${fmt}${scaleStr}.jpg`,
          buffer: buf,
        });
      }
    } catch {
      // Skip variants that can't be fetched
    }
  }

  if (zipFiles.length === 0) throw new AppError('No images could be exported', 500, 'EXPORT_FAILED');

  // Add metadata CSV
  const csvHeader = 'filename,variant_type,format,width,height\n';
  const csvRows = zipFiles.map(f => {
    const format = formats.find(fmt => f.name.includes(fmt)) || 'unknown';
    const spec = FORMAT_SPECS[format as FormatKey] || { width: 0, height: 0 };
    return `${f.name},${format},${spec.width * scale},${spec.height * scale}`;
  });
  const csvBuffer = Buffer.from(csvHeader + csvRows.join('\n'));
  zipFiles.push({ name: '_metadata.csv', buffer: csvBuffer });

  return buildZipBuffer(zipFiles);
};
