export async function registerPwa(canUpdate: () => boolean): Promise<void> {
  const status = document.createElement('span'); status.dataset.testid = 'offline-status'; status.setAttribute('role', 'status');
  const container = document.createElement('div'); container.className = 'pwa-status'; container.append(status); document.querySelector('header')!.after(container);
  if (!import.meta.env.PROD) { status.textContent = '開発版（オフライン機能は無効）'; return; }
  if (!('serviceWorker' in navigator)) { status.textContent = 'このブラウザーはオフライン保存に対応していません'; return; }
  status.textContent = 'オフライン準備中…';
  const updateStatus = document.createElement('span'); updateStatus.dataset.testid = 'update-status'; updateStatus.setAttribute('role', 'status');
  const apply = document.createElement('button'); apply.textContent = '新しい版を適用'; apply.hidden = true; container.append(updateStatus, apply);
  let prepared = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const unlock = () => { prepared = false; document.body.inert = false; clearTimeout(timer); apply.disabled = false; };
  navigator.serviceWorker.addEventListener('message', event => {
    if (event.data?.type === 'PREPARE_UPDATE') {
      const ready = canUpdate();
      if (ready) { prepared = true; document.body.inert = true; timer = setTimeout(unlock, 10000); }
      event.ports[0]?.postMessage({ ready });
    }
    if (event.data?.type === 'CANCEL_UPDATE') unlock();
    if (event.data?.type === 'UPDATE_BLOCKED') { unlock(); updateStatus.textContent = '別のタブに未保存の変更・処理中の操作があります。保存してから適用してください。'; }
  });
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (prepared) { clearTimeout(timer); location.reload(); } });
  try {
    const registration = await navigator.serviceWorker.register(new URL('./sw.js', document.baseURI), { scope: './', updateViaCache: 'none' });
    const offer = () => {
      apply.hidden = !registration.waiting || !navigator.serviceWorker.controller;
      if (!apply.hidden) updateStatus.textContent = '新しい版があります。全タブの保存後に適用できます。';
    };
    registration.addEventListener('updatefound', () => {
      registration.installing?.addEventListener('statechange', offer);
    });
    offer();
    apply.onclick = () => {
      if (!registration.waiting) { offer(); return; }
      if (!canUpdate()) { updateStatus.textContent = '未保存の変更・処理中の操作があります。保存してから適用してください。'; return; }
      apply.disabled = true; updateStatus.textContent = '開いているタブの保存状態を確認中…';
      registration.waiting?.postMessage({ type: 'APPLY' });
    };
    await navigator.serviceWorker.ready;
    const channel = new MessageChannel();
    channel.port1.onmessage = event => {
      if (event.data.ready) {
        status.textContent = 'オフライン準備完了';
        document.querySelector('.version')!.textContent = `0.1.0 / ${event.data.version}`;
      }
      channel.port1.close();
    };
    registration.active?.postMessage({ type: 'STATUS' }, [channel.port2]);
  } catch { status.textContent = 'オフライン準備に失敗しました。通信を確認して再起動してください'; }
}
