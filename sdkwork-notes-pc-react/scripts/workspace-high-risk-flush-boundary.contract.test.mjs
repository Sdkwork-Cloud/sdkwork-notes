import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const workspaceRoot = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(workspaceRoot, relativePath), 'utf8');
}

test('workspace store flushes dirty drafts and waits for in-flight saves before high-risk transitions that can discard or replace the active note', () => {
  const storeSource = read('packages/sdkwork-notes-notes/src/store/useNotesWorkspaceStore.ts');

  assert.match(storeSource, /const persistUnsavedActiveNoteIfNeeded = async \(\) => \{/);
  assert.match(
    storeSource,
    /if \(!activeNote\) \{\s*return true;\s*\}/s,
  );
  assert.match(
    storeSource,
    /if \(saveState === 'saving' \|\| saveState === 'retrying'\) \{\s*return activeNoteSaveQueue\.waitForActiveRequest\(\);\s*\}/s,
  );
  assert.match(
    storeSource,
    /if \(saveState !== 'dirty' && saveState !== 'error'\) \{\s*return true;\s*\}/s,
  );

  assert.match(
    storeSource,
    /if \(!skipPersist && currentActiveId && currentActiveId !== nextNoteId\) \{\s*const persisted = await persistUnsavedActiveNoteIfNeeded\(\);\s*if \(!persisted\) \{\s*return;\s*\}\s*\}/s,
  );
  assert.match(
    storeSource,
    /async createNote\(input = \{\}\) \{\s*const persisted = await persistUnsavedActiveNoteIfNeeded\(\);\s*if \(!persisted\) \{\s*return '';\s*\}/s,
  );
  assert.match(
    storeSource,
    /async deleteFolder\(id\) \{[\s\S]*?const persisted = await persistUnsavedActiveNoteIfNeeded\(\);\s*if \(!persisted\) \{\s*return false;\s*\}[\s\S]*?await workspaceService\.deleteFolder\(folderId\)/s,
  );
  assert.match(
    storeSource,
    /async moveNoteToTrash\(id\) \{[\s\S]*?if \(get\(\)\.activeNoteId === noteId\) \{\s*const persisted = await persistUnsavedActiveNoteIfNeeded\(\);\s*if \(!persisted\) \{\s*return false;\s*\}\s*\}/s,
  );
  assert.match(
    storeSource,
    /async moveNote\(id, newParentId\) \{[\s\S]*?if \(get\(\)\.activeNoteId === noteId\) \{\s*const persisted = await persistUnsavedActiveNoteIfNeeded\(\);\s*if \(!persisted\) \{\s*return false;\s*\}\s*\}/s,
  );
});

test('trashed notes stay read-only in the editor so trash-only destructive actions do not bypass editable dirty drafts', () => {
  const editorSource = read('packages/sdkwork-notes-notes/src/components/NoteEditorPane.tsx');

  assert.match(editorSource, /editable: Boolean\(note && !note\.deletedAt\),/);
  assert.match(editorSource, /if \(!note \|\| note\.deletedAt\) \{\s*return;\s*\}/s);
  assert.match(editorSource, /if \(note\.deletedAt\) \{/);
});
