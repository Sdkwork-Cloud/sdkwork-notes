export interface UpdatePageRequest {
  title?: string;
  favorite?: boolean;
  archiveStatus?: string;
  publishStatus?: string;
  parentPageId?: string | null;
  expectedVersion?: string;
}
