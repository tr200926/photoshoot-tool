export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  plan: string;
  monthlyCredits: number;
  creditsUsed: number;
  aiModelsEnabled: boolean;
  custombranding: boolean;
  whiteLabel: boolean;
}

export interface Asset {
  id: string;
  originalFileName: string;
  originalUrl: string;
  mimeType: string;
  fileSize: number;
  width?: number;
  height?: number;
  status: string;
  projectId?: string;
  variants: AssetVariant[];
  createdAt: string;
  updatedAt: string;
}

export interface AssetVariant {
  id: string;
  assetId: string;
  type: string;
  url: string;
  width?: number;
  height?: number;
}

export interface GenerationJob {
  id: string;
  jobType: string;
  status: string;
  progress: number;
  assetId?: string;
  resultUrl?: string;
  error?: string;
  parameters?: Record<string, unknown>;
  creditsUsed: number;
  estimatedCost: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  workspaceId: string;
  isArchived: boolean;
  thumbnail?: string;
  createdAt: string;
  updatedAt: string;
}
