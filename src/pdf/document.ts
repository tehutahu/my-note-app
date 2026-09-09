import { CanvasCache } from './cache';
import { PDFDocument, degrees, rgb, LineCapStyle, LineJoinStyle, setLineJoin, pushGraphicsState, popGraphicsState } from 'pdf-lib';
import * as pdfjs from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import type { NoteSnapshot, Page } from '../domain/notebook';
import type { Attachment, LibrarySnapshot } from '../transfer/backup';
import { sha256 } from '../transfer/backup';
import { strokePath } from '../rendering/outline';
import { shapePoints } from '../domain/shapes';
pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
function load(bytes: Uint8Array) {
  const root = new URL('./pdf/', document.baseURI).href;
  return pdfjs.getDocument({ data: bytes, useSystemFonts: false, cMapUrl: root + 'cmaps/', cMapPacked: true, standardFontDataUrl: root + 'standard_fonts/', wasmUrl: root + 'wasm/' });
}
export async function importPdf(file: File, folderId: string | null): Promise<LibrarySnapshot> {
  if (file.size > 20 * 1024 * 1024) throw new Error('PDFは20MiBまでです');
  const bytes = new Uint8Array(await file.arrayBuffer());
  let task: pdfjs.PDFDocumentLoadingTask | undefined;
  try {
    const source = await PDFDocument.load(bytes);
    if (source.getPageCount() < 1 || source.getPageCount() > 100) throw new Error('PDFは1〜100ページです');
    task = load(bytes.slice()); task.onPassword = () => { void task?.destroy(); };
    const documentPdf = await task.promise;
    if (source.getPageCount() !== documentPdf.numPages) throw new Error('PDFページ数に互換性がありません');
    const id = crypto.randomUUID(), attachmentId = crypto.randomUUID(), now = new Date().toISOString();
    const pages: Page[] = [];
    for (let i = 1; i <= documentPdf.numPages; i++) {
      const page = await documentPdf.getPage(i), viewport = page.getViewport({ scale: 1 });
      pages.push({ id: crypto.randomUUID(), notebookId: id, widthPt: viewport.width, heightPt: viewport.height, revision: 0,
        background: { kind: 'plain', color: '#ffffff' }, elements: [], pdfSource: { attachmentId, pageIndex: i - 1, rotation: viewport.rotation, viewBox: page.view } });
      page.cleanup();
    }
    return { folders: [], notebooks: [{ id, folderId, title: file.name.slice(0, 120).trim() || 'PDFノート', pageIds: pages.map(p => p.id), revision: 0, createdAt: now, updatedAt: now, deletedAt: null }], pages,
      attachments: [{ id: attachmentId, mimeType: 'application/pdf', size: bytes.length, sha256: await sha256(bytes), blob: new Blob([bytes], { type: 'application/pdf' }) }] };
  } catch (error) {
    throw new Error(`PDFを取り込めません。破損・暗号化・未対応の形式、または上限超過です。${error instanceof Error && error.message.startsWith('PDF') ? error.message : ''}`, { cause: error });
  } finally { await task?.destroy(); }
}
const inkColor = (hex: string) => rgb(parseInt(hex.slice(1, 3), 16) / 255, parseInt(hex.slice(3, 5), 16) / 255, parseInt(hex.slice(5, 7), 16) / 255);
export async function exportPdf(note: NoteSnapshot, attachments: Attachment[]): Promise<Uint8Array<ArrayBuffer>> {
  const output = await PDFDocument.create(), originals = new Map<string, PDFDocument>();
  for (const page of note.pages) {
    const target = output.addPage([page.widthPt, page.heightPt]);
    if (page.pdfSource) {
      const s = page.pdfSource;
      if (!originals.has(s.attachmentId)) {
        const attachment = attachments.find(a => a.id === s.attachmentId);
        if (!attachment) throw new Error('PDF原本が見つかりません');
        originals.set(s.attachmentId, await PDFDocument.load(await attachment.blob.arrayBuffer()));
      }
      const original = originals.get(s.attachmentId)!.getPage(s.pageIndex);
      const [left, bottom, right, top] = s.viewBox;
      const embedded = await output.embedPage(original, { left, bottom, right, top });
      const r = s.rotation, w = right - left, h = top - bottom;
      const x = r === 180 ? w : r === 270 ? h : 0;
      const y = r === 90 ? w : r === 180 ? h : 0;
      target.drawPage(embedded, { x, y, width: w, height: h, rotate: degrees(-r) });
    } else target.drawRectangle({ x: 0, y: 0, width: page.widthPt, height: page.heightPt, color: inkColor(page.background.color) });
    if (page.background.kind !== 'plain') {
      for (let y = 24; y < page.heightPt; y += 24) target.drawLine({ start: { x: 0, y: page.heightPt - y }, end: { x: page.widthPt, y: page.heightPt - y }, thickness: .5, color: inkColor('#b8c9c1') });
      if (page.background.kind === 'grid') for (let x = 24; x < page.widthPt; x += 24) target.drawLine({ start: { x, y: 0 }, end: { x, y: page.heightPt }, thickness: .5, color: inkColor('#b8c9c1') });
    }
    for (const element of page.elements) {
      if (element.type === 'stroke') target.drawSvgPath(strokePath(element), { x: 0, y: page.heightPt, color: inkColor(element.color), opacity: element.tool === 'highlighter' ? .25 : 1 });
      else {
        const path = shapePoints(element).map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join('');
        target.pushOperators(pushGraphicsState(), setLineJoin(LineJoinStyle.Round));
        target.drawSvgPath(path, { x: 0, y: page.heightPt, borderColor: inkColor(element.color), borderWidth: element.widthPt, borderLineCap: LineCapStyle.Round });
        target.pushOperators(popGraphicsState());
      }
    }
  }
  return new Uint8Array(await output.save());
}
export class PdfRenderer {
  private cache = new CanvasCache();
  private task: pdfjs.RenderTask | undefined;
  private loading: pdfjs.PDFDocumentLoadingTask | undefined;
  private pending: Promise<HTMLCanvasElement> | undefined;
  private active: HTMLCanvasElement | undefined;
  private generation = 0;
  private disposed = false;
  constructor(private attachment: (id: string) => Promise<Attachment | undefined>) {}
  get metrics() { return { bytes: this.cache.bytes + (this.active ? this.active.width * this.active.height * 4 : 0), pages: this.cache.count + (this.active ? 1 : 0) }; }
  render(page: Page, scale: number, budget: number): Promise<HTMLCanvasElement> {
    const generation = ++this.generation, previous = this.pending;
    this.task?.cancel(); void this.loading?.destroy();
    const current = () => { if (generation !== this.generation || this.disposed) throw new Error('表示を中止しました'); };
    const pending = (async () => {
      await previous?.catch(() => {}); current();
      const source = page.pdfSource!;
      const key = `${source.attachmentId}:${source.pageIndex}:${scale}:${budget}`;
      const cached = this.cache.get(key, budget); if (cached) return cached;
      const attachment = await this.attachment(source.attachmentId); current();
      if (!attachment) throw new Error('PDF原本が見つかりません');
      const bytes = new Uint8Array(await attachment.blob.arrayBuffer()); current();
      const loading = this.loading = load(bytes);
      let canvas: HTMLCanvasElement | undefined, retained = false;
      try {
        const pdf = await loading.promise; current();
        const original = await pdf.getPage(source.pageIndex + 1); current();
        const safeScale = Math.min(scale, Math.sqrt(budget / (4 * page.widthPt * page.heightPt)), budget / (4 * page.widthPt), budget / (4 * page.heightPt), 8192 / page.widthPt, 8192 / page.heightPt) * .99;
        const viewport = original.getViewport({ scale: safeScale });
        const width = Math.ceil(viewport.width), height = Math.ceil(viewport.height), size = width * height * 4;
        if (size > budget || width < 1 || height < 1) throw new Error('PDF表示用のメモリーが不足しています');
        this.cache.trim(budget - size, 2);
        canvas = this.active = document.createElement('canvas'); canvas.width = width; canvas.height = height;
        this.task = original.render({ canvas, viewport }); await this.task.promise; current();
        this.cache.put(key, canvas, budget); retained = true; this.active = undefined;
        return canvas;
      } finally {
        if (canvas && !retained) canvas.width = canvas.height = 0;
        this.active = undefined; this.task = undefined;
        await loading.destroy(); this.loading = undefined;
      }
    })();
    this.pending = pending; return pending;
  }
  dispose(): void { this.disposed = true; this.generation++; this.task?.cancel(); void this.loading?.destroy(); this.cache.clear(); }
}
