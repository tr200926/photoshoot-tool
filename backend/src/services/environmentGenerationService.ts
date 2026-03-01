import axios from 'axios';
import Replicate from 'replicate';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { getPrismaClient } from '@config/database';
import { uploadToS3 } from '@modules/assets/uploadService';
import config from '@config/env';

const prisma = getPrismaClient();

export const ENVIRONMENTS = {
  'white-studio': {
    name: 'White Studio',
    prompt: 'product on clean white studio background, professional product photography, soft diffused lighting, minimal shadows, pure white background, commercial photography, high detail',
    negativePrompt: 'dark, colorful background, busy, cluttered, shadows, reflections',
  },
  'luxury-marble': {
    name: 'Luxury Marble',
    prompt: 'product displayed on premium white marble surface with natural veining, luxury aesthetic, soft window light, subtle reflections, upscale product photography, editorial style',
    negativePrompt: 'cheap, plastic, dark background, low quality',
  },
  'outdoor-nature': {
    name: 'Outdoor Nature',
    prompt: 'product in natural outdoor setting, fresh green foliage, soft natural sunlight, lifestyle photography, organic textures, warm natural light, botanical elements',
    negativePrompt: 'indoor, studio, artificial light, dark, urban',
  },
  'minimal-scandinavian': {
    name: 'Minimal Scandinavian',
    prompt: 'product on minimal Scandinavian interior surface, light wood texture, neutral tones, modern minimalist aesthetic, clean lines, Hygge style, soft natural light',
    negativePrompt: 'busy, colorful, maximalist, dark, cluttered',
  },
  'dark-moody': {
    name: 'Dark Moody',
    prompt: 'product in dramatic dark moody setting, deep shadows, rich textures, cinematic lighting, luxury noir aesthetic, dark background with strategic highlights, sophisticated atmosphere',
    negativePrompt: 'bright, white background, casual, simple, low contrast',
  },
} as const;

export type EnvironmentKey = keyof typeof ENVIRONMENTS;

export const CAMERA_ANGLES = {
  front: {
    name: 'Front View',
    suffix: 'photographed straight-on at eye level, front view, 0 degrees',
  },
  'forty-five': {
    name: '45° Three-Quarter',
    suffix: 'photographed from 45-degree three-quarter angle, showing depth and dimension',
  },
  'top-down': {
    name: 'Top Down',
    suffix: 'photographed from directly above, overhead flat-lay style, top-down view',
  },
} as const;

export type AngleKey = keyof typeof CAMERA_ANGLES;

const replicate = new Replicate({ auth: config.ai.replicate.token });

const generateWithReplicate = async (prompt: string, negativePrompt: string): Promise<Buffer> => {
  const output = await replicate.run(
    'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
    {
      input: {
        prompt,
        negative_prompt: negativePrompt,
        width: 1024,
        height: 1024,
        num_inference_steps: 30,
        guidance_scale: 7.5,
      },
    },
  );

  const imageUrl: string = Array.isArray(output) ? String(output[0]) : String(output);
  const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
  return Buffer.from(response.data);
};

const generateWithOpenAI = async (prompt: string): Promise<Buffer> => {
  const response = await axios.post(
    'https://api.openai.com/v1/images/generations',
    {
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
    },
    {
      headers: {
        Authorization: `Bearer ${config.ai.openai.apiKey}`,
        'Content-Type': 'application/json',
      },
    },
  );
  const imageUrl = response.data.data[0].url;
  const imgResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
  return Buffer.from(imgResponse.data);
};

const createPlaceholderEnvironment = async (
  width: number,
  height: number,
  envKey: EnvironmentKey,
): Promise<Buffer> => {
  const colors: Record<EnvironmentKey, { r: number; g: number; b: number }> = {
    'white-studio': { r: 245, g: 245, b: 245 },
    'luxury-marble': { r: 230, g: 220, b: 210 },
    'outdoor-nature': { r: 150, g: 200, b: 130 },
    'minimal-scandinavian': { r: 220, g: 210, b: 195 },
    'dark-moody': { r: 30, g: 25, b: 35 },
  };
  const color = colors[envKey];
  return sharp({
    create: { width, height, channels: 3, background: color },
  })
    .jpeg({ quality: 90 })
    .toBuffer();
};

export const compositeProductOnEnvironment = async (
  productBuffer: Buffer,
  environmentBuffer: Buffer,
  outputWidth: number,
  outputHeight: number,
): Promise<Buffer> => {
  // Resize environment to output dimensions
  const envResized = await sharp(environmentBuffer)
    .resize(outputWidth, outputHeight, { fit: 'cover' })
    .toBuffer();

  // Get product dimensions
  const productMeta = await sharp(productBuffer).metadata();
  const prodW = productMeta.width || 512;
  const prodH = productMeta.height || 512;

  // Scale product to 65% of output dimension (preserving aspect ratio)
  const maxDim = Math.floor(Math.min(outputWidth, outputHeight) * 0.65);
  const scale = Math.min(maxDim / prodW, maxDim / prodH);
  const scaledW = Math.round(prodW * scale);
  const scaledH = Math.round(prodH * scale);

  const productResized = await sharp(productBuffer)
    .resize(scaledW, scaledH, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  // Center the product
  const left = Math.round((outputWidth - scaledW) / 2);
  const top = Math.round((outputHeight - scaledH) / 2);

  const composited = await sharp(envResized)
    .composite([{ input: productResized, left, top, blend: 'over' }])
    .jpeg({ quality: 95 })
    .toBuffer();

  return composited;
};

export const generateEnvironmentVariant = async (
  jobId: string,
  assetId: string,
  workspaceId: string,
  environmentKey: EnvironmentKey,
  angleKey: AngleKey,
  lightingIntensity: number = 50,
  colorTone: number = 0,
): Promise<{ url: string; width: number; height: number }> => {
  const env = ENVIRONMENTS[environmentKey];
  const angle = CAMERA_ANGLES[angleKey];

  const asset = await prisma.asset.findUnique({
    where: { id: assetId },
    include: { variants: true },
  });
  if (!asset) throw new Error('Asset not found');

  await prisma.generationJob.update({
    where: { id: jobId },
    data: { status: 'processing', startedAt: new Date(), progress: 10 },
  });

  // Find transparent background variant if available
  const transparentVariant = asset.variants.find(v => v.type === 'transparent-bg');

  const outputSize = 1024;
  let environmentBuffer: Buffer;
  let productBuffer: Buffer | null = null;

  try {
    // Build prompt combining environment + angle + lighting
    const lightDesc = lightingIntensity > 70 ? 'bright dramatic lighting' : lightingIntensity < 30 ? 'soft subtle lighting' : 'balanced natural lighting';
    const toneDesc = colorTone > 20 ? 'warm golden tones' : colorTone < -20 ? 'cool blue tones' : 'neutral tones';
    const fullPrompt = `${env.prompt}, ${angle.suffix}, ${lightDesc}, ${toneDesc}, high quality, photorealistic, professional product photography`;

    if (config.ai.replicate.token) {
      environmentBuffer = await generateWithReplicate(fullPrompt, env.negativePrompt);
    } else if (config.ai.openai.apiKey) {
      environmentBuffer = await generateWithOpenAI(fullPrompt);
    } else {
      environmentBuffer = await createPlaceholderEnvironment(outputSize, outputSize, environmentKey);
    }

    await prisma.generationJob.update({ where: { id: jobId }, data: { progress: 60 } });

    // Fetch product buffer (transparent bg version if available)
    if (transparentVariant?.url) {
      const resp = await axios.get(transparentVariant.url, { responseType: 'arraybuffer' }).catch(() => null);
      if (resp) productBuffer = Buffer.from(resp.data);
    }

    if (!productBuffer && asset.originalUrl) {
      const resp = await axios.get(asset.originalUrl, { responseType: 'arraybuffer' }).catch(() => null);
      if (resp) productBuffer = Buffer.from(resp.data);
    }

    // Composite product onto environment if we have both
    let finalBuffer: Buffer;
    if (productBuffer) {
      finalBuffer = await compositeProductOnEnvironment(productBuffer, environmentBuffer, outputSize, outputSize);
    } else {
      finalBuffer = await sharp(environmentBuffer).resize(outputSize, outputSize).jpeg({ quality: 95 }).toBuffer();
    }

    await prisma.generationJob.update({ where: { id: jobId }, data: { progress: 85 } });

    // Upload result
    const resultId = uuidv4();
    const s3Key = `workspaces/${workspaceId}/generated/${assetId}/${environmentKey}-${angleKey}-${resultId}.jpg`;
    const resultUrl = await uploadToS3(finalBuffer, s3Key, 'image/jpeg');

    // Save as asset variant
    await prisma.assetVariant.create({
      data: {
        id: resultId,
        assetId,
        type: `env-${environmentKey}-${angleKey}`,
        url: resultUrl,
        width: outputSize,
        height: outputSize,
      },
    });

    await prisma.generationJob.update({
      where: { id: jobId },
      data: { status: 'completed', progress: 100, resultUrl, completedAt: new Date() },
    });

    return { url: resultUrl, width: outputSize, height: outputSize };
  } catch (err) {
    await prisma.generationJob.update({
      where: { id: jobId },
      data: { status: 'failed', error: (err as Error).message },
    });
    throw err;
  }
};
