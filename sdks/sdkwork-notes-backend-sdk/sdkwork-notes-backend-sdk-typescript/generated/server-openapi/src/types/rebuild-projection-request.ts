export interface RebuildProjectionRequest {
  projectionType: 'search' | 'outline' | 'semantic' | 'insight' | 'all';
  pageId?: string;
  force?: boolean;
}
