import type { AiFeedback } from './ai-feedback';

export interface AiSuggestionsFeedbackCreateResponse {
  code: 0;
  data: unknown & Record<string, unknown>;
  /** Server-owned request correlation id. */
  traceId: string;
}
