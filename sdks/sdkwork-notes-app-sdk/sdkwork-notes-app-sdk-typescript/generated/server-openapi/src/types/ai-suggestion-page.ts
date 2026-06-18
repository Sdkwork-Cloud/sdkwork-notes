import type { AiSuggestion } from './ai-suggestion';
import type { PageInfo } from './page-info';

export interface AiSuggestionPage {
  items: AiSuggestion[];
  pageInfo: PageInfo;
}
