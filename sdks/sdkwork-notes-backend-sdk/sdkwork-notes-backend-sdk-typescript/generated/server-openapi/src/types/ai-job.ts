export interface AiJob {
  id: string;
  workspaceId: string;
  jobType: string;
  targetType: string;
  targetId?: string;
  status: 'queued' | 'running' | 'succeeded' | 'failed' | 'canceled';
  sourceCount?: string;
  suggestionCount?: string;
  createdAt: string;
}
