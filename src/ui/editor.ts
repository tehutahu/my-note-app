import { ConflictError } from '../storage/conflict';
import { rasterPlan } from '../pdf/cache';
import { toPage } from '../domain/coordinates';
import { History, hitsStroke } from '../domain/ink';
import { hitsShape, type Shape } from '../domain/shapes';
import { Gestures } from '../input/gestures';
import { drawElement } from '../rendering/elements';
import { drawBackground } from '../rendering/background';
import type { NoteSession } from '../application/note-session';
import type { Page, PageElement } from '../domain/notebook';
import { addPage, movePage, removePage } from '../domain/pages';
import type { PdfRenderer } from '../pdf/document';
export function openEditor(main: HTMLElement, session: NoteSession, back: () => void, exportNote: () => Promise<void>, pdfRenderer: PdfRenderer, exportPDF: () => Promise<void>, copyNote: () => Promise<void>): { update: () => void; canUpdate: () => boolean; dispose: () => void } {
  main.innerHTML = `<div class="editor-heading"><div><button id="back">ノート一覧</button><label>ノート名 <input id="title" maxlength="120"></label></div><span role="status" data-testid="save-status">保存済み</span><button id="retry" hidden>再試行</button></div><p id="save-error" role="alert"></p>
  <div class="toolbar" aria-label="ページ操作"><label for="page-select">ページ選択</label><select id="page-select"></select><button id="page-add">ページを追加</button><button id="page-prev">ページを前へ</button><button id="page-next">ページを後へ</button><button id="page-delete">ページを削除</button></div>
  <div class="toolbar" aria-label="用紙設定"><label for="background">用紙の背景</label><select id="background"><option value="plain">無地</option><option value="ruled">横罫線</option><option value="grid">方眼</option></select><label>背景色 <input id="background-color" type="color"></label></div>
  <div class="toolbar" aria-label="筆記ツール">
  <button data-tool="pen" aria-pressed="true">ペン</button><button data-tool="eraser" aria-pressed="false">消しゴム</button><button data-tool="pan" aria-pressed="false">移動</button>
  <button data-tool="highlighter" aria-pressed="false">蛍光ペン</button>
  <button data-tool="line" aria-pressed="false">直線</button><button data-tool="rectangle" aria-pressed="false">長方形</button><button data-tool="ellipse" aria-pressed="false">楕円</button>
  <label>太さ <input id="width" type="number" min="0.5" max="12" step="0.5" value="3"></label>
  <label>色 <input id="color" type="color" value="#244f46"></label>
  <button id="undo" disabled>元に戻す</button><button id="redo" disabled>やり直す</button>
  <button id="finger" aria-pressed="false">指書き OFF</button>
  <button id="zoom-out" aria-label="縮小">−</button><output data-testid="zoom" aria-label="倍率">100%</output><button id="zoom-in" aria-label="拡大">＋</button><button id="fit">用紙を合わせる</button>
  </div><div class="paper-space"><canvas id="pdf-layer" aria-hidden="true"></canvas><canvas id="committed" aria-hidden="true"></canvas><canvas id="ink" aria-label="手書きキャンバス" tabindex="0"></canvas></div>
  <footer><span data-testid="stroke-count">0筆</span><span data-testid="element-count">0要素</span><span data-testid="pdf-status"></span><span>ペンで書く・指で移動／拡大</span></footer>`;
  const canvas = main.querySelector<HTMLCanvasElement>('#ink')!;
  const committed = main.querySelector<HTMLCanvasElement>('#committed')!;
  const pdfLayer = main.querySelector<HTMLCanvasElement>('#pdf-layer')!;
  let renderGeneration = 0, rasterScale = devicePixelRatio;
  const stage = main.querySelector<HTMLElement>('.paper-space')!;
  const ctx = canvas.getContext('2d')!, base = committed.getContext('2d')!;
  const history = new History<Page[]>(session.snapshot.pages), gestures = new Gestures();
  let selected = history.current[0].id;
  const currentPage = () => history.current.find(page => page.id === selected)!;
  const title = main.querySelector<HTMLInputElement>('#title')!;
  const exportButton = document.createElement('button'); exportButton.textContent = 'このノートを書き出す';
  main.querySelector('.editor-heading')!.append(exportButton);
  exportButton.onclick = async () => {
    exportButton.disabled = true;
    try { await exportNote(); }
    catch (error) { main.querySelector('#save-error')!.textContent = error instanceof Error ? error.message : '書き出しに失敗しました'; }
    finally { exportButton.disabled = false; }
  };
  const pdfButton = document.createElement('button'); pdfButton.textContent = 'PDFを書き出す'; main.querySelector('.editor-heading')!.append(pdfButton);
  pdfButton.onclick = async () => {
    pdfButton.disabled = true; pdfButton.textContent = 'PDF作成中…';
    try { await exportPDF(); }
    catch (error) { main.querySelector('#save-error')!.textContent = error instanceof Error ? error.message : 'PDF出力に失敗しました'; }
    finally { pdfButton.disabled = false; pdfButton.textContent = 'PDFを書き出す'; }
  };
  const copyButton = document.createElement('button'); copyButton.textContent = '変更をコピーとして保存'; copyButton.hidden = true; main.querySelector('.editor-heading')!.append(copyButton);
  copyButton.onclick = async () => {
    copyButton.disabled = true;
    try { await copyNote(); }
    catch { main.querySelector('#save-error')!.textContent = 'コピーの保存に失敗しました。変更は画面に残っています。ファイルへの書き出しも利用できます。'; }
    finally { copyButton.disabled = false; }
  };
  const conflicted = () => session.error instanceof ConflictError;
  title.value = session.snapshot.notebook.title;
  const persist = () => {
    const snapshot = structuredClone(session.snapshot);
    snapshot.pages = history.current;
    snapshot.notebook.pageIds = history.current.map(page => page.id);
    snapshot.notebook.title = title.value.trim() || snapshot.notebook.title;
    session.edit(snapshot);
  };
  title.onchange = () => { title.value = title.value.trim() || session.snapshot.notebook.title; persist(); };
  const update = () => {
    main.querySelector('[data-testid=save-status]')!.textContent = conflicted() ? '未保存・編集競合' : { saved: '保存済み', saving: '保存中…', failed: '未保存・再試行してください' }[session.status];
    main.querySelector<HTMLButtonElement>('#retry')!.hidden = session.status !== 'failed' || conflicted();
    copyButton.hidden = !conflicted();
    if (conflicted() && (active || erased)) cancel();
    main.querySelector<HTMLButtonElement>('#back')!.disabled = session.status !== 'saved';
    main.querySelector('#save-error')!.textContent = conflicted() ? '別のタブの変更と競合しました。編集を停止しています。変更をルートの独立コピーとして保存するか、このノートを書き出してください。' : session.status === 'failed' ? '保存できませんでした。変更は画面に保持しています。再読み込みせず再試行してください。' : '';
    if (conflicted()) for (const control of main.querySelectorAll<HTMLButtonElement | HTMLInputElement | HTMLSelectElement>('.toolbar button, .toolbar input, .toolbar select, #title')) control.disabled = true;
  };
  main.querySelector<HTMLButtonElement>('#retry')!.onclick = () => { session.retry(); update(); };
  main.querySelector<HTMLButtonElement>('#back')!.onclick = back;
  const beforeUnload = (event: BeforeUnloadEvent) => { if (session.status !== 'saved') event.preventDefault(); };
  window.addEventListener('beforeunload', beforeUnload);
  let tool = 'pen', fingerInk = false, space = false;
  let active: PageElement | null = null, erased: PageElement[] | null = null;
  gestures.camera.zoom = Math.min(1, stage.clientWidth / 595.28);
  const view = () => ({ left: canvas.getBoundingClientRect().left, top: canvas.getBoundingClientRect().top,
    panX: gestures.camera.x, panY: gestures.camera.y, zoom: gestures.camera.zoom });
  const clear = (context: CanvasRenderingContext2D) => {
    context.setTransform(1, 0, 0, 1, 0, 0); context.clearRect(0, 0, canvas.width, canvas.height);
    const { zoom, x, y } = gestures.camera;
    context.setTransform(zoom * rasterScale, 0, 0, zoom * rasterScale, x * rasterScale, y * rasterScale);
  };
  const paint = (context: CanvasRenderingContext2D, stroke: PageElement, start = 0) => {
    context.save(); context.beginPath(); context.rect(0, 0, currentPage().widthPt, currentPage().heightPt); context.clip(); drawElement(context, stroke, start); context.restore();
  };
  const render = () => {
    if (!history.current.some(page => page.id === selected)) selected = history.current[0].id;
    clear(base); drawBackground(base, currentPage(), !currentPage().pdfSource);
    const pdfContext = pdfLayer.getContext('2d')!; clear(pdfContext);
    const generation = ++renderGeneration, page = currentPage();
    const pdfStatus = main.querySelector('[data-testid=pdf-status]')!;
    pdfStatus.textContent = page.pdfSource ? 'PDF表示中…' : '';
    if (page.pdfSource) {
      const budget = Math.max(1024, 64 * 1024 * 1024 - canvas.width * canvas.height * 4 * 3);
      void pdfRenderer.render(page, gestures.camera.zoom * rasterScale, budget).then(bitmap => {
        if (generation !== renderGeneration) return;
        pdfContext.drawImage(bitmap, 0, 0, page.widthPt, page.heightPt); pdfStatus.textContent = 'PDF表示済み';
      }).catch(() => { if (generation === renderGeneration) pdfStatus.textContent = 'PDFを表示できませんでした'; });
    }
    main.querySelector<HTMLSelectElement>('#background')!.value = currentPage().background.kind;
    main.querySelector<HTMLInputElement>('#background-color')!.value = currentPage().background.color;
    for (const stroke of erased ?? currentPage().elements) paint(base, stroke);
    main.querySelector('[data-testid=stroke-count]')!.textContent = `${currentPage().elements.filter(e => e.type === 'stroke').length}筆`;
    main.querySelector('[data-testid=element-count]')!.textContent = `${currentPage().elements.length}要素`;
    const select = main.querySelector<HTMLSelectElement>('#page-select')!;
    select.replaceChildren(...history.current.map((page, index) => new Option(`${index + 1} / ${history.current.length}`, String(index), false, page.id === selected)));
    const index = history.current.findIndex(page => page.id === selected);
    main.querySelector<HTMLButtonElement>('#page-prev')!.disabled = index === 0;
    main.querySelector<HTMLButtonElement>('#page-next')!.disabled = index === history.current.length - 1;
    main.querySelector<HTMLButtonElement>('#page-delete')!.disabled = history.current.length === 1;
    main.querySelector<HTMLButtonElement>('#undo')!.disabled = !history.canUndo;
    main.querySelector<HTMLButtonElement>('#redo')!.disabled = !history.canRedo;
    main.querySelector('[data-testid=zoom]')!.textContent = `${Math.round(gestures.camera.zoom * 100)}%`;
    canvas.dataset.panX = String(gestures.camera.x);
    if (conflicted()) update();
  };
  const discard = () => { active = null; erased = null; clear(ctx); render(); };
  const cancel = () => { gestures.cancel(); discard(); };
  const applyPages = (pages: Page[]) => { history.apply(pages); persist(); render(); };
  const applyStrokes = (elements: PageElement[]) => applyPages(history.current.map(page => page.id === selected ? { ...page, elements, revision: page.revision + 1 } : page));
  main.querySelector<HTMLSelectElement>('#page-select')!.onchange = event => {
    const index = Number((event.target as HTMLSelectElement).value);
    cancel(); selected = history.current[index].id; render();
  };
  main.querySelector<HTMLButtonElement>('#page-add')!.onclick = () => {
    cancel();
    const page: Page = { id: crypto.randomUUID(), notebookId: session.snapshot.notebook.id, widthPt: 595.28, heightPt: 841.89, background: { kind: 'plain', color: '#fffefb' }, elements: [], revision: 0 };
    selected = page.id; applyPages(addPage(history.current, page));
  };
  const move = (delta: number) => { cancel(); applyPages(movePage(history.current, selected, history.current.findIndex(page => page.id === selected) + delta)); };
  main.querySelector<HTMLButtonElement>('#page-prev')!.onclick = () => move(-1);
  main.querySelector<HTMLButtonElement>('#page-next')!.onclick = () => move(1);
  main.querySelector<HTMLButtonElement>('#page-delete')!.onclick = () => { cancel(); applyPages(removePage(history.current, selected)); };
  const changeBackground = () => {
    const kind = main.querySelector<HTMLSelectElement>('#background')!.value as Page['background']['kind'];
    const color = main.querySelector<HTMLInputElement>('#background-color')!.value;
    cancel(); applyPages(history.current.map(page => page.id === selected ? { ...page, background: { kind, color }, revision: page.revision + 1 } : page));
  };
  main.querySelector<HTMLSelectElement>('#background')!.onchange = changeBackground;
  main.querySelector<HTMLInputElement>('#background-color')!.onchange = changeBackground;
  const resize = () => {
    const plan = rasterPlan(stage.clientWidth, stage.clientHeight, devicePixelRatio); rasterScale = plan.scale;
    for (const layer of [canvas, committed, pdfLayer]) {
      layer.style.width = `${stage.clientWidth}px`; layer.style.height = `${stage.clientHeight}px`;
      layer.width = plan.width; layer.height = plan.height;
    }
    clear(ctx); render(); if (active) paint(ctx, active);
  };
  const observer = new ResizeObserver(resize); observer.observe(stage); resize();
  for (const button of main.querySelectorAll<HTMLButtonElement>('[data-tool]')) button.onclick = () => {
    cancel(); tool = button.dataset.tool!;
    for (const other of main.querySelectorAll<HTMLButtonElement>('[data-tool]')) other.setAttribute('aria-pressed', String(other === button));
  };
  main.querySelector<HTMLButtonElement>('#undo')!.onclick = () => { cancel(); history.undo(); persist(); render(); };
  main.querySelector<HTMLButtonElement>('#redo')!.onclick = () => { cancel(); history.redo(); persist(); render(); };
  const finger = main.querySelector<HTMLButtonElement>('#finger')!;
  finger.onclick = () => { cancel(); fingerInk = !fingerInk; finger.textContent = `指書き ${fingerInk ? 'ON' : 'OFF'}`; finger.setAttribute('aria-pressed', String(fingerInk)); };
  const zoomAt = (factor: number, x: number, y: number) => {
    cancel(); const camera = gestures.camera, zoom = Math.max(.25, Math.min(4, camera.zoom * factor));
    const ratio = zoom / camera.zoom;
    gestures.camera = { x: x - (x - camera.x) * ratio, y: y - (y - camera.y) * ratio, zoom }; clear(ctx); render();
  };
  main.querySelector<HTMLButtonElement>('#zoom-in')!.onclick = () => zoomAt(1.25, stage.clientWidth / 2, stage.clientHeight / 2);
  main.querySelector<HTMLButtonElement>('#zoom-out')!.onclick = () => zoomAt(.8, stage.clientWidth / 2, stage.clientHeight / 2);
  main.querySelector<HTMLButtonElement>('#fit')!.onclick = () => { cancel(); gestures.camera = { x: 0, y: 0, zoom: Math.max(.25, Math.min(1, stage.clientWidth / 595.28)) }; clear(ctx); render(); };
  canvas.addEventListener('wheel', event => {
    if (!event.ctrlKey) return;
    event.preventDefault(); const rect = canvas.getBoundingClientRect(); zoomAt(Math.exp(-event.deltaY * .002), event.clientX - rect.left, event.clientY - rect.top);
  }, { passive: false });
  canvas.onkeydown = event => { if (event.code === 'Space') { event.preventDefault(); space = true; } };
  canvas.onkeyup = event => { if (event.code === 'Space') space = false; };
  canvas.onblur = () => { space = false; cancel(); };
  const sample = (event: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    return { id: event.pointerId, kind: event.pointerType, x: event.clientX - rect.left, y: event.clientY - rect.top };
  };
  const point = (event: PointerEvent) => ({ ...toPage({ x: event.clientX, y: event.clientY }, view()), p: event.pointerType === 'pen' ? event.pressure : 1 });
  const erase = (event: PointerEvent) => { erased = erased!.filter(element => !(element.type === 'stroke' ? hitsStroke(element, point(event), 8) : hitsShape(element, point(event), 8))); render(); };
  canvas.onpointerdown = event => {
    if (conflicted()) return;
    if (event.button !== 0) return;
    const result = gestures.down(sample(event), fingerInk, space || tool === 'pan');
    if (event.isTrusted) { canvas.setPointerCapture(event.pointerId); canvas.focus({ preventScroll: true }); }
    if (result === 'cancel') { discard(); return; }
    if (result !== 'draw') return;
    discard();
    if (tool === 'eraser') { erased = [...currentPage().elements]; erase(event); return; }
    const width = Number(main.querySelector<HTMLInputElement>('#width')!.value);
    active = { id: crypto.randomUUID(), type: 'stroke', tool: tool === 'highlighter' ? 'highlighter' : 'pen', color: main.querySelector<HTMLInputElement>('#color')!.value,
      widthPt: Number.isFinite(width) ? Math.max(.5, Math.min(12, width)) : 3, points: [point(event)] };
    if (['line', 'rectangle', 'ellipse'].includes(tool)) {
      const p = point(event);
      active = { id: active.id, type: 'shape', kind: tool as Shape['kind'], x1: p.x, y1: p.y, x2: p.x, y2: p.y, color: active.color, widthPt: active.widthPt };
    }
    paint(ctx, active);
  };
  canvas.onpointermove = event => {
    const before = { ...gestures.camera }; gestures.move(sample(event));
    if (before.x !== gestures.camera.x || before.y !== gestures.camera.y || before.zoom !== gestures.camera.zoom) { clear(ctx); render(); }
    if (event.pointerId !== gestures.owner || gestures.mode !== 'drawing') return;
    if (erased) { erase(event); return; }
    if (!active) return;
    if (active.type === 'shape') {
      const p = point(event); active.x2 = p.x; active.y2 = p.y; clear(ctx); paint(ctx, active); return;
    }
    const start = active.points.length;
    const events = event.getCoalescedEvents?.() ?? [];
    for (const p of events.length ? events : [event]) active.points.push(point(p));
    if (active.tool === 'highlighter') { clear(ctx); paint(ctx, active); }
    else paint(ctx, active, start);
  };
  canvas.onpointerup = event => {
    if (event.pointerId === gestures.owner && gestures.mode === 'drawing') {
      if (active) {
        const end = point(event);
        if (active.type === 'stroke') {
          const last = active.points[active.points.length - 1];
          if (last.x !== end.x || last.y !== end.y) active.points.push({ ...end, p: last.p });
        } else { active.x2 = end.x; active.y2 = end.y; }
        applyStrokes([...currentPage().elements, active]);
      }
      if (erased && erased.length !== currentPage().elements.length) applyStrokes(erased);
      discard();
    }
    gestures.up(event.pointerId);
  };
  canvas.onpointercancel = event => { if (event.pointerId === gestures.owner || gestures.mode === 'pinching') cancel(); };
  canvas.onlostpointercapture = event => { if (event.pointerId === gestures.owner || gestures.mode === 'pinching') cancel(); };
  return { update, canUpdate: () => session.status === 'saved' && !active && !erased && title.value.trim() === session.snapshot.notebook.title && !pdfButton.disabled && !exportButton.disabled, dispose: () => { renderGeneration++; pdfRenderer.dispose(); observer.disconnect(); window.removeEventListener('beforeunload', beforeUnload); } };
}
