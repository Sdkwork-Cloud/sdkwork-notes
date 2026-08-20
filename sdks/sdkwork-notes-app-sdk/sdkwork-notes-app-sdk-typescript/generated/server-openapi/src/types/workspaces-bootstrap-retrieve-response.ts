import type { WorkspaceBootstrap } from './workspace-bootstrap';

export interface WorkspacesBootstrapRetrieveResponse {
  code: 0;
  data: unknown & { item: WorkspaceBootstrap; };
  /** Server-owned request correlation id. */
  traceId: string;
}
