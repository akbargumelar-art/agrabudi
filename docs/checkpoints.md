# Checkpoint

> **Wajib dibaca sebelum mengubah apa pun.** Checkpoint teratas adalah kondisi terakhir repo yang sudah
> diuji. Mulai kerja dari sana: cek branch dan commit, baca keputusan yang sudah diambil dan hal yang masih
> terbuka, lalu jalankan tes dasar supaya tahu titik awalnya hijau. Jangan membongkar ulang keputusan yang
> tercatat di sini tanpa permintaan pemilik.

Titik simpan pekerjaan. Tiap checkpoint = satu commit + tag `checkpoint/<tanggal>-<nama>`.
Untuk kembali melihat kondisinya: `git checkout checkpoint/<nama>` (lalu kembali ke branch kerja).
Checkpoint terbaru selalu ditaruh paling atas.

## Cara memakai checkpoint sebelum update

1. `git fetch --tags` lalu `git status`. Pastikan berada di branch kerja yang tercatat di checkpoint teratas dan
   tidak ada perubahan lain yang belum jelas asalnya.
2. Bandingkan dengan checkpoint: `git log --oneline checkpoint/<nama>..HEAD`. Commit di luar daftar berarti ada
   perubahan setelah checkpoint; baca pesan commitnya dulu.
3. Baca bagian **Keputusan yang dikunci** dan **Terbuka** di checkpoint teratas, plus `docs/status.md`.
4. Jalankan `pnpm lint`, `pnpm typecheck`, `pnpm test`. Bila UI ikut berubah, juga `pnpm e2e`.
   Kalau sudah merah sebelum Anda mengubah apa pun, catat dulu, jangan dianggap akibat perubahan Anda.
5. Setelah update selesai dan teruji, tambah checkpoint baru di atas dengan format yang sama, lalu buat tag.

## checkpoint/2026-11-19-vscode-diagnostics-verified

Tanggal: 19 November 2026. Branch: `feat/m1-redesign-telkomsel-pattern`.
Diagnostics merah pada panel Problems VS Code untuk `apps/api/src/routes/accounts.ts`, `apps/api/test/helpers.ts`, dan `apps/public-web/src/app/tentang/area/page.tsx` sudah diperiksa terhadap file di disk. Tidak ada syntax error pada source tersimpan; diagnostics berasal dari buffer/language service VS Code yang stale.
File disentuh ulang untuk memicu pembacaan ulang watcher tanpa mengubah isi kode.

### Tes

- `pnpm typecheck`: lulus, 6 task.
- `pnpm lint`: lulus, 6 task.
- `git diff --check`: lulus.

### Terbuka

- Jika Problems masih menampilkan error lama, tutup-buka tab atau jalankan `Developer: Reload Window`.
- Warning Tailwind canonical class tetap berupa warning, bukan error build.
- WAHA sungguhan, Docker/staging, konfigurasi produksi, dan UAT tetap terbuka.

## checkpoint/2026-11-19-live-preview-mock-accounts

Tanggal: 19 November 2026. Branch: `feat/m1-redesign-telkomsel-pattern`.
Live preview mode mock didokumentasikan lengkap dengan URL, akun Portal semua role, akun Outlet, password dummy, akun pending wajib ganti password, dan kode reset mock.
Kredensial hanya berlaku pada `mock`; tidak masuk ke API/produksi dan tidak mengirim WhatsApp.

### Tes

- `pnpm lint`: lulus.
- `pnpm typecheck`: lulus.
- Endpoint `http://localhost:3000`, `:3001/login`, dan `:3002/login`: merespons HTTP 200 dari preview lokal.
- `pnpm dev` kedua mendeteksi port 3001/3002 sudah dipakai proses preview yang berjalan; tidak ada perubahan port atau konfigurasi.

### Terbuka

- Preview interaktif browser penuh tetap perlu dijalankan dari terminal pemilik; proses lokal sebelumnya sudah memakai port 3001/3002.
- WAHA sungguhan, Docker/staging, konfigurasi produksi, dan UAT tetap terbuka.

## checkpoint/2026-11-19-m3-password-min-6

Tanggal: 19 November 2026. Branch: `feat/m1-redesign-telkomsel-pattern`.
Perubahan kecil: minimum kata sandi baru/ganti diturunkan dari 12 menjadi 6 karakter sesuai permintaan pemilik.
Password sementara acak dari server tetap memakai formatnya sendiri dan tidak diubah.

### Tes

- Contracts: 13 tes lulus.
- API password/accounts: 22 tes lulus.
- `pnpm lint`: lulus.
- `pnpm typecheck`: lulus.
- `git diff --check`: lulus.

### Terbuka

- Belum dibuat commit/tag/push untuk checkpoint ini.
- Pengiriman WAHA sungguhan, Docker/staging, konfigurasi produksi, dan UAT tetap terbuka.

## checkpoint/2026-11-19-m3-password-and-user-management

Tanggal: 19 November 2026. Branch: `feat/m1-redesign-telkomsel-pattern`.
Commit dasar: `2eb26ea` `feat: add image fallbacks and portal updates`; branch masih belum merge ke `main`.
Perubahan checkpoint ini menambahkan siklus kata sandi dan User Management Portal.

### Keputusan yang dikunci

- Akun baru dibuat dengan kata sandi sementara acak dari server; tidak ada kolom kata sandi di form admin.
- Kata sandi sementara dikirim hanya ke nomor WhatsApp pemilik akun melalui WA Gateway; bila WAHA gagal, pembuatan/reset dibatalkan dan kata sandi lama tetap berlaku.
- Login pertama dan login setelah reset admin wajib mengganti kata sandi. Server memblokir API lain sampai penggantian selesai.
- Reset mandiri memakai kode 6 angka lewat WhatsApp, hash di database, berlaku 10 menit, maksimal 5 percobaan, anti-enumerasi, dan maksimal 3 kode per akun per jam.
- Admin dengan izin `user.manage` mengelola akun Portal dalam cakupan unitnya; akun Outlet dikelola Admin Mobile. Manager dan Admin Web tetap dibuat lewat CLI.
- WAHA hanya dari env server; pengiriman nyata, Docker/staging, konfigurasi produksi, dan UAT belum dilakukan.

### Tes pada checkpoint

- `pnpm lint`: lulus.
- `pnpm typecheck`: lulus.
- API: 106 tes lulus (termasuk password lifecycle, reset WhatsApp tiruan, dan User Management).
- Contracts: 13 tes lulus; UI 8; Portal 22; Outlet 14.
- `pnpm build` mode mock: lulus (env localhost + `*_DATA_SOURCE=mock`).
- `pnpm e2e` mode mock pada 360/390/768/1024/1440: 212 lulus, 8 dilewati, 0 gagal setelah tes reset Outlet diperbarui.

### Terbuka

- Pengiriman ke WAHA sungguhan, Docker/compose, staging, konfigurasi produksi, dan UAT.
- Editor UI IndiHome/Kalkulator Cuan, menu pesan Hubungi Kami, pembatalan order, status pembayaran, stok/reservasi, impor CSV, email, MFA Admin Web, rollback, pemisahan CMS API/DB, backup, dan S3.
- Branch belum merge ke `main`.

## checkpoint/2026-11-19-m2-konten-institusi

Tanggal: 19 November 2026. Branch: `feat/m1-redesign-telkomsel-pattern`.
Commit kode terakhir yang diuji: `d29f3dc`. Checkpoint sebelumnya: `checkpoint/2026-11-18-m2-backend`.
`main` masih di `efa33f7`; branch ini belum di-merge.

### Isi sejak checkpoint sebelumnya

| Commit    | Isi                                                                                                                                                                                                                         |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `b1cfef3` | CI: spec E2E diperiksa lewat `tsconfig.json` root, bukan oleh `next build` (penyebab image Publik gagal)                                                                                                                    |
| `0d7fce6` | Publik: footer menempel di dasar layar pada halaman pendek                                                                                                                                                                  |
| `39f04cb` | Admin Web: editor Tentang Kami, Area Layanan, Lokasi Kantor, Hubungi Kami, teks Daftar Digipos. WA Gateway lewat WAHA (grup + saklar per notifikasi; host dan kunci hanya dari env server). Migrasi `0003_wa_notifications` |
| `c6be379` | Area Layanan: koordinat (wajib berpasangan, rentang WGS84) dan foto dari Aset. `PhotoField` bersama. Publik: foto dan tautan "Buka di peta" di tab baru                                                                     |
| `d165dd6` | Publik: panel kepala halaman (`PageIntro`) diberi warna merah lembut; digantikan oleh `d29f3dc`                                                                                                                             |
| `e5644e8` | Publik `/tentang`: Area layanan, Lokasi kantor, Hubungi Kami jadi bagian buka-tutup `<details>`, tertutup di awal. Komponen `AreaList` dan `CollapsibleSection`                                                             |
| `d29f3dc` | Publik: `PageIntro` merah brand (`bg-brand-red`), teks putih, `shadow-raised`, tautan kembali putih, fokus `on-dark`                                                                                                        |

### Keputusan yang dikunci di checkpoint ini

Ini sudah diminta atau disetujui pemilik. Jangan diubah balik tanpa permintaan baru.

- **Kepala halaman Publik** (`apps/public-web/src/components/PageIntro.tsx`): latar `bg-brand-red` pekat,
  teks putih, bayangan `shadow-raised`, motif `SignalRings` putih `opacity-15`. Dipakai semua halaman dalam
  Publik. Kontras putih di atas `#cf211b` sekitar 5,3:1 (lolos AA). Tautan `back` dipaksa putih lewat
  `[&_a]:text-white`.
- **`/tentang`**: tiga bagian buka-tutup dengan urutan Area layanan, Lokasi kantor, Hubungi Kami; semuanya
  tertutup saat halaman dibuka. Memakai `<details>`/`<summary>` bawaan (jalan tanpa JS, bisa keyboard, isi tetap
  terindeks). Bagian "Kantor kami" dan navigasi "Halaman terkait" yang lama sudah dihapus.
- **Route lama tetap hidup**: `/tentang/area`, `/tentang/kantor`, `/kontak`. Masih ditautkan dari footer dan
  menu Lainnya di HP. Formulir pesan tetap di `/kontak`.
- **Kartu wilayah hanya punya satu sumber**: `AreaList` di `apps/public-web/src/components/company.tsx`, dipakai
  `/tentang` (`headingLevel="h3"`) dan `/tentang/area` (`h2`).
- **Peta**: hanya tautan ke Google Maps di tab baru; tidak ada peta tertanam, jadi CSP tidak diubah.
- **Foto wilayah dan kantor** wajib dari Aset Website; URL luar ditolak API (422).
- **WAHA**: host, kunci, dan sesi hanya dari env server (`WAHA_BASE_URL`, `WAHA_API_KEY`, `WAHA_SESSION`).
  Gagal kirim tidak menggagalkan order atau form, dan log tidak memuat nomor atau isi pesan.
- **Token bayangan** `--shadow-raised` sekarang juga sah untuk panel kepala halaman Publik (komentar di
  `packages/ui/src/styles/tokens.css`).

### Bukti tes saat checkpoint

Semua dijalankan di mesin pengembangan pada commit `d29f3dc`, mode `mock`, 19 November 2026.

| Tes                                             | Hasil                                                                                                |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `pnpm lint`, `pnpm typecheck`                   | lulus                                                                                                |
| `pnpm test`                                     | 136 lulus: api 84 (integrasi MySQL 8.4), portal-web 22, outlet-web 14, contracts 8, ui 8             |
| `pnpm e2e` tiga aplikasi, 360/390/768/1024/1440 | 202 lulus, 8 dilewati (tes khusus HP yang memang dilewati di lebar besar), 0 gagal                   |
| Pemeriksaan visual                              | tangkapan layar `/tentang`, `/tentang/area`, detail produk di 360 dan 1440 px; tidak ada overflow    |
| Build mode `api` dan `mock`                     | lulus pada `c6be379`; **tidak diulang** untuk `e5644e8` dan `d29f3dc` (hanya ubahan tampilan Publik) |
| CI GitHub                                       | **belum jalan** untuk branch ini: workflow hanya terpicu push ke `main` atau pull request            |
| WAHA sungguhan, Docker, compose, staging        | **belum dijalankan**                                                                                 |

### Terbuka saat checkpoint

- Uji manual editor Area Layanan dalam mode `api`.
- Koordinat dan foto resmi tiap wilayah dari pemilik (T-4 / D-09). Isi institusi masih data contoh berlabel.
- Uji kirim ke WAHA sungguhan.
- Editor UI untuk info IndiHome dan kontak Kalkulator Cuan (API sudah ada).
- Buka pull request ke `main` supaya CI (check, build mode `api`, docker, e2e) jalan untuk semua commit di atas.
- Keputusan terbuka lain tidak berubah: D-B1 s.d. D-B5, D-07, T-1, T-2. Rincian: `docs/status.md`.

## checkpoint/2026-11-18-m2-backend

Tanggal: 18 November 2026. Branch: `feat/m1-redesign-telkomsel-pattern`. Tag sudah di-push ke [GitHub](https://github.com/akbargumelar-art/agrabudi/tree/checkpoint/2026-11-18-m2-backend).

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
