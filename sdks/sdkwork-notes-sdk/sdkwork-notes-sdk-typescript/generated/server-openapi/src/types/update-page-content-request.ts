export interface UpdatePageContentRequest {
  content: Record<string, unknown>;
  contentType?: string;
  contentSchemaVersion?: string;
  changeSummary?: string;
  expectedDriveVersionId?: string;
}
