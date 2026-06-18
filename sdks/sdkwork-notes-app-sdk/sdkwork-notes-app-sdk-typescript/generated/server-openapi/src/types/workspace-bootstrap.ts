import type { ObjectTypeSummary } from './object-type-summary';
import type { PageSummary } from './page-summary';
import type { Workspace } from './workspace';

export interface WorkspaceBootstrap {
  workspace: Workspace;
  rootPages: PageSummary[];
  objectTypes?: ObjectTypeSummary[];
  changeToken?: string;
}
