import type { PageInfo } from './page-info';
import type { SearchResult } from './search-result';

export interface SearchResultPage {
  items: SearchResult[];
  pageInfo: PageInfo;
}
