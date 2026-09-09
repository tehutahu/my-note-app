import { createHash } from 'node:crypto';

// Deterministic PDF 1.4 / Standard security revision 2 fixture. No personal content.
const padding = Buffer.from('28bf4e5e4e758a4164004e56fffa01082e2e00b6d0683e802f0ca9fe6453697a', 'hex');
const md5 = (bytes: Uint8Array) => createHash('md5').update(bytes).digest();
const passwordBytes = (password: string) => Buffer.concat([Buffer.from(password, 'ascii'), padding]).subarray(0, 32);
function rc4(key: Uint8Array, bytes: Uint8Array): Buffer {
  const state = Array.from({ length: 256 }, (_, i) => i);
  let j = 0;
  for (let i = 0; i < 256; i++) { j = (j + state[i] + key[i % key.length]) & 255; [state[i], state[j]] = [state[j], state[i]]; }
  const result = Buffer.alloc(bytes.length); let i = 0; j = 0;
  for (let n = 0; n < bytes.length; n++) {
    i = (i + 1) & 255; j = (j + state[i]) & 255; [state[i], state[j]] = [state[j], state[i]];
    result[n] = bytes[n] ^ state[(state[i] + state[j]) & 255];
  }
  return result;
}
export function encryptedPdf(password = ''): Buffer {
  const fileId = Buffer.from('00112233445566778899aabbccddeeff', 'hex');
  const owner = rc4(md5(passwordBytes('fixture-owner')).subarray(0, 5), passwordBytes(password));
  const permission = Buffer.alloc(4); permission.writeInt32LE(-4);
  const key = md5(Buffer.concat([passwordBytes(password), owner, permission, fileId])).subarray(0, 5);
  const user = rc4(key, padding);
  const objectKey = md5(Buffer.concat([key, Buffer.from([5, 0, 0, 0, 0])])).subarray(0, 10);
  const stream = rc4(objectKey, Buffer.from('BT /F1 12 Tf 20 200 Td (Encrypted fixture text) Tj ET'));
  const objects = [
    Buffer.from('<< /Type /Catalog /Pages 2 0 R >>'),
    Buffer.from('<< /Type /Pages /Kids [3 0 R] /Count 1 >>'),
    Buffer.from('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 400 300] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>'),
    Buffer.from('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'),
    Buffer.concat([Buffer.from(`<< /Length ${stream.length} >>\nstream\n`), stream, Buffer.from('\nendstream')]),
    Buffer.from(`<< /Filter /Standard /V 1 /R 2 /O <${owner.toString('hex')}> /U <${user.toString('hex')}> /P -4 >>`),
  ];
  const chunks = [Buffer.from('%PDF-1.4\n')], offsets = [0]; let length = chunks[0].length;
  objects.forEach((object, i) => {
    offsets.push(length); const chunk = Buffer.concat([Buffer.from(`${i + 1} 0 obj\n`), object, Buffer.from('\nendobj\n')]); chunks.push(chunk); length += chunk.length;
  });
  chunks.push(Buffer.from(`xref\n0 7\n0000000000 65535 f \n${offsets.slice(1).map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size 7 /Root 1 0 R /Encrypt 6 0 R /ID [<${fileId.toString('hex')}> <${fileId.toString('hex')}>] >>\nstartxref\n${length}\n%%EOF\n`));
  return Buffer.concat(chunks);
}
