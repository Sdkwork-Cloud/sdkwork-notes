export interface CreateIndexJobRequest {
  workspaceId: string;
  jobType: string;
  targetType?: string;
  targetId?: string;
}
