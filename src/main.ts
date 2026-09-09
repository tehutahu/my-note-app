import { installDiagnostics } from './diagnostics/ui';
import { measure } from './diagnostics/runtime';
import './style.css';
import { registerPwa } from './pwa/register';
import { openEditor } from './ui/editor';
import { Repository } from './storage/repository';
import { NoteSession } from './application/note-session';
import type { NoteSnapshot } from './domain/notebook';
import { downloadBlob, exportBackup, saveConflictCopy } from './application/file-transfer';
import { copyLibrary, decodeBackup } from './transfer/backup';
import { exportPdf, importPdf, PdfRenderer } from './pdf/document';
document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
<header><span class="brand">てのひらノート</span><span class="version">試作 0.1.0</span></header><main><p role="status">ノートを読み込んでいます…</p></main>`;
installDiagnostics();
let pendingViews = 0;
let canApplyUpdate = () => false;
void registerPwa(() => pendingViews === 0 && canApplyUpdate());
const main = document.querySelector('main')!;
let openError = '端末内の保存領域を開けませんでした。ブラウザーのストレージ設定を確認してください。既存データは削除していません。';
const repository = await Repository.open(undefined, () => {
  const notice = document.createElement('p'); notice.setAttribute('role', 'alert'); notice.className = 'pwa-status';
  notice.textContent = '別のタブで保存形式が更新されました。このタブの保存接続を閉じました。新しい版のアプリで開き直してください。';
  document.querySelector('header')!.after(notice);
}).catch(error => { if (error instanceof Error) openError = error.message; return undefined; });
if (!repository) {
  main.innerHTML = '<p role="alert"></p>'; main.querySelector('p')!.textContent = openError;
} else {
  const db = repository;
  const withViewLock = async <T>(action: () => Promise<T>): Promise<T> => {
    const controls = [...main.querySelectorAll<HTMLButtonElement | HTMLInputElement | HTMLSelectElement>('button, input, select')].map(control => ({ control, disabled: control.disabled }));
    for (const { control } of controls) control.disabled = true;
    pendingViews++; main.inert = true; main.setAttribute('aria-busy', 'true');
    try { return await action(); }
    finally {
      for (const { control, disabled } of controls) if (control.isConnected) control.disabled = disabled;
      if (--pendingViews === 0) { main.inert = false; main.removeAttribute('aria-busy'); }
    }
  };
  let currentFolder: string | null = new URLSearchParams(location.hash.slice(1)).get('folder');
  let dispose: (() => void) | undefined;
  const open = (id: string) => measure('note-open', () => withViewLock(async () => {
    const snapshot = await db.load(id);
    if (!snapshot || snapshot.notebook.deletedAt) throw new Error('ノートが見つかりません。ゴミ箱も確認してください');
    currentFolder = snapshot.notebook.folderId;
    dispose?.();
    history.replaceState(null, '', `#note=${encodeURIComponent(id)}`);
    let update = () => {};
    const session = new NoteSession(snapshot, (value, revision) => db.save(value, revision), () => update());
    const renderer = new PdfRenderer(id => db.attachment(id));
    const editor = openEditor(main, session, () => { void library(); }, () => exportBackup(db, session.snapshot), renderer, async () => {
      const library = await db.snapshot();
      downloadBlob(new Blob([await measure('pdf-export', () => exportPdf(session.snapshot, library.attachments))], { type: 'application/pdf' }), 'note.pdf');
    }, async () => { await open(await saveConflictCopy(db, session.snapshot)); });
    update = editor.update; dispose = editor.dispose; canApplyUpdate = editor.canUpdate; update();
  }));
  const trashView = () => withViewLock(async () => {
    const [folders, notebooks] = await Promise.all([db.listFolders(), db.list()]);
    main.innerHTML = '<section class="library"><h1>ゴミ箱</h1><button id="close-trash">ノート一覧へ戻る</button><p>復元すると元の場所へ戻します。親フォルダがない場合はルートへ戻します。</p><div id="trash-items" class="notebooks"></div><p id="trash-error" role="alert"></p></section>';
    main.querySelector<HTMLButtonElement>('#close-trash')!.onclick = () => { void library(); };
    const report = (error: unknown) => { main.querySelector('#trash-error')!.textContent = error instanceof Error ? error.message : '操作に失敗しました'; };
    for (const kind of ['folder', 'notebook'] as const) {
      const items = kind === 'folder' ? folders : notebooks;
      for (const item of items.filter(item => item.deletedAt)) {
        const name = 'name' in item ? item.name : item.title;
        const row = document.createElement('div'); row.className = 'note-card';
        const label = document.createElement('span'); label.textContent = `${kind === 'folder' ? 'フォルダ' : 'ノート'}: ${name}`;
        const restore = document.createElement('button'); restore.textContent = `復元: ${name}`;
        restore.onclick = async () => { restore.disabled = true; try { await db.restore(kind, item.id); await trashView(); } catch (error) { restore.disabled = false; report(error); } };
        const purge = document.createElement('button'); purge.textContent = `完全削除: ${name}`;
        purge.onclick = () => {
          const dialog = document.createElement('dialog');
          dialog.setAttribute('aria-labelledby', 'delete-heading');
          dialog.innerHTML = '<h2 id="delete-heading">完全に削除しますか？</h2><p id="delete-target"></p><p>この操作は元に戻せません。フォルダの場合は中の項目も削除します。</p><button id="cancel-delete" autofocus>キャンセル</button><button id="confirm-delete">完全に削除する</button><p role="alert" id="delete-error"></p>';
          dialog.querySelector('#delete-target')!.textContent = name;
          document.body.append(dialog); dialog.showModal();
          dialog.addEventListener('keydown', event => {
            if (event.key !== 'Tab') return;
            const buttons = [...dialog.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')];
            const first = buttons[0], last = buttons[buttons.length - 1];
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
          });
          dialog.onclose = () => dialog.remove();
          dialog.querySelector<HTMLButtonElement>('#cancel-delete')!.onclick = () => dialog.close();
          const confirm = dialog.querySelector<HTMLButtonElement>('#confirm-delete')!;
          confirm.onclick = async () => {
            confirm.disabled = true;
            try { await db.purge(kind, item.id); dialog.close(); await trashView(); }
            catch { confirm.disabled = false; dialog.querySelector('#delete-error')!.textContent = '完全削除に失敗しました。もう一度お試しください。'; }
          };
        };
        row.append(label, restore, purge); main.querySelector('#trash-items')!.append(row);
      }
    }
  });
  const library = () => withViewLock(async () => {
    canApplyUpdate = () => !main.querySelector('input:disabled, dialog[open]') && !document.querySelector('dialog[open]');
    dispose?.(); dispose = undefined;
    const [notebooks, allFolders] = await Promise.all([db.list(), db.listFolders()]);
    const folders = allFolders.filter(folder => !folder.deletedAt);
    const current = folders.find(folder => folder.id === currentFolder);
    if (!current) currentFolder = null;
    history.replaceState(null, '', currentFolder ? `#folder=${encodeURIComponent(currentFolder)}` : '#');
    main.innerHTML = `<section class="library"><p class="eyebrow">手書きの時間を、もっと自由に。</p><h1 id="folder-heading">ノート一覧</h1><button id="parent-folder">上のフォルダ</button><button id="new-note">ノートを作る</button><p class="notice">このブラウザーの中に保存します。別の端末には自動で同期されません。</p><form id="create-folder"><label>新しいフォルダ名 <input id="folder-name" maxlength="120" required></label><button>フォルダを作る</button></form><div id="current-folder-controls"></div><div id="folders" class="notebooks"></div><div id="notebooks" class="notebooks"></div><p role="alert" id="library-error"></p></section>`;
    const report = (error?: unknown) => { main.querySelector('#library-error')!.textContent = error instanceof Error ? error.message : '操作に失敗しました。もう一度お試しください。'; };
    const perform = async (action: () => Promise<void>) => { try { await withViewLock(async () => { await action(); await library(); }); } catch (error) { report(error); } };
    const pdfLabel = document.createElement('label'); pdfLabel.textContent = 'PDFを取り込む ';
    const pdfInput = document.createElement('input'); pdfInput.type = 'file'; pdfInput.accept = 'application/pdf,.pdf'; pdfLabel.append(pdfInput); main.querySelector('.library')!.append(pdfLabel);
    pdfInput.onchange = async () => {
      const file = pdfInput.files?.[0]; if (!file) return;
      pdfInput.disabled = true;
      main.querySelector('#library-error')!.textContent = 'PDFを検証・取り込み中です…';
      try { const imported = await measure('pdf-import', async () => { const imported = await importPdf(file, currentFolder); await db.importSnapshot(imported); return imported; }); await open(imported.notebooks[0].id); }
      catch (error) { report(error); pdfInput.disabled = false; pdfInput.value = ''; }
    };
    const transfer = document.createElement('section'); transfer.className = 'transfer';
    transfer.innerHTML = '<button id="export-library">全体バックアップを書き出す</button><label>バックアップを読み込む <input id="import-library" type="file" accept=".snote,application/json"></label><p id="import-status" role="status"></p><button id="cancel-import" hidden>取り込みをキャンセル</button>';
    main.querySelector('.library')!.append(transfer);
    main.querySelector<HTMLButtonElement>('#export-library')!.onclick = async () => { try { await exportBackup(db); } catch (error) { report(error); } };
    const upload = main.querySelector<HTMLInputElement>('#import-library')!;
    const status = main.querySelector('#import-status')!, cancelImport = main.querySelector<HTMLButtonElement>('#cancel-import')!;
    upload.onchange = async () => {
      const file = upload.files?.[0]; if (!file) return;
      let cancelled = false; cancelImport.hidden = false; cancelImport.onclick = () => { cancelled = true; status.textContent = 'キャンセルしました'; };
      upload.disabled = true; status.textContent = '検証中です。まだキャンセルできます。';
      try {
        if (file.size > 100 * 1024 * 1024) throw new Error('バックアップは100MiBまでです');
        const decoded = await decodeBackup(await file.text());
        await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
        if (cancelled) return;
        cancelImport.hidden = true; status.textContent = '保存中です。この段階ではキャンセルできません。';
        await db.importSnapshot(copyLibrary(decoded)); currentFolder = null; await library();
      } catch (error) {
        status.textContent = '取り込みに失敗しました';
        report(error instanceof DOMException ? new Error(error.name === 'QuotaExceededError'
          ? '保存容量が不足しています。バックアップを確保してから空き容量を確認してください。'
          : '取り込みを完了できませんでした。既存のノートは変更されていません。') : error);
      }
      finally { upload.disabled = false; upload.value = ''; cancelImport.hidden = true; }
    };
    const trash = document.createElement('button'); trash.textContent = 'ゴミ箱を開く';
    trash.onclick = () => { void trashView().catch(report); };
    main.querySelector('.library')!.append(trash);
    const path = (id: string): string => {
      const names: string[] = []; let folder = folders.find(f => f.id === id);
      while (folder) { names.unshift(folder.name); folder = folders.find(f => f.id === folder!.parentId); }
      return names.join(' / ');
    };
    const options = () => [new Option('ルート', ''), ...folders.map(folder => new Option(path(folder.id), folder.id))];
    main.querySelector('#folder-heading')!.textContent = current ? path(current.id) : 'ノート一覧';
    const parent = main.querySelector<HTMLButtonElement>('#parent-folder')!; parent.hidden = !current;
    parent.onclick = () => { currentFolder = current!.parentId; void library(); };
    main.querySelector<HTMLFormElement>('#create-folder')!.onsubmit = event => {
      event.preventDefault(); const name = main.querySelector<HTMLInputElement>('#folder-name')!.value;
      const now = new Date().toISOString();
      void perform(() => db.addFolder({ id: crypto.randomUUID(), parentId: currentFolder, name, createdAt: now, updatedAt: now, deletedAt: null }));
    };
    if (current) {
      const controls = main.querySelector('#current-folder-controls')!;
      controls.innerHTML = '<form id="rename-folder"><label>このフォルダの名前 <input id="current-folder-name" maxlength="120" required></label><button>名前を変更</button></form><label for="folder-destination">フォルダの移動先</label><select id="folder-destination"></select><button id="move-folder">フォルダを移動</button>';
      main.querySelector<HTMLInputElement>('#current-folder-name')!.value = current.name;
      main.querySelector<HTMLFormElement>('#rename-folder')!.onsubmit = event => { event.preventDefault(); const name = main.querySelector<HTMLInputElement>('#current-folder-name')!.value; void perform(() => db.renameFolder(current.id, name)); };
      const destination = main.querySelector<HTMLSelectElement>('#folder-destination')!; destination.replaceChildren(...options()); destination.value = current.parentId ?? '';
      main.querySelector<HTMLButtonElement>('#move-folder')!.onclick = () => { void perform(() => db.moveFolder(current.id, destination.value || null)); };
      const remove = document.createElement('button'); remove.textContent = 'このフォルダをゴミ箱へ';
      remove.onclick = () => { void perform(() => db.trash('folder', current.id)); };
      controls.append(remove);
    }
    for (const folder of folders.filter(f => f.parentId === currentFolder)) {
      const button = document.createElement('button'); button.textContent = `フォルダ: ${folder.name}`;
      button.onclick = () => { currentFolder = folder.id; void library(); };
      main.querySelector('#folders')!.append(button);
    }
    for (const notebook of notebooks.filter(n => !n.deletedAt && n.folderId === currentFolder)) {
      const card = document.createElement('div'); card.className = 'note-card';
      const button = document.createElement('button'); button.textContent = notebook.title;
      button.onclick = () => { void open(notebook.id).catch(report); };
      const destination = document.createElement('select'); destination.setAttribute('aria-label', 'ノートの移動先'); destination.replaceChildren(...options()); destination.value = notebook.folderId ?? '';
      const move = document.createElement('button'); move.textContent = 'ノートを移動';
      move.onclick = () => { void perform(() => db.moveNotebook(notebook.id, destination.value || null, notebook.revision)); };
      const remove = document.createElement('button'); remove.textContent = 'ノートをゴミ箱へ';
      remove.onclick = () => { void perform(() => db.trash('notebook', notebook.id)); };
      card.append(button, destination, move, remove); main.querySelector('#notebooks')!.append(card);
    }
    const create = main.querySelector<HTMLButtonElement>('#new-note')!;
    create.onclick = async () => {
      create.disabled = true;
      const id = crypto.randomUUID(), pageId = crypto.randomUUID(), now = new Date().toISOString();
      const note: NoteSnapshot = { notebook: { id, title: 'はじめてのノート', folderId: currentFolder, pageIds: [pageId], revision: 0, createdAt: now, updatedAt: now, deletedAt: null },
        pages: [{ id: pageId, notebookId: id, widthPt: 595.28, heightPt: 841.89, background: { kind: 'plain', color: '#fffefb' }, elements: [], revision: 0 }] };
      try { await db.create(note); await open(id); } catch { report(); create.disabled = false; }
    };
  });
  const id = new URLSearchParams(location.hash.slice(1)).get('note');
  try { if (id) await open(id); else await library(); }
  catch { await library(); main.querySelector('#library-error')!.textContent = '指定されたノートを開けませんでした。'; }
}
