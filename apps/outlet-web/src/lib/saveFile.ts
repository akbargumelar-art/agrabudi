type DownloadsApi = { save(request: { filename: string; data: string | Blob }): Promise<unknown> };
type ClaudeHost = { use(name: string): Promise<unknown> };

/**
 * Simpan berkas buatan halaman. Di dalam penampil artifact (pratinjau) unduhan biasa
 * diblokir, jadi lewat kapabilitas `downloads` bila tersedia; di browser biasa
 * memakai tautan unduh. Melempar error bila pengguna menolak atau browser memblokir.
 */
export async function saveFile(filename: string, content: string, mime: string): Promise<void> {
  const host = (window as unknown as { claude?: ClaudeHost }).claude;
  if (host?.use) {
    const downloads = (await host.use('downloads')) as DownloadsApi | null;
    if (downloads) {
      await downloads.save({ filename, data: content });
      return;
    }
  }
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
