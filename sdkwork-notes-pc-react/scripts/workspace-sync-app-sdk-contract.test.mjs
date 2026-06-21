import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const workspaceRoot = process.cwd();

function readFromWorkspace(...segments) {
  return fs.readFileSync(path.resolve(workspaceRoot, ...segments), 'utf8');
}

test('notes remote app capability is declared through the local typed product app client port', () => {
  const portSource = readFromWorkspace(
    'packages',
    'sdkwork-notes-pc-core',
    'src',
    'sdk',
    'appSdkPort.ts',
  );
  const sdkSource = readFromWorkspace(
    'packages',
    'sdkwork-notes-pc-core',
    'src',
    'sdk',
    'useAppSdkClient.ts',
  );

  assert.match(portSource, /export interface NotesRemoteAppClient/u);
  assert.match(portSource, /export interface NotesAppNoteClient/u);
  assert.match(portSource, /export interface NotesAppUserClient/u);
  assert.match(portSource, /export interface NotesAppFilesystemClient/u);
  assert.match(sdkSource, /export function configureAppSdkClientFactory/u);
  assert.match(sdkSource, /Inject a generated product app SDK client/u);

  [
    'listNotes',
    'getNoteDetail',
    'getNoteContent',
    'createNote',
    'updateNote',
    'updateNoteContent',
    'move',
    'archive',
    'restore',
    'deleteNote',
    'permanentlyDelete',
    'clearTrash',
    'listFolders',
    'createFolder',
    'updateFolder',
    'deleteFolder',
    'moveNode',
    'getUserProfile',
    'updateUserProfile',
    'getUserSettings',
    'updateUserSettings',
  ].forEach((methodName) => {
    assert.match(
      portSource,
      new RegExp(`\\b${methodName}\\(`, 'u'),
      `Expected typed Notes app client port to declare ${methodName}.`,
    );
  });
});

test('notes app sdk runtime no longer imports or aliases the retired generic package', () => {
  const workspaceFiles = [
    readFromWorkspace('package.json'),
    readFromWorkspace('pnpm-workspace.yaml'),
    readFromWorkspace('tsconfig.base.json'),
    readFromWorkspace('vite.config.ts'),
    readFromWorkspace('packages', 'sdkwork-notes-pc-desktop', 'vite.config.ts'),
    readFromWorkspace('packages', 'sdkwork-notes-pc-core', 'package.json'),
    readFromWorkspace('packages', 'sdkwork-notes-pc-core', 'src', 'sdk', 'useAppSdkClient.ts'),
    readFromWorkspace('packages', 'sdkwork-notes-pc-core', 'src', 'services', 'appUserService.ts'),
    readFromWorkspace('packages', 'sdkwork-notes-pc-notes', 'package.json'),
    readFromWorkspace('packages', 'sdkwork-notes-pc-notes', 'src', 'repository', 'noteRepository.ts'),
  ].join('\n');

  const retiredTokens = [
    `@sdkwork/${'app'}-sdk`,
    `@sdkwork/${'backend'}-sdk`,
    `spring-ai-plus-${'app'}-api`,
    `spring-ai-plus-${'backend'}-api`,
  ];

  retiredTokens.forEach((retiredToken) => {
    assert.equal(
      workspaceFiles.includes(retiredToken),
      false,
      `Expected Notes runtime files to avoid retired SDK token ${retiredToken}.`,
    );
  });
});
