import { downloadBlob } from '../application/file-transfer';
import { measurements, startMeasurements } from './runtime';
export function installDiagnostics(): void {
  const button = document.createElement('button'); button.textContent = '動作の計測';
  document.querySelector('header')!.append(button);
  let startedAt: string | null = null, stoppedAt: string | null = null;
  button.onclick = () => {
    const dialog = document.createElement('dialog'); dialog.setAttribute('aria-labelledby', 'diagnostic-heading');
    dialog.innerHTML = `<h2 id="diagnostic-heading">動作の計測</h2><p>筆記・保存・PDFの処理時間を記録します。ノートの内容は含めません。入力処理時間はペンから画面までの総遅延とは異なります。</p>
    <p>開始すると前回の記録を消します。各項目の生値は最新10,000件、総件数と総失敗数は全件を保持します。</p>
    <p role="status"></p><label>端末の温度 <select id="temperature"><option>未確認</option><option>通常</option><option>温かい</option><option>熱い</option></select></label>
    <label>省電力モード <select id="power-saving"><option>未確認</option><option>OFF</option><option>ON</option></select></label>
    <div><button id="measure-start">計測を開始</button><button id="measure-stop">計測を停止</button><button id="measure-export">計測結果を書き出す</button><button id="measure-close" autofocus>閉じる</button></div>`;
    const status = () => { dialog.querySelector('[role=status]')!.textContent = measurements.active ? '計測中です。閉じて通常どおり操作してください。' : '計測は停止しています。'; };
    dialog.querySelector<HTMLButtonElement>('#measure-start')!.onclick = () => { startMeasurements(); startedAt = new Date().toISOString(); stoppedAt = null; status(); };
    dialog.querySelector<HTMLButtonElement>('#measure-stop')!.onclick = () => { measurements.stop(); stoppedAt = new Date().toISOString(); status(); };
    dialog.querySelector<HTMLButtonElement>('#measure-export')!.onclick = () => {
      const report = { format: 'tenohira-measurements', version: document.querySelector('.version')!.textContent, startedAt, stoppedAt, active: measurements.active,
        environment: { userAgent: navigator.userAgent, hardwareConcurrency: navigator.hardwareConcurrency, devicePixelRatio,
          viewport: { width: innerWidth, height: innerHeight }, temperature: dialog.querySelector<HTMLSelectElement>('#temperature')!.value,
          powerSaving: dialog.querySelector<HTMLSelectElement>('#power-saving')!.value }, measurements: measurements.report() };
      downloadBlob(new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' }), 'measurements.json');
    };
    dialog.querySelector<HTMLButtonElement>('#measure-close')!.onclick = () => dialog.close();
    dialog.onclose = () => { dialog.remove(); button.focus(); };
    dialog.addEventListener('keydown', event => {
      if (event.key !== 'Tab') return;
      const controls = [...dialog.querySelectorAll<HTMLElement>('button, select')], first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
    document.body.append(dialog); status(); dialog.showModal();
  };
}
