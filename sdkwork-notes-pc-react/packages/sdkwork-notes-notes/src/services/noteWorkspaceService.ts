import { createServiceAdapterController } from '@sdkwork/notes-commons';
import type { Note, NoteSummary, PageRequest, ServiceResult } from '@sdkwork/notes-types';
import {
  noteRepository,
  type NoteRepository,
  type NoteWorkspaceSnapshot,
} from '../repository/noteRepository';

export interface NoteWorkspaceService extends NoteRepository {
  queryWorkspaceSnapshot(pageRequest?: PageRequest): Promise<ServiceResult<NoteWorkspaceSnapshot>>;
  save(entity: Partial<Note>): Promise<ServiceResult<NoteSummary>>;
}

class DefaultNoteWorkspaceService implements NoteWorkspaceService {
  queryWorkspaceSnapshot(pageRequest?: PageRequest) {
    return noteRepository.queryWorkspaceSnapshot(pageRequest);
  }
  findAll(pageRequest?: PageRequest) {
    return noteRepository.findAll(pageRequest);
  }
  findTrashed(pageRequest?: PageRequest) {
    return noteRepository.findTrashed(pageRequest);
  }
  getFolders() {
    return noteRepository.getFolders();
  }
  findById(id: string) {
    return noteRepository.findById(id);
  }
  save(entity: Partial<Note>) {
    return noteRepository.save(entity);
  }
  createFolder(name: string, parentId: string | null) {
    return noteRepository.createFolder(name, parentId);
  }
  renameFolder(id: string, newName: string) {
    return noteRepository.renameFolder(id, newName);
  }
  moveToTrash(id: string) {
    return noteRepository.moveToTrash(id);
  }
  restoreFromTrash(id: string) {
    return noteRepository.restoreFromTrash(id);
  }
  deleteById(id: string) {
    return noteRepository.deleteById(id);
  }
  clearTrash() {
    return noteRepository.clearTrash();
  }
  deleteFolder(id: string) {
    return noteRepository.deleteFolder(id);
  }
  moveFolder(id: string, newParentId: string | null) {
    return noteRepository.moveFolder(id, newParentId);
  }
  moveNote(note: NoteSummary, newParentId: string | null) {
    return noteRepository.moveNote(note, newParentId);
  }
  delete(entity: NoteSummary) {
    return noteRepository.delete(entity);
  }
  deleteAll(ids: string[]) {
    return noteRepository.deleteAll(ids);
  }
  findAllById(ids: string[]) {
    return noteRepository.findAllById(ids);
  }
  saveAll(entities: Partial<NoteSummary>[]) {
    return noteRepository.saveAll(entities);
  }
  count() {
    return noteRepository.count();
  }
}

const localNoteWorkspaceService: NoteWorkspaceService = new DefaultNoteWorkspaceService();
const controller = createServiceAdapterController<NoteWorkspaceService>(localNoteWorkspaceService);

export const noteWorkspaceService: NoteWorkspaceService = controller.service;
export const setNoteWorkspaceServiceAdapter = (adapter: NoteWorkspaceService) => {
  controller.setAdapter(adapter);
};
export const getNoteWorkspaceServiceAdapter = () => controller.getAdapter();
export const resetNoteWorkspaceServiceAdapter = () => controller.resetAdapter();
