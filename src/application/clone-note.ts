import type { NoteSnapshot } from '../domain/notebook';
/** Copy every mutable field in the note schema without serializing all ink points. */
export function cloneNote(note: NoteSnapshot): NoteSnapshot {
  return {
    notebook: { ...note.notebook, pageIds: [...note.notebook.pageIds] },
    pages: note.pages.map(page => ({
      ...page, background: { ...page.background },
      ...(page.pdfSource ? { pdfSource: { ...page.pdfSource, viewBox: [...page.pdfSource.viewBox] } } : {}),
      elements: page.elements.map(element => element.type === 'stroke'
        ? { ...element, points: element.points.map(point => ({ ...point })) }
        : { ...element }),
    })),
  };
}
