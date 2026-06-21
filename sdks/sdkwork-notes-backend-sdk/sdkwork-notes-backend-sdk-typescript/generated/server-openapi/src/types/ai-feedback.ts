export interface AiFeedback {
  id: string;
  workspaceId: string;
  jobId: string;
  suggestionId?: string;
  feedbackType: 'accepted' | 'rejected' | 'edited' | 'helpful' | 'not_helpful';
  feedbackText?: string;
  createdBy: string;
  createdAt: string;
}
