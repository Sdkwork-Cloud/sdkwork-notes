import type { AiFeedback } from './ai-feedback';
import type { PageInfo } from './page-info';

export interface AiSuggestionsFeedbackListResponse {
  code: 0;
  data: unknown & { items: AiFeedback[]; pageInfo: PageInfo; };
  /** Server-owned request correlation id. */
  traceId: string;
}
