import type { AiFeedback } from './ai-feedback';
import type { PageInfo } from './page-info';

export interface AiFeedbackPage {
  items: AiFeedback[];
  pageInfo: PageInfo;
}
