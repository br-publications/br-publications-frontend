/**
 * Reads the pixel dimensions of a remote JPEG/PNG by streaming only its header bytes
 * (the full cover is ~0.5 MB). Returns null on any failure so callers can omit width/height.
 * Server-side only (used from generateMetadata; pages are ISR-cached so this runs rarely).
 */
const MAX_BYTES = 128 * 1024;

const parse = (b: Uint8Array): { width: number; height: number } | null => {
  // PNG: 8-byte signature, IHDR width/height at offsets 16 / 20
  if (b.length >= 24 && b[0] === 0x89 && b[1] === 0x50) {
    const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
    return { width: dv.getUint32(16), height: dv.getUint32(20) };
  }
  // JPEG: walk segments until a Start-Of-Frame marker
  if (b.length > 4 && b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) { i++; continue; }
      const marker = b[i + 1];
      if (marker === 0xff) { i++; continue; }
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return { height: (b[i + 5] << 8) | b[i + 6], width: (b[i + 7] << 8) | b[i + 8] };
      }
      i += 2 + ((b[i + 2] << 8) | b[i + 3]);
    }
  }
  return null;
};

export async function getRemoteImageSize(url: string): Promise<{ width: number; height: number } | null> {
  if (!url || !/^https?:\/\//i.test(url)) return null;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 4000);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { Range: `bytes=0-${MAX_BYTES - 1}` } });
    if (!res.ok || !res.body) return null;
    const reader = res.body.getReader();
    let buf = new Uint8Array(0);
    while (buf.length < MAX_BYTES) {
      const { done, value } = await reader.read();
      if (done || !value) break;
      const next = new Uint8Array(buf.length + value.length);
      next.set(buf); next.set(value, buf.length);
      buf = next;
      const size = parse(buf);
      if (size && size.width > 0 && size.height > 0) { ctrl.abort(); return size; }
    }
    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
