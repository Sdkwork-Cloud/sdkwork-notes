export interface PageContent {
  pageId: string;
  driveNodeId: string;
  driveVersionId: string;
  driveVersionNo: string;
  contentType: string;
  content: Record<string, unknown>;
  contentSchemaVersion: string;
}
