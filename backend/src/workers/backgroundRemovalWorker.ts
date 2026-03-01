import { getBackgroundRemovalQueue } from '@services/queueService';
import { processBackgroundRemoval } from '@services/backgroundRemovalService';

export const startBackgroundRemovalWorker = () => {
  const queue = getBackgroundRemovalQueue();

  queue.process(5, async (job) => {
    const { jobId, assetId, workspaceId } = job.data;
    console.log(`[BG Removal Worker] Processing job ${jobId} for asset ${assetId}`);
    const result = await processBackgroundRemoval(jobId, assetId, workspaceId);
    console.log(`[BG Removal Worker] Completed job ${jobId} → ${result.url}`);
    return result;
  });

  queue.on('failed', (job, err) => {
    console.error(`[BG Removal Worker] Job ${job.id} failed:`, err.message);
  });

  console.log('[BG Removal Worker] Started (5 concurrent workers)');
};
