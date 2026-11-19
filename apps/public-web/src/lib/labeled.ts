/**
 * Konvensi isi CMS: "Judul: isi" tampil sebagai kartu berjudul. Teks tanpa judul pendek
 * di depan tetap tampil apa adanya. Daftar dipisah titik koma (;).
 */
export function splitLabeled(text: string): { title: string | null; body: string } {
  const match = /^([^:]{2,40}):\s+(.+)$/s.exec(text.trim());
  return match ? { title: match[1]!.trim(), body: match[2]!.trim() } : { title: null, body: text };
}

export function splitList(text: string): string[] {
  return text
    .split(';')
    .map((item) => item.trim().replace(/\.$/, ''))
    .filter(Boolean);
}
