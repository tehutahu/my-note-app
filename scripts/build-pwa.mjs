import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { deflateSync } from 'node:zlib';
// Dependency-free PNG writer for the app's geometric notebook icon.
function crc(bytes) {
  let value = 0xffffffff;
  for (const byte of bytes) { value ^= byte; for (let bit = 0; bit < 8; bit++) value = (value >>> 1) ^ ((value & 1) ? 0xedb88320 : 0); }
  return (value ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const body = Buffer.concat([Buffer.from(type), data]), size = Buffer.alloc(4), checksum = Buffer.alloc(4);
  size.writeUInt32BE(data.length); checksum.writeUInt32BE(crc(body)); return Buffer.concat([size, body, checksum]);
}
for (const size of [192, 512]) {
  const rows = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const u = x / size, v = y / size;
    let color = [36, 79, 70];
    if (u > .25 && u < .75 && v > .2 && v < .8) color = [255, 254, 249];
    if (u > .34 && u < .67 && [.38, .5, .62].some(line => Math.abs(v - line) < .012)) color = [110, 142, 121];
    if (u > .28 && u < .30 && v > .2 && v < .8) color = [182, 91, 40];
    const at = y * (size * 4 + 1) + 1 + x * 4; rows.set([...color, 255], at);
  }
  const header = Buffer.alloc(13); header.writeUInt32BE(size); header.writeUInt32BE(size, 4); header[8] = 8; header[9] = 6;
  await writeFile(`dist/icon-${size}.png`, Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), chunk('IHDR', header), chunk('IDAT', deflateSync(rows)), chunk('IEND', Buffer.alloc(0))]));
}
async function files(dir) {
  const result = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory()) result.push(...await files(path)); else if (entry.name !== 'sw.js') result.push(path);
  }
  return result.sort();
}
const assets = await files('dist'), hash = createHash('sha256');
for (const file of assets) { hash.update(file); hash.update(await readFile(file)); }
const version = hash.digest('hex').slice(0, 16);
const worker = `const VERSION = ${JSON.stringify(version)};
const PREFIX = 'tenohira-' + self.registration.scope;
const CACHE = PREFIX + VERSION;
const ASSETS = ${JSON.stringify(assets.map(file => './' + file.slice(5)))};
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    try { await cache.addAll(ASSETS); }
    catch (error) { await caches.delete(CACHE); throw error; }
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (key.startsWith(PREFIX) && key !== CACHE) await caches.delete(key);
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request, url = new URL(request.url);
  if (request.method !== 'GET' || !url.href.startsWith(self.registration.scope)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const key = request.mode === 'navigate' ? new URL('./index.html', self.registration.scope).href : request;
    return await cache.match(key) || fetch(request);
  })());
});
let updating = false;
self.addEventListener('message', event => {
  if (event.data?.type === 'APPLY' && !updating) {
    updating = true;
    event.waitUntil((async () => {
      const clients = (await self.clients.matchAll({ type: 'window', includeUncontrolled: true })).filter(client => client.url.startsWith(self.registration.scope));
      const answers = await Promise.all(clients.map(client => new Promise(resolve => {
        const channel = new MessageChannel();
        const timer = setTimeout(() => { channel.port1.close(); resolve(false); }, 2000);
        channel.port1.onmessage = message => { clearTimeout(timer); channel.port1.close(); resolve(message.data?.ready === true); };
        client.postMessage({ type: 'PREPARE_UPDATE' }, [channel.port2]);
      })));
      if (answers.length && answers.every(Boolean)) await self.skipWaiting();
      else {
        for (const client of clients) client.postMessage({ type: 'CANCEL_UPDATE' });
        event.source?.postMessage({ type: 'UPDATE_BLOCKED' });
        updating = false;
      }
    })());
  }

  if (event.data?.type === 'STATUS') event.ports[0]?.postMessage({ version: VERSION, ready: true });
});
`;
await writeFile('dist/sw.js', worker);
console.log(`PWA ${version}: ${assets.length} local assets`);
