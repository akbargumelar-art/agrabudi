import { createReadStream } from 'node:fs';
import { mkdir, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, join, resolve, sep } from 'node:path';
import type { Readable } from 'node:stream';
import { newId } from './ids';

/**
 * Penyimpanan berkas. Area `public` untuk banner/aset website (dilayani reverse proxy),
 * area `private` untuk CV dan dokumen yang hanya keluar lewat API setelah izin diperiksa
 * (PRD 4.13). Implementasi sekarang disk lokal (volume Docker); antarmukanya sengaja kecil
 * supaya bisa diganti object storage S3 tanpa mengubah route.
 */
export type StorageArea = 'public' | 'private';

export interface FileStorage {
  put(area: StorageArea, ext: string, data: Buffer): Promise<string>;
  open(area: StorageArea, key: string): Promise<{ stream: Readable; size: number } | null>;
  remove(area: StorageArea, key: string): Promise<void>;
  publicUrl(key: string): string;
}

const KEY_PATTERN = /^\d{4}\/\d{2}\/[0-9a-f-]{36}\.[a-z0-9]{2,5}$/;

export function createLocalStorage(rootDir: string, publicBaseUrl: string): FileStorage {
  const root = resolve(rootDir);

  function pathFor(area: StorageArea, key: string): string {
    // Kunci selalu buatan server; tetap diperiksa supaya tidak bisa keluar dari folder area.
    if (!KEY_PATTERN.test(key)) throw new Error('Kunci berkas tidak sah.');
    const full = resolve(root, area, key);
    if (!full.startsWith(join(root, area) + sep)) throw new Error('Kunci berkas tidak sah.');
    return full;
  }

  return {
    async put(area, ext, data) {
      const now = new Date();
      const key = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, '0')}/${newId()}.${ext}`;
      const full = pathFor(area, key);
      await mkdir(dirname(full), { recursive: true });
      await writeFile(full, data, { flag: 'wx' });
      return key;
    },
    async open(area, key) {
      const full = pathFor(area, key);
      try {
        const info = await stat(full);
        return { stream: createReadStream(full), size: info.size };
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
        throw error;
      }
    },
    async remove(area, key) {
      await rm(pathFor(area, key), { force: true });
    },
    publicUrl(key) {
      return `${publicBaseUrl.replace(/\/$/, '')}/${key}`;
    },
  };
}
