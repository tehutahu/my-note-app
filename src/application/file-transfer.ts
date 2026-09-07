import type { NoteSnapshot } from '../domain/notebook';
import type { Repository } from '../storage/repository';
import { copyLibrary, encodeBackup } from '../transfer/backup';
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob), link = document.createElement('a');
  link.href = url; link.download = filename; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export async function exportBackup(db: Repository, note?: NoteSnapshot): Promise<void> {
  const library = await db.snapshot();
  if (note) {
    const copy = structuredClone(note), needed = new Set<string>();
    let folderId = copy.notebook.folderId;
    if (folderId && !library.folders.some(f => f.id === folderId)) { copy.notebook.folderId = null; folderId = null; }
    while (folderId) {
      needed.add(folderId); const folder = library.folders.find(f => f.id === folderId);
      if (!folder) throw new Error('親フォルダが見つかりません');
      folderId = folder.parentId;
    }
    library.folders = library.folders.filter(f => needed.has(f.id));
    library.notebooks = [copy.notebook]; library.pages = copy.pages;
    const attachments = new Set(copy.pages.flatMap(p => p.pdfSource ? [p.pdfSource.attachmentId] : []));
    library.attachments = library.attachments.filter(a => attachments.has(a.id));
  }
  const text = await encodeBackup(library, note ? 'notebook' : 'library');
  downloadBlob(new Blob([text], { type: 'application/json' }), note ? 'note.snote' : 'library.snote');
}

export async function saveConflictCopy(db: Repository, note: NoteSnapshot): Promise<string> {
  const source = structuredClone(note), attachments = [];
  const needed = new Set(source.pages.flatMap(page => page.pdfSource ? [page.pdfSource.attachmentId] : []));
  for (const id of needed) {
    const attachment = await db.attachment(id);
    if (!attachment) throw new Error('PDF原本が見つからないためコピーを保存できません');
    attachments.push(attachment);
  }
  const now = new Date().toISOString();
  source.notebook = { ...source.notebook, title: source.notebook.title.slice(0,112) + '（コピー）', folderId: null, revision: 0, createdAt: now, updatedAt: now, deletedAt: null };
  const library = copyLibrary({ folders: [], notebooks: [source.notebook], pages: source.pages.map(page => ({ ...page, revision: 0 })), attachments });
  await db.importSnapshot(library);
  return library.notebooks[0].id;
}
