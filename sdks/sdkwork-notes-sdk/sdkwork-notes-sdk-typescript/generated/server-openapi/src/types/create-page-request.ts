export interface CreatePageRequest {
  workspaceId: string;
  title: string;
  parentPageId?: string;
  initialContent?: Record<string, unknown>;
  contentType?: string;
  contentSchemaVersion?: string;
}
