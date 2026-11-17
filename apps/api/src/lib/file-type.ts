/**
 * Kenali jenis berkas dari isinya (magic bytes), bukan dari nama atau Content-Type
 * kiriman browser yang bisa dipalsukan (PRD 4.13).
 */
export type DetectedFile = { mime: string; ext: string };

function startsWith(data: Buffer, bytes: number[], offset = 0): boolean {
  if (data.length < offset + bytes.length) return false;
  return bytes.every((byte, index) => data[offset + index] === byte);
}

export function detectDocument(data: Buffer): DetectedFile | null {
  if (startsWith(data, [0x25, 0x50, 0x44, 0x46, 0x2d]))
    return { mime: 'application/pdf', ext: 'pdf' };
  // Word 97-2003 (OLE2 compound file).
  if (startsWith(data, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])) {
    return { mime: 'application/msword', ext: 'doc' };
  }
  // DOCX = ZIP yang memuat bagian word/.
  if (startsWith(data, [0x50, 0x4b, 0x03, 0x04]) && data.includes('word/')) {
    return {
      mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ext: 'docx',
    };
  }
  return null;
}

/** Gambar raster saja. SVG ditolak karena bisa membawa skrip. */
export function detectImage(data: Buffer): DetectedFile | null {
  if (startsWith(data, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return { mime: 'image/png', ext: 'png' };
  }
  if (startsWith(data, [0xff, 0xd8, 0xff])) return { mime: 'image/jpeg', ext: 'jpg' };
  if (startsWith(data, [0x52, 0x49, 0x46, 0x46]) && startsWith(data, [0x57, 0x45, 0x42, 0x50], 8)) {
    return { mime: 'image/webp', ext: 'webp' };
  }
  return null;
}

/** Nama berkas asli hanya untuk ditampilkan: buang path dan karakter kontrol. */
export function safeDisplayName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? '';
  // eslint-disable-next-line no-control-regex -- sengaja membuang karakter kontrol dari nama berkas
  const cleaned = base.replace(/[\u0000-\u001f\u007f"<>|]/g, '').trim();
  return cleaned.slice(0, 150) || 'berkas';
}
