export interface CreateAiJobRequest {
  tenantId: string;
  organizationId: string;
  operatorId: string;
  workspaceId: string;
  jobType: 'summarize' | 'rewrite' | 'extract_tasks' | 'answer' | 'organize' | 'generate';
  targetType: 'page' | 'collection' | 'workspace' | 'selection';
  targetId?: string;
  prompt?: string;
  contextPolicy?: Record<string, unknown>;
}
