import type { AiFeedback } from './ai-feedback';

export interface AiSuggestionsFeedbackCreateResponse201 {
  code: 0;
  data: unknown & { item: AiFeedback; };
  /** Server-owned request correlation id. */
  traceId: string;
}
