import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

interface Config {
  database: {
    url: string;
  };
  server: {
    port: number;
    nodeEnv: string;
    baseUrl: string;
    secret: string;
  };
  jwt: {
    secret: string;
    expiry: string;
  };
  redis: {
    url: string;
  };
  aws: {
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    s3Bucket: string;
    cdnUrl: string;
  };
  ai: {
    openai: {
      apiKey: string;
    };
    replicate: {
      token: string;
    };
    stability: {
      apiKey: string;
    };
    bria: {
      apiKey: string;
    };
  };
  email: {
    sendgridApiKey: string;
    fromEmail: string;
  };
  sentry: {
    dsn: string;
  };
  stripe: {
    secretKey: string;
    publishableKey: string;
    webhookSecret: string;
  };
  features: {
    whiteLabel: boolean;
    batchProcessing: boolean;
    aiModels: boolean;
    performancePrediction: boolean;
  };
}

const config: Config = {
  database: {
    url: process.env.DATABASE_URL || 'postgresql://photoshoot:photoshoot@localhost:5432/photoshoot_dev',
  },
  server: {
    port: parseInt(process.env.PORT || '3001'),
    nodeEnv: process.env.NODE_ENV || 'development',
    baseUrl: process.env.API_BASE_URL || 'http://localhost:3001',
    secret: process.env.API_SECRET || 'change-me-in-production',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'change-me-in-production',
    expiry: process.env.JWT_EXPIRY || '7d',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    s3Bucket: process.env.S3_BUCKET || 'photoshoot-dev',
    cdnUrl: process.env.S3_CDN_URL || 'https://cdn.photoshoot.local',
  },
  ai: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY || '',
    },
    replicate: {
      token: process.env.REPLICATE_API_TOKEN || '',
    },
    stability: {
      apiKey: process.env.STABILITY_API_KEY || '',
    },
    bria: {
      apiKey: process.env.BRIA_API_KEY || '',
    },
  },
  email: {
    sendgridApiKey: process.env.SENDGRID_API_KEY || '',
    fromEmail: process.env.SENDGRID_FROM_EMAIL || 'noreply@photoshoot.app',
  },
  sentry: {
    dsn: process.env.SENTRY_DSN || '',
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  },
  features: {
    whiteLabel: process.env.FEATURE_WHITE_LABEL === 'true',
    batchProcessing: process.env.FEATURE_BATCH_PROCESSING === 'true',
    aiModels: process.env.FEATURE_AI_MODELS === 'true',
    performancePrediction: process.env.FEATURE_PERFORMANCE_PREDICTION === 'true',
  },
};

export default config;
