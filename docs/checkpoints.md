# Checkpoint

Titik simpan pekerjaan. Tiap checkpoint = satu commit + tag `checkpoint/<tanggal>-<nama>`.
Untuk kembali melihat kondisinya: `git checkout checkpoint/<nama>` (lalu kembali ke branch kerja).

## checkpoint/2026-11-18-m2-backend

Tanggal: 18 November 2026. Branch: `feat/m1-redesign-telkomsel-pattern`. Belum di-push (repo GitHub belum ada, T-2).

### Isi

- Pekerjaan Outlet yang sebelumnya belum di-commit: ABKShop tabel pembelian, checkout, pesanan; embed ABKShop dan
  pengaturan embed di console dihapus.
- Backend `apps/api` (Fastify + Kysely + MySQL): skema dan migrasi, sesi tiga realm, CSRF lewat Origin, batas laju,
  API Publik, form publik + CV privat, katalog/quote/order Outlet, 13 menu Admin Portal, CMS Admin Web.
- Kontrak baru di `packages/contracts` (error API, quote/order, form, dataset modul, aturan akses Admin, CMS) dan
  klien HTTP `@agrabudi/contracts/http`.
- Adapter HTTP di Publik, Outlet, dan Portal; checkout dua langkah (harga final lalu ajukan order).
- Infrastruktur: `infra/` (Dockerfile, Nginx tiga host, compose), CI diperbarui, `docs/deploy.md`, `docs/adr/0001`.
- Perbaikan: chip akun Outlet melebar di HP, penanda "kerangka" Portal hanya di mode `mock`, halaman Publik mode `api`
  dirender dinamis, idempotensi order pada kiriman bersamaan.

### Bukti tes saat checkpoint

| Tes                                             | Hasil                                                         |
| ----------------------------------------------- | ------------------------------------------------------------- |
| `pnpm lint`, `pnpm typecheck`                   | lulus                                                         |
| `pnpm test`                                     | 114 lulus (65 tes integrasi API terhadap MySQL 8.4)           |
| `pnpm e2e` (mode `mock`, 360/390/768/1024/1440) | lulus; Outlet dan Portal diulang setelah perbaikan overflow   |
| Build mode `api`                                | lulus, tanpa data contoh di bundel                            |
| Smoke artefak build + browser mode `api`        | lulus manual (login, order Rp1.565.000, Admin melihat order)  |
| Image Docker, compose, Nginx                    | **belum dijalankan** (tidak ada Docker di mesin pengembangan) |

### Terbuka saat checkpoint

D-B1 stack backend, D-B2 tabel akun Admin Web, D-B3 SOP order, D-B4 izin Admin per modul, D-B5 menu pesan
Hubungi Kami, T-1 VPS, T-2 repo GitHub. Rincian: `docs/status.md`.
