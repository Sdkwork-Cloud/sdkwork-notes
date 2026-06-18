export interface AiSuggestion {
  id: string;
  workspaceId: string;
  pageId: string;
  aiJobId: string;
  suggestionType: string;
  status: 'proposed' | 'accepted' | 'applied' | 'rejected' | 'dismissed';
  sourceDriveNodeId?: string;
  sourceDriveVersionId?: string;
  sourceDriveVersionNo?: string;
  payload: Record<string, unknown>;
  createdAt: string;
}
