export interface IndexJob {
  id: string;
  workspaceId: string;
  jobType: string;
  targetType?: string;
  targetId?: string;
  status: string;
  createdAt: string;
}
