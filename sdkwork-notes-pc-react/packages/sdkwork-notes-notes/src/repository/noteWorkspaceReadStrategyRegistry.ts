import type { NoteWorkspaceReadStrategyKey } from '../types/notesWorkspace';
import type { NoteWorkspaceReadStrategy } from './noteWorkspaceReadStrategy';

export interface NoteWorkspaceReadStrategyRegistryOptions {
  strategies: readonly NoteWorkspaceReadStrategy[];
  defaultKey?: NoteWorkspaceReadStrategyKey;
}

export interface NoteWorkspaceReadStrategyRegistry {
  readonly defaultKey: NoteWorkspaceReadStrategyKey;
  listKeys(): NoteWorkspaceReadStrategyKey[];
  resolve(requestedKey?: NoteWorkspaceReadStrategyKey): NoteWorkspaceReadStrategy;
}

function buildStrategyMap(
  strategies: readonly NoteWorkspaceReadStrategy[],
) {
  const strategiesByKey = new Map<NoteWorkspaceReadStrategyKey, NoteWorkspaceReadStrategy>();

  strategies.forEach((strategy) => {
    if (strategiesByKey.has(strategy.key)) {
      throw new Error(`Duplicate workspace read strategy key: ${strategy.key}`);
    }
    strategiesByKey.set(strategy.key, strategy);
  });

  return strategiesByKey;
}

export function createNoteWorkspaceReadStrategyRegistry(
  options: NoteWorkspaceReadStrategyRegistryOptions,
): NoteWorkspaceReadStrategyRegistry {
  const strategiesByKey = buildStrategyMap(options.strategies);

  if (strategiesByKey.size === 0) {
    throw new Error('At least one workspace read strategy is required');
  }

  const firstKey = strategiesByKey.keys().next().value as NoteWorkspaceReadStrategyKey;
  const defaultKey = options.defaultKey ?? firstKey;

  if (!strategiesByKey.has(defaultKey)) {
    throw new Error(`Unknown default workspace read strategy key: ${defaultKey}`);
  }

  return {
    defaultKey,
    listKeys() {
      return [...strategiesByKey.keys()];
    },
    resolve(requestedKey) {
      if (requestedKey && strategiesByKey.has(requestedKey)) {
        return strategiesByKey.get(requestedKey)!;
      }
      return strategiesByKey.get(defaultKey)!;
    },
  };
}
