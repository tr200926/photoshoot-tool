import { getEnvironmentGenerationQueue } from '@services/queueService';
import { generateEnvironmentVariant, EnvironmentKey, AngleKey } from '@services/environmentGenerationService';

export const startEnvironmentGenerationWorker = () => {
  const queue = getEnvironmentGenerationQueue();

  queue.process(3, async (job) => {
    const { jobId, assetId, workspaceId, environment, angle, lightingIntensity, colorTone } = job.data;
    console.log(`[Env Gen Worker] Processing job ${jobId} — ${environment}/${angle}`);

    const result = await generateEnvironmentVariant(
      jobId,
      assetId,
      workspaceId,
      environment as EnvironmentKey,
      angle as AngleKey,
      lightingIntensity,
      colorTone,
    );

    console.log(`[Env Gen Worker] Completed job ${jobId} → ${result.url}`);
    return result;
  });

  queue.on('failed', (job, err) => {
    console.error(`[Env Gen Worker] Job ${job.id} failed:`, err.message);
  });

  console.log('[Env Gen Worker] Started (3 concurrent workers)');
};
