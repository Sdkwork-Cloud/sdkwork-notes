import type { WorkspaceBootstrap } from './workspace-bootstrap';

export interface WorkspacesBootstrapRetrieveResponse {
  code: 0;
  data: unknown & Record<string, unknown>;
  /** Server-owned request correlation id. */
  traceId: string;
}
