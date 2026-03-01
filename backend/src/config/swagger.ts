const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'PhotoshootAI API',
    version: '1.0.0',
    description:
      'AI-powered product photography API. Background removal, environment generation, multi-format export, and workspace management.',
    contact: {
      name: 'API Support',
      email: 'support@photoshoot.app',
    },
  },
  servers: [
    { url: 'http://localhost:3001', description: 'Development' },
    { url: 'https://api.photoshoot.app', description: 'Production' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token obtained from /api/auth/login or /api/auth/signup',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              code: { type: 'string' },
            },
          },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          name: { type: 'string' },
          avatar: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Workspace: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          slug: { type: 'string' },
          plan: { type: 'string', enum: ['free', 'starter', 'pro', 'enterprise'] },
          monthlyCredits: { type: 'integer' },
          creditsUsed: { type: 'integer' },
        },
      },
      Asset: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          originalFileName: { type: 'string' },
          originalUrl: { type: 'string', format: 'uri' },
          mimeType: { type: 'string' },
          fileSize: { type: 'integer' },
          width: { type: 'integer' },
          height: { type: 'integer' },
          status: { type: 'string', enum: ['uploaded', 'processing', 'ready', 'failed'] },
          variants: { type: 'array', items: { $ref: '#/components/schemas/AssetVariant' } },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      AssetVariant: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          assetId: { type: 'string', format: 'uuid' },
          type: { type: 'string', description: 'e.g. transparent-bg, env-white-studio-front' },
          url: { type: 'string', format: 'uri' },
          width: { type: 'integer' },
          height: { type: 'integer' },
        },
      },
      GenerationJob: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          jobType: { type: 'string', enum: ['background-removal', 'environment-generation', 'export'] },
          status: { type: 'string', enum: ['pending', 'processing', 'completed', 'failed'] },
          progress: { type: 'integer', minimum: 0, maximum: 100 },
          resultUrl: { type: 'string', format: 'uri', nullable: true },
          error: { type: 'string', nullable: true },
          creditsUsed: { type: 'integer' },
          createdAt: { type: 'string', format: 'date-time' },
          completedAt: { type: 'string', format: 'date-time', nullable: true },
        },
      },
      Project: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          description: { type: 'string', nullable: true },
          workspaceId: { type: 'string', format: 'uuid' },
          isArchived: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['System'],
        summary: 'Health check',
        description: 'Returns server health status including database connectivity.',
        responses: {
          200: {
            description: 'Server is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    database: { type: 'string', example: 'connected' },
                    environment: { type: 'string', example: 'development' },
                  },
                },
              },
            },
          },
          503: { description: 'Service unavailable (database disconnected)' },
        },
      },
    },
    '/api/auth/signup': {
      post: {
        tags: ['Authentication'],
        summary: 'Create a new user account',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'name', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'user@example.com' },
                  name: { type: 'string', example: 'Jane Doe' },
                  password: { type: 'string', minLength: 8, example: 'securepass123' },
                  workspaceName: { type: 'string', example: 'My Company' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Account created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    user: { $ref: '#/components/schemas/User' },
                    workspace: { $ref: '#/components/schemas/Workspace' },
                    token: { type: 'string', description: 'JWT bearer token' },
                  },
                },
              },
            },
          },
          400: { description: 'Validation error (missing fields, weak password)' },
          409: { description: 'Email already exists' },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Login with email and password',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    user: { $ref: '#/components/schemas/User' },
                    token: { type: 'string' },
                  },
                },
              },
            },
          },
          401: { description: 'Invalid credentials' },
        },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['Authentication'],
        summary: 'Get current authenticated user',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Current user',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    user: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/api/assets': {
      get: {
        tags: ['Assets'],
        summary: 'List workspace assets',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'projectId', in: 'query', schema: { type: 'string' }, description: 'Filter by project' },
          { name: 'status', in: 'query', schema: { type: 'string' }, description: 'Filter by status' },
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search by filename' },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } },
        ],
        responses: {
          200: {
            description: 'List of assets',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    assets: { type: 'array', items: { $ref: '#/components/schemas/Asset' } },
                    pagination: {
                      type: 'object',
                      properties: {
                        total: { type: 'integer' },
                        limit: { type: 'integer' },
                        offset: { type: 'integer' },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/api/assets/upload': {
      post: {
        tags: ['Assets'],
        summary: 'Upload a product image',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['file'],
                properties: {
                  file: { type: 'string', format: 'binary', description: 'PNG, JPG or WebP, min 800x800px, max 50MB' },
                  projectId: { type: 'string', format: 'uuid', description: 'Optional project assignment' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Asset uploaded',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    asset: { $ref: '#/components/schemas/Asset' },
                    qualityScore: { type: 'integer', description: 'Image quality score 0–100' },
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
          400: { description: 'Invalid file type, file too small, or no file provided' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/api/assets/{assetId}': {
      get: {
        tags: ['Assets'],
        summary: 'Get asset details',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'assetId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Asset details with variants and recent jobs' },
          404: { description: 'Asset not found' },
        },
      },
      patch: {
        tags: ['Assets'],
        summary: 'Update asset metadata',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'assetId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  originalFileName: { type: 'string' },
                  projectId: { type: 'string', nullable: true },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Asset updated' },
          404: { description: 'Asset not found' },
        },
      },
      delete: {
        tags: ['Assets'],
        summary: 'Delete an asset',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'assetId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Asset deleted' },
          404: { description: 'Asset not found' },
        },
      },
    },
    '/api/jobs': {
      get: {
        tags: ['Jobs'],
        summary: 'List generation jobs',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['pending', 'processing', 'completed', 'failed'] } },
          { name: 'jobType', in: 'query', schema: { type: 'string' } },
          { name: 'assetId', in: 'query', schema: { type: 'string' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } },
        ],
        responses: {
          200: { description: 'List of jobs' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/api/jobs/meta/options': {
      get: {
        tags: ['Jobs'],
        summary: 'Get available environments, angles, and export formats',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Available options',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    environments: {
                      type: 'array',
                      items: { type: 'object', properties: { key: { type: 'string' }, name: { type: 'string' } } },
                    },
                    angles: {
                      type: 'array',
                      items: { type: 'object', properties: { key: { type: 'string' }, name: { type: 'string' } } },
                    },
                    formats: { type: 'array', items: { type: 'object' } },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/jobs/background-removal': {
      post: {
        tags: ['Jobs'],
        summary: 'Create a background removal job',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['assetId'],
                properties: {
                  assetId: { type: 'string', format: 'uuid' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Job created and queued (costs 50 credits)', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, job: { $ref: '#/components/schemas/GenerationJob' } } } } } },
          400: { description: 'Missing assetId' },
          404: { description: 'Asset not found' },
        },
      },
    },
    '/api/jobs/environment-generation': {
      post: {
        tags: ['Jobs'],
        summary: 'Create environment generation job(s)',
        description: 'Creates one job per camera angle requested. Each job costs 100 credits.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['assetId', 'environment'],
                properties: {
                  assetId: { type: 'string', format: 'uuid' },
                  environment: {
                    type: 'string',
                    enum: ['white-studio', 'luxury-marble', 'outdoor-nature', 'minimal-scandinavian', 'dark-moody'],
                  },
                  angles: {
                    type: 'array',
                    items: { type: 'string', enum: ['front', 'forty-five', 'top-down'] },
                    default: ['front'],
                  },
                  lightingIntensity: { type: 'integer', minimum: 0, maximum: 100, default: 50 },
                  colorTone: { type: 'integer', minimum: -100, maximum: 100, default: 0 },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Jobs created' },
          400: { description: 'Invalid environment or angles' },
          404: { description: 'Asset not found' },
        },
      },
    },
    '/api/jobs/export': {
      post: {
        tags: ['Jobs'],
        summary: 'Export asset variants as ZIP',
        description: 'Generates resized versions for each requested format and returns a ZIP file.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['assetId'],
                properties: {
                  assetId: { type: 'string', format: 'uuid' },
                  variantIds: { type: 'array', items: { type: 'string' }, description: 'Specific variant IDs (empty = all variants)' },
                  formats: {
                    type: 'array',
                    items: { type: 'string', enum: ['square', 'portrait', 'stories'] },
                    default: ['square', 'portrait', 'stories'],
                  },
                  scale: { type: 'integer', enum: [1, 2, 4], default: 1 },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'ZIP file download',
            content: { 'application/zip': { schema: { type: 'string', format: 'binary' } } },
          },
          400: { description: 'Invalid formats or missing assetId' },
        },
      },
    },
    '/api/jobs/{jobId}': {
      get: {
        tags: ['Jobs'],
        summary: 'Get job details and status',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'jobId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Job details' },
          404: { description: 'Job not found' },
        },
      },
    },
    '/api/jobs/{jobId}/cancel': {
      post: {
        tags: ['Jobs'],
        summary: 'Cancel a pending job',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'jobId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Job cancelled' },
          400: { description: 'Job already completed or failed' },
          404: { description: 'Job not found' },
        },
      },
    },
    '/api/workspaces/current': {
      get: {
        tags: ['Workspaces'],
        summary: 'Get current workspace',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Workspace with members, projects, and asset count' },
          401: { description: 'Unauthorized' },
        },
      },
      put: {
        tags: ['Workspaces'],
        summary: 'Update workspace settings (admin only)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Workspace updated' },
          403: { description: 'Not an admin' },
        },
      },
    },
    '/api/workspaces/current/analytics': {
      get: {
        tags: ['Workspaces'],
        summary: 'Get workspace usage analytics',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Analytics data',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    analytics: {
                      type: 'object',
                      properties: {
                        assets: { type: 'object', properties: { total: { type: 'integer' } } },
                        jobs: {
                          type: 'object',
                          properties: {
                            total: { type: 'integer' },
                            completed: { type: 'integer' },
                            failed: { type: 'integer' },
                            successRate: { type: 'integer' },
                          },
                        },
                        credits: {
                          type: 'object',
                          properties: {
                            monthly: { type: 'integer' },
                            used: { type: 'integer' },
                            remaining: { type: 'integer' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/workspaces/current/members': {
      get: {
        tags: ['Workspaces'],
        summary: 'List workspace members',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'List of members with roles' } },
      },
    },
    '/api/workspaces/current/members/invite': {
      post: {
        tags: ['Workspaces'],
        summary: 'Invite a user to workspace (admin only)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  role: { type: 'string', enum: ['admin', 'editor', 'viewer'], default: 'editor' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Member invited' },
          404: { description: 'User not found' },
          409: { description: 'Already a member' },
        },
      },
    },
    '/api/billing/plans': {
      get: {
        tags: ['Billing'],
        summary: 'Get available subscription plans',
        responses: {
          200: {
            description: 'List of plans with pricing and features',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    plans: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          key: { type: 'string' },
                          name: { type: 'string' },
                          price: { type: 'number' },
                          monthlyCredits: { type: 'integer' },
                          features: { type: 'array', items: { type: 'string' } },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/billing/checkout': {
      post: {
        tags: ['Billing'],
        summary: 'Create a Stripe checkout session',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['plan', 'successUrl', 'cancelUrl'],
                properties: {
                  plan: { type: 'string', enum: ['starter', 'pro', 'enterprise'] },
                  successUrl: { type: 'string', format: 'uri' },
                  cancelUrl: { type: 'string', format: 'uri' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Stripe checkout URL', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, url: { type: 'string', format: 'uri' } } } } } },
          400: { description: 'Invalid plan or free plan' },
        },
      },
    },
    '/api/billing/portal': {
      post: {
        tags: ['Billing'],
        summary: 'Create a Stripe billing portal session',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['returnUrl'],
                properties: { returnUrl: { type: 'string', format: 'uri' } },
              },
            },
          },
        },
        responses: {
          200: { description: 'Billing portal URL' },
          400: { description: 'No Stripe customer found' },
        },
      },
    },
    '/api/projects': {
      get: {
        tags: ['Projects'],
        summary: 'List workspace projects',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'List of projects' } },
      },
      post: {
        tags: ['Projects'],
        summary: 'Create a new project',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Project created' } },
      },
    },
  },
  tags: [
    { name: 'System', description: 'Health and status endpoints' },
    { name: 'Authentication', description: 'User signup, login, and session management' },
    { name: 'Assets', description: 'Product image upload and management' },
    { name: 'Jobs', description: 'AI generation jobs — background removal, environment generation, export' },
    { name: 'Workspaces', description: 'Workspace settings, members, and analytics' },
    { name: 'Billing', description: 'Stripe subscription management' },
    { name: 'Projects', description: 'Project organization for assets' },
  ],
};

export default swaggerDocument;
