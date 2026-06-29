export interface AiFeedbackCreateRequest {
  feedbackType: 'accepted' | 'rejected' | 'edited' | 'helpful' | 'not_helpful';
  feedbackText?: string;
}
