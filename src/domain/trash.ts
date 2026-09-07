import type { Folder } from './folders';
import { moveFolder } from './folders';
import type { Notebook } from './notebook';
export interface LibraryMetadata { folders: Folder[]; notebooks: Notebook[] }
export function descendantIds(folders: Folder[], id: string): Set<string> {
  const ids = new Set([id]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const folder of folders) if (folder.parentId !== null && ids.has(folder.parentId) && !ids.has(folder.id)) { ids.add(folder.id); grew = true; }
  }
  return ids;
}
export function trashFolder(library: LibraryMetadata, id: string, now: string): LibraryMetadata {
  if (!library.folders.some(f => f.id === id && !f.deletedAt)) throw new Error('フォルダが見つかりません');
  const ids = descendantIds(library.folders, id);
  return {
    folders: library.folders.map(f => ids.has(f.id) && !f.deletedAt ? { ...f, deletedAt: now, updatedAt: now } : f),
    notebooks: library.notebooks.map(n => n.folderId !== null && ids.has(n.folderId) && !n.deletedAt ? { ...n, deletedAt: now, updatedAt: now, revision: n.revision + 1 } : n),
  };
}
export function restoreFolder(library: LibraryMetadata, id: string, now: string): LibraryMetadata {
  const root = library.folders.find(f => f.id === id);
  if (!root?.deletedAt) throw new Error('ゴミ箱のフォルダが見つかりません');
  const ids = descendantIds(library.folders, id);
  let folders = library.folders.map(f => ids.has(f.id) && f.deletedAt === root.deletedAt ? { ...f, deletedAt: null, updatedAt: now } : f);
  const parentId = folders.some(f => f.id === root.parentId && !f.deletedAt) ? root.parentId : null;
  folders = moveFolder(folders, id, parentId);
  return {
    folders,
    notebooks: library.notebooks.map(n => n.folderId !== null && ids.has(n.folderId) && n.deletedAt === root.deletedAt ? { ...n, deletedAt: null, updatedAt: now, revision: n.revision + 1 } : n),
  };
}
