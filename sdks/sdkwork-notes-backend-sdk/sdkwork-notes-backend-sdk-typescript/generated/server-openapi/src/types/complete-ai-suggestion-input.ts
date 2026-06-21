export interface CompleteAiSuggestionInput {
  pageId?: string;
  suggestionType: 'summary' | 'rewrite' | 'tag' | 'property_update' | 'link_create' | 'task_create';
  payload: Record<string, unknown>;
}
