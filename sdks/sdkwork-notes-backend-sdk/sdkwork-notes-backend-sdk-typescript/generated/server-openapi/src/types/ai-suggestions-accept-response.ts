import type { AiSuggestion } from './ai-suggestion';

export interface AiSuggestionsAcceptResponse {
  code: 0;
  data: unknown & { item: AiSuggestion; };
  /** Server-owned request correlation id. */
  traceId: string;
}
