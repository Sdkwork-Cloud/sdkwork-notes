export interface AiFeedbackCreateRequest {
  tenantId: string;
  organizationId: string;
  operatorId: string;
  feedbackType: 'accepted' | 'rejected' | 'edited' | 'helpful' | 'not_helpful';
  feedbackText?: string;
}
