import { Request } from 'express';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import multer, { FileFilterCallback } from 'multer';
import { getPrismaClient } from '@config/database';
import { AppError } from '@middleware/errorHandler';
import config from '@config/env';
import AWS from 'aws-sdk';

const prisma = getPrismaClient();

const s3 = new AWS.S3({
  accessKeyId: config.aws.accessKeyId,
  secretAccessKey: config.aws.secretAccessKey,
  region: config.aws.region,
});

// Multer memory storage
const storage = multer.memoryStorage();

const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Only PNG, JPG, and WebP images are allowed', 400, 'INVALID_FILE_TYPE'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

interface UploadContext {
  userId: string;
  workspaceId: string;
  projectId?: string;
}

export const validateImage = async (buffer: Buffer): Promise<{ width: number; height: number; format: string }> => {
  const meta = await sharp(buffer).metadata();
  const { width = 0, height = 0, format = 'unknown' } = meta;

  if (width < 800 || height < 800) {
    throw new AppError(
      `Image too small (${width}x${height}). Minimum size is 800x800px.`,
      400,
      'IMAGE_TOO_SMALL',
    );
  }

  return { width, height, format };
};

export const uploadToS3 = async (
  buffer: Buffer,
  key: string,
  mimeType: string,
): Promise<string> => {
  if (!config.aws.accessKeyId || config.aws.accessKeyId === 'your-aws-key') {
    // Dev fallback: return a placeholder URL
    return `${config.server.baseUrl}/dev-uploads/${key}`;
  }

  await s3
    .upload({
      Bucket: config.aws.s3Bucket,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    })
    .promise();

  return `${config.aws.cdnUrl}/${key}`;
};

export const getAssetQualityScore = async (buffer: Buffer): Promise<number> => {
  try {
    const stats = await sharp(buffer).stats();
    const channels = stats.channels;
    const avgStdDev = channels.reduce((sum, ch) => sum + ch.stdev, 0) / channels.length;
    return Math.min(100, Math.max(0, Math.round((avgStdDev / 60) * 100)));
  } catch {
    return 75;
  }
};

export const uploadAsset = async (req: Request, context: UploadContext) => {
  const { userId, workspaceId, projectId } = context;

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId, workspaceId },
  });
  if (!membership) throw new AppError('Unauthorized', 403, 'FORBIDDEN');

  const file = req.file;
  if (!file) throw new AppError('No file provided', 400, 'NO_FILE');

  const { width, height } = await validateImage(file.buffer);
  const qualityScore = await getAssetQualityScore(file.buffer);

  const assetId = uuidv4();
  const ext = (file.originalname.split('.').pop() || 'jpg').toLowerCase();
  const s3Key = `workspaces/${workspaceId}/originals/${assetId}.${ext}`;
  const originalUrl = await uploadToS3(file.buffer, s3Key, file.mimetype);

  const asset = await prisma.asset.create({
    data: {
      id: assetId,
      userId,
      workspaceId,
      projectId,
      originalFileName: file.originalname,
      originalUrl,
      mimeType: file.mimetype,
      fileSize: file.size,
      width,
      height,
      status: 'uploaded',
    },
    include: { variants: true },
  });

  return { asset, qualityScore };
};

export const processAsset = async (assetId: string): Promise<void> => {
  const asset = await prisma.asset.findUnique({ where: { id: assetId } });
  if (!asset) throw new AppError('Asset not found', 404, 'ASSET_NOT_FOUND');

  await prisma.asset.update({
    where: { id: assetId },
    data: { status: 'processing' },
  });
};
