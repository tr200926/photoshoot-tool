import { PrismaClient } from '@prisma/client';
import config from './env';

let prismaInstance: PrismaClient | null = null;

export const getPrismaClient = (): PrismaClient => {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient({
      datasources: {
        db: {
          url: config.database.url,
        },
      },
      log: config.server.nodeEnv === 'development' 
        ? ['query', 'error', 'warn'] 
        : ['error'],
    });
  }
  return prismaInstance;
};

export const disconnectDatabase = async (): Promise<void> => {
  if (prismaInstance) {
    await prismaInstance.$disconnect();
    prismaInstance = null;
  }
};

export default getPrismaClient;
