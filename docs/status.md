# Status fitur

Terakhir diperbarui: 15 November 2026, setelah slider pemenang di Outlet dan login + menu per peran di Portal.
Arti status: **planned** belum dikerjakan, **mock** tampil dengan data contoh berlabel atau aksi dinonaktifkan,
**integrated** tersambung backend, **tested** lulus tes otomatis yang relevan, **accepted** lolos UAT pemilik modul.
Belum ada fitur berstatus integrated atau accepted: backend belum dibuat.

## M0 — fondasi repo (minimal)

| Item                                | Status  | Catatan                                                            |
| ----------------------------------- | ------- | ------------------------------------------------------------------ |
| Monorepo pnpm + Turborepo, lockfile | tested  | `pnpm install`, `pnpm build`                                       |
| Lint, typecheck, unit test          | tested  | ESLint, TypeScript 6, Vitest                                       |
| `packages/contracts`                | tested  | Skema Zod awal untuk data yang dipakai M1                          |
| `AGENTS.md` (AS-01 s.d. AS-18)      | selesai |                                                                    |
| Workflow CI GitHub Actions          | planned | File ada, **belum pernah dijalankan** karena repo GitHub belum ada |
| Compose lokal MySQL + Redis         | planned | Belum dibuat; dibutuhkan mulai M2                                  |
| Preflight VPS, DNS, Nginx staging   | planned | Menunggu akses dan persetujuan (T-1)                               |

## M1 — design system dan kerangka

| Item                                                                                                                    | Status          | Catatan                                                                                                                                                                                                                                                                                                      |
| ----------------------------------------------------------------------------------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Token warna, radius, breakpoint                                                                                         | tested          | **Nilai hex sementara**, belum dicocokkan logo resmi (T-4)                                                                                                                                                                                                                                                   |
| Arah visual pola telkomsel.com                                                                                          | tested          | Header putih menempel, tombol pil, banner carousel, kartu bersudut besar, motif lingkaran sinyal. Tanpa logo, font, atau gambar Telkomsel. Foto dan banner asli belum ada: tempatnya berlabel                                                                                                                |
| Font Montserrat + Poppins self-host                                                                                     | tested          | Subset latin, weight 400-800 yang dipakai                                                                                                                                                                                                                                                                    |
| AppSwitcher, MainNav, BottomNav                                                                                         | tested          | Unit test + E2E lima lebar layar                                                                                                                                                                                                                                                                             |
| Primitive: Button, Field/Input/Select/Textarea, Modal, Drawer, Toast, Table, Carousel, EmptyState, ErrorState, Skeleton | tested sebagian | Modal belum dipakai halaman mana pun, jadi belum teruji E2E                                                                                                                                                                                                                                                  |
| Merek di header                                                                                                         | mock            | Teks "Agrabudi", bukan logo. Logo resmi belum ada                                                                                                                                                                                                                                                            |
| Publik: 14 route PRD 2.6                                                                                                | mock, tested    | Katalog, program, lowongan, banner dari mock berlabel. Isi institusional sengaja kosong berlabel. Semua form nonaktif                                                                                                                                                                                        |
| Outlet: 11 route PRD 2.7                                                                                                | mock, tested    | Tabel ABKShop menghitung estimasi di browser (uji US-05 lulus). "Ajukan order", login, kalkulator nonaktif                                                                                                                                                                                                   |
| Portal: 135 route PRD 2.8-2.10 + 5 halaman utama                                                                        | mock, tested    | Halaman kerangka tanpa tabel dan tanpa angka. Tidak ada mock data di Portal karena kamus data belum disahkan                                                                                                                                                                                                 |
| Portal: login dulu, menu per peran                                                                                      | mock, tested    | Halaman pertama adalah login. Tahap kerangka memakai 8 akun contoh berlabel (tanpa kata sandi); build `api` tidak memuatnya dan menampilkan form yang gagal dengan pesan jujur. Menu, sidebar, dan "Akses ditolak" mengikuti jabatan x unit x izin. **Penyaringan ini baru di browser**, bukan kontrol akses |
| Outlet: slider pemenang program                                                                                         | mock, tested    | Dokumentasi penyerahan hadiah di Home, geser otomatis dengan tombol jeda, detail di modal. Foto kosong berlabel; koordinat lokasi dan nama petugas tidak ditampilkan                                                                                                                                         |
| Console Administrator Web: 10 route PRD 2.3                                                                             | mock, tested    | Daftar halaman, banner, riwayat publikasi dari mock berlabel. Editor, preview, publikasi, login nonaktif                                                                                                                                                                                                     |
| Build `api` tanpa data contoh                                                                                           | tested manual   | Bundle Outlet, console, dan Publik diperiksa: string data contoh tidak ada; halaman menampilkan pesan gangguan                                                                                                                                                                                               |

## Belum ada sama sekali

Login dan sesi sungguhan, RBAC di server, API, database, upload berkas, quote/order server, editor CMS, impor data, notifikasi.
Seluruh pembatasan akses di M1 hanya tampilan; belum ada kontrol akses yang nyata.

## Keputusan terbuka yang menahan pekerjaan berikutnya

| ID         | Hal                                     | Dampak                                              |
| ---------- | --------------------------------------- | --------------------------------------------------- |
| T-2        | Repo GitHub baru                        | Kode belum bisa di-push; CI belum bisa jalan        |
| T-4 / D-09 | Logo, warna brand, alamat, kontak, foto | Token warna dan isi institusional masih placeholder |
| T-1        | Preflight VPS                           | Staging belum bisa disiapkan                        |
| D-07       | Rumus Kalkulator Cuan, KPI, fee, poin   | Halaman terkait tetap nonaktif                      |
