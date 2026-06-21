export interface PageContent {
  pageId: string;
  driveNodeId: string;
  driveVersionId: string;
  driveVersionNo: string;
  contentType: string;
  contentSchemaVersion: string;
  content: Record<string, unknown>;
}
