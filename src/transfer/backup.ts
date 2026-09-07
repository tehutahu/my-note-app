import { PDFDocument } from 'pdf-lib';
import type { Folder } from '../domain/folders';
import type { Notebook, Page } from '../domain/notebook';
export interface Attachment { id: string; mimeType: string; size: number; sha256: string; blob: Blob }
export interface LibrarySnapshot { folders: Folder[]; notebooks: Notebook[]; pages: Page[]; attachments: Attachment[] }
export interface Backup extends Omit<LibrarySnapshot, 'attachments'> { format: 'my-note-app'; schemaVersion: 1; scope: 'notebook' | 'library'; exportedAt: string; attachments: (Omit<Attachment, 'blob'> & { dataBase64: string })[] }
const MiB = 1024 * 1024;
function requireValue(condition: unknown, reason: string): asserts condition { if (!condition) throw new Error(`バックアップを読み込めません: ${reason}`); }
function object(value: unknown): Record<string, unknown> { requireValue(value !== null && typeof value === 'object' && !Array.isArray(value), 'オブジェクト形式が不正です'); return value as Record<string, unknown>; }
function array(value: unknown): unknown[] { requireValue(Array.isArray(value), '配列が不正です'); return value; }
function finite(value: unknown, min = -Infinity, max = Infinity): void { requireValue(typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max, '数値が不正です'); }
function integer(value: unknown): void { finite(value, 0); requireValue(Number.isInteger(value), '整数が必要です'); }
function name(value: unknown): void { requireValue(typeof value === 'string' && value.trim().length > 0 && value.length <= 120, '名前は1〜120文字です'); }
function date(value: unknown): void { requireValue(typeof value === 'string' && value.endsWith('Z') && Number.isFinite(Date.parse(value)), '日時が不正です'); }
function color(value: unknown): void { requireValue(typeof value === 'string' && /^#[\da-f]{6}$/i.test(value), '色が不正です'); }
export async function sha256(bytes: Uint8Array<ArrayBuffer>): Promise<string> {
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(n => n.toString(16).padStart(2, '0')).join('');
}
export async function encodeBackup(library: LibrarySnapshot, scope: Backup['scope'] = 'library'): Promise<string> {
  const attachments: Backup['attachments'] = [];
  for (const attachment of library.attachments) {
    const bytes = new Uint8Array(await attachment.blob.arrayBuffer());
    let binary = '';
    for (let i = 0; i < bytes.length; i += 32768) binary += String.fromCharCode(...bytes.subarray(i, i + 32768));
    attachments.push({ id: attachment.id, mimeType: attachment.mimeType, size: bytes.length, sha256: await sha256(bytes), dataBase64: btoa(binary) });
  }
  const output = JSON.stringify({ ...library, format: 'my-note-app', schemaVersion: 1, scope, exportedAt: new Date().toISOString(), attachments });
  requireValue(new TextEncoder().encode(output).length <= 100 * MiB, '100MiBを超えます。ノート単位で書き出してください');
  return output;
}
export async function decodeBackup(text: string): Promise<LibrarySnapshot> {
  requireValue(text.length <= 100 * MiB && new TextEncoder().encode(text).length <= 100 * MiB, 'ファイルは100MiBまでです');
  let raw: unknown;
  try { raw = JSON.parse(text); } catch { throw new Error('バックアップのJSONが壊れています'); }
  const root = object(raw);
  requireValue(root.format === 'my-note-app' && root.schemaVersion === 1, '形式またはバージョンが未対応です');
  requireValue(root.scope === 'library' || root.scope === 'notebook', '範囲が不正です'); date(root.exportedAt);
  const folders = array(root.folders).map(object), notebooks = array(root.notebooks).map(object), pages = array(root.pages).map(object), attachments = array(root.attachments).map(object);
  requireValue(pages.length <= 1000, '1000ページを超えます');
  const allIds = new Set<string>();
  const identify = (record: Record<string, unknown>): string => {
    requireValue(typeof record.id === 'string' && /^[\da-f]{8}-[\da-f]{4}-[1-8][\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i.test(record.id), 'IDが不正です');
    requireValue(!allIds.has(record.id), 'IDが重複しています'); allIds.add(record.id); return record.id;
  };
  const folderMap = new Map(folders.map(f => [identify(f), f]));
  const noteMap = new Map(notebooks.map(n => [identify(n), n]));
  const pageMap = new Map(pages.map(p => [identify(p), p]));
  const attachmentMap = new Map(attachments.map(a => [identify(a), a]));
  const reference = (id: unknown, map: Map<string, unknown>) => requireValue(typeof id === 'string' && map.has(id), '参照先が存在しません');
  for (const item of [...folders, ...notebooks]) { name(item.name ?? item.title); date(item.createdAt); date(item.updatedAt); if (item.deletedAt !== null) date(item.deletedAt); }
  for (const folder of folders) {
    let node = folder; const seen = new Set();
    while (true) {
      requireValue(!seen.has(node.id), 'フォルダが循環しています'); seen.add(node.id); requireValue(seen.size <= 20, 'フォルダは20階層までです');
      if (node.parentId === null) break;
      reference(node.parentId, folderMap); node = folderMap.get(node.parentId as string)!;
    }
  }
  const referencedPages = new Set();
  for (const note of notebooks) {
    if (note.folderId !== null) reference(note.folderId, folderMap);
    integer(note.revision); const ids = array(note.pageIds); requireValue(ids.length > 0, 'ノートには最低1ページ必要です');
    for (const id of ids) {
      reference(id, pageMap); requireValue(!referencedPages.has(id), 'ページ参照が重複しています'); referencedPages.add(id);
      requireValue(pageMap.get(id as string)!.notebookId === note.id, 'ページの所属が不正です');
    }
  }
  requireValue(referencedPages.size === pages.length, '所属のないページがあります');
  let pointCount = 0;
  for (const page of pages) {
    reference(page.notebookId, noteMap); finite(page.widthPt, Number.MIN_VALUE); finite(page.heightPt, Number.MIN_VALUE); integer(page.revision);
    const background = object(page.background); requireValue(['plain', 'ruled', 'grid'].includes(background.kind as string), '背景が不正です'); color(background.color);
    if (page.pdfSource !== undefined) {
      const source = object(page.pdfSource); reference(source.attachmentId, attachmentMap); integer(source.pageIndex);
      requireValue([0, 90, 180, 270].includes(source.rotation as number), 'PDF回転が不正です');
      requireValue(array(source.viewBox).length === 4, 'PDF表示領域が不正です'); for (const n of array(source.viewBox)) finite(n);
    }
    for (const value of array(page.elements)) {
      const element = object(value); identify(element); color(element.color); finite(element.widthPt, .5, 12);
      if (element.type === 'stroke') {
        requireValue(element.tool === 'pen' || element.tool === 'highlighter', '筆記ツールが不正です');
        const points = array(element.points); pointCount += points.length; requireValue(points.length > 0 && pointCount <= 2000000, '点数は1筆1点以上、全体200万点までです');
        for (const value of points) { const point = object(value); finite(point.x); finite(point.y); finite(point.p, 0, 1); }
      } else {
        requireValue(element.type === 'shape' && ['line', 'rectangle', 'ellipse'].includes(element.kind as string), '図形が不正です');
        for (const key of ['x1', 'y1', 'x2', 'y2']) finite(element[key]);
      }
    }
  }
  let attachmentBytes = 0; const decoded: Attachment[] = [];
  for (const a of attachments) {
    requireValue(a.mimeType === 'application/pdf', '添付形式が未対応です'); integer(a.size); requireValue((a.size as number) <= 20 * MiB, 'PDFは20MiBまでです');
    attachmentBytes += a.size as number; requireValue(attachmentBytes <= 64 * MiB, '添付合計は64MiBまでです');
    requireValue(typeof a.dataBase64 === 'string' && /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(a.dataBase64), 'base64が不正です');
    const binary = atob(a.dataBase64); requireValue(btoa(binary) === a.dataBase64 && binary.length === a.size, '添付サイズが一致しません');
    const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
    requireValue(await sha256(bytes) === a.sha256, '添付SHA-256が一致しません');
    let count: number;
    try { const pdf = await PDFDocument.load(bytes); count = pdf.getPageCount(); } catch { throw new Error('添付PDFが破損、暗号化、または未対応です'); }
    requireValue(count > 0 && count <= 100, 'PDFは1〜100ページです');
    for (const page of pages) if (page.pdfSource) { const source = object(page.pdfSource); if (source.attachmentId === a.id) requireValue((source.pageIndex as number) < count, 'PDFページが存在しません'); }
    decoded.push({ id: a.id as string, mimeType: a.mimeType, size: a.size as number, sha256: a.sha256 as string, blob: new Blob([bytes], { type: 'application/pdf' }) });
  }
  return { folders: folders as unknown as Folder[], notebooks: notebooks as unknown as Notebook[], pages: pages as unknown as Page[], attachments: decoded };
}
export function copyLibrary(library: LibrarySnapshot): LibrarySnapshot {
  const ids = new Map<string, string>();
  for (const record of [...library.folders, ...library.notebooks, ...library.pages, ...library.attachments, ...library.pages.flatMap(p => p.elements)]) ids.set(record.id, crypto.randomUUID());
  const id = (value: string) => ids.get(value)!;
  return {
    folders: library.folders.map(f => ({ ...f, id: id(f.id), parentId: f.parentId === null ? null : id(f.parentId) })),
    notebooks: library.notebooks.map(n => ({ ...n, id: id(n.id), folderId: n.folderId === null ? null : id(n.folderId), pageIds: n.pageIds.map(id) })),
    pages: library.pages.map(p => ({ ...structuredClone(p), id: id(p.id), notebookId: id(p.notebookId), ...(p.pdfSource ? { pdfSource: { ...p.pdfSource, attachmentId: id(p.pdfSource.attachmentId) } } : {}), elements: p.elements.map(e => ({ ...structuredClone(e), id: id(e.id) })) })),
    attachments: library.attachments.map(a => ({ ...a, id: id(a.id) })),
  };
}
