import Bull from 'bull';
import config from '@config/env';

let backgroundRemovalQueue: Bull.Queue | null = null;
let environmentGenerationQueue: Bull.Queue | null = null;
let exportQueue: Bull.Queue | null = null;

const getQueueOptions = (): Bull.QueueOptions => ({
  redis: config.redis.url,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

export const getBackgroundRemovalQueue = (): Bull.Queue => {
  if (!backgroundRemovalQueue) {
    backgroundRemovalQueue = new Bull('background-removal', getQueueOptions());
  }
  return backgroundRemovalQueue;
};

export const getEnvironmentGenerationQueue = (): Bull.Queue => {
  if (!environmentGenerationQueue) {
    environmentGenerationQueue = new Bull('environment-generation', getQueueOptions());
  }
  return environmentGenerationQueue;
};

export const getExportQueue = (): Bull.Queue => {
  if (!exportQueue) {
    exportQueue = new Bull('export', getQueueOptions());
  }
  return exportQueue;
};

export const closeQueues = async (): Promise<void> => {
  await Promise.all([
    backgroundRemovalQueue?.close(),
    environmentGenerationQueue?.close(),
    exportQueue?.close(),
  ]);
};
