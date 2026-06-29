import type { AiSuggestion } from './ai-suggestion';
import type { PageInfo } from './page-info';

export interface PagesAiSuggestionsListResponse {
  code: 0;
  data: unknown & Record<string, unknown>;
  /** Server-owned request correlation id. */
  traceId: string;
}
