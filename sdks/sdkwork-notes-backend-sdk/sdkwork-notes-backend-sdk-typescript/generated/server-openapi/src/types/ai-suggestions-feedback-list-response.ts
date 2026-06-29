import type { AiFeedback } from './ai-feedback';
import type { PageInfo } from './page-info';

export interface AiSuggestionsFeedbackListResponse {
  code: 0;
  data: unknown & Record<string, unknown>;
  /** Server-owned request correlation id. */
  traceId: string;
}
