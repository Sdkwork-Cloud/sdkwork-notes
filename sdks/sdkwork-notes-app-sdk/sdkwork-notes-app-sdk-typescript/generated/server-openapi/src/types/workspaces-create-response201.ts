import type { Workspace } from './workspace';

export interface WorkspacesCreateResponse201 {
  code: 0;
  data: unknown & { item: Workspace; };
  /** Server-owned request correlation id. */
  traceId: string;
}
