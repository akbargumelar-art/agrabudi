# AGENTS.md — aturan kerja agen coding di repo Agrabudi.id

Sumber keputusan: `prd.md` v2.0 dan `rancangan-build.md` (keduanya di Project "Portal Agrabudi.id").
Jika aturan di sini bertentangan dengan PRD, PRD yang berlaku.

## Urutan kerja per task

1. Baca PRD dan aturan repo yang relevan.
2. Audit file yang akan disentuh.
3. Pilih perubahan kecil yang bisa diverifikasi.
4. Implementasi.
5. Jalankan tes yang bermakna: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, dan `pnpm e2e` bila UI berubah.
6. Periksa tampilan di 360, 390, 768, 1024, 1440 px bila UI berubah.
7. Laporkan: perilaku yang berubah, file terdampak, tes yang benar-benar dijalankan beserta hasilnya, sisa blocker, langkah berikutnya.

Kode yang belum diuji disebut belum diuji. Status fitur memakai kata: planned, mock, integrated, tested, accepted.
Perbarui `docs/status.md` setiap kali status fitur berubah.

## Batas yang tidak boleh dilanggar

- Tiga aplikasi tingkat 1: Publik, Outlet, Portal. Karir bagian dari Publik.
- ABKShop Pelanggan dan ABKShop Outlet adalah dua layanan dengan data, harga, dan aturan terpisah. Tidak ada fallback harga antar kanal.
- Administrator Web punya console, akun, dan sesi sendiri di `/web-admin`. Bukan superadmin dan bukan submenu akun Manager/GM.
- Jangan menaruh secret di kode, log, screenshot, `.env.example`, commit, atau dokumentasi.
- Jangan mengubah port, domain, server, DB, atau konfigurasi yang tidak diminta.
- Jangan menambah dependency tanpa fungsi yang jelas. Versi dikunci, lockfile di-commit.
- Tipe data lintas aplikasi hanya dari `packages/contracts`. Ubah kontrak berarti ubah semua pemakainya dalam perubahan yang sama.

## Anti-slop visual (PRD 3.2)

| ID    | Aturan                                                                                                                                     |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| AS-01 | Ikuti desain Agrabudi yang dipilih. Perubahan layout besar harus punya alasan dari kebutuhan.                                              |
| AS-02 | Tidak semua halaman jadi dashboard atau kartu seragam. Katalog, tabel Outlet, lowongan, laporan, form, dan CMS punya bentuk masing-masing. |
| AS-03 | Tidak ada gradient, glow, glassmorphism, atau emoji dekoratif tanpa tujuan.                                                                |
| AS-04 | Hero tidak wajib di halaman kerja. Portal mengutamakan tugas dan kepadatan data.                                                           |
| AS-05 | Satu bottom navigation per aplikasi. Tabel di HP punya cara inspeksi yang jelas.                                                           |
| AS-06 | Gambar bermakna, bukan stok acak. Logo resmi tidak direka. Placeholder diberi label.                                                       |
| AS-07 | Pakai token spacing, warna, dan tipografi dari `packages/ui`. Tidak ada angka CSS acak untuk menambal satu layar.                          |
| AS-08 | Status sukses, gagal, kosong, dan loading jelas. Warna bukan satu-satunya penanda.                                                         |

## Anti-slop isi dan data (PRD 3.3)

- Jangan membuat testimoni, penghargaan, jumlah pelanggan/outlet, harga resmi, alamat, kontak, legalitas, atau klaim partner yang tidak disahkan.
- Singkatan bisnis (MB, CTB, DOA, SCS, Retina, CVM, 5s-4r, IO/RE/PS) tidak diekspansi berdasarkan tebakan.
- Data contoh hidup di folder `mock/`, selalu membawa `meta.source = "mock"`, dan selalu ditandai di UI.
- Build produksi tidak memuat data contoh sebagai fallback diam-diam. API gagal ditampilkan sebagai gagal.
- Rumus KPI, fee, poin, cuan, dan aturan stok hanya diterapkan setelah ada contoh input-output yang disahkan.

## Anti-slop fungsi dan kode (PRD 3.4)

| ID    | Aturan                                                                                                                |
| ----- | --------------------------------------------------------------------------------------------------------------------- |
| AS-09 | Tombol mengerjakan aksi sesuai labelnya. Aksi yang belum ada dinonaktifkan dan diberi alasan, bukan toast "berhasil". |
| AS-10 | Modul punya model, kolom, dan aksi yang relevan. Template laporan demo bukan modul produksi.                          |
| AS-11 | Tidak ada file monolitik untuk seluruh website.                                                                       |
| AS-12 | Satu sumber aturan bisnis di backend. Frontend hanya validasi UX dan estimasi.                                        |
| AS-13 | Tidak ada `any` menyeluruh, error yang ditelan, `ts-ignore` tanpa alasan, atau catch lalu sukses palsu.               |
| AS-14 | Tidak menambah dependency, framework, atau service tanpa fungsi yang jelas.                                           |
| AS-15 | Tidak mengubah API, skema, atau route tanpa memperbarui kontrak dan pemakainya.                                       |
| AS-16 | Tidak melemahkan tes atau mematikan lint/security demi status hijau.                                                  |
| AS-17 | Prototipe satu-file hanya referensi visual, bukan fondasi produksi.                                                   |
| AS-18 | Tidak menyatakan selesai jika masih mock, TODO kritis, angka hardcode, atau route mati.                               |

## Release blocker

Bocor data antar role atau outlet, total order salah, sukses transaksi palsu, data contoh tersamar sebagai produksi,
kontrol akses hanya di UI, halaman kunci tidak bisa dipakai di HP, atau tes diklaim lulus padahal tidak dijalankan.
