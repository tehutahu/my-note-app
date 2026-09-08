import { ConflictError } from './conflict';
import type { Notebook, NoteSnapshot, Page } from '../domain/notebook';
import { createFolder, moveFolder, renameFolder, type Folder } from '../domain/folders';
import { descendantIds, restoreFolder, trashFolder } from '../domain/trash';
import type { Attachment, LibrarySnapshot } from '../transfer/backup';
function request<T>(operation: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    operation.onsuccess = () => resolve(operation.result);
    operation.onerror = () => reject(operation.error);
  });
}
function validate(snapshot: NoteSnapshot): void {
  const { notebook, pages } = snapshot;
  if (!pages.length || pages.length !== notebook.pageIds.length || new Set(notebook.pageIds).size !== pages.length ||
    pages.some((page, i) => page.notebookId !== notebook.id || page.id !== notebook.pageIds[i])) throw new Error('ページの参照が不正です');
}
export class Repository {
  async attachment(id: string): Promise<Attachment | undefined> { return this.transaction('readonly', tx => request(tx.objectStore('attachments').get(id))); }
  async snapshot(): Promise<LibrarySnapshot> {
    return this.transaction('readonly', async tx => {
      const [folders, notebooks, pages, attachments] = await Promise.all(['folders', 'notebooks', 'pages', 'attachments'].map(store => request(tx.objectStore(store).getAll())));
      return { folders, notebooks, pages, attachments };
    });
  }
  /** Caller completes format/hash validation and ID remapping before entering IDB. */
  async importSnapshot(library: LibrarySnapshot): Promise<void> {
    await this.transaction('readwrite', async tx => {
      for (const store of ['folders', 'notebooks', 'pages', 'attachments'] as const) {
        for (const record of library[store]) await request(tx.objectStore(store).add(record));
      }
    });
  }
  async trash(kind: 'folder' | 'notebook', id: string): Promise<void> { await this.changeTrash(kind, id, false); }
  async restore(kind: 'folder' | 'notebook', id: string): Promise<void> { await this.changeTrash(kind, id, true); }
  private async changeTrash(kind: 'folder' | 'notebook', id: string, restoring: boolean): Promise<void> {
    await this.transaction('readwrite', async tx => {
      const folders = await request<Folder[]>(tx.objectStore('folders').getAll());
      const notebooks = await request<Notebook[]>(tx.objectStore('notebooks').getAll());
      // A unique deletion timestamp distinguishes earlier independent trash operations.
      const previous = [...folders, ...notebooks].map(item => Date.parse(item.deletedAt ?? '')).filter(Number.isFinite);
      const now = new Date(Math.max(Date.now(), ...previous.map(time => time + 1))).toISOString();
      if (kind === 'folder') {
        const next = restoring ? restoreFolder({ folders, notebooks }, id, now) : trashFolder({ folders, notebooks }, id, now);
        for (const folder of next.folders) if (!folders.includes(folder)) await request(tx.objectStore('folders').put(folder));
        for (const note of next.notebooks) if (!notebooks.includes(note)) await request(tx.objectStore('notebooks').put(note));
      } else {
        const note = notebooks.find(n => n.id === id);
        if (!note || Boolean(note.deletedAt) !== restoring) throw new Error('対象のノートが見つかりません');
        const folderId = restoring && !folders.some(f => f.id === note.folderId && !f.deletedAt) ? null : note.folderId;
        await request(tx.objectStore('notebooks').put({ ...note, folderId, deletedAt: restoring ? null : now, updatedAt: now, revision: note.revision + 1 }));
      }
    });
  }
  async purge(kind: 'folder' | 'notebook', id: string): Promise<void> {
    await this.transaction('readwrite', async tx => {
      const folders = await request<Folder[]>(tx.objectStore('folders').getAll());
      const notebooks = await request<Notebook[]>(tx.objectStore('notebooks').getAll());
      const target = (kind === 'folder' ? folders : notebooks).find(item => item.id === id);
      if (!target?.deletedAt) throw new Error('完全削除はゴミ箱の項目だけに実行できます');
      const folderIds = kind === 'folder' ? descendantIds(folders, id) : new Set<string>();
      const noteIds = new Set(notebooks.filter(n => kind === 'notebook' ? n.id === id : n.folderId !== null && folderIds.has(n.folderId)).map(n => n.id));
      const pages = await request<Page[]>(tx.objectStore('pages').getAll());
      const removedAttachments = new Set<string>(), retainedAttachments = new Set<string>();
      for (const page of pages) {
        if (noteIds.has(page.notebookId)) {
          if (page.pdfSource) removedAttachments.add(page.pdfSource.attachmentId);
          await request(tx.objectStore('pages').delete(page.id));
        } else if (page.pdfSource) retainedAttachments.add(page.pdfSource.attachmentId);
      }
      for (const attachment of removedAttachments) if (!retainedAttachments.has(attachment)) await request(tx.objectStore('attachments').delete(attachment));
      for (const note of noteIds) await request(tx.objectStore('notebooks').delete(note));
      for (const folder of folderIds) await request(tx.objectStore('folders').delete(folder));
    });
  }
  async listFolders(): Promise<Folder[]> {
    return this.transaction('readonly', tx => request(tx.objectStore('folders').getAll()));
  }
  private async updateFolders(change: (folders: Folder[]) => Folder[]): Promise<void> {
    await this.transaction('readwrite', async tx => {
      const store = tx.objectStore('folders');
      const folders = await request<Folder[]>(store.getAll());
      const next = change(folders);
      for (const folder of next) if (!folders.includes(folder)) await request(store.put({ ...folder, updatedAt: new Date().toISOString() }));
    });
  }
  async addFolder(folder: Folder): Promise<void> { await this.updateFolders(folders => createFolder(folders, folder)); }
  async renameFolder(id: string, name: string): Promise<void> { await this.updateFolders(folders => renameFolder(folders, id, name)); }
  async moveFolder(id: string, parentId: string | null): Promise<void> { await this.updateFolders(folders => moveFolder(folders, id, parentId)); }
  async moveNotebook(id: string, folderId: string | null, revision: number): Promise<void> {
    await this.transaction('readwrite', async tx => {
      if (folderId !== null) {
        const folder = await request<Folder | undefined>(tx.objectStore('folders').get(folderId));
        if (!folder || folder.deletedAt) throw new Error('移動先フォルダが存在しません');
      }
      const store = tx.objectStore('notebooks');
      const notebook = await request<Notebook | undefined>(store.get(id));
      if (!notebook || notebook.revision !== revision) throw new Error('競合しました。最新の一覧を開いてください');
      await request(store.put({ ...notebook, folderId, revision: revision + 1, updatedAt: new Date().toISOString() }));
    });
  }
  private constructor(private db: IDBDatabase, changed: () => void) { db.onversionchange = () => { this.close(); changed(); }; }
  static async open(name = 'my-note-app', changed: () => void = () => {}): Promise<Repository> {
    const operation = indexedDB.open(name, 2);
    let abandoned = false;
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      operation.onblocked = () => {
        abandoned = true;
        reject(new Error('別のタブが保存形式の更新を妨げています。このアプリの別のタブを閉じてから再起動してください。'));
      };
      operation.onupgradeneeded = event => {
        const tx = operation.transaction!;
        if (abandoned) { tx.abort(); return; }
        try {
          if (event.oldVersion < 1) for (const store of ['notebooks', 'pages', 'folders', 'attachments', 'meta']) operation.result.createObjectStore(store, { keyPath: 'id' });
          if (event.oldVersion < 2) tx.objectStore('pages').createIndex('byNotebook', 'notebookId');
        } catch { tx.abort(); }
      };
      operation.onsuccess = () => resolve(operation.result);
      operation.onerror = () => reject(new Error(operation.error?.name === 'VersionError'
        ? 'このタブより新しい保存形式です。新しい版のアプリで開き直してください。'
        : '保存形式の更新に失敗しました。既存データは変更していません。再起動してお試しください。', { cause: operation.error }));
    });
    return new Repository(database, changed);
  }
  /** Only IDB requests may be awaited inside body, to keep the transaction alive. */
  private async transaction<T>(mode: IDBTransactionMode, body: (tx: IDBTransaction) => Promise<T>): Promise<T> {
    const tx = this.db.transaction(['notebooks', 'pages', 'folders', 'attachments'], mode);
    const complete = new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onabort = () => reject(tx.error ?? new Error('保存を中止しました'));
    });
    const result = body(tx).catch(error => {
      try { tx.abort(); } catch { /* The transaction may already have aborted. Preserve the original cause. */ }
      throw error;
    });
    const [value] = await Promise.all([result, complete]);
    return value;
  }
  async create(snapshot: NoteSnapshot): Promise<void> {
    validate(snapshot);
    await this.transaction('readwrite', async tx => {
      await request(tx.objectStore('notebooks').add(snapshot.notebook));
      for (const page of snapshot.pages) await request(tx.objectStore('pages').add(page));
    });
  }
  async load(id: string): Promise<NoteSnapshot | undefined> {
    return this.transaction('readonly', async tx => {
      const notebook = await request<Notebook | undefined>(tx.objectStore('notebooks').get(id));
      if (!notebook) return undefined;
      const stored = await request<Page[]>(tx.objectStore('pages').index('byNotebook').getAll(id));
      const byId = new Map(stored.map(page => [page.id, page]));
      const pages = notebook.pageIds.map(id => byId.get(id)!);
      return { notebook, pages };
    });
  }
  async list(): Promise<Notebook[]> {
    return this.transaction('readonly', tx => request(tx.objectStore('notebooks').getAll()));
  }
  async save(snapshot: NoteSnapshot, expectedRevision: number): Promise<void> {
    validate(snapshot);
    if (snapshot.notebook.revision !== expectedRevision + 1) throw new Error('revisionは1ずつ増加させてください');
    await this.transaction('readwrite', async tx => {
      const notebooks = tx.objectStore('notebooks'), pages = tx.objectStore('pages');
      const current = await request<Notebook | undefined>(notebooks.get(snapshot.notebook.id));
      if (!current || current.revision !== expectedRevision) throw new ConflictError();
      for (const page of snapshot.pages) {
        const existing = await request<Page | undefined>(pages.get(page.id));
        if (existing && existing.notebookId !== current.id) throw new Error('別のノートのページは上書きできません');
        await request(pages.put(page));
      }
      for (const id of current.pageIds) if (!snapshot.notebook.pageIds.includes(id)) await request(pages.delete(id));
      await request(notebooks.put(snapshot.notebook));
    });
  }
  close(): void { this.db.close(); }
}
