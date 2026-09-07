export interface Folder { id: string; parentId: string | null; name: string; createdAt: string; updatedAt: string; deletedAt: string | null }
function nameValue(name: string): string {
  const value = name.trim();
  if (!value.length || value.length > 120) throw new Error('名前は1〜120文字にしてください');
  return value;
}
function existing(folders: Folder[], id: string): Folder {
  const folder = folders.find(f => f.id === id);
  if (!folder) throw new Error('フォルダが見つかりません');
  return folder;
}
function validate(folders: Folder[]): void {
  const byId = new Map(folders.map(folder => [folder.id, folder]));
  for (const folder of folders) {
    if (folder.deletedAt) continue;
    let node = folder;
    const seen = new Set<string>();
    while (true) {
      if (seen.has(node.id)) throw new Error('循環する移動はできません');
      seen.add(node.id);
      if (seen.size > 20) throw new Error('フォルダは20階層までです');
      if (node.parentId === null) break;
      const parent = byId.get(node.parentId);
      if (!parent || parent.deletedAt) throw new Error('親フォルダが存在しません');
      node = parent;
    }
  }
}
export function renameFolder(folders: Folder[], id: string, name: string): Folder[] {
  existing(folders, id); const value = nameValue(name);
  return folders.map(folder => folder.id === id ? { ...folder, name: value } : folder);
}
export function moveFolder(folders: Folder[], id: string, parentId: string | null): Folder[] {
  existing(folders, id);
  const next = folders.map(folder => folder.id === id ? { ...folder, parentId } : folder);
  validate(next); return next;
}
export function createFolder(folders: Folder[], folder: Folder): Folder[] {
  if (folders.some(f => f.id === folder.id)) throw new Error('フォルダIDが重複しています');
  const next = [...folders, { ...folder, name: nameValue(folder.name) }];
  validate(next); return next;
}
