import type { Stroke } from './ink';
import type { Shape } from './shapes';
export type PageElement = Stroke | Shape;
export interface Notebook { id: string; folderId: string | null; title: string; pageIds: string[]; revision: number; createdAt: string; updatedAt: string; deletedAt: string | null }
export interface Page { id: string; notebookId: string; widthPt: number; heightPt: number; background: { kind: 'plain' | 'ruled' | 'grid'; color: string }; elements: PageElement[]; revision: number; pdfSource?: { attachmentId: string; pageIndex: number; rotation: number; viewBox: number[] } }
export interface NoteSnapshot { notebook: Notebook; pages: Page[] }
